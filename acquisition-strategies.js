(function initAcquisitionStrategies(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.UNEED_ACQUISITION_STRATEGIES = api;
})(typeof window !== "undefined" ? window : null, function acquisitionStrategiesFactory() {
  const CONFIG_VERSION = "acquisition-strategies-v0.1";
  const STRATEGIES = Object.freeze({
    uneed_presence: Object.freeze({ id: "uneed_presence", name: "Uneed Presença", active: true, runnable: true, serviceId: "uneed_presence", questEligible: true, assignmentMode: "quest_eligible", defaultMinimumScore: 70, requiredHumanReview: "normal", allowedChannels: Object.freeze(["instagram", "whatsapp", "email", "phone"]), researchProfile: "standard-v0.1", qualificationProfile: "uneed-presence-v0.1", messagePolicy: "uneed-presence-outreach-v0.1", createdAt: "2026-09-12", updatedAt: "2026-09-12" }),
    high_ticket: Object.freeze({ id: "high_ticket", name: "High Ticket", active: true, runnable: true, serviceId: null, questEligible: false, assignmentMode: "human_only", defaultMinimumScore: 55, requiredHumanReview: "strict", allowedChannels: Object.freeze(["email", "linkedin", "phone", "whatsapp"]), researchProfile: "high-ticket-deep-v0.1", qualificationProfile: "high_ticket_v1", messagePolicy: "high-ticket-diagnostic-v0.1", createdAt: "2026-09-12", updatedAt: "2026-09-12" }),
  });
  function getStrategy(id = "uneed_presence") { return STRATEGIES[id] || null; }
  function listStrategies() { return Object.values(STRATEGIES); }
  function assertRunnable(id) { const strategy = getStrategy(id); if (!strategy) throw new Error("Estratégia de aquisição inválida."); if (!strategy.runnable) throw new Error(`${strategy.name}: estrutura preparada; inteligência ainda em configuração.`); return strategy; }
  return { CONFIG_VERSION, STRATEGIES, getStrategy, listStrategies, assertRunnable };
});
