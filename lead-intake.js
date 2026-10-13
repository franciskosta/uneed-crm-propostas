(function initLeadIntake(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.UNEED_LEAD_INTAKE = api;
})(typeof window !== "undefined" ? window : null, function leadIntakeFactory() {
  const SCHEMA_VERSION = "lead-intake-v1";
  const PRIVACY_VERSION = "2026-10-13";
  const ORIGINS = Object.freeze(["uneed.pt", "360.uneed.pt", "presenca.uneed.pt"]);
  const PRODUCTS = Object.freeze(["uneed", "uneed_360", "uneed_presence"]);
  const MODULES_360 = Object.freeze(["clientes", "propostas", "obras", "agenda", "despesas", "documentos"]);
  const PRESENCE_NEEDS = Object.freeze(["booking", "catalogue", "quote", "contact", "institutional"]);
  const LANGUAGES = Object.freeze(["EN", "ES", "FR", "DE"]);
  const PRESENCE_ADDONS = Object.freeze({
    remover_branding: { name: "Remover by uneed.pt", monthly: 5 },
    idioma_extra: { name: "Página em mais um idioma", monthly: 5, quantity: "languages" },
    assistente_guiado: { name: "Assistente Guiado 24h", monthly: 12, exclusive: "assistant" },
    assistente_inteligente: { name: "Assistente Inteligente 24h", monthly: 29, exclusive: "assistant" },
    email_extra: { name: "Email profissional 15GB extra", monthly: 6, quantity: "number" },
    backoffice: { name: "Backoffice para editar conteúdos", monthly: 15 },
    avaliacoes: { name: "Sistema de avaliações", monthly: 5, only: "booking" },
    multi_estabelecimento: { name: "Versão multi-estabelecimento", monthly: 7.5, quantity: "number", only: "booking" },
    sistema_inscricoes: { name: "Sistema de inscrições", monthly: 9, only: "institutional" },
    sms_100: { name: "Pack 100 SMS/mês", monthly: 9, only: "booking", exclusive: "sms" },
    sms_250: { name: "Pack 250 SMS/mês", monthly: 19, only: "booking", exclusive: "sms" },
    sms_500: { name: "Pack 500 SMS/mês", monthly: 39, only: "booking", exclusive: "sms" },
    sms_1000: { name: "Pack 1000 SMS/mês", monthly: 89, only: "booking", exclusive: "sms" },
    cartoes: { name: "250 cartões por ano", monthly: 5 },
    pagina_extra: { name: "Conteúdos ou páginas extra", monthly: null },
  });

  function fail(code, message, fields = [], status = 400) {
    throw Object.assign(new Error(message), { code, fields, status });
  }
  function text(value, max = 4000) { return String(value ?? "").trim().slice(0, max); }
  function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
  function unique(values) { return [...new Set(values)]; }
  function publicUrl(value, max = 800) {
    const raw = text(value, max); if (!raw) return "";
    try { const parsed = new URL(raw); return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : ""; } catch { return ""; }
  }
  function clientEstimate(input) {
    const raw = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    return { initial: number(raw.initial), monthly: number(raw.monthly), firstYear: number(raw.firstYear) };
  }
  function estimate360(configuration) {
    const model = text(configuration.model, 30);
    const modules = unique((Array.isArray(configuration.modules) ? configuration.modules : []).map((item) => text(item, 40)));
    if (modules.some((item) => !MODULES_360.includes(item))) fail("configuration_invalid", "A configuração contém módulos desconhecidos.", ["configuration.modules"], 409);
    if (!model) return { configuration: { need: text(configuration.need, 80) || "team", model: null, modules }, estimate: { currency: "EUR", vatIncluded: false, initial: 0, monthly: 0, firstYear: 0, priceStatus: "requires_quote" } };
    if (!Object.hasOwn({ purchase: true, subscription: true }, model)) fail("configuration_invalid", "Escolha compra ou subscrição.", ["configuration.model"], 409);
    const subscription = model === "subscription";
    const initial = (subscription ? 650 : 950) + modules.length * (subscription ? 100 : 500);
    const monthly = subscription ? 39 + modules.length * 19 : 0;
    return { configuration: { model, modules }, estimate: { currency: "EUR", vatIncluded: false, initial, monthly, firstYear: initial + 12 * monthly, priceStatus: subscription ? "estimated" : "recurring_requires_quote" } };
  }
  function estimatePresence(configuration) {
    const plan = text(configuration.plan, 30) || "start";
    if (plan !== "start") fail("configuration_invalid", "Plano Presença desconhecido.", ["configuration.plan"], 409);
    const presenceNeed = text(configuration.presenceNeed, 40);
    if (!PRESENCE_NEEDS.includes(presenceNeed)) fail("configuration_invalid", "Escolha o tipo de presença.", ["configuration.presenceNeed"], 409);
    const seen = new Set(), exclusive = new Set();
    const addons = (Array.isArray(configuration.addons) ? configuration.addons : []).slice(0, 30).map((item) => {
      const key = text(item?.key, 60), definition = PRESENCE_ADDONS[key];
      if (!definition || seen.has(key)) fail("configuration_invalid", "A configuração contém extras desconhecidos ou repetidos.", ["configuration.addons"], 409);
      seen.add(key);
      if (definition.only && definition.only !== presenceNeed) fail("configuration_invalid", "Um extra não é compatível com o tipo de presença.", ["configuration.addons"], 409);
      if (definition.exclusive && exclusive.has(definition.exclusive)) fail("configuration_invalid", "Escolha apenas uma opção de cada grupo de extras.", ["configuration.addons"], 409);
      if (definition.exclusive) exclusive.add(definition.exclusive);
      const languages = definition.quantity === "languages" ? unique((Array.isArray(item.languages) ? item.languages : []).map((language) => text(language, 4).toUpperCase())) : [];
      if (languages.some((language) => !LANGUAGES.includes(language))) fail("configuration_invalid", "Idioma adicional inválido.", ["configuration.addons"], 409);
      const quantity = definition.quantity === "languages" ? languages.length : definition.quantity === "number" ? Math.trunc(number(item.quantity)) : 1;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20 || (definition.quantity === "languages" && quantity > LANGUAGES.length)) fail("configuration_invalid", "Confirme as quantidades selecionadas.", ["configuration.addons"], 409);
      const subtotal = definition.monthly === null ? null : Math.round(definition.monthly * quantity * 100) / 100;
      return { key, name: definition.name, quantity, languages, unitMonthly: definition.monthly, monthlySubtotal: subtotal };
    });
    const knownMonthly = 39 + addons.reduce((sum, addon) => sum + (addon.monthlySubtotal || 0), 0);
    const requiresQuote = addons.some((addon) => addon.monthlySubtotal === null);
    return { configuration: { plan, presenceNeed, addons }, estimate: { currency: "EUR", vatIncluded: false, initial: 0, monthly: knownMonthly, firstYear: knownMonthly * 12, priceStatus: requiresQuote ? "requires_quote" : "estimated" } };
  }
  function normalize(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) fail("invalid_json", "Pedido inválido.");
    const schemaVersion = text(input.schemaVersion, 40);
    const idempotencyKey = text(input.idempotencyKey, 128);
    const origin = text(input.origin, 80).toLowerCase();
    const product = text(input.product, 40).toLowerCase();
    const fields = [];
    if (schemaVersion !== SCHEMA_VERSION) fields.push("schemaVersion");
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) fields.push("idempotencyKey");
    if (!ORIGINS.includes(origin)) fields.push("origin");
    if (!PRODUCTS.includes(product)) fields.push("product");
    const allowedProductOrigin = product === "uneed_presence" ? origin === "presenca.uneed.pt" : product === "uneed_360" ? ["uneed.pt", "360.uneed.pt"].includes(origin) : origin === "uneed.pt";
    if (!allowedProductOrigin) fields.push("product_origin");
    const contactInput = input.contact && typeof input.contact === "object" ? input.contact : {};
    const contact = { name: text(contactInput.name, 160), email: text(contactInput.email, 254).toLowerCase(), phone: text(contactInput.phone, 40) };
    if (contact.name.length < 2) fields.push("contact.name");
    if (!contact.email && !contact.phone) fields.push("contact.email_or_phone");
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) fields.push("contact.email");
    if (contact.phone && !/^\+?[\d\s().-]{7,40}$/.test(contact.phone)) fields.push("contact.phone");
    const businessInput = input.business && typeof input.business === "object" ? input.business : {};
    const business = { name: text(businessInput.name, 180), sector: text(businessInput.sector, 120), website: publicUrl(businessInput.website) };
    if (businessInput.website && !business.website) fields.push("business.website");
    const consentInput = input.consent && typeof input.consent === "object" ? input.consent : {};
    const consent = { privacy: consentInput.privacy === true, privacyVersion: text(consentInput.privacyVersion, 40) };
    if (!consent.privacy) fields.push("consent.privacy");
    if (consent.privacyVersion !== PRIVACY_VERSION) fields.push("consent.privacyVersion");
    if (fields.length) fail("validation_failed", "Confirme os campos indicados.", unique(fields));
    const rawConfiguration = input.configuration && typeof input.configuration === "object" && !Array.isArray(input.configuration) ? input.configuration : {};
    let calculated = { configuration: { need: text(rawConfiguration.need, 80) }, estimate: { currency: "EUR", vatIncluded: false, initial: 0, monthly: 0, firstYear: 0, priceStatus: "not_applicable" } };
    if (product === "uneed_360") calculated = estimate360(rawConfiguration);
    if (product === "uneed_presence") calculated = estimatePresence(rawConfiguration);
    const claimed = clientEstimate(rawConfiguration.clientEstimate);
    const estimateMismatch = ["initial", "monthly", "firstYear"].some((key) => Math.abs(claimed[key] - calculated.estimate[key]) > 0.01);
    const contextInput = input.context && typeof input.context === "object" ? input.context : {};
    const utmInput = contextInput.utm && typeof contextInput.utm === "object" ? contextInput.utm : {};
    return {
      schemaVersion, idempotencyKey, origin, product, contact, business,
      message: text(input.message, 6000),
      configuration: calculated.configuration,
      clientEstimate: claimed,
      estimate: { ...calculated.estimate, clientEstimateMismatch: estimateMismatch },
      consent,
      context: { pageUrl: publicUrl(contextInput.pageUrl), referrer: publicUrl(contextInput.referrer), utm: Object.fromEntries(["source", "medium", "campaign", "content", "term"].map((key) => [key, text(utmInput[key], 160)])) },
      antiSpam: { website: text(input.antiSpam?.website, 200), startedAt: text(input.antiSpam?.startedAt, 50) },
    };
  }
  function summary(payload) {
    if (payload.product === "uneed_360") return `UNEED 360º · ${payload.configuration.model === "purchase" ? "Compra" : payload.configuration.model === "subscription" ? "Subscrição" : "âmbito a definir"} · ${payload.configuration.modules.join(", ") || "sem módulos adicionais"}`;
    if (payload.product === "uneed_presence") return `UNEED Presença · ${payload.configuration.presenceNeed} · ${payload.configuration.addons.map((addon) => `${addon.name}${addon.quantity > 1 ? ` × ${addon.quantity}` : ""}`).join(", ") || "sem extras"}`;
    return `UNEED · ${payload.configuration.need || "pedido geral"}`;
  }
  function toProspect(row) {
    const payload = row.payload || {}, contact = payload.contact || {}, business = payload.business || {};
    const presence = payload.product === "uneed_presence";
    return {
      id: `intake-${row.id}`, sourceIntakeId: row.id, intakeReference: row.reference,
      name: business.name || contact.name || "Pedido do website", email: contact.email || "", phone: contact.phone || "",
      website: business.website || "", officialWebsite: business.website || "", niche: business.sector || "",
      status: "Por fazer", source: "website_form", discoverySource: "website_form", createdBy: "website_form",
      acquisitionStrategy: presence ? "uneed_presence" : "high_ticket", strategyId: presence ? "uneed_presence" : "high_ticket",
      serviceId: presence ? "uneed_presence" : null, questEligible: false, readiness: "not_researched", primaryChannel: contact.email ? "email" : "phone",
      hasWebsite: Boolean(business.website), hasBooking: false, hasWhatsappTree: false,
      notes: [payload.message, summary(payload), `Referência: ${row.reference}`].filter(Boolean).join("\n\n"),
      websiteRequest: { origin: payload.origin, product: payload.product, contact, business, message: payload.message || "", configuration: payload.configuration, estimate: row.estimate || payload.estimate, consent: payload.consent, context: payload.context, receivedAt: row.created_at },
      createdAt: row.created_at, updatedAt: row.created_at,
    };
  }
  function mergeRows(state, rows) {
    state.instagramProspects ||= [];
    const known = new Set(state.instagramProspects.map((item) => item.sourceIntakeId).filter(Boolean));
    const added = [];
    for (const row of [...(rows || [])].reverse()) if (row?.id && !known.has(row.id)) { const prospect = toProspect(row); state.instagramProspects.unshift(prospect); known.add(row.id); added.push(prospect); }
    return added;
  }
  return { SCHEMA_VERSION, PRIVACY_VERSION, ORIGINS, PRODUCTS, MODULES_360, PRESENCE_NEEDS, PRESENCE_ADDONS, normalize, summary, toProspect, mergeRows, fail };
});
