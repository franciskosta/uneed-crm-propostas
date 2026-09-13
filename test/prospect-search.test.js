const test = require("node:test");
const assert = require("node:assert/strict");
const { discover } = require("../api/prospect/search");

test("manual target scenario produces five prepared Aveiro hairdresser candidates above score 70", async (t) => {
  const previousKey = process.env.GOOGLE_PLACES_API_KEY; const previousFetch = global.fetch;
  process.env.GOOGLE_PLACES_API_KEY = "test-key";
  global.fetch = async (_url, options) => { const body = JSON.parse(options.body); if (body.textQuery.startsWith("município")) return { ok: true, json: async () => ({ places: [{ location: { latitude: 40.64, longitude: -8.65 } }] }) }; return { ok: true, json: async () => ({ places: Array.from({ length: 5 }, (_, index) => ({ id: `place-${index}`, displayName: { text: `Cabeleireiro Aveiro ${index + 1}` }, formattedAddress: `Aveiro ${index + 1}`, nationalPhoneNumber: `91234567${index}`, googleMapsUri: `https://maps.google.com/?q=${index}`, rating: 4.5, userRatingCount: 30 })) }) }; };
  t.after(() => { global.fetch = previousFetch; if (previousKey == null) delete process.env.GOOGLE_PLACES_API_KEY; else process.env.GOOGLE_PLACES_API_KEY = previousKey; });
  const result = await discover({ niche: { id: "hair", label: "Cabeleireiros", query: "cabeleireiro" }, district: "Aveiro", municipalities: ["Aveiro"], radiusKm: 10, limit: 5, minScore: 70, knownKeys: [], catalog: [{ name: "Uneed Presença" }] });
  assert.equal(result.results.length, 5);
  assert.ok(result.results.every((lead) => lead.municipality === "Aveiro" && lead.commercialScore >= 70 && lead.initialMessage && lead.followUp1 && lead.followUp2 && lead.mockupPrompt));
  assert.ok(result.results.every((lead) => lead.source === "automated_lead_factory" && lead.discoverySource === "google_places"));
});

test("High Ticket sends the best preliminary candidate to deep research before applying final Fit", async (t) => {
  const previousKey = process.env.GOOGLE_PLACES_API_KEY; const previousFetch = global.fetch; process.env.GOOGLE_PLACES_API_KEY = "test-key";
  global.fetch = async (url, options = {}) => { if (String(url).includes("places.googleapis.com")) { const body = JSON.parse(options.body); if (body.textQuery.startsWith("município")) return { ok: true, json: async () => ({ places: [{ location: { latitude: 38.67, longitude: -9.15 } }] }) }; return { ok: true, json: async () => ({ places: [{ id: "b2b-1", displayName: { text: "Fornecedor Almada" }, formattedAddress: "Almada", websiteUri: "https://fornecedor.test", nationalPhoneNumber: "212345678", userRatingCount: 5 }] }) }; } return { ok: true, text: async () => "<html><body>Produtos para empresas</body></html>" }; };
  t.after(() => { global.fetch = previousFetch; if (previousKey == null) delete process.env.GOOGLE_PLACES_API_KEY; else process.env.GOOGLE_PLACES_API_KEY = previousKey; });
  const result = await discover({ niche: { label: "Distribuidores e fornecedores B2B", query: "fornecedores B2B" }, acquisitionStrategy: "high_ticket", district: "Setúbal", municipalities: ["Almada"], radiusKm: 10, limit: 1, minScore: 55, knownKeys: [] });
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].preliminaryQualification, true);
  assert.equal(result.results[0].readiness, "researching");
  assert.ok(result.results[0].provisionalScore < 55);
});

test("Lead Factory enforces the selected radius instead of treating it only as a bias", async (t) => { const previousKey = process.env.GOOGLE_PLACES_API_KEY; const previousFetch = global.fetch; process.env.GOOGLE_PLACES_API_KEY = "test-key"; global.fetch = async (_url, options = {}) => { const body = JSON.parse(options.body); if (body.textQuery.startsWith("município")) return { ok: true, json: async () => ({ places: [{ location: { latitude: 38.67, longitude: -9.15 } }] }) }; return { ok: true, json: async () => ({ places: [{ id: "near", displayName: { text: "Empresa Próxima" }, formattedAddress: "Almada", nationalPhoneNumber: "210000001", location: { latitude: 38.68, longitude: -9.15 } }, { id: "far", displayName: { text: "Empresa Distante" }, formattedAddress: "Setúbal", nationalPhoneNumber: "210000002", location: { latitude: 38.52, longitude: -8.89 } }] }) }; }; t.after(() => { global.fetch = previousFetch; if (previousKey == null) delete process.env.GOOGLE_PLACES_API_KEY; else process.env.GOOGLE_PLACES_API_KEY = previousKey; }); const result = await discover({ niche: { label: "Empresas", query: "empresas" }, acquisitionStrategy: "high_ticket", district: "Setúbal", municipalities: ["Almada"], radiusKm: 10, limit: 2, knownKeys: [] }); assert.deepEqual(result.results.map((item) => item.name), ["Empresa Próxima"]); assert.ok(result.results[0].distanceKm < 10); assert.equal(result.results[0].searchArea, "Almada · raio 10 km"); });
