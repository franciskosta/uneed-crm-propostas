(function initLeadIntelligence(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.UNEED_LEAD_INTELLIGENCE = api;
})(typeof window !== "undefined" ? window : null, function leadIntelligenceFactory() {
  const POLICY_VERSION = "lead-intelligence-v0.1";
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
    const site = classifyUrl(input.website); const realBusiness = input.placeId || input.mapsUrl || input.reviewCount > 0 ? 15 : 5;
    const digitalOpportunity = !site.official ? 25 : input.hasBooking === false || input.hasCta === false ? 15 : 5;
    const reachable = input.instagramUrl || input.phone || input.email ? 20 : 0;
    const socialActivity = input.instagramUrl ? 10 : 0;
    const nicheFit = input.niche ? 10 : 0;
    const localFit = input.municipality || input.district ? 10 : 0;
    const buyingSignal = Math.min(10, Number(input.reviewCount || 0) >= 20 ? 10 : Number(input.rating || 0) >= 4 ? 5 : 0);
    const breakdown = { realBusiness, digitalOpportunity, reachable, socialActivity, nicheFit, localFit, buyingSignal };
    return { score: Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)), breakdown, version: POLICY_VERSION };
  }
  function recommendService(input = {}, catalog = []) {
    const names = catalog.map((item) => item.name || item.label).filter(Boolean); const find = (...needles) => names.find((name) => needles.some((needle) => name.toLowerCase().includes(needle)));
    const site = classifyUrl(input.website);
    if (!site.official) return find("presença", "website", "site") || names[0] || null;
    if (input.hasBooking === false) return find("leads", "marcação", "personalizada") || find("presença", "website") || names[0] || null;
    return find("diagnóstico", "high ticket", "personalizada") || names[0] || null;
  }
  function opportunity(input = {}) { const site = classifyUrl(input.website); if (!site.official) return "Criar uma presença digital própria, profissional e orientada à conversão"; if (input.hasBooking === false) return "Simplificar pedidos e marcações através do website"; if (input.hasCta === false) return "Clarificar o próximo passo e os canais de contacto"; return "Validar melhorias de conversão na presença digital atual"; }
  function initialMessage(input = {}, service) { const name = clean(input.name || "a vossa empresa"); const observed = input.instagramUrl ? "Estive a ver a vossa presença no Instagram e gostei da forma como apresentam o negócio 🙂" : "Estive a conhecer a vossa presença online e gostei da forma como apresentam o negócio 🙂"; const gap = classifyUrl(input.website).official ? "Reparei que poderia ser útil tornar os pedidos e marcações ainda mais simples para quem vos encontra online." : "Reparei que uma página própria poderia ajudar a reunir a informação e tornar os pedidos ou marcações mais simples."; const offer = service ? `Na Uneed podemos preparar uma solução ${service}, ajustada ao vosso contexto.` : "Na Uneed criamos soluções digitais simples e ajustadas a cada negócio."; return `Olá ${name}! Sou o Francisco, da Uneed Soluções Digitais.\n\n${observed}\n\n${gap}\n\n${offer}\n\nFaria sentido preparar-vos uma simulação personalizada, sem qualquer compromisso?`; }
  function followUps(input = {}) { const name = clean(input.name); return { followUp1: `Olá${name ? ` ${name}` : ""}! Queria apenas confirmar se tiveram oportunidade de ver a mensagem que enviei. Posso preparar-vos uma simulação simples para perceberem melhor a ideia?`, followUp2: `Olá${name ? ` ${name}` : ""}! Não quero insistir, por isso deixo só esta última mensagem. Se fizer sentido melhorar a vossa presença digital, terei todo o gosto em preparar uma proposta ajustada.`, recommendedFollowUpDelayDays: 4 }; }
  function mockup(input = {}, service) { const mainOpportunity = opportunity(input); return { mockupRecommended: !classifyUrl(input.website).official || input.hasBooking === false, mockupReason: mainOpportunity, mockupPrompt: `Criar mockup personalizado para ${clean(input.name || "negócio local")}, no nicho ${clean(input.niche || "negócio local")}. Objetivo comercial: ${mainOpportunity}. Solução UNEED: ${service || "solução adequada do catálogo"}. Usar apenas identidade e contexto confirmados; destacar um CTA simples e uma experiência mobile profissional.` }; }
  function buildLeadIntelligence(input = {}, catalog = []) { const scoring = scoreLead(input); const channels = selectChannels(input); const service = recommendService(input, catalog); const messages = followUps(input); const mockupData = mockup(input, service); const classified = classifyUrl(input.website); return { schemaVersion: POLICY_VERSION, commercialScore: scoring.score, scoreBreakdown: scoring.breakdown, scoreVersion: scoring.version, confidence: Number(input.confidence || 0), whyThisLead: clean(input.notes) || opportunity(input), mainOpportunity: opportunity(input), recommendedService: service, ...channels, initialMessage: initialMessage(input, service), ...messages, ...mockupData, officialWebsite: classified.official ? classified.url : null, externalReferences: classified.official || !classified.url ? [] : [{ url: classified.url, type: classified.type }], readiness: "researching", createdBy: "automated_lead_factory", createdAt: new Date().toISOString(), lastResearchedAt: null, nextAction: "Aguardar conclusão da investigação" }; }
  return { POLICY_VERSION, SCORING_CONFIG, OUTREACH_POLICY, classifyUrl, scoreLead, selectChannels, recommendService, initialMessage, followUps, mockup, buildLeadIntelligence };
});
