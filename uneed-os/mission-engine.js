const crypto = require("crypto");
const { getSkill, validateSkillOutput, OUTPUT_FIELDS } = require("./skills");
const { RuntimeError, normalizeProviderError } = require("./errors");
const { transition } = require("./state-machine");

function now() { return new Date().toISOString(); }
function event(type, summary, details = {}) { return { id: crypto.randomUUID(), type, summary, details, createdAt: now() }; }
function cleanClaim(mission) { mission.workerId = null; mission.claimedAt = null; mission.heartbeatAt = null; }
function resultKey(skillId) { return skillId === "research-company" ? "research" : skillId === "qualify-lead" ? "qualification" : "outreach"; }

class MissionEngine {
  constructor({ gateway, repository, discover = null, maxSteps = 10, missionTimeoutMs = 5 * 60_000, retryBaseMs = 1000 }) { this.gateway = gateway; this.repository = repository; this.discover = discover; this.maxSteps = maxSteps; this.missionTimeoutMs = missionTimeoutMs; this.retryBaseMs = retryBaseMs; }
  async create({ type = "qualify_existing_lead", objective, targetType = "lead", targetId, requestedBy, autonomyLevel = "PREPARE", maxCost = 1, maxAttempts = 3, input = {}, idempotencyKey }) {
    if (!objective || !targetId || !requestedBy || !["OBSERVE","SUGGEST","PREPARE"].includes(autonomyLevel)) throw new RuntimeError("INPUT_INVALID", "Pedido de Mission inválido.");
    const duplicate = await this.repository.findActiveDuplicate(requestedBy, type, targetType, targetId); if (duplicate) return { mission: duplicate, duplicate: true };
    const createdAt = now(); const strategy = type === "research_company" ? ["research-company"] : ["research-company", "qualify-lead", "prepare-outreach"];
    const steps = strategy.map((skillId, index) => { const skill = getSkill(skillId); return { id: crypto.randomUUID(), key: `skill:${index}:${skillId}`, skillId, skillVersion: skill.version, status: "pending", input: null, output: null, attempt: 0, startedAt: null, completedAt: null, error: null, metadata: {} }; });
    if (type !== "research_company") steps.push({ id: crypto.randomUUID(), key: "approval:send_external_message", skillId: null, skillVersion: null, status: "pending", input: null, output: null, attempt: 0, startedAt: null, completedAt: null, error: null, metadata: { requiresApproval: true, idempotencyKey: idempotencyKey || `mission:${targetType}:${targetId}:send_external_message` } });
    const mission = { id: crypto.randomUUID(), type, objective, status: "draft", priority: "normal", targetType, targetId, requestedBy, autonomyLevel, strategy, steps, currentStepCount: 0, maxSteps: Math.min(Number(this.maxSteps), 100), input, result: null, confidence: null, maxCost: Number(maxCost), estimatedCost: 0, actualCost: 0, costStatus: "actual", callCount: 0, inputTokens: 0, outputTokens: 0, attempt: 0, maxAttempts: Math.min(Math.max(Number(maxAttempts), 1), 5), nextRunAt: null, workerId: null, claimedAt: null, heartbeatAt: null, cancelRequestedAt: null, startedAt: null, completedAt: null, createdAt, updatedAt: createdAt, error: null, lastError: null, metadata: {}, events: [event("mission.created", "Missão criada"), event("mission.queued", "Missão colocada em fila")] };
    transition(mission, "queued"); await this.repository.save(mission); return { mission, duplicate: false };
  }
  async executeClaimed(mission, workerId) {
    if (!mission || mission.status !== "running" || mission.workerId !== workerId) throw new RuntimeError("PERMISSION_DENIED", "Worker não detém o claim desta Mission.");
    mission = await this.repository.get(mission.id);
    if (!mission || mission.status !== "running" || mission.workerId !== workerId) throw new RuntimeError("PERMISSION_DENIED", "Claim deixou de ser válido.");
    mission.startedAt ||= now(); mission.events.push(event("mission.claimed", "Mission reclamada pelo runner", { workerId, attempt: mission.attempt })); await this.repository.save(mission);
    const deadline = Date.now() + this.missionTimeoutMs;
    try {
      for (const step of mission.steps) {
        if (step.status === "completed" || step.status === "rejected") continue;
        await this.assertCanContinue(mission, workerId, deadline);
        if (step.metadata?.requiresApproval) {
          if (step.status !== "approved") { transition(mission, "waiting_approval"); cleanClaim(mission); mission.events.push(event("approval.requested", "A aguardar aprovação de Francisco", { stepId: step.id, action: "send_external_message" })); await this.repository.save(mission); return mission; }
          step.status = "completed"; step.completedAt = now(); step.output = { approved: true, execution: "manual", sideEffectExecuted: false }; mission.events.push(event("approval.resumed", "Aprovação persistida; execução retomada sem repetir Skills", { stepId: step.id })); continue;
        }
        if (mission.currentStepCount >= mission.maxSteps) throw new RuntimeError("MAX_STEPS_EXCEEDED", "Limite de steps atingido.");
        await this.executeSkillStep(mission, step, workerId); mission.currentStepCount += 1;
        if (mission.input?.leadFactoryBatchId && mission.steps.some((item) => item.skillId && !["completed", "rejected"].includes(item.status))) { transition(mission, "queued"); mission.nextRunAt = null; cleanClaim(mission); mission.events.push(event("mission.checkpoint", "Etapa Lead Factory concluída; próxima etapa colocada em fila", { completedSkill: step.skillId })); await this.repository.save(mission); return mission; }
      }
      mission.result ||= this.buildResult(mission); mission.confidence = mission.result.qualification?.confidence ?? null; transition(mission, "completed"); mission.completedAt = now(); cleanClaim(mission); mission.events.push(event("mission.completed", "Mission concluída; nenhuma ação externa foi executada")); await this.repository.save(mission); return mission;
    } catch (rawError) { return this.handleFailure(mission, rawError); }
  }
  async executeSkillStep(mission, step, workerId) {
    const skill = getSkill(step.skillId, step.skillVersion); step.status = "running"; step.attempt += 1; step.startedAt ||= now(); step.error = null; mission.events.push(event("step.started", `${skill.name} iniciada`, { stepId: step.id, skill: `${skill.id}@${skill.version}`, workerId })); await this.repository.save(mission); await this.repository.heartbeat(mission.id, workerId);
    const company = mission.input.company || null; const contact = mission.input.contact || null; const centralLead = mission.input.lead || {}; const context = { company, contact, acquisitionStrategy: mission.input.acquisitionStrategy || centralLead.acquisitionStrategy || null, serviceId: mission.input.serviceId || centralLead.serviceId || null, intelligenceSeed: mission.input.intelligenceSeed || null, lead: company ? { ...centralLead, companyName: company.name, companyWebsite: company.website, clientName: contact?.name || "", clientEmail: contact?.email || company.email || "", clientPhone: contact?.phone || company.phone || "", instagram: company.instagramUrl || "", location: company.location || "", internalNotes: centralLead.notes || company.notes || "", services: mission.input.services || [] } : centralLead }; for (const previous of mission.steps.filter((item) => item.output && item.skillId)) context[resultKey(previous.skillId)] = previous.output;
    const aiBudgetUsed = mission.costStatus === "unknown" ? Math.max(mission.actualCost, mission.estimatedCost) : mission.actualCost; const toolBudgetUsed = mission.toolCostStatus === "unknown" ? Math.max(Number(mission.toolCost || 0), Number(mission.toolEstimatedCost || 0)) : Number(mission.toolCost || 0); let remainingBudget = mission.maxCost - aiBudgetUsed - toolBudgetUsed;
    if (skill.id === "research-company" && skill.version === "1.1.0") {
      if (!this.discover) throw new RuntimeError("CONFIGURATION_ERROR", "DISCOVER service não configurado.");
      const discovery = await this.discover.research(company ? { company, lead: centralLead, contact, services: mission.input.services || [], strategyId: context.acquisitionStrategy } : { ...centralLead, strategyId: context.acquisitionStrategy }, { budget: remainingBudget }); discovery.pack.strategyId = context.acquisitionStrategy; context.researchPack = discovery.pack; mission.toolEstimatedCost = Number(mission.toolEstimatedCost || 0) + Number(discovery.toolEstimatedCost || 0); if (discovery.toolCost == null) mission.toolCostStatus = "unknown"; else mission.toolCost = Number(mission.toolCost || 0) + discovery.toolCost;
      for (const trace of discovery.trace) mission.events.push(event("tool.executed", `${trace.toolId} executada`, { stepId: step.id, tool: trace.toolId, query: trace.input.query, url: trace.input.url, results: trace.resultCount, durationMs: trace.durationMs, cached: trace.cached, estimatedCost: trace.estimatedCost, cost: trace.cost }));
      mission.metadata.discover = { partial: discovery.partial, warnings: discovery.pack.warnings, searches: discovery.trace.filter((item) => item.toolId === "search_web").length, pagesFetched: discovery.trace.filter((item) => ["inspect_website","fetch_public_page"].includes(item.toolId)).length, durationMs: discovery.durationMs }; remainingBudget -= Number(discovery.toolCost ?? discovery.toolEstimatedCost ?? 0);
    }
    const response = await this.gateway.execute({ task: skill.id, capabilitiesRequired: skill.requiredCapabilities, quality: skill.id === "qualify-lead" && !mission.input?.leadFactoryBatchId ? "SMART" : "FAST", budget: remainingBudget, allowFallback: true, context, instructions: skill.instructions, outputSchema: { type: "object", required: OUTPUT_FIELDS[skill.id] } });
    if (!validateSkillOutput(skill.id, response.output, skill.version)) throw new RuntimeError("AI_BAD_RESPONSE", `Output inválido para ${skill.id}@${skill.version}.`);
    mission.estimatedCost += Number(response.estimatedCost || 0); mission.callCount += Number(response.usage?.calls || 1); mission.inputTokens += Number(response.usage?.inputTokens || 0); mission.outputTokens += Number(response.usage?.outputTokens || 0);
    if (response.cost == null) mission.costStatus = "unknown"; else mission.actualCost += Number(response.cost);
    if (mission.costStatus !== "unknown" && mission.actualCost > mission.maxCost) throw new RuntimeError("AI_BUDGET_EXCEEDED", "A chamada excedeu o orçamento da Mission.");
    step.output = response.output; step.status = "completed"; step.completedAt = now(); step.metadata = { ...step.metadata, provider: response.provider, model: response.model, estimatedCost: response.estimatedCost, actualCost: response.cost ?? null, costStatus: response.costStatus };
    mission.events.push(event("step.completed", `${skill.name} concluída`, { stepId: step.id, skill: `${skill.id}@${skill.version}`, provider: response.provider, model: response.model })); mission.result = this.buildResult(mission); mission.confidence = mission.result.qualification?.confidence ?? mission.confidence; await this.repository.save(mission);
  }
  buildResult(mission) {
    const outputs = Object.fromEntries(mission.steps.filter((step) => step.skillId && step.output).map((step) => [resultKey(step.skillId), step.output]));
    return mission.type === "research_company" ? outputs : { ...outputs, actionProposal: { type: "send_external_message", requiresApproval: true, reason: "Uma mensagem externa exige decisão humana.", impact: "Inicia contacto comercial com o lead.", expectedResult: "Validar interesse numa conversa." } };
  }
  async assertCanContinue(mission, workerId, deadline) {
    if (Date.now() > deadline) throw new RuntimeError("AI_TIMEOUT", "Timeout global da execução atingido.");
    const current = await this.repository.get(mission.id); if (!current || current.workerId !== workerId) throw new RuntimeError("PERMISSION_DENIED", "Claim perdido.");
    if (current.cancelRequestedAt) throw new RuntimeError("CANCELLED", "Cancelamento solicitado.");
    mission.cancelRequestedAt = current.cancelRequestedAt; await this.repository.heartbeat(mission.id, workerId);
  }
  async handleFailure(mission, rawError) {
    const error = rawError instanceof RuntimeError ? rawError : normalizeProviderError(rawError); const active = mission.steps.find((step) => step.status === "running"); if (active) { active.status = "failed"; active.error = { code: error.code, message: error.message, retryable: error.retryable }; }
    mission.lastError = { code: error.code, message: error.message, retryable: error.retryable, at: now() }; mission.events.push(event("mission.error", error.message, { code: error.code, retryable: error.retryable, attempt: mission.attempt }));
    if (error.code === "CANCELLED") { transition(mission, "cancelled"); mission.completedAt = now(); }
    else if (error.retryable && mission.attempt < mission.maxAttempts) { if (active) active.status = "pending"; transition(mission, "queued"); mission.nextRunAt = new Date(Date.now() + this.retryBaseMs * 2 ** (mission.attempt - 1)).toISOString(); mission.events.push(event("mission.retry_scheduled", "Retry limitado agendado", { attempt: mission.attempt, maxAttempts: mission.maxAttempts, nextRunAt: mission.nextRunAt })); }
    else { transition(mission, "failed"); mission.error = mission.lastError; mission.completedAt = now(); }
    cleanClaim(mission); await this.repository.save(mission); return mission;
  }
  async decide(id, { approved, decidedBy, note = "" }) {
    const mission = await this.repository.get(id, decidedBy); if (!mission || mission.status !== "waiting_approval") throw new RuntimeError("INPUT_INVALID", "Mission não aguarda aprovação.");
    if (!mission.steps) { mission.steps = (mission.strategy || []).map((skillId, index) => ({ id: crypto.randomUUID(), key: `legacy:${index}:${skillId}`, skillId, skillVersion: getSkill(skillId).version, status: "completed", output: mission.result?.[resultKey(skillId)] || null, attempt: 1, metadata: { migratedFrom: "v0.1" } })); mission.steps.push({ id: crypto.randomUUID(), key: "approval:send_external_message", status: "pending", metadata: { requiresApproval: true, idempotencyKey: `mission:${mission.targetType}:${mission.targetId}:send_external_message`, migratedFrom: "v0.1" } }); mission.maxAttempts ||= 3; mission.maxSteps ||= this.maxSteps; mission.currentStepCount ||= mission.strategy?.length || 0; }
    const step = mission.steps.find((item) => item.metadata?.requiresApproval && !["completed","rejected"].includes(item.status)); if (!step) throw new RuntimeError("INPUT_INVALID", "Approval step não encontrado.");
    mission.approval = { approved: Boolean(approved), decidedBy, note, decidedAt: now() }; mission.events.push(event(approved ? "approval.approved" : "approval.rejected", approved ? "Ação aprovada" : "Ação rejeitada", { stepId: step.id, decidedBy, note }));
    if (approved) { step.status = "approved"; transition(mission, "queued"); mission.nextRunAt = null; mission.events.push(event("mission.queued", "Mission colocada em fila para retomar após aprovação")); }
    else { step.status = "rejected"; step.completedAt = now(); transition(mission, "completed"); mission.completedAt = now(); mission.events.push(event("mission.completed", "Mission concluída; ação rejeitada e não executada")); }
    await this.repository.save(mission); return mission;
  }
  async cancel(id, requestedBy) {
    const mission = await this.repository.get(id, requestedBy); if (!mission || ["completed","cancelled"].includes(mission.status)) throw new RuntimeError("INPUT_INVALID", "Mission não pode ser cancelada."); mission.cancelRequestedAt = now(); mission.events.push(event("mission.cancel_requested", "Cancelamento solicitado", { requestedBy }));
    if (["queued","waiting_approval","failed","draft"].includes(mission.status)) { if (mission.status === "failed") transition(mission, "queued"); transition(mission, "cancelled"); mission.completedAt = now(); cleanClaim(mission); }
    await this.repository.save(mission); return mission;
  }
  async retry(id, requestedBy) { const mission = await this.repository.get(id, requestedBy); if (!mission || mission.status !== "failed") throw new RuntimeError("INPUT_INVALID", "Apenas Missions falhadas podem voltar à fila."); mission.error = null; mission.cancelRequestedAt = null; mission.nextRunAt = null; transition(mission, "queued"); mission.events.push(event("mission.manual_retry", "Retry manual solicitado", { requestedBy })); await this.repository.save(mission); return mission; }
  staleFailure(mission) { mission.status = "failed"; mission.error = mission.lastError = { code: "STALE_WORKER", message: "Worker deixou de enviar heartbeat; execução parada para evitar duplicação.", retryable: false, at: now() }; mission.completedAt = now(); cleanClaim(mission); mission.events.push(event("mission.stale", mission.error.message)); return mission; }
}

module.exports = { MissionEngine, event };
