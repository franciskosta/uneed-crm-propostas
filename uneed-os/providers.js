class AIProvider {
  supports() { return false; }
  async execute() { throw new Error("provider_execute_not_implemented"); }
  estimateCost() { return 0; }
  async healthCheck() { return { ok: true }; }
}

class LocalEvidenceProvider extends AIProvider {
  constructor() { super(); this.id = "local-evidence"; this.model = "rules-v1"; }
  supports(capabilities = []) { return capabilities.every((item) => ["structured_output", "structured_reasoning", "web_context_analysis"].includes(item)); }
  async execute(request) {
    const lead = request.context.lead || {};
    if (request.task === "research-company") {
      if (request.context.researchPack) return { output: request.context.researchPack, cost: 0, usage: { calls: 0 } };
      const facts = [
        lead.companyName && `Empresa: ${lead.companyName}`,
        lead.clientName && `Contacto: ${lead.clientName}`,
        lead.leadSource && `Origem: ${lead.leadSource}`,
        lead.sampleUrl && `URL registado: ${lead.sampleUrl}`,
        lead.internalNotes && `Nota CRM: ${lead.internalNotes}`,
      ].filter(Boolean);
      return { output: { businessSummary: lead.companyName || lead.clientName || "Lead sem nome", facts, inferences: [], unconfirmed: ["Presença digital e necessidades ainda não verificadas externamente"], sources: ["Dados existentes no CRM"] }, cost: 0, usage: { calls: 1 } };
    }
    if (request.task === "qualify-lead") {
      if (request.context.research?.schemaVersion) {
        const pack = request.context.research; const signals = pack.websiteSignals || {}; const gapSignals = [signals.forms === false, signals.booking === false, signals.quoteRequest === false, !signals.website].filter(Boolean).length; const digitalGap = Math.min(30, gapSignals * 8); const businessFit = Math.min(30, (pack.opportunities?.length || 0) * 12 + (pack.knownData?.catalog?.length ? 8 : 0)); const reachable = pack.knownData?.contacts?.email || pack.knownData?.contacts?.phone ? 20 : pack.digitalPresence?.socialProfiles?.length ? 10 : 0; const likelyNeed = Math.min(20, (pack.inferences?.length || 0) * 8); const breakdown = { digitalGap, businessFit, reachable, likelyNeed }; const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0); const catalog = pack.knownData?.catalog || []; const recommendedService = catalog[0]?.name || null; const confidence = pack.confidence === "high" ? 0.85 : pack.confidence === "medium" ? 0.65 : 0.4;
        return { output: { score, breakdown, opportunityLevel: score >= 70 ? "alta" : score >= 40 ? "média" : "por qualificar", observations: pack.observations || [], digitalPresence: pack.digitalPresence, problemsDetected: pack.inferences || [], potentialNeeds: pack.opportunities || [], recommendedService, reasoningSummary: `Score heurístico e explicável: gap digital ${digitalGap}/30, fit ${businessFit}/30, contacto ${reachable}/20 e necessidade provável ${likelyNeed}/20.`, confidence }, cost: 0, usage: { calls: 1 } };
      }
      const evidence = request.context.research || {};
      const completeness = [lead.companyName, lead.clientName, lead.clientEmail, lead.clientPhone, lead.internalNotes, lead.sampleUrl].filter(Boolean).length;
      const score = Math.min(80, 25 + completeness * 8);
      const services = (lead.services || []).filter((item) => item.selected !== false).map((item) => item.name).filter(Boolean);
      return { output: { score, opportunityLevel: score >= 65 ? "alta" : score >= 45 ? "média" : "por qualificar", observations: evidence.facts || [], digitalPresence: lead.sampleUrl ? "Existe um URL registado, não auditado" : "Não confirmada", problemsDetected: ["Informação pública não analisada nesta execução local"], potentialNeeds: services.length ? [`Interesse registado em ${services.join(", ")}`] : ["Necessidades por diagnosticar"], recommendedService: services[0] || "Diagnóstico digital UNEED", reasoningSummary: `Score baseado na completude de ${completeness} campos CRM; não é um indicador de conversão.`, confidence: Math.min(0.75, 0.3 + completeness * 0.07) }, cost: 0, usage: { calls: 1 } };
    }
    if (request.task === "prepare-outreach") {
      const qualification = request.context.qualification || {};
      const recipient = lead.clientName || "Olá";
      const company = lead.companyName ? ` sobre a ${lead.companyName}` : "";
      const pack = request.context.research; const safeObservation = pack?.observations?.[0]?.statement || pack?.facts?.[0]?.statement || "estive a rever a informação pública disponível"; const evidenceUsed = pack?.observations?.[0]?.evidenceIds || pack?.facts?.[0]?.evidenceIds || [];
      return { output: { suggestedApproach: "Contacto humano, breve e consultivo; confirmar primeiro o contexto e a prioridade.", preparedMessage: `${recipient}, estive a rever a informação disponível${company}. ${safeObservation} Gostava de confirmar convosco o contexto antes de sugerir qualquer solução. Faz sentido uma conversa breve?`, recommendationReason: qualification.reasoningSummary || "Confirmar necessidades antes de propor.", evidenceUsed }, cost: 0, usage: { calls: 1 } };
    }
    throw new Error(`unsupported_task:${request.task}`);
  }
}

class OpenAIProvider extends AIProvider {
  constructor({ apiKey, model = "gpt-5-mini", fetchImpl = global.fetch, maxCallCost = 0.25, inputCostPerMillion = null, outputCostPerMillion = null } = {}) { super(); this.id = "openai"; this.model = model; this.apiKey = apiKey; this.fetch = fetchImpl; this.maxCallCost = maxCallCost; this.inputCostPerMillion = inputCostPerMillion; this.outputCostPerMillion = outputCostPerMillion; }
  supports(capabilities = []) { return Boolean(this.apiKey) && capabilities.every((item) => ["structured_output", "structured_reasoning", "web_context_analysis", "long_context"].includes(item)); }
  estimateCost() { return this.maxCallCost; }
  async execute(request) {
    const response = await this.fetch("https://api.openai.com/v1/responses", { method: "POST", signal: AbortSignal.timeout(45_000), headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: this.model, input: `${request.instructions}\nReturn only valid JSON matching this description: ${JSON.stringify(request.outputSchema)}\nContext: ${JSON.stringify(request.context)}` }) });
    if (!response.ok) throw new Error(`provider_error:${response.status}`);
    const data = await response.json();
    const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
    if (!text) throw new Error("provider_empty_output");
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const cost = this.inputCostPerMillion == null || this.outputCostPerMillion == null ? null : (inputTokens * this.inputCostPerMillion + outputTokens * this.outputCostPerMillion) / 1_000_000;
    return { output: JSON.parse(text), cost, usage: { calls: 1, inputTokens, outputTokens } };
  }
}

module.exports = { AIProvider, LocalEvidenceProvider, OpenAIProvider };
