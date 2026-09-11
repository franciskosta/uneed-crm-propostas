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
