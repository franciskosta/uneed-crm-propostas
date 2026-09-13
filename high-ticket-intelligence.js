(function initHighTicket(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.UNEED_HIGH_TICKET = api;
})(typeof window !== "undefined" ? window : null, function highTicketFactory() {
  const PROFILE_VERSION = "high_ticket_v1";
  const MESSAGE_POLICY_VERSION = "high-ticket-diagnostic-v0.1";
  const DIAGNOSTIC_URL = "https://diagnostico-digital.uneed.pt/";
  const DIMENSION_WEIGHTS = Object.freeze({ operationalComplexity: 25, digitalGap: 15, economicPotential: 20, businessFit: 15, transformationPotential: 15, reachability: 5, evidenceQuality: 5 });
  const CATEGORIES = Object.freeze(["sales_process","quoting","customer_portal","catalogue","order_management","internal_workflow","document_automation","reporting","dashboard","crm","client_management","support","booking","logistics","stock","integrations","multi_location","intranet","data_collection","automation","ai_assistance"]);
  const QUESTIONS = Object.freeze(["Como entram e são acompanhados atualmente os pedidos comerciais?","Existem tarefas ou dados duplicados entre equipas?","Onde é feito o acompanhamento de clientes e oportunidades?","Que processos dependem hoje de folhas de cálculo ou documentos manuais?","Existe reporting centralizado para apoiar decisões?","Existem sistemas que não comunicam entre si?"]);
  const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
  function highTicketScore(pack = {}) {
    const s = pack.highTicketSignals || {}; const count = (key) => Array.isArray(s[key]) ? s[key].length : 0;
    const evidenceCount = Array.isArray(pack.evidence) ? pack.evidence.length : 0;
    const operationalComplexity = clamp((count("scale") + count("catalogue") + count("locations") + count("operations")) * 18);
    const digitalGap = clamp((count("manual") + count("integrationGaps")) * 24 + (pack.websiteSignals?.forms ? 0 : 8));
    const economicPotential = clamp((count("scale") + count("growth") + count("b2b") + count("operations")) * 18);
    const businessFit = clamp((count("b2b") + count("catalogue") + count("operations")) * 24);
    const transformationPotential = clamp((count("manual") + count("integrationGaps") + count("catalogue") + count("locations")) * 20);
    const reachability = clamp((pack.knownData?.contacts?.email || pack.knownData?.contacts?.phone ? 70 : 10) + (pack.decisionMakerSignals?.length ? 30 : 0));
    const evidenceQuality = clamp(evidenceCount * 12 + (pack.confidence === "high" ? 30 : pack.confidence === "medium" ? 15 : 0));
    const breakdown = { operationalComplexity, digitalGap, economicPotential, businessFit, transformationPotential, reachability, evidenceQuality };
    const score = clamp(Object.entries(DIMENSION_WEIGHTS).reduce((sum, [key, weight]) => sum + breakdown[key] * weight / 100, 0));
    return { score, breakdown, version: PROFILE_VERSION };
  }
  function evidenceFor(pack, terms) { return (pack.evidence || []).filter((item) => terms.some((term) => String(item.fact || "").toLowerCase().includes(term))).map((item) => item.id).slice(0, 6); }
  function signalContext(pack, categories) { const statements = categories.flatMap((category) => pack.highTicketSignals?.[category] || []).map((item) => item.statement).filter(Boolean); return [...new Set(statements)].slice(0, 2).join(" "); }
  function hypotheses(pack = {}) {
    const s = pack.highTicketSignals || {}; const out = [];
    const add = (category, title, why, impact, terms) => { const ids = evidenceFor(pack, terms); if (ids.length) out.push({ category, hypothesis: title, rationale: why, potentialImpact: impact, evidenceIds: ids, confidence: ids.length >= 2 ? "medium" : "low" }); };
    if (s.catalogue?.length || s.b2b?.length) add("sales_process", "Validar a integração entre oferta, pedidos comerciais e acompanhamento de clientes.", `A investigação encontrou estes sinais: ${signalContext(pack, ["catalogue","b2b"])}`, "Menos duplicação e maior visibilidade do processo comercial.", ["catálogo","produto","oferta","b2b","profissionais","orçamento","distribui"]);
    if (s.locations?.length) add("multi_location", "Validar como informação e processos são coordenados entre localizações.", `A investigação encontrou este sinal: ${signalContext(pack, ["locations"])}`, "Maior consistência operacional e reporting consolidado.", ["localiza","loja","delegação","rede","unidades"]);
    if (s.operations?.length || s.manual?.length) add("internal_workflow", "Validar os fluxos administrativos e operacionais com maior carga manual.", `A investigação encontrou estes sinais: ${signalContext(pack, ["operations","manual"])}`, "Redução de tarefas repetitivas, erros e atrasos.", ["logística","stock","document","formulário","suporte","pedido"]);
    if (s.growth?.length) add("reporting", "Validar se o crescimento é acompanhado por reporting e sistemas adequados.", `A investigação encontrou este sinal: ${signalContext(pack, ["growth"])}`, "Melhor visibilidade de gestão e capacidade de escalar.", ["carreira","recrut","expans","export"]);
    return out.slice(0, 4);
  }
  function decisionMakers(pack = {}) { return (pack.decisionMakerSignals || []).map((item) => ({ name: item.name || null, role: item.role, source: item.sourceUrl, confidence: item.confidence || "low" })); }
  function buildOutreach(input, pack, opportunities) {
    const company = input.name || pack.companyIdentity?.name || "a vossa empresa"; const first = opportunities[0];
    if (!first?.evidenceIds?.length) return { preparedMessage: null, readiness: "needs_more_research", reason: "Não existe evidência específica suficiente para personalizar a abordagem." };
    const evidenceItem = (pack.evidence || []).find((item) => first.evidenceIds.includes(item.id)); const observation = evidenceItem?.fact || first.rationale;
    return { preparedMessage: `Bom dia, sou o Francisco, da Uneed Soluções Digitais. Estive a conhecer melhor a ${company} e chamou-me a atenção este sinal público: ${observation} Gostava de perceber como esta área é coordenada atualmente e se existe trabalho repetitivo ou informação dispersa. Temos um Diagnóstico Digital para identificar oportunidades antes de falar em qualquer solução. Se não encontrarmos impacto real, ficamos por aí. Posso enviar-lhe o acesso?`, readiness: "ready_for_review", reason: "Mensagem personalizada a partir de evidência pública; exige revisão humana estrita." };
  }
  function buildHighTicketIntelligence(input = {}, pack = {}) {
    const scoring = highTicketScore(pack); const opportunityHypotheses = hypotheses(pack); const makers = decisionMakers(pack); const outreach = buildOutreach(input, pack, opportunityHypotheses);
    const insufficient = (pack.evidence || []).length < 2;
    const rejected = scoring.score < 30 && !insufficient;
    const readiness = rejected ? "reject" : insufficient ? "needs_more_research" : "ready_for_review";
    const confirmedSignals = [...new Map(Object.entries(pack.highTicketSignals || {}).flatMap(([category, items]) => (items || []).map((item) => ({ category, statement: item.statement, evidenceIds: item.evidenceIds || [] }))).map((item) => [`${item.category}:${String(item.statement).toLowerCase()}`, item])).values()];
    const phone = pack.knownData?.contacts?.phone || input.phone; const email = pack.knownData?.contacts?.email || input.email; const primaryChannel = email ? "email" : phone ? "phone" : makers.length ? "linkedin" : "manual_review";
    return { schemaVersion: "1.0.0", strategyId: "high_ticket", acquisitionStrategy: "high_ticket", qualificationProfile: PROFILE_VERSION, qualificationProfileVersion: "1.0.0", messagePolicyVersion: MESSAGE_POLICY_VERSION, serviceId: null, recommendedService: null, companyIdentity: pack.companyIdentity, businessProfile: pack.businessProfile || {}, operationalComplexity: pack.operationalComplexity || {}, digitalMaturity: pack.digitalMaturity || {}, highTicketFit: scoring.score, commercialScore: scoring.score, score: scoring.score, scoreBreakdown: scoring.breakdown, scoreVersion: scoring.version, commercialReadiness: "unknown", confirmedOperationalSignals: confirmedSignals, opportunityHypotheses, businessImpactHypotheses: opportunityHypotheses.map((item) => ({ category: item.category, impact: item.potentialImpact, evidenceIds: item.evidenceIds, confidence: item.confidence })), discoveryQuestions: [...QUESTIONS], decisionMakerSignals: makers, recommendedNextStep: { type: "digital_diagnostic", label: "Diagnóstico Digital Uneed", url: DIAGNOSTIC_URL }, outreachStrategy: { channel: primaryChannel, requiredHumanReview: "strict", ...outreach }, primaryChannel, fallbackChannel: primaryChannel === "email" && phone ? "phone" : null, initialMessage: outreach.preparedMessage, evidence: pack.evidence || [], unknowns: [...new Set([...(pack.unknowns || []), ...(makers.length ? [] : ["Pessoa decisora"])])], warnings: pack.warnings || [], confidence: insufficient ? "low" : pack.confidence || "low", needsMoreResearch: insufficient, readiness, rejectReason: rejected ? "Sem sinais públicos suficientes de complexidade ou potencial de transformação." : null, questEligible: false, proposalCreated: false, researchedAt: pack.researchedAt || new Date().toISOString() };
  }
  return { PROFILE_VERSION, MESSAGE_POLICY_VERSION, DIAGNOSTIC_URL, DIMENSION_WEIGHTS, CATEGORIES, QUESTIONS, highTicketScore, buildHighTicketIntelligence };
});
