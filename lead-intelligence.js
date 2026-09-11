(function initLeadIntelligence(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.UNEED_LEAD_INTELLIGENCE = api;
})(typeof window !== "undefined" ? window : null, function leadIntelligenceFactory() {
  const POLICY_VERSION = "lead-intelligence-v0.1";
  const SERVICE_CATALOG = Object.freeze({
    uneed_presence: Object.freeze({ serviceId: "uneed_presence", name: "Uneed Presença", description: "Presença digital chave na mão, com página profissional, domínio, email, alojamento, suporte e pedidos de marcação integrados.", priceFrom: 39, vat: "excluded", billing: "monthly", commitment: "none", landingUrl: "https://presenca.uneed.pt/", includes: Object.freeze(["página profissional", "domínio", "email", "alojamento", "suporte", "pedidos de marcação integrados"]) }),
  });
  const SCORING_CONFIG = Object.freeze({
    version: POLICY_VERSION,
    weights: Object.freeze({ realBusiness: 15, digitalOpportunity: 25, reachable: 20, socialActivity: 10, nicheFit: 10, localFit: 10, buyingSignal: 10 }),
  });
  const OUTREACH_POLICY = Object.freeze({
    id: "uneed-outreach",
    version: POLICY_VERSION,
    rules: Object.freeze(["linguagem humana, curta e cordial", "usar apenas factos ou observações seguras", "sem crítica agressiva ou linguagem de IA", "solução relevante do catálogo", "CTA simples", "nunca enviar automaticamente"]),
  });
  const DIRECTORY_HOSTS = ["racius.com", "racius.pt", "einforma.pt", "infoempresas.com.pt", "portugalio.com", "guiadeempresas.pt", "tripadvisor.", "yelp.", "facebook.com", "instagram.com", "linkedin.com", "linktr.ee", "beacons.ai", "fresha.com", "google.com"];
  const clean = (value) => String(value || "").trim();
  function formatStructuredValue(value) { if (value == null) return ""; if (["string", "number", "boolean"].includes(typeof value)) return String(value); if (Array.isArray(value)) return value.map(formatStructuredValue).filter(Boolean).join(" · "); return value.label || value.statement || value.recommendation || value.fact || value.reason || value.basis || value.evidence || Object.entries(value).map(([key, item]) => `${key}: ${formatStructuredValue(item)}`).join(" · "); }
  const safeUrl = (value) => { try { const parsed = new URL(clean(value)); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : ""; } catch { return ""; } };
  const host = (value) => { try { return new URL(safeUrl(value)).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
  function classifyUrl(value) {
    const url = safeUrl(value); const hostname = host(url);
    if (!url) return { url: "", type: "invalid", official: false };
    if (/instagram\.com|facebook\.com|linkedin\.com|youtube\.com|tiktok\.com/.test(hostname)) return { url, type: "social_profile", official: false };
    if (/linktr\.ee|beacons\.ai/.test(hostname)) return { url, type: "directory_profile", official: false };
    if (/fresha\.com/.test(hostname)) return { url, type: "booking_profile", official: false };
    if (DIRECTORY_HOSTS.some((item) => hostname.includes(item))) return { url, type: "external_reference", official: false };
    return { url, type: "official_website", official: true };
  }
  function selectChannels(input = {}) {
    const instagram = safeUrl(input.instagramUrl); const phone = clean(input.phone); const email = clean(input.email);
    if (instagram) return { primaryChannel: "instagram", fallbackChannel: phone ? "whatsapp" : email ? "email" : "phone" };
    if (phone) return { primaryChannel: "whatsapp", fallbackChannel: "phone" };
    if (email) return { primaryChannel: "email", fallbackChannel: "phone" };
    return { primaryChannel: "manual_review", fallbackChannel: null };
  }
  function scoreLead(input = {}) {
    const site = classifyUrl(input.website); const realBusiness = input.confirmedBusiness || input.placeId || input.mapsUrl || input.reviewCount > 0 ? 15 : 5;
    const digitalOpportunity = !site.official ? 25 : input.hasBooking === false || input.hasCta === false ? 20 : 5;
    const reachable = input.instagramUrl || input.phone || input.email ? 20 : 0;
    const socialActivity = input.instagramUrl ? 10 : 0;
    const nicheFit = input.niche ? 10 : 0;
    const localFit = input.municipality || input.district ? 10 : 0;
    const buyingSignal = Math.min(10, Number(input.reviewCount || 0) >= 20 ? 10 : Number(input.rating || 0) >= 4 ? 5 : 0);
    const breakdown = { realBusiness, digitalOpportunity, reachable, socialActivity, nicheFit, localFit, buyingSignal };
    return { score: Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)), breakdown, version: POLICY_VERSION };
  }
  function recommendService(input = {}) {
    const localNiche = /cabele|barbear|sal[aã]o|est[eé]tica|cl[ií]nica|gabinete|servi[cç]o/i.test(clean(input.niche));
    const site = classifyUrl(input.website);
    if (localNiche || !site.official || input.hasBooking === false || input.hasCta === false) return SERVICE_CATALOG.uneed_presence;
    return null;
  }
  function commercialAssessment(input = {}) {
    const site = classifyUrl(input.website); const ctaKnown = typeof input.hasCta === "boolean"; const bookingKnown = typeof input.hasBooking === "boolean";
    const confirmedGaps = [];
    if (!site.official) confirmedGaps.push({ label: "Não foi encontrado um website oficial próprio", evidence: "A fonte disponível é inexistente ou externa." });
    if (bookingKnown && !input.hasBooking) confirmedGaps.push({ label: "Não foi encontrado um percurso de marcação", evidence: "A inspeção não detetou marcação integrada." });
    if (ctaKnown && !input.hasCta) confirmedGaps.push({ label: "Não foi encontrado um CTA claro", evidence: "A inspeção não detetou um próximo passo explícito." });
    const improvementOpportunities = [];
    if (!site.official) improvementOpportunities.push({ label: "Reunir marca, informação e contactos numa página profissional própria", basis: "Ausência de website oficial confirmado." });
    else if (input.hasBooking === false || input.hasCta === false) improvementOpportunities.push({ label: "Tornar o percurso entre visita e pedido ou marcação mais evidente", basis: "CTA ou marcação não foram encontrados." });
    else improvementOpportunities.push({ label: "Validar se a comunicação atual diferencia a oferta e facilita a conversão", basis: "O funcionamento técnico não confirma eficácia comercial." });
    const unknowns = [];
    if (!ctaKnown) unknowns.push("Não foi possível confirmar a clareza do CTA.");
    if (!bookingKnown) unknowns.push("Não foi possível confirmar o processo de marcação.");
    if (!input.instagramUrl) unknowns.push("Não foi possível confirmar atividade recente no Instagram.");
    const mainCommercialGap = !site.official ? "O negócio depende de canais externos e não tem uma presença digital própria confirmada para transformar interesse em pedidos." : input.hasBooking === false || input.hasCta === false ? "O negócio tem presença digital, mas o percurso para pedido ou marcação não é evidente." : "A presença digital funciona, mas falta confirmar se comunica diferenciação e conduz visitantes a uma ação clara.";
    const whyContactThisLead = !site.official ? "É um negócio local contactável, com margem concreta para profissionalizar a apresentação e centralizar pedidos sem um investimento inicial elevado." : "É um negócio local com presença digital existente e uma oportunidade observável de simplificar o caminho até ao contacto ou marcação.";
    const communicationQuality = {
      clarity: !site.official ? "weak" : input.hasCta === false ? "weak" : ctaKnown ? "adequate" : "unknown",
      trust: site.official ? "adequate" : "unknown",
      brandingConsistency: site.official && input.instagramUrl ? "adequate" : "unknown",
      conversionFocus: input.hasCta === true || input.hasBooking === true ? "adequate" : input.hasCta === false || input.hasBooking === false ? "weak" : "unknown",
      contactAccessibility: input.phone || input.email || input.instagramUrl ? "adequate" : "weak",
      bookingAccessibility: input.hasBooking === true ? "strong" : input.hasBooking === false ? "weak" : "unknown",
      mobileExperience: input.mobile === true ? "adequate" : input.mobile === false ? "weak" : "unknown",
      professionalism: site.official ? "adequate" : "weak",
      explanation: mainCommercialGap,
    };
    return { confirmedGaps, improvementOpportunities, unknowns, mainCommercialGap, whyContactThisLead, communicationQuality };
  }
  function opportunity(input = {}) { return commercialAssessment(input).improvementOpportunities[0].label; }
  function initialMessage(input = {}, service) { const name = clean(input.name || "a vossa empresa"); const assessment = commercialAssessment(input); const observed = input.instagramUrl ? "Estive a ver o vosso trabalho no Instagram e gostei da forma como apresentam o negócio 🙂" : "Estive a conhecer o vosso negócio e gostei da forma como apresentam o vosso trabalho 🙂"; const gap = assessment.confirmedGaps[0]?.label || assessment.improvementOpportunities[0].label; const observation = `Reparei que ${gap.charAt(0).toLowerCase()}${gap.slice(1)}.`; const offer = service?.serviceId === "uneed_presence" ? "Na Uneed criamos presenças digitais chave na mão, com página profissional, domínio, email, alojamento, suporte e pedidos de marcação integrados, desde 39€ + IVA/mês e sem fidelização." : "Gostava de perceber se existe margem para simplificar a forma como recebem novos pedidos."; return `Olá ${name}! Sou o Francisco, da Uneed Soluções Digitais.\n\n${observed}\n\n${observation}\n\n${offer}\n\nSe quiserem, posso preparar-vos uma simulação personalizada sem compromisso.`; }
  function followUps(input = {}) { const name = clean(input.name); return { followUp1: `Olá${name ? ` ${name}` : ""}! Queria apenas confirmar se tiveram oportunidade de ver a mensagem que enviei. Posso preparar-vos uma simulação simples para perceberem melhor a ideia?`, followUp2: `Olá${name ? ` ${name}` : ""}! Não quero insistir, por isso deixo só esta última mensagem. Se fizer sentido melhorar a vossa presença digital, terei todo o gosto em preparar uma proposta ajustada.`, recommendedFollowUpDelayDays: 4 }; }
  function mockup(input = {}, service) { const mainOpportunity = opportunity(input); return { mockupRecommended: !classifyUrl(input.website).official || input.hasBooking === false, mockupReason: mainOpportunity, mockupPrompt: `Criar mockup personalizado para ${clean(input.name || "negócio local")}, no nicho ${clean(input.niche || "negócio local")}. Objetivo comercial: ${mainOpportunity}. Solução UNEED: ${service?.name || "a validar"}. Usar apenas identidade e contexto confirmados; destacar um CTA simples e uma experiência mobile profissional.` }; }
  function buildLeadIntelligence(input = {}) { const scoring = scoreLead(input); const channels = selectChannels(input); const service = recommendService(input); const assessment = commercialAssessment(input); const messages = followUps(input); const mockupData = mockup(input, service); const classified = classifyUrl(input.website); const confidence = input.confidence === "high" || input.confidence === "medium" || input.confidence === "low" ? input.confidence : Number(input.confidence || 0) >= .8 ? "high" : Number(input.confidence || 0) >= .55 ? "medium" : "low"; const confidenceReason = [classified.official ? "website oficial confirmado" : "website oficial não confirmado", input.instagramUrl ? "Instagram confirmado" : "perfil social não confirmado", input.phone || input.email ? "canal direto disponível" : "canal direto não confirmado"];
    return { schemaVersion: POLICY_VERSION, commercialScore: scoring.score, scoreBreakdown: scoring.breakdown, scoreVersion: scoring.version, confidence, confidenceReason, whyThisLead: assessment.whyContactThisLead, whyContactThisLead: assessment.whyContactThisLead, mainOpportunity: assessment.improvementOpportunities[0].label, mainCommercialGap: assessment.mainCommercialGap, confirmedGaps: assessment.confirmedGaps, improvementOpportunities: assessment.improvementOpportunities, unknowns: assessment.unknowns, communicationQuality: assessment.communicationQuality, serviceId: service?.serviceId || null, recommendedService: service?.name || null, uneedFit: service ? { serviceId: service.serviceId, fit: "high", reason: ["negócio local", "necessidade de presença profissional ou marcações", "solução mensal sem fidelização"] } : { serviceId: null, fit: "review", reason: ["necessidade comercial ainda por confirmar"] }, serviceDetails: service || null, ...channels, initialMessage: initialMessage(input, service), ...messages, ...mockupData, officialWebsite: classified.official ? classified.url : null, externalReferences: classified.official || !classified.url ? [] : [{ url: classified.url, type: classified.type }], readiness: "researching", createdBy: "automated_lead_factory", createdAt: new Date().toISOString(), lastResearchedAt: null, nextAction: "Aguardar conclusão da investigação" }; }
  return { POLICY_VERSION, SERVICE_CATALOG, SCORING_CONFIG, OUTREACH_POLICY, formatStructuredValue, classifyUrl, scoreLead, selectChannels, recommendService, commercialAssessment, initialMessage, followUps, mockup, buildLeadIntelligence };
});
