const { SupabaseMissionRepository } = require("../uneed-os/supabase-repository");
const { createMissionEngine } = require("../uneed-os/runtime");
const { MissionRunner } = require("../uneed-os/runner");

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
let singleton;

function runtime() {
  if (!singleton) {
    const repository = new SupabaseMissionRepository({ url: supabaseUrl, secretKey });
    const engine = createMissionEngine(repository);
    const runner = new MissionRunner({ engine, repository, concurrency: 1, staleMs: Number(process.env.MISSION_STALE_MS || 120000) });
    singleton = { repository, engine, runner };
  }
  return singleton;
}

async function authenticate(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !anonKey) return null;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: anonKey } });
  if (!response.ok) return null;
  return response.json();
}

function json(res, status, payload) { res.status(status).json(payload); }
function error(res, raw) { console.error(raw); json(res, raw?.code === "INPUT_INVALID" ? 400 : 500, { ok: false, error: raw?.message || "mission_error", code: raw?.code || "UNEXPECTED" }); }

module.exports = { runtime, authenticate, json, error };
