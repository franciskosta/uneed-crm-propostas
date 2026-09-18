const crypto = require("node:crypto");
const { authenticate } = require("./_mission-runtime");
const { alertFor } = require("../contact-alerts");
function reminderId(owner, key) { const h = crypto.createHash("sha256").update(`contact-alert:${owner}:${key}`).digest("hex"); return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; }
async function run(owner) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY_V2 || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error("Configurar SUPABASE, RESEND_API_KEY e EMAIL_FROM para ativar emails de contacto.");
  async function db(path, options = {}) {
    const r = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json", Prefer: "return=representation", ...options.headers }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`contact_alert_database_${r.status}`);
    return r.status === 204 ? [] : r.json();
  }
  let sent = 0, pendingReview = 0, attempted = 0;
  const deadline = Date.now() + 40000;
  for (let offset = 0; attempted < 25 && Date.now() < deadline; offset += 100) {
    const rows = await db(`crm_state?select=user_id,data&order=user_id&limit=100&offset=${offset}${owner ? `&user_id=eq.${encodeURIComponent(owner)}` : ""}`);
    for (const row of rows) for (const prospect of row.data.instagramProspects || []) {
      const alert = alertFor(prospect);
      if (!alert?.due || attempted >= 25 || Date.now() >= deadline) continue;
      const id = reminderId(row.user_id, alert.key);
      const subject = `${alert.action} pendente — UNEED CRM`;
      const body = `Está na altura de fazer ${alert.action.toLowerCase()}. Passaram 5 dias úteis desde o contacto registado.\nConsulta os cartões sinalizados: https://crm.uneed.pt/\nEste aviso é interno e não contacta o cliente.`;
      await db("email_reminders?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({ id, user_id: row.user_id, to_email: "geral@uneed.pt", subject, body, due_date: alert.dueDate, status: "contact_pending" }) });
      const [record] = await db(`email_reminders?id=eq.${id}&select=id,status,created_at`);
      if (!record || record.status === "contact_sent") continue;
      if (record.status === "contact_sending") {
        if (Date.now() - new Date(record.created_at).getTime() > 23 * 3600000) { pendingReview++; continue; }
      } else {
        if (record.status !== "contact_pending") continue;
        const claimed = await db(`email_reminders?id=eq.${id}&status=eq.contact_pending`, { method: "PATCH", body: JSON.stringify({ status: "contact_sending", created_at: new Date().toISOString() }) });
        if (!claimed.length) continue;
      }
      attempted++;
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": id }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: ["geral@uneed.pt"], subject, text: body }), signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        // Explicit rejection means no email was accepted; allow a later attempt after configuration/rate-limit recovery.
        if ([400, 401, 403, 422, 429].includes(response.status)) await db(`email_reminders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "contact_pending" }) });
        throw new Error(`contact_alert_email_${response.status}`);
      }
      await db(`email_reminders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "contact_sent" }) });
      sent++;
    }
    if (rows.length < 100 || owner) break;
  }
  return { sent, pendingReview };
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    let owner;
    if (req.method === "GET") {
      if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ ok: false });
    } else if (req.method === "POST") {
      const user = await authenticate(req); if (!user) return res.status(401).json({ ok: false }); owner = user.id;
    } else return res.status(405).json({ ok: false });
    return res.status(200).json({ ok: true, ...await run(owner) });
  } catch (error) { console.error("contact_alerts", error.message); return res.status(503).json({ ok: false, error: error.message }); }
};
module.exports.reminderId = reminderId;
module.exports.run = run;
