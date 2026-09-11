const { runtime, authenticate, json, error } = require("../_mission-runtime");

module.exports = async function handler(req, res) {
  try {
    const user = await authenticate(req); if (!user) return json(res, 401, { ok: false, error: "unauthorized" });
    const { repository, engine } = runtime();
    if (req.method === "GET") return json(res, 200, { ok: true, missions: await repository.list(user.id) });
    if (req.method === "POST") { const created = await engine.create({ ...(req.body || {}), requestedBy: user.id }); return json(res, created.duplicate ? 200 : 202, { ok: true, ...created }); }
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  } catch (raw) { return error(res, raw); }
};
