const { buildLeadIntelligence } = require("../lead-intelligence");
const { buildHighTicketIntelligence } = require("../high-ticket-intelligence");

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
        if (request.context.acquisitionStrategy === "high_ticket") { const intelligence = buildHighTicketIntelligence(request.context.intelligenceSeed || lead, request.context.research); return { output: { ...intelligence, breakdown: intelligence.scoreBreakdown, opportunityLevel: intelligence.highTicketFit >= 70 ? "alta" : intelligence.highTicketFit >= 40 ? "média" : "baixa", observations: intelligence.confirmedOperationalSignals, digitalPresence: request.context.research.digitalPresence, problemsDetected: [], potentialNeeds: intelligence.opportunityHypotheses, reasoningSummary: intelligence.opportunityHypotheses[0]?.rationale || "Evidência insuficiente para uma hipótese específica.", confidence: intelligence.confidence === "high" ? 0.85 : intelligence.confidence === "medium" ? 0.65 : 0.4, confidenceLevel: intelligence.confidence }, cost: 0, usage: { calls: 1 } }; }
        const pack = request.context.research; const signals = pack.websiteSignals || {}; const instagramUrl = pack.digitalPresence?.socialProfiles?.find((item) => item.platform === "instagram")?.url; const intelligence = buildLeadIntelligence({ ...(request.context.intelligenceSeed || {}), confirmedBusiness: Boolean(pack.companyIdentity?.name), website: pack.digitalPresence?.website, instagramUrl, phone: pack.knownData?.contacts?.phone, email: pack.knownData?.contacts?.email, niche: lead.niche || lead.opportunityCategory || request.context.intelligenceSeed?.niche, municipality: lead.municipality || request.context.intelligenceSeed?.municipality, district: lead.district || request.context.intelligenceSeed?.district, hasBooking: signals.booking, hasCta: Array.isArray(signals.contactPaths) ? signals.contactPaths.length > 0 : undefined, mobile: signals.mobile, confidence: pack.confidence }); const score = intelligence.commercialScore; const confidence = pack.confidence === "high" ? 0.85 : pack.confidence === "medium" ? 0.65 : 0.4;
        return { output: { score, breakdown: intelligence.scoreBreakdown, scoreVersion: intelligence.scoreVersion, opportunityLevel: score >= 70 ? "alta" : score >= 40 ? "média" : "por qualificar", observations: pack.observations || [], digitalPresence: pack.digitalPresence, problemsDetected: intelligence.confirmedGaps, potentialNeeds: intelligence.improvementOpportunities, confirmedGaps: intelligence.confirmedGaps, improvementOpportunities: intelligence.improvementOpportunities, unknowns: intelligence.unknowns, communicationQuality: intelligence.communicationQuality, mainCommercialGap: intelligence.mainCommercialGap, whyContactThisLead: intelligence.whyContactThisLead, serviceId: intelligence.serviceId, recommendedService: intelligence.recommendedService, serviceDetails: intelligence.serviceDetails, uneedFit: intelligence.uneedFit, reasoningSummary: intelligence.whyContactThisLead, confidence, confidenceLevel: intelligence.confidence, confidenceReason: intelligence.confidenceReason }, cost: 0, usage: { calls: 1 } };
      }
      const evidence = request.context.research || {};
      const completeness = [lead.companyName, lead.clientName, lead.clientEmail, lead.clientPhone, lead.internalNotes, lead.sampleUrl].filter(Boolean).length;
      const score = Math.min(80, 25 + completeness * 8);
      const services = (lead.services || []).filter((item) => item.selected !== false).map((item) => item.name).filter(Boolean);
      return { output: { score, opportunityLevel: score >= 65 ? "alta" : score >= 45 ? "média" : "por qualificar", observations: evidence.facts || [], digitalPresence: lead.sampleUrl ? "Existe um URL registado, não auditado" : "Não confirmada", problemsDetected: ["Informação pública não analisada nesta execução local"], potentialNeeds: services.length ? [`Interesse registado em ${services.join(", ")}`] : ["Necessidades por diagnosticar"], recommendedService: services[0] || "Diagnóstico digital UNEED", reasoningSummary: `Score baseado na completude de ${completeness} campos CRM; não é um indicador de conversão.`, confidence: Math.min(0.75, 0.3 + completeness * 0.07) }, cost: 0, usage: { calls: 1 } };
    }
    if (request.task === "prepare-outreach") {
      const qualification = request.context.qualification || {};
      if (request.context.acquisitionStrategy === "high_ticket") { const strategy = qualification.outreachStrategy || {}; return { output: { suggestedApproach: "Convite consultivo para Diagnóstico Digital; nunca apresentar solução ou proposta nesta fase.", preparedMessage: strategy.preparedMessage || "", recommendationReason: strategy.reason || qualification.reasoningSummary, evidenceUsed: qualification.opportunityHypotheses?.[0]?.evidenceIds || [], requiredHumanReview: "strict", readiness: qualification.readiness || "needs_more_research", diagnosticUrl: qualification.recommendedNextStep?.url || "https://diagnostico-digital.uneed.pt/", decisionMakerSignals: qualification.decisionMakerSignals || [] }, cost: 0, usage: { calls: 0 } }; }
      if (request.context.intelligenceSeed) { const signals = request.context.research?.websiteSignals || {}; const intelligence = buildLeadIntelligence({ ...request.context.intelligenceSeed, website: request.context.research?.digitalPresence?.website || request.context.intelligenceSeed.website, hasBooking: signals.booking, hasCta: Array.isArray(signals.contactPaths) ? signals.contactPaths.length > 0 : request.context.intelligenceSeed.hasCta, mobile: signals.mobile, confidence: request.context.research?.confidence }); return { output: { suggestedApproach: `Contacto manual por ${intelligence.primaryChannel}${intelligence.fallbackChannel ? `; alternativa ${intelligence.fallbackChannel}` : ""}. Ângulo: ${intelligence.mainCommercialGap}`, preparedMessage: intelligence.initialMessage, followUp1: intelligence.followUp1, followUp2: intelligence.followUp2, recommendedFollowUpDelayDays: intelligence.recommendedFollowUpDelayDays, recommendationReason: intelligence.whyContactThisLead, evidenceUsed: request.context.research?.facts?.flatMap((item) => item.evidenceIds || []).slice(0, 5) || [] }, cost: 0, usage: { calls: 0 } }; }
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
