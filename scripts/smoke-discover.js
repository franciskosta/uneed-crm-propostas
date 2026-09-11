const { OpenAIWebSearchProvider } = require("../uneed-os/web-search");
const { DiscoverService } = require("../uneed-os/discover");

const name = process.argv[2]; const website = process.argv[3] || "";
if (!name) { console.error("Uso: node scripts/smoke-discover.js 'Empresa' 'https://website.pt'"); process.exitCode = 1; }
else {
  const provider = new OpenAIWebSearchProvider({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_WEB_SEARCH_MODEL || process.env.UNEED_AI_SMART_MODEL || "gpt-5-mini", costPerQuery: process.env.OPENAI_WEB_SEARCH_COST_PER_QUERY ? Number(process.env.OPENAI_WEB_SEARCH_COST_PER_QUERY) : null, inputCostPerMillion: process.env.UNEED_AI_INPUT_COST_PER_MILLION ? Number(process.env.UNEED_AI_INPUT_COST_PER_MILLION) : null, outputCostPerMillion: process.env.UNEED_AI_OUTPUT_COST_PER_MILLION ? Number(process.env.UNEED_AI_OUTPUT_COST_PER_MILLION) : null });
  new DiscoverService({ searchProvider: provider }).research({ companyName: name, website }, { budget: Number(process.env.DISCOVER_SMOKE_MAX_COST || 1) }).then((result) => console.log(JSON.stringify(result.pack, null, 2))).catch((error) => { console.error(`${error.code || "ERROR"}: ${error.message}`); process.exitCode = 1; });
}
