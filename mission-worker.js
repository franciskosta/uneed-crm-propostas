const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { MissionRepository } = require("./uneed-os/repository");
const { MissionRunner } = require("./uneed-os/runner");
const { createMissionEngine } = require("./uneed-os/runtime");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL é obrigatório no runner de produção.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false });
const query = (sql, params = []) => pool.query(sql, params);

async function main() {
  await query(fs.readFileSync(path.join(__dirname, "migrations/001_uneed_os_runtime_v011.sql"), "utf8"));
  const repository = new MissionRepository({ query, pool }); const engine = createMissionEngine(repository);
  const runner = new MissionRunner({ engine, repository, concurrency: Number(process.env.MISSION_WORKER_CONCURRENCY || 1), pollMs: Number(process.env.MISSION_POLL_MS || 1500), staleMs: Number(process.env.MISSION_STALE_MS || 120000) });
  const shutdown = () => runner.stop(); process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown); await runner.start(); await pool.end();
}

main().catch((error) => { console.error(JSON.stringify({ level: "error", message: "worker_fatal", code: error.code || error.message })); process.exitCode = 1; });
