const { RuntimeError, normalizeProviderError } = require("./errors");

class AIGateway {
  constructor({ providers, routes = {} }) { this.providers = providers; this.routes = routes; }
  async execute(request) {
    const preferred = this.routes[request.quality || "SMART"] || [];
    const candidates = [...preferred, ...this.providers.map((provider) => provider.id)];
    const seen = new Set();
    const eligible = candidates.map((id) => this.providers.find((item) => item.id === id)).filter((item) => item && !seen.has(item.id) && seen.add(item.id) && item.supports(request.capabilitiesRequired));
    if (!eligible.length) throw new RuntimeError("CONFIGURATION_ERROR", "Nenhum provider suporta as capacidades pedidas.");
    let lastError;
    for (const provider of eligible) {
      const estimate = provider.estimateCost(request);
      if (request.budget != null && (estimate == null || estimate > request.budget)) throw new RuntimeError("AI_BUDGET_EXCEEDED", "Orçamento insuficiente para a próxima chamada.", { estimate, budget: request.budget });
      try {
        const result = await provider.execute(request);
        if (!result || typeof result.output !== "object" || Array.isArray(result.output)) throw new RuntimeError("AI_BAD_RESPONSE", "Output estruturado inválido.");
        return { ...result, estimatedCost: estimate, costStatus: result.cost == null ? "unknown" : "actual", provider: provider.id, model: provider.model };
      } catch (error) {
        lastError = normalizeProviderError(error);
        if (!request.allowFallback || !lastError.retryable) break;
      }
    }
    throw lastError;
  }
}

module.exports = { AIGateway };
