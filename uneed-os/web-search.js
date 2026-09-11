const { RuntimeError } = require("./errors");

class WebSearchProvider {
  supports() { return false; }
  async search() { throw new RuntimeError("CONFIGURATION_ERROR", "Search provider não implementado."); }
  async healthCheck() { return { ok: false }; }
}

class OpenAIWebSearchProvider extends WebSearchProvider {
  constructor({ apiKey, model = "gpt-5-mini", fetchImpl = global.fetch, timeoutMs = 32000, costPerQuery = null, inputCostPerMillion = null, outputCostPerMillion = null, maxQueryCost = 0.05 } = {}) {
    super(); this.id = "openai"; this.apiKey = apiKey; this.model = model; this.fetch = fetchImpl; this.timeoutMs = timeoutMs; this.costPerQuery = costPerQuery; this.inputCostPerMillion = inputCostPerMillion; this.outputCostPerMillion = outputCostPerMillion; this.maxQueryCost = maxQueryCost;
  }
  supports() { return Boolean(this.apiKey); }
  estimateCost() { return this.maxQueryCost; }
  async search({ query, domains = [], maxResults = 5 }) {
    if (!this.apiKey) throw new RuntimeError("CONFIGURATION_ERROR", "OPENAI_API_KEY não configurada.");
    const cleanQuery = String(query || "").trim(); if (!cleanQuery || cleanQuery.length > 600) throw new RuntimeError("INPUT_INVALID", "Query de pesquisa inválida.");
    const limit = Math.min(Math.max(Number(maxResults), 1), 10); const allowedDomains = domains.slice(0, 3).map((domain) => String(domain).trim()).filter(Boolean);
    const scope = allowedDomains.length ? ` Limita a pesquisa a: ${allowedDomains.join(", ")}.` : "";
    let response;
    try {
      response = await this.fetch("https://api.openai.com/v1/responses", { method: "POST", signal: AbortSignal.timeout(this.timeoutMs), headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: this.model, reasoning: { effort: "low" }, text: { verbosity: "low" }, max_output_tokens: 600, store: false, tools: [{ type: "web_search" }], tool_choice: "required", max_tool_calls: 1, include: ["web_search_call.action.sources"], input: `Pesquisa web: ${cleanQuery}.${scope} Devolve uma síntese factual e concisa baseada em, no máximo, ${limit} fontes relevantes.` }) });
    } catch (error) { if (["AbortError","TimeoutError"].includes(error.name)) throw new RuntimeError("AI_TIMEOUT", "Pesquisa web excedeu o timeout."); throw new RuntimeError("AI_UNAVAILABLE", "Pesquisa web indisponível."); }
    if (response.status === 429) throw new RuntimeError("AI_RATE_LIMIT", "Limite do provider de pesquisa atingido."); if (response.status >= 500) throw new RuntimeError("AI_UNAVAILABLE", "Provider de pesquisa indisponível."); if (!response.ok) throw new RuntimeError([401,403].includes(response.status) ? "AI_AUTH_ERROR" : "AI_BAD_RESPONSE", "Pesquisa web recusada.");
    const data = await response.json(); const output = Array.isArray(data.output) ? data.output : []; const messages = output.filter((item) => item.type === "message").flatMap((item) => item.content || []).filter((item) => item.type === "output_text");
    const fallbackSnippet = messages.map((item) => item.text || "").join(" ").replace(/\s+/g, " ").trim().slice(0, 500); const candidates = [];
    for (const content of messages) for (const annotation of content.annotations || []) if (annotation.type === "url_citation" && annotation.url) candidates.push({ title: annotation.title || "", url: annotation.url, snippet: content.text?.slice(annotation.start_index || 0, annotation.end_index || undefined).replace(/\s+/g, " ").trim() || fallbackSnippet });
    for (const call of output.filter((item) => item.type === "web_search_call")) for (const source of call.action?.sources || []) if (source.url) candidates.push({ title: source.title || "", url: source.url, snippet: fallbackSnippet });
    const results = [...new Map(candidates.map((item) => [item.url, item])).values()].slice(0, limit).map((item) => ({ ...item, source: "openai", publishedAt: null }));
    if (!results.length) throw new RuntimeError("AI_BAD_RESPONSE", "Pesquisa web não devolveu fontes utilizáveis.");
    const inputTokens = Number(data.usage?.input_tokens || 0); const outputTokens = Number(data.usage?.output_tokens || 0); const searchCalls = output.filter((item) => item.type === "web_search_call").length;
    const hasKnownCost = this.costPerQuery != null && this.inputCostPerMillion != null && this.outputCostPerMillion != null; const cost = hasKnownCost ? searchCalls * this.costPerQuery + (inputTokens * this.inputCostPerMillion + outputTokens * this.outputCostPerMillion) / 1_000_000 : null;
    return { results, cost, costStatus: cost == null ? "unknown" : "actual" };
  }
  async healthCheck() { return { ok: Boolean(this.apiKey), configured: Boolean(this.apiKey), model: this.model }; }
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

module.exports = { WebSearchProvider, OpenAIWebSearchProvider, BraveSearchProvider };
