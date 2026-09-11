const test = require("node:test");
const assert = require("node:assert/strict");
const { classifyUrl, scoreLead, selectChannels, buildLeadIntelligence } = require("../lead-intelligence");

test("official websites are separated from directories and social profiles", () => { assert.equal(classifyUrl("https://empresa.pt").type, "official_website"); assert.equal(classifyUrl("https://racius.com/empresa/x").official, false); assert.equal(classifyUrl("https://instagram.com/empresa").type, "social_profile"); assert.equal(classifyUrl("https://fresha.com/a/empresa").type, "booking_profile"); });

test("commercial score is single, explainable and versioned", () => { const result = scoreLead({ placeId: "p1", niche: "Cabeleireiros", municipality: "Aveiro", phone: "912345678", instagramUrl: "https://instagram.com/test", website: "", reviewCount: 25 }); assert.equal(result.score, Object.values(result.breakdown).reduce((sum, value) => sum + value, 0)); assert.equal(result.version, "lead-intelligence-v0.1"); assert.ok(result.score >= 70); });

test("channel selection prefers the natural available channel", () => { assert.deepEqual(selectChannels({ instagramUrl: "https://instagram.com/test", phone: "912345678" }), { primaryChannel: "instagram", fallbackChannel: "whatsapp" }); assert.deepEqual(selectChannels({ phone: "912345678" }), { primaryChannel: "whatsapp", fallbackChannel: "phone" }); });

test("Lead Intelligence prepares one message policy, two follow-ups and a contextual mockup prompt", () => { const lead = buildLeadIntelligence({ name: "Salão Aveiro", niche: "Cabeleireiros", municipality: "Aveiro", placeId: "p1", phone: "912345678", website: "", hasBooking: false }, [{ name: "Uneed Presença" }]); assert.equal(lead.createdBy, "automated_lead_factory"); assert.equal(lead.readiness, "researching"); assert.match(lead.initialMessage, /Sou o Francisco, da Uneed Soluções Digitais/); assert.ok(lead.followUp1 && lead.followUp2); assert.match(lead.mockupPrompt, /Salão Aveiro/); assert.equal(lead.recommendedService, "Uneed Presença"); });

test("directory URL remains an external reference and never an official website", () => { const lead = buildLeadIntelligence({ name: "Empresa", website: "https://racius.com/empresa/test" }, []); assert.equal(lead.officialWebsite, null); assert.equal(lead.externalReferences[0].type, "external_reference"); });
