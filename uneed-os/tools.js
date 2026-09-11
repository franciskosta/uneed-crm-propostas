const { RuntimeError } = require("./errors");

class Tool {
  constructor({ id, hasSideEffects = false }) { this.id = id; this.hasSideEffects = hasSideEffects; }
  async execute() { throw new RuntimeError("CONFIGURATION_ERROR", `Tool ${this.id} não implementada.`); }
}

class ToolExecutor {
  constructor({ tools = [], idempotencyStore }) { this.tools = new Map(tools.map((tool) => [tool.id, tool])); this.idempotencyStore = idempotencyStore; }
  async execute({ toolId, allowedTools, idempotencyKey, input, context }) {
    if (!allowedTools?.includes(toolId)) throw new RuntimeError("PERMISSION_DENIED", `Tool ${toolId} não permitida pela Skill.`);
    const tool = this.tools.get(toolId); if (!tool) throw new RuntimeError("CONFIGURATION_ERROR", `Tool ${toolId} não registada.`);
    if (tool.hasSideEffects && !idempotencyKey) throw new RuntimeError("INPUT_INVALID", "Tool com side effect exige idempotency key.");
    if (tool.hasSideEffects && this.idempotencyStore) { const previous = await this.idempotencyStore.get(idempotencyKey); if (previous) return { ...previous, replayed: true }; }
    const result = await tool.execute(input, context);
    if (tool.hasSideEffects && this.idempotencyStore) await this.idempotencyStore.set(idempotencyKey, result);
    return { ...result, replayed: false };
  }
}

module.exports = { Tool, ToolExecutor };
