const test = require("node:test");
const assert = require("node:assert/strict");
const { STRATEGIES, getStrategy, assertRunnable } = require("../acquisition-strategies");
const { buildLeadIntelligence, scoreLead } = require("../lead-intelligence");
const { migrateState } = require("../commercial-core");

test("Presença is the runnable default strategy with Quest eligibility", () => {
  const strategy = assertRunnable("uneed_presence");
  assert.equal(strategy.serviceId, "uneed_presence");
  assert.equal(strategy.questEligible, true);
  assert.equal(strategy.requiredHumanReview, "normal");
});

test("High Ticket exists structurally but cannot run generation", () => {
  assert.equal(getStrategy("high_ticket").questEligible, false);
  assert.equal(getStrategy("high_ticket").serviceId, null);
  assert.equal(getStrategy("high_ticket").requiredHumanReview, "strict");
  assert.throws(() => assertRunnable("high_ticket"), /inteligência ainda em configuração/);
});

test("Lead Intelligence carries explicit strategy and policy versions without inventing a High Ticket service", () => {
  const presence = buildLeadIntelligence({ name: "Salão", niche: "Cabeleireiros", phone: "912345678" });
  assert.equal(presence.strategyId, "uneed_presence");
  assert.equal(presence.serviceId, "uneed_presence");
  assert.equal(presence.qualificationProfileVersion, STRATEGIES.uneed_presence.qualificationProfile);
  const highTicket = buildLeadIntelligence({ name: "Empresa", strategyId: "high_ticket", phone: "912345678" });
  assert.equal(highTicket.strategyId, "high_ticket");
  assert.equal(highTicket.serviceId, null);
  assert.equal(highTicket.initialMessage, null);
});

test("strategy parameter does not duplicate or change Presença scoring infrastructure", () => {
  const input = { placeId: "p1", niche: "Cabeleireiros", municipality: "Aveiro", phone: "912345678", website: "", reviewCount: 25 };
  assert.equal(scoreLead(input).score, scoreLead({ ...input, strategyId: "uneed_presence" }).score);
});

test("legacy migration is conservative and never duplicates Company by strategy", () => {
  const base = { commercialCore: {}, companies: [], contacts: [], leads: [], opportunities: [], activities: [], projects: [], proposals: [], contracts: [], tickets: [] };
  const generated = { id: "p1", name: "Salão Seguro", source: "automated_lead_factory", createdBy: "automated_lead_factory", phone: "912345678", status: "Por fazer", createdAt: "2026-09-12T00:00:00Z", updatedAt: "2026-09-12T00:00:00Z" };
  const manual = { id: "p2", name: "Empresa Incerta", source: "instagram_prospecting", phone: "913456789", status: "Por fazer", createdAt: "2026-09-12T00:00:00Z", updatedAt: "2026-09-12T00:00:00Z" };
  const state = migrateState({ ...base, instagramProspects: [generated, manual] });
  assert.equal(state.instagramProspects[0].acquisitionStrategy, "uneed_presence");
  assert.equal(state.instagramProspects[1].acquisitionStrategy, null);
  assert.equal(state.companies.length, 2);
});
