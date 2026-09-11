const ERROR_CODES = Object.freeze({
  AI_TIMEOUT: { retryable: true }, AI_RATE_LIMIT: { retryable: true }, AI_UNAVAILABLE: { retryable: true },
  AI_BAD_RESPONSE: { retryable: false }, AI_AUTH_ERROR: { retryable: false }, AI_BUDGET_EXCEEDED: { retryable: false },
  INPUT_INVALID: { retryable: false }, PERMISSION_DENIED: { retryable: false }, MAX_STEPS_EXCEEDED: { retryable: false },
  CANCELLED: { retryable: false }, STALE_WORKER: { retryable: false }, CONFIGURATION_ERROR: { retryable: false },
});

class RuntimeError extends Error {
  constructor(code, message, details = {}) { super(message || code); this.name = "RuntimeError"; this.code = code; this.retryable = ERROR_CODES[code]?.retryable ?? false; this.details = details; }
}

function normalizeProviderError(error) {
  if (error instanceof RuntimeError) return error;
  if (error?.name === "TimeoutError" || error?.name === "AbortError") return new RuntimeError("AI_TIMEOUT", "O provider excedeu o tempo limite.");
  const status = Number(error?.status || String(error?.message || "").match(/provider_error:(\d+)/)?.[1]);
  if (status === 401 || status === 403) return new RuntimeError("AI_AUTH_ERROR", "Credenciais do provider inválidas.");
  if (status === 429) return new RuntimeError("AI_RATE_LIMIT", "Limite temporário do provider atingido.");
  if (status >= 500) return new RuntimeError("AI_UNAVAILABLE", "Provider temporariamente indisponível.");
  if (error instanceof SyntaxError || ["provider_empty_output", "invalid_structured_output"].includes(error?.message)) return new RuntimeError("AI_BAD_RESPONSE", "O provider devolveu um output inválido.");
  return new RuntimeError("AI_UNAVAILABLE", "Falha inesperada do provider.", { cause: error?.message });
}

module.exports = { ERROR_CODES, RuntimeError, normalizeProviderError };
