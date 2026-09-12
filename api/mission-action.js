const { runtime, authenticate, json, error } = require("./_mission-runtime");

module.exports = async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) return json(res, 401, { ok: false, error: "unauthorized" });
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" });
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const id = String(body.id || "");
    const action = String(body.action || "");
    if (!id) return json(res, 400, { ok: false, error: "mission_id_required" });
    const { engine } = runtime();
    let mission;
    if (action === "decision") mission = await engine.decide(id, { approved: body.approved, note: body.note || "", decidedBy: user.id });
    else if (action === "cancel") mission = await engine.cancel(id, user.id);
    else if (action === "retry") mission = await engine.retry(id, user.id);
    else return json(res, 400, { ok: false, error: "invalid_action" });
    return json(res, 200, { ok: true, mission });
  } catch (raw) {
    return error(res, raw);
  }
};
