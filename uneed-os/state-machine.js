const { RuntimeError } = require("./errors");

const TRANSITIONS = Object.freeze({
  draft: ["queued", "cancelled"], queued: ["running", "cancelled"],
  running: ["queued", "waiting_approval", "completed", "failed", "cancelled"],
  waiting_approval: ["queued", "completed", "cancelled"], failed: ["queued"],
  completed: [], cancelled: [],
});

function transition(mission, next) {
  if (!TRANSITIONS[mission.status]?.includes(next)) throw new RuntimeError("INPUT_INVALID", `Transição inválida: ${mission.status} → ${next}`);
  mission.status = next; mission.updatedAt = new Date().toISOString(); return mission;
}

module.exports = { TRANSITIONS, transition };
