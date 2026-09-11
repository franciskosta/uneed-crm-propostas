const crypto = require("crypto");

class MissionRunner {
  constructor({ engine, repository, workerId = `worker-${crypto.randomUUID()}`, concurrency = 1, pollMs = 1500, staleMs = 120000, logger = console }) { this.engine = engine; this.repository = repository; this.workerId = workerId; this.concurrency = Math.min(Math.max(Number(concurrency), 1), 10); this.pollMs = pollMs; this.staleMs = staleMs; this.logger = logger; this.running = false; this.inFlight = new Set(); }
  log(level, message, fields = {}) { this.logger[level]?.(JSON.stringify({ level, message, worker_id: this.workerId, ...fields })); }
  async recoverStale() { const recovered = await this.repository.recoverStale(new Date(Date.now() - this.staleMs), (mission) => this.engine.staleFailure(mission)); for (const mission of recovered) this.log("warn", "stale_mission_failed", { mission_id: mission.id }); return recovered; }
  async tick() {
    while (this.inFlight.size < this.concurrency) {
      const mission = await this.repository.claimNext(this.workerId); if (!mission) break;
      const task = this.engine.executeClaimed(mission, this.workerId).then((result) => this.log("info", "mission_yielded", { mission_id: result.id, status: result.status, attempt: result.attempt })).catch((error) => this.log("error", "mission_runner_error", { mission_id: mission.id, code: error.code || "UNEXPECTED" })).finally(() => this.inFlight.delete(task));
      this.inFlight.add(task);
    }
    return this.inFlight.size;
  }
  async start() { this.running = true; await this.recoverStale(); this.log("info", "runner_started", { concurrency: this.concurrency }); while (this.running) { await this.tick(); await new Promise((resolve) => setTimeout(resolve, this.pollMs)); } await Promise.allSettled([...this.inFlight]); }
  stop() { this.running = false; }
}

module.exports = { MissionRunner };
