const { AIGateway } = require("./gateway");
const { LocalEvidenceProvider, OpenAIProvider } = require("./providers");
const { MissionEngine } = require("./mission-engine");
const { BraveSearchProvider } = require("./web-search");
const { DiscoverService } = require("./discover");
const { PageClient, TTLCache } = require("./discover-tools");
const { fetchPublicUrl } = require("./public-web");

function createMissionEngine(repository) {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push(new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: process.env.UNEED_AI_SMART_MODEL || "gpt-5-mini", maxCallCost: Number(process.env.UNEED_AI_MAX_CALL_COST || 0.25), inputCostPerMillion: process.env.UNEED_AI_INPUT_COST_PER_MILLION ? Number(process.env.UNEED_AI_INPUT_COST_PER_MILLION) : null, outputCostPerMillion: process.env.UNEED_AI_OUTPUT_COST_PER_MILLION ? Number(process.env.UNEED_AI_OUTPUT_COST_PER_MILLION) : null }));
  providers.push(new LocalEvidenceProvider());
  const routes = { FAST: String(process.env.UNEED_AI_FAST_ROUTE || "local-evidence,openai").split(","), SMART: String(process.env.UNEED_AI_SMART_ROUTE || (process.env.OPENAI_API_KEY ? "openai,local-evidence" : "local-evidence")).split(","), DEEP: String(process.env.UNEED_AI_DEEP_ROUTE || "openai,local-evidence").split(",") };
  const searchProvider = new BraveSearchProvider({ apiKey: process.env.BRAVE_SEARCH_API_KEY, timeoutMs: Number(process.env.DISCOVER_SEARCH_TIMEOUT_MS || 8000), costPerQuery: process.env.BRAVE_SEARCH_COST_PER_QUERY ? Number(process.env.BRAVE_SEARCH_COST_PER_QUERY) : null, maxQueryCost: Number(process.env.BRAVE_SEARCH_MAX_QUERY_COST || 0.05) });
  const pageClient = new PageClient({ cache: new TTLCache(Number(process.env.DISCOVER_CACHE_TTL_MS || 900000)), fetcher: (url) => fetchPublicUrl(url, { timeoutMs: Number(process.env.DISCOVER_FETCH_TIMEOUT_MS || 8000), maxBytes: Number(process.env.DISCOVER_MAX_PAGE_BYTES || 750000), maxRedirects: Number(process.env.DISCOVER_MAX_REDIRECTS || 3) }) });
  const discover = new DiscoverService({ searchProvider, pageClient, limits: { maxSearches: Number(process.env.MAX_WEB_SEARCHES || 2), maxPages: Number(process.env.MAX_PAGES_FETCHED || 3), maxDepth: Number(process.env.MAX_WEBSITE_DEPTH || 1) } });
  return new MissionEngine({ gateway: new AIGateway({ providers, routes }), repository, discover, maxSteps: Number(process.env.MISSION_MAX_STEPS || 10), missionTimeoutMs: Number(process.env.MISSION_TIMEOUT_MS || 300000) });
}

module.exports = { createMissionEngine };
