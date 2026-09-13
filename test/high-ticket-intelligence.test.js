const test = require("node:test");
const assert = require("node:assert/strict");
const { getStrategy, assertRunnable } = require("../acquisition-strategies");
const { buildHighTicketIntelligence, highTicketScore, DIAGNOSTIC_URL } = require("../high-ticket-intelligence");

function fixture(categories = ["scale", "catalogue", "operations", "b2b", "growth", "locations"]) {
  const evidence = categories.map((category, index) => ({ id: `ev-${index}`, sourceUrl: `https://empresa.pt/${category}`, fact: `Sinal público de ${category}: exemplo.`, confidence: "medium", metadata: { category } }));
  return { companyIdentity: { name: "Empresa Industrial" }, knownData: { contacts: { email: "geral@empresa.pt", phone: null } }, highTicketSignals: Object.fromEntries(categories.map((category, index) => [category, [{ statement: evidence[index].fact, evidenceIds: [evidence[index].id] }]])), evidence, unknowns: ["Processos internos"], warnings: [], confidence: "medium", researchedAt: "2026-09-12T00:00:00.000Z" };
}

test("High Ticket generation is unlocked but remains human-only and Quest-ineligible", () => {
  const strategy = assertRunnable("high_ticket");
  assert.equal(strategy.requiredHumanReview, "strict");
  assert.equal(strategy.questEligible, false);
  assert.equal(strategy.serviceId, null);
  assert.equal(strategy.qualificationProfile, "high_ticket_v1");
});

test("High Ticket score is versioned and independent from Presence scoring", () => {
  const score = highTicketScore(fixture());
  assert.equal(score.version, "high_ticket_v1");
  assert.ok(score.score >= 55);
  assert.ok(Object.hasOwn(score.breakdown, "operationalComplexity"));
  assert.equal(Object.hasOwn(score.breakdown, "digitalOpportunity"), false);
});

test("pack separates evidence, hypotheses and validation questions without inventing service or proposal", () => {
  const result = buildHighTicketIntelligence({ name: "Empresa Industrial" }, fixture());
  assert.equal(result.serviceId, null);
  assert.equal(result.recommendedService, null);
  assert.equal(result.proposalCreated, false);
  assert.equal(result.questEligible, false);
  assert.equal(result.readiness, "ready_for_review");
  assert.ok(result.confirmedOperationalSignals.every((item) => item.evidenceIds.length));
  assert.ok(result.opportunityHypotheses.every((item) => item.evidenceIds.length && item.potentialImpact && item.confidence));
  assert.ok(result.discoveryQuestions.length >= 5);
  assert.equal(result.recommendedNextStep.url, DIAGNOSTIC_URL);
  assert.match(result.outreachStrategy.preparedMessage, /Empresa Industrial/);
  assert.match(result.outreachStrategy.preparedMessage, /Diagnóstico Digital/);
  assert.doesNotMatch(result.outreachStrategy.preparedMessage, /High Ticket|proposta|20\.000|cobaia/i);
  assert.equal(result.outreachStrategy.requiredHumanReview, "strict");
});

test("insufficient evidence never produces a generic outreach message", () => {
  const result = buildHighTicketIntelligence({ name: "Empresa Incerta" }, fixture([]));
  assert.equal(result.readiness, "needs_more_research");
  assert.equal(result.confidence, "low");
  assert.equal(result.outreachStrategy.preparedMessage, null);
  assert.equal(result.opportunityHypotheses.length, 0);
});

test("High Ticket explanation and message quote readable evidence rather than generic categories", () => { const pack = fixture(["locations"]); pack.evidence[0].fact = "Multi-localização: O grupo apresenta unidades em Belém, Parque das Nações e Odivelas."; pack.highTicketSignals.locations[0].statement = pack.evidence[0].fact; pack.evidence.push({ id: "ev-contact", fact: "Website oficial e contacto telefónico confirmados.", sourceUrl: "https://empresa.pt", confidence: "high" }); const result = buildHighTicketIntelligence({ name: "Hospital do Gato" }, pack); assert.match(result.opportunityHypotheses[0].rationale, /Belém, Parque das Nações e Odivelas/); assert.match(result.outreachStrategy.preparedMessage, /Multi-localização/); assert.doesNotMatch(result.outreachStrategy.preparedMessage, /Sinal público de locations/); });

test("a researched but clearly unsuitable company can be rejected with a reason", () => {
  const pack = fixture([]); pack.evidence = [{ id: "generic", sourceUrl: "https://micro.pt", fact: "Website respondeu com HTTP 200.", confidence: "high" }, { id: "https", sourceUrl: "https://micro.pt", fact: "Website usa HTTPS.", confidence: "high" }];
  const result = buildHighTicketIntelligence({ name: "Micro Empresa" }, pack);
  assert.equal(result.readiness, "reject");
  assert.match(result.rejectReason, /Sem sinais públicos/);
});

test("strategy registry preserves the single Lead Factory contract", () => {
  assert.equal(getStrategy("uneed_presence").runnable, true);
  assert.equal(getStrategy("high_ticket").assignmentMode, "human_only");
});
