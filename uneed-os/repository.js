class MissionRepository {
  constructor({ query, pool, readStore, writeStore }) { this.query = query; this.pool = pool; this.readStore = readStore; this.writeStore = writeStore; }
  async save(mission) {
    if (this.query) {
      await this.query(`insert into missions (id,user_id,type,objective,priority,autonomy_level,data,status,target_type,target_id,worker_id,claimed_at,heartbeat_at,attempt,max_attempts,next_run_at,cancel_requested_at,updated_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,now())
        on conflict (id) do update set data=excluded.data,status=excluded.status,worker_id=excluded.worker_id,claimed_at=excluded.claimed_at,heartbeat_at=excluded.heartbeat_at,attempt=excluded.attempt,max_attempts=excluded.max_attempts,next_run_at=excluded.next_run_at,cancel_requested_at=excluded.cancel_requested_at,updated_at=now()`,
      [mission.id, mission.requestedBy, mission.type, mission.objective, mission.priority, mission.autonomyLevel, mission, mission.status, mission.targetType, mission.targetId, mission.workerId || null, mission.claimedAt || null, mission.heartbeatAt || null, mission.attempt || 0, mission.maxAttempts || 1, mission.nextRunAt || null, mission.cancelRequestedAt || null]); return mission;
    }
    const data = this.readStore(); data.missions ||= []; const index = data.missions.findIndex((item) => item.id === mission.id); if (index >= 0) data.missions[index] = structuredClone(mission); else data.missions.unshift(structuredClone(mission)); this.writeStore(data); return mission;
  }
  async get(id, userId) {
    if (this.query) { const result = await this.query("select data from missions where id=$1" + (userId ? " and user_id=$2" : ""), userId ? [id, userId] : [id]); return result.rows[0]?.data || null; }
    const mission = (this.readStore().missions || []).find((item) => item.id === id); return !userId || mission?.requestedBy === userId ? structuredClone(mission || null) : null;
  }
  async list(userId, limit = 100) {
    if (this.query) { const result = await this.query("select data from missions where user_id=$1 order by updated_at desc limit $2", [userId, limit]); return result.rows.map((row) => row.data); }
    return (this.readStore().missions || []).filter((item) => item.requestedBy === userId).slice(0, limit).map(structuredClone);
  }
  async findActiveDuplicate(userId, type, targetType, targetId) {
    const active = ["queued", "running", "waiting_approval"];
    if (this.query) { const result = await this.query("select data from missions where user_id=$1 and type=$2 and target_type=$3 and target_id=$4 and status=any($5) order by updated_at desc limit 1", [userId, type, targetType, targetId, active]); return result.rows[0]?.data || null; }
    return structuredClone((this.readStore().missions || []).find((item) => item.requestedBy === userId && item.type === type && item.targetType === targetType && item.targetId === targetId && active.includes(item.status)) || null);
  }
  async claimNext(workerId, now = new Date()) {
    const iso = now.toISOString();
    if (this.query) {
      const result = await this.query(`with candidate as (select id from missions where status='queued' and (next_run_at is null or next_run_at <= $2) order by updated_at asc for update skip locked limit 1)
        update missions m set status='running',worker_id=$1,claimed_at=$2,heartbeat_at=$2,attempt=m.attempt+1,updated_at=$2 from candidate where m.id=candidate.id returning m.data,m.attempt`, [workerId, iso]);
      const row = result.rows[0]; if (!row) return null; const mission = { ...row.data, status: "running", workerId, claimedAt: iso, heartbeatAt: iso, attempt: row.attempt, updatedAt: iso }; await this.save(mission); return mission;
    }
    const data = this.readStore(); data.missions ||= []; const mission = data.missions.filter((item) => item.status === "queued" && (!item.nextRunAt || item.nextRunAt <= iso)).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))[0];
    if (!mission) return null; Object.assign(mission, { status: "running", workerId, claimedAt: iso, heartbeatAt: iso, attempt: Number(mission.attempt || 0) + 1, updatedAt: iso }); this.writeStore(data); return structuredClone(mission);
  }
  async heartbeat(id, workerId, at = new Date()) {
    const iso = at.toISOString();
    if (this.query) { const result = await this.query("update missions set heartbeat_at=$3,data=jsonb_set(data,'{heartbeatAt}',to_jsonb($3::text)),updated_at=$3 where id=$1 and worker_id=$2 and status='running' returning id", [id, workerId, iso]); return Boolean(result.rowCount); }
    const data = this.readStore(); const mission = (data.missions || []).find((item) => item.id === id && item.workerId === workerId && item.status === "running"); if (!mission) return false; mission.heartbeatAt = iso; mission.updatedAt = iso; this.writeStore(data); return true;
  }
  async recoverStale(staleBefore, makeError) {
    const cutoff = staleBefore.toISOString(); const recovered = [];
    if (this.query) { const result = await this.query("update missions set status='failed',worker_id=null,claimed_at=null,heartbeat_at=null,updated_at=now() where id in (select id from missions where status='running' and coalesce(heartbeat_at,claimed_at,updated_at) < $1 for update skip locked) returning data", [cutoff]); for (const row of result.rows) { const mission = makeError(row.data); await this.save(mission); recovered.push(mission); } return recovered; }
    const data = this.readStore(); for (let i = 0; i < (data.missions || []).length; i += 1) if (data.missions[i].status === "running" && (data.missions[i].heartbeatAt || data.missions[i].claimedAt || data.missions[i].updatedAt) < cutoff) { data.missions[i] = makeError(structuredClone(data.missions[i])); recovered.push(structuredClone(data.missions[i])); } this.writeStore(data); return recovered;
  }
  async stats(userId) {
    const missions = await this.list(userId, 10000); const finished = missions.filter((item) => item.startedAt && item.completedAt); const research = missions.filter((item) => item.type === "research_company" || item.result?.research?.schemaVersion); const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; return { total: missions.length, byStatus: Object.fromEntries(["queued","running","waiting_approval","completed","failed","cancelled"].map((status) => [status, missions.filter((item) => item.status === status).length])), stale: missions.filter((item) => item.status === "running" && item.heartbeatAt && Date.now() - new Date(item.heartbeatAt).getTime() > 120000).length, averageDurationMs: finished.length ? Math.round(finished.reduce((sum, item) => sum + new Date(item.completedAt) - new Date(item.startedAt), 0) / finished.length) : null, estimatedCost: missions.reduce((sum, item) => sum + Number(item.estimatedCost || 0) + Number(item.toolEstimatedCost || 0), 0), actualCost: missions.some((item) => item.costStatus === "unknown" || item.toolCostStatus === "unknown") ? null : missions.reduce((sum, item) => sum + Number(item.actualCost || 0) + Number(item.toolCost || 0), 0), attempts: missions.reduce((sum, item) => sum + Number(item.attempt || 0), 0), research: { total: research.length, success: research.filter((item) => ["completed","waiting_approval"].includes(item.status) && !item.metadata?.discover?.partial).length, partial: research.filter((item) => item.metadata?.discover?.partial).length, failed: research.filter((item) => item.status === "failed").length, averageSearchQueries: average(research.map((item) => Number(item.metadata?.discover?.searches || 0))), averagePagesFetched: average(research.map((item) => Number(item.metadata?.discover?.pagesFetched || 0))), averageAiCalls: average(research.map((item) => Number(item.callCount || 0))) } };
  }
}

module.exports = { MissionRepository };
