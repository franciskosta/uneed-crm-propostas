const crypto = require("crypto");
const { Tool } = require("./tools");
const { RuntimeError } = require("./errors");
const { fetchPublicUrl, extractPage, normalizeUrl } = require("./public-web");

class TTLCache { constructor(ttlMs = 15 * 60_000) { this.ttlMs = ttlMs; this.items = new Map(); } get(key) { const item = this.items.get(key); if (!item || item.expiresAt < Date.now()) { this.items.delete(key); return null; } return structuredClone(item.value); } set(key, value) { this.items.set(key, { value: structuredClone(value), expiresAt: Date.now() + this.ttlMs }); return value; } }

class PageClient {
  constructor({ cache = new TTLCache(), fetcher = fetchPublicUrl } = {}) { this.cache = cache; this.fetcher = fetcher; }
  async get(url) { const key = normalizeUrl(url, url); const cached = this.cache.get(key); if (cached) return { ...cached, cached: true }; const response = await this.fetcher(key); const contentType = String(response.headers["content-type"] || ""); if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) throw new RuntimeError("AI_BAD_RESPONSE", "Tipo de conteúdo público não suportado."); const page = { url: response.finalUrl, status: response.status, redirects: response.redirects, fetchedAt: new Date().toISOString(), content: extractPage(response.body, response.finalUrl) }; this.cache.set(key, page); return { ...page, cached: false }; }
}

class ReadCrmTool extends Tool {
  constructor() { super({ id: "read_crm" }); }
  async execute(input) { const lead = input?.lead || {}; const company = input?.company || {}; const contact = input?.contact || {}; return { data: { companyId: company.id || lead.companyId || null, leadId: lead.id || null, name: company.name || lead.companyName || lead.clientName || "", website: company.website || lead.companyWebsite || lead.website || "", location: company.location || lead.location || "", email: contact.email || company.email || lead.clientEmail || "", phone: contact.phone || company.phone || lead.clientPhone || "", instagram: company.instagramUrl || lead.instagramUrl || lead.instagram || "", facebook: company.facebookUrl || "", linkedin: company.linkedinUrl || "", booking: company.bookingUrl || "", observations: lead.notes || company.notes || lead.internalNotes || "", source: lead.source || lead.leadSource || "", channel: lead.channel || "", catalog: (input?.services || lead.catalog || lead.services || []).filter((item) => item.selected !== false).map((item) => ({ name: item.name })).filter((item) => item.name) }, cost: 0, costStatus: "actual" }; }
}

class SearchWebTool extends Tool {
  constructor({ provider, cache = new TTLCache() }) { super({ id: "search_web" }); this.provider = provider; this.cache = cache; }
  async execute(input) { const key = JSON.stringify(input); const cached = this.cache.get(key); if (cached) return { ...cached, cached: true }; const result = await this.provider.search(input); this.cache.set(key, result); return { ...result, cached: false }; }
}

class FetchPublicPageTool extends Tool {
  constructor({ pageClient }) { super({ id: "fetch_public_page" }); this.pageClient = pageClient; }
  async execute({ url }) { const page = await this.pageClient.get(url); return { page, cost: 0, costStatus: "actual" }; }
}

class InspectWebsiteTool extends Tool {
  constructor({ pageClient }) { super({ id: "inspect_website" }); this.pageClient = pageClient; }
  async execute({ url }) { const started = Date.now(); const page = await this.pageClient.get(url); const { content } = page; const haystack = `${content.text} ${content.links.map((item) => `${item.text} ${item.url}`).join(" ")}`.toLowerCase(); const contacts = { emails: [...new Set(content.text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || [])].slice(0, 10), phones: [...new Set(content.text.match(/(?:\+351\s*)?2\d{8}|(?:\+351\s*)?9\d{8}/g) || [])].slice(0, 10) };
    const socialLinks = content.links.filter((item) => /instagram\.com|facebook\.com|linkedin\.com|youtube\.com|tiktok\.com/i.test(item.url)); const internal = content.links.filter((item) => { try { return new URL(item.url).hostname === new URL(page.url).hostname; } catch { return false; } });
    return { inspection: { url: page.url, status: page.status, https: page.url.startsWith("https://"), redirectedHttpToHttps: page.redirects.some((item) => item.startsWith("https://")), responseTimeMs: Date.now() - started, title: content.title, metaDescription: content.metaDescription, mobileViewport: content.viewport, language: content.language, canonical: content.canonical, headings: content.headings, contacts, forms: content.forms, whatsapp: /wa\.me|api\.whatsapp\.com|whatsapp/.test(haystack), booking: /marcar|marca[cç][aã]o|agendar|booking|appointment/.test(haystack), ecommerce: /carrinho|checkout|adicionar ao carrinho|shopify|woocommerce/.test(haystack), quoteRequest: /pedir orçamento|solicitar orçamento|request (a )?quote/.test(haystack), ctas: content.links.filter((item) => /contact|contacto|marcar|agendar|comprar|orçamento/i.test(item.text)).slice(0, 20), socialLinks, principalPages: internal.filter((item) => /servi|sobre|contact|marca|agenda|orçamento|produto|catálogo|catalog|carreira|career|notícia|news|download|portal|cliente|loja|localiza/i.test(`${item.text} ${item.url}`)).slice(0, 20), signals: page.status >= 400 ? [`HTTP ${page.status}`] : [] }, page, cost: 0, costStatus: "actual", cached: page.cached };
  }
}

class DiscoverSocialProfilesTool extends Tool {
  constructor() { super({ id: "discover_social_profiles" }); }
  async execute({ websiteLinks = [], searchResults = [], crm = {} }) { const candidates = [...websiteLinks.map((item) => ({ url: item.url, source: "website", confidence: "high" })), ...searchResults.map((item) => ({ url: item.url, source: "search", confidence: "medium" })), ...(crm.instagram ? [{ url: crm.instagram, source: "crm", confidence: "high" }] : [])]; const platforms = [["instagram",/instagram\.com\/([^/?#]+)/i],["facebook",/facebook\.com\/([^/?#]+)/i],["linkedin",/linkedin\.com\/(?:company\/)?([^/?#]+)/i],["youtube",/youtube\.com\/(?:@|channel\/|c\/)?([^/?#]+)/i],["tiktok",/tiktok\.com\/@?([^/?#]+)/i]]; const profiles = [];
    for (const candidate of candidates) for (const [platform, pattern] of platforms) { const match = candidate.url?.match(pattern); if (match) profiles.push({ platform, url: normalizeUrl(candidate.url, candidate.url), handle: match[1] || null, source: candidate.source, confidence: candidate.confidence }); }
    return { profiles: [...new Map(profiles.map((item) => [`${item.platform}:${item.url}`, item])).values()], cost: 0, costStatus: "actual" };
  }
}

function evidence({ type = "fact", url, title, fact, excerpt = "", confidence = "medium", metadata = {} }) { return { id: crypto.randomUUID(), type, sourceUrl: url || null, sourceTitle: title || "", observedAt: new Date().toISOString(), fact, rawExcerpt: excerpt.slice(0, 240) || null, confidence, metadata }; }

module.exports = { TTLCache, PageClient, ReadCrmTool, SearchWebTool, FetchPublicPageTool, InspectWebsiteTool, DiscoverSocialProfilesTool, evidence };
