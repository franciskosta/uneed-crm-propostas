const { BraveSearchProvider } = require("../uneed-os/web-search");
const { DiscoverService } = require("../uneed-os/discover");

const name = process.argv[2]; const website = process.argv[3] || "";
if (!name) { console.error("Uso: node scripts/smoke-discover.js 'Empresa' 'https://website.pt'"); process.exitCode = 1; }
else {
  const provider = new BraveSearchProvider({ apiKey: process.env.BRAVE_SEARCH_API_KEY, costPerQuery: process.env.BRAVE_SEARCH_COST_PER_QUERY ? Number(process.env.BRAVE_SEARCH_COST_PER_QUERY) : null });
  new DiscoverService({ searchProvider: provider }).research({ companyName: name, website }, { budget: Number(process.env.DISCOVER_SMOKE_MAX_COST || 1) }).then((result) => console.log(JSON.stringify(result.pack, null, 2))).catch((error) => { console.error(`${error.code || "ERROR"}: ${error.message}`); process.exitCode = 1; });
}
