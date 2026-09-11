const { RuntimeError } = require("./errors");

class WebSearchProvider {
  supports() { return false; }
  async search() { throw new RuntimeError("CONFIGURATION_ERROR", "Search provider não implementado."); }
  async healthCheck() { return { ok: false }; }
}

class BraveSearchProvider extends WebSearchProvider {
  constructor({ apiKey, fetchImpl = global.fetch, timeoutMs = 8000, costPerQuery = null, maxQueryCost = 0.05 } = {}) { super(); this.id = "brave"; this.apiKey = apiKey; this.fetch = fetchImpl; this.timeoutMs = timeoutMs; this.costPerQuery = costPerQuery; this.maxQueryCost = maxQueryCost; }
  supports() { return Boolean(this.apiKey); }
  estimateCost() { return this.costPerQuery ?? this.maxQueryCost; }
  async search({ query, domains = [], maxResults = 5 }) {
    if (!this.apiKey) throw new RuntimeError("CONFIGURATION_ERROR", "BRAVE_SEARCH_API_KEY não configurada.");
    const cleanQuery = String(query || "").trim(); if (!cleanQuery || cleanQuery.length > 600) throw new RuntimeError("INPUT_INVALID", "Query de pesquisa inválida.");
    const scoped = `${cleanQuery} ${domains.slice(0, 3).map((domain) => `site:${domain}`).join(" ")}`.trim();
    const url = new URL("https://api.search.brave.com/res/v1/web/search"); url.searchParams.set("q", scoped); url.searchParams.set("count", String(Math.min(Math.max(Number(maxResults), 1), 10))); url.searchParams.set("country", "PT"); url.searchParams.set("search_lang", "pt"); url.searchParams.set("safesearch", "moderate");
    let response; try { response = await this.fetch(url, { headers: { Accept: "application/json", "X-Subscription-Token": this.apiKey }, signal: AbortSignal.timeout(this.timeoutMs) }); } catch (error) { if (["AbortError","TimeoutError"].includes(error.name)) throw new RuntimeError("AI_TIMEOUT", "Pesquisa web excedeu o timeout."); throw new RuntimeError("AI_UNAVAILABLE", "Pesquisa web indisponível."); }
    if (response.status === 429) throw new RuntimeError("AI_RATE_LIMIT", "Limite do provider de pesquisa atingido."); if (response.status >= 500) throw new RuntimeError("AI_UNAVAILABLE", "Provider de pesquisa indisponível."); if (!response.ok) throw new RuntimeError(response.status === 401 ? "AI_AUTH_ERROR" : "AI_BAD_RESPONSE", "Pesquisa web recusada.");
    const data = await response.json(); return { results: (data.web?.results || []).slice(0, maxResults).map((item) => ({ title: item.title || "", url: item.url, snippet: item.description || "", source: "brave", publishedAt: item.page_age || null })), cost: this.costPerQuery, costStatus: this.costPerQuery == null ? "unknown" : "actual" };
  }
  async healthCheck() { return { ok: Boolean(this.apiKey), configured: Boolean(this.apiKey) }; }
}

module.exports = { WebSearchProvider, BraveSearchProvider };
