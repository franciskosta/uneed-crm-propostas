class SupabaseMissionRepository {
  constructor({ url, secretKey, fetcher = fetch }) {
    this.url = String(url || "").replace(/\/$/, "");
    this.secretKey = secretKey;
    this.fetcher = fetcher;
    if (!this.url || !this.secretKey) throw new Error("Supabase backend não configurado.");
  }

  async request(path, { method = "GET", body, prefer } = {}) {
    const response = await this.fetcher(`${this.url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: this.secretKey,
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.message || `Supabase respondeu ${response.status}`);
    return data;
  }

  row(mission) {
    return { id: mission.id, user_id: mission.requestedBy, type: mission.type, objective: mission.objective, priority: mission.priority, autonomy_level: mission.autonomyLevel, data: mission, status: mission.status, target_type: mission.targetType, target_id: mission.targetId, worker_id: mission.workerId || null, claimed_at: mission.claimedAt || null, heartbeat_at: mission.heartbeatAt || null, attempt: mission.attempt || 0, max_attempts: mission.maxAttempts || 1, next_run_at: mission.nextRunAt || null, cancel_requested_at: mission.cancelRequestedAt || null, updated_at: mission.updatedAt || new Date().toISOString() };
  }

  async save(mission) { await this.request("missions?on_conflict=id", { method: "POST", body: this.row(mission), prefer: "resolution=merge-duplicates,return=minimal" }); return mission; }
  async get(id, userId) { const rows = await this.request(`missions?select=data&id=eq.${encodeURIComponent(id)}${userId ? `&user_id=eq.${encodeURIComponent(userId)}` : ""}&limit=1`); return rows[0]?.data || null; }
  async list(userId, limit = 100) { const rows = await this.request(`missions?select=data&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=${Number(limit)}`); return rows.map((row) => row.data); }
  async findActiveDuplicate(userId, type, targetType, targetId) { const statuses = "queued,running,waiting_approval"; const rows = await this.request(`missions?select=data&user_id=eq.${encodeURIComponent(userId)}&type=eq.${encodeURIComponent(type)}&target_type=eq.${encodeURIComponent(targetType)}&target_id=eq.${encodeURIComponent(targetId)}&status=in.(${statuses})&order=updated_at.desc&limit=1`); return rows[0]?.data || null; }
  async claimNext(workerId, now = new Date()) { const data = await this.request("rpc/claim_next_uneed_mission", { method: "POST", body: { p_worker_id: workerId, p_now: now.toISOString() } }); return data || null; }
  async heartbeat(id, workerId, at = new Date()) { const mission = await this.get(id); if (!mission || mission.workerId !== workerId || mission.status !== "running") return false; mission.heartbeatAt = at.toISOString(); mission.updatedAt = mission.heartbeatAt; await this.save(mission); return true; }
  async recoverStale(staleBefore, makeError) { const rows = await this.request(`missions?select=data&status=eq.running&heartbeat_at=lt.${encodeURIComponent(staleBefore.toISOString())}`); const recovered = []; for (const row of rows) { const mission = makeError(row.data); await this.save(mission); recovered.push(mission); } return recovered; }
  async stats(userId) { const missions = await this.list(userId, 10000); return { total: missions.length, byStatus: Object.fromEntries(["queued","running","waiting_approval","completed","failed","cancelled"].map((status) => [status, missions.filter((item) => item.status === status).length])) }; }
}

module.exports = { SupabaseMissionRepository };
