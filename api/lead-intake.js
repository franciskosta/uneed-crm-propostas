const crypto = require("node:crypto");
const intake = require("../lead-intake");
const { sendEmail, shell, escapeHtml } = require("../kickoff-email");

const ALLOWED_ORIGINS = new Set(intake.ORIGINS.map((host) => `https://${host}`));
const MAX_BYTES = 32 * 1024;

function config() {
  return {
    url: String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, ""),
    secret: process.env.SUPABASE_SECRET_KEY_V2 || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    owner: process.env.CRM_OWNER_USER_ID || "",
  };
}
function cors(req, res) {
  const origin = String(req.headers.origin || "");
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (!ALLOWED_ORIGINS.has(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key");
  res.setHeader("Access-Control-Max-Age", "600");
  return true;
}
function send(res, status, payload) { return res.status(status).json(payload); }
function error(res, raw) {
  const status = Number(raw.status) || 500;
  const code = raw.code || (status >= 500 ? "backend_unavailable" : "validation_failed");
  if (status >= 500) console.error("lead_intake", code, raw.message);
  return send(res, status, { ok: false, error: { code, message: status >= 500 ? "Não foi possível guardar o pedido. Tente novamente." : raw.message, ...(raw.fields?.length ? { fields: raw.fields } : {}) } });
}
function headers(secret, prefer = "") {
  return { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) };
}
async function db(cfg, path, { method = "GET", body, prefer = "" } = {}) {
  const response = await fetch(`${cfg.url}/rest/v1/${path}`, { method, headers: headers(cfg.secret, prefer), ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw Object.assign(new Error(`lead_intake_database_${response.status}`), { status: 503, code: "backend_unavailable" });
  if (response.status === 204) return [];
  return response.json();
}
async function ownerId(cfg) {
  if (cfg.owner) return cfg.owner;
  const rows = await db(cfg, "crm_state?select=user_id&order=updated_at.desc&limit=2");
  if (rows.length !== 1) throw Object.assign(new Error("CRM_OWNER_USER_ID em falta ou CRM com vários proprietários."), { status: 503, code: "owner_not_configured" });
  return rows[0].user_id;
}
function digest(cfg, value) { return crypto.createHmac("sha256", cfg.secret).update(String(value || "unknown")).digest("hex"); }
function requesterIp(req) { return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim().slice(0, 120); }
async function limited(cfg, field, hash, since, limit) {
  const rows = await db(cfg, `lead_intake_requests?select=id&${field}=eq.${encodeURIComponent(hash)}&created_at=gte.${encodeURIComponent(since)}&limit=${limit}`);
  return rows.length >= limit;
}
function reference(id, now) { return `UNEED-LEAD-${now.slice(2, 10).replaceAll("-", "")}-${id.slice(0, 5).toUpperCase()}`; }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function samePayload(stored, incoming) { return JSON.stringify(canonical(stored)) === JSON.stringify(canonical(incoming)); }
function emailFor(row) {
  const payload = row.payload, estimate = row.estimate;
  const addons = payload.configuration?.addons || [];
  const modules = payload.configuration?.modules || [];
  const lines = [
    `<strong>Referência:</strong> ${escapeHtml(row.reference)}`,
    `<strong>Origem:</strong> ${escapeHtml(payload.origin)}`,
    `<strong>Produto:</strong> ${escapeHtml(payload.product)}`,
    `<strong>Contacto:</strong> ${escapeHtml(payload.contact.name)} · ${escapeHtml(payload.contact.phone || "sem telefone")} · ${escapeHtml(payload.contact.email || "sem email")}`,
    `<strong>Negócio:</strong> ${escapeHtml(payload.business.name || "não indicado")} · ${escapeHtml(payload.business.sector || "área não indicada")}`,
    `<strong>Mensagem:</strong> ${escapeHtml(payload.message || "sem mensagem")}`,
    modules.length ? `<strong>Módulos:</strong> ${escapeHtml(modules.join(", "))}` : "",
    addons.length ? `<strong>Extras:</strong> ${escapeHtml(addons.map((addon) => `${addon.name} × ${addon.quantity}`).join(", "))}` : "",
    `<strong>Estimativa do servidor:</strong> ${escapeHtml(`${estimate.initial} € inicial · ${estimate.monthly} €/mês · ${estimate.priceStatus}`)} + IVA`,
  ].filter(Boolean);
  const body = `<div style="margin:22px 0;padding:20px;border:1px solid #e1e3ed;border-radius:16px;line-height:1.8;color:#4f566e">${lines.map((line) => `<p style="margin:0 0 8px">${line}</p>`).join("")}</div><p><a href="https://crm.uneed.pt/#instagram">Abrir PROSPEÇÃO no CRM</a></p>`;
  const plain = [
    `Novo pedido comercial — ${row.reference}`, `Origem: ${payload.origin}`, `Produto: ${payload.product}`,
    `Contacto: ${payload.contact.name} · ${payload.contact.phone || "sem telefone"} · ${payload.contact.email || "sem email"}`,
    `Negócio: ${payload.business.name || "não indicado"} · ${payload.business.sector || "área não indicada"}`,
    `Mensagem: ${payload.message || "sem mensagem"}`,
    modules.length ? `Módulos: ${modules.join(", ")}` : "", addons.length ? `Extras: ${addons.map((addon) => `${addon.name} × ${addon.quantity}`).join(", ")}` : "",
    `Estimativa do servidor: ${estimate.initial} € inicial · ${estimate.monthly} €/mês · ${estimate.priceStatus} + IVA`, "", "CRM: https://crm.uneed.pt/#instagram",
  ].filter(Boolean).join("\n");
  return { to: process.env.LEAD_INTAKE_NOTIFICATION_TO || "geral@uneed.pt", replyTo: payload.contact.email || undefined, subject: `Novo pedido ${payload.product} — ${payload.business.name || payload.contact.name} — ${row.reference}`, html: shell({ preview: `Novo pedido ${row.reference}`, eyebrow: "Pedido comercial recebido", title: payload.business.name || payload.contact.name, intro: "O pedido já ficou guardado na área PROSPEÇÃO do CRM.", body }), text: plain };
}
function publicResult(row, duplicate = false) {
  const status = row.notification_status === "sending" ? "pending" : row.notification_status || "pending";
  return { ok: true, accepted: true, duplicate, requestId: row.id, reference: row.reference, notification: status, estimate: row.estimate };
}
async function attemptNotification(cfg, row) {
  if (!row || !["pending", "failed"].includes(row.notification_status || "pending")) return row;
  const expected = row.notification_status || "pending";
  const claimed = await db(cfg, `lead_intake_requests?id=eq.${encodeURIComponent(row.id)}&notification_status=eq.${expected}`, {
    method: "PATCH", body: { notification_status: "sending", updated_at: new Date().toISOString() }, prefer: "return=representation",
  });
  if (!claimed[0]) return { ...row, notification_status: "sending" };
  let notice;
  try { notice = await sendEmail(emailFor(claimed[0]), `lead-intake/${row.id}/admin`); }
  catch (notificationError) { notice = { sent: false, reason: "email_unavailable", detail: notificationError.message }; }
  const notificationStatus = notice?.sent ? "sent" : "failed";
  try {
    await db(cfg, `lead_intake_requests?id=eq.${encodeURIComponent(row.id)}&notification_status=eq.sending`, {
      method: "PATCH",
      body: {
        notification_status: notificationStatus,
        notification_detail: notice?.sent
          ? { id: notice.id, acceptedCount: notice.acceptedCount ?? null, rejectedCount: notice.rejectedCount ?? null, pendingCount: notice.pendingCount ?? null }
          : { reason: notice?.reason || "email_unavailable" },
        updated_at: new Date().toISOString(),
      },
      prefer: "return=representation",
    });
  } catch (notificationError) { console.error("lead_intake_notification_status", row.id, notificationError.message); }
  if (!notice?.sent) console.error("lead_intake_email_failed", row.id, notice?.reason || "email_unavailable");
  return { ...claimed[0], notification_status: notificationStatus };
}
async function existingResult(cfg, row, storedPayload, status = 200) {
  if (!row || !samePayload(row.payload, storedPayload)) intake.fail("idempotency_conflict", "Esta chave de idempotência já foi usada para outro pedido.", ["idempotencyKey"], 409);
  const notified = await attemptNotification(cfg, row);
  return { status, body: publicResult(notified, true) };
}

module.exports = async function handler(req, res) {
  const allowed = cors(req, res);
  if (req.method === "OPTIONS") return allowed ? res.status(204).end() : send(res, 403, { ok: false, error: { code: "origin_not_allowed", message: "Origem não autorizada." } });
  if (req.method !== "POST") return send(res, 405, { ok: false, error: { code: "method_not_allowed", message: "Método não permitido." } });
  if (!allowed) return send(res, 403, { ok: false, error: { code: "origin_not_allowed", message: "Origem não autorizada." } });
  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) return send(res, 415, { ok: false, error: { code: "content_type_invalid", message: "Envie JSON." } });
  if (Number(req.headers["content-length"] || 0) > MAX_BYTES) return send(res, 413, { ok: false, error: { code: "payload_too_large", message: "Pedido demasiado grande." } });
  let input = req.body;
  if (typeof input === "string") { if (Buffer.byteLength(input) > MAX_BYTES) return send(res, 413, { ok: false, error: { code: "payload_too_large", message: "Pedido demasiado grande." } }); try { input = JSON.parse(input); } catch { return send(res, 400, { ok: false, error: { code: "invalid_json", message: "JSON inválido." } }); } }
  else { try { if (Buffer.byteLength(JSON.stringify(input ?? null)) > MAX_BYTES) return send(res, 413, { ok: false, error: { code: "payload_too_large", message: "Pedido demasiado grande." } }); } catch { return send(res, 400, { ok: false, error: { code: "invalid_json", message: "JSON inválido." } }); } }
  try {
    const cfg = config();
    if (!cfg.url || !cfg.secret) throw Object.assign(new Error("Supabase não configurado."), { status: 503, code: "backend_not_configured" });
    const payload = intake.normalize(input);
    const headerKey = String(req.headers["idempotency-key"] || "");
    if (headerKey && headerKey !== payload.idempotencyKey) intake.fail("idempotency_mismatch", "A chave de idempotência não coincide.", ["idempotencyKey"], 400);
    if (payload.antiSpam.website) intake.fail(
      "anti_spam_triggered",
      "A verificação anti-spam bloqueou o pedido. Recarregue a página e tente novamente.",
      ["antiSpam.website"],
      422,
    );
    const storedPayload = { ...payload }; delete storedPayload.antiSpam;
    const existing = await db(cfg, `lead_intake_requests?select=id,reference,payload,estimate,notification_status,updated_at&origin=eq.${encodeURIComponent(payload.origin)}&idempotency_key=eq.${encodeURIComponent(payload.idempotencyKey)}&limit=1`);
    if (existing[0]) { const result = await existingResult(cfg, existing[0], storedPayload); return send(res, result.status, result.body); }
    const ipHash = digest(cfg, requesterIp(req));
    const contactHash = digest(cfg, `${payload.contact.email}|${payload.contact.phone.replace(/\D/g, "")}`);
    const hour = new Date(Date.now() - 3600000).toISOString(), day = new Date(Date.now() - 86400000).toISOString();
    if (await limited(cfg, "ip_hash", ipHash, hour, 8) || await limited(cfg, "ip_hash", ipHash, day, 30) || await limited(cfg, "contact_hash", contactHash, hour, 5)) return send(res, 429, { ok: false, error: { code: "rate_limited", message: "Foram recebidos vários pedidos. Aguarde e tente novamente." } });
    const owner = await ownerId(cfg), id = crypto.randomUUID(), createdAt = new Date().toISOString();
    const row = { id, owner_id: owner, origin: payload.origin, product: payload.product, idempotency_key: payload.idempotencyKey, reference: reference(id, createdAt), payload: storedPayload, estimate: payload.estimate, status: "new", notification_status: "pending", ip_hash: ipHash, contact_hash: contactHash, created_at: createdAt, updated_at: createdAt };
    const inserted = await db(cfg, "lead_intake_requests?on_conflict=origin,idempotency_key", { method: "POST", body: row, prefer: "resolution=ignore-duplicates,return=representation" });
    if (!inserted[0]) {
      const raced = await db(cfg, `lead_intake_requests?select=id,reference,payload,estimate,notification_status,updated_at&origin=eq.${encodeURIComponent(payload.origin)}&idempotency_key=eq.${encodeURIComponent(payload.idempotencyKey)}&limit=1`);
      const result = await existingResult(cfg, raced[0], storedPayload);
      return send(res, result.status, result.body);
    }
    const saved = inserted[0];
    const notified = await attemptNotification(cfg, saved);
    return send(res, 201, publicResult(notified));
  } catch (raw) { return error(res, raw); }
};

module.exports.ALLOWED_ORIGINS = ALLOWED_ORIGINS;
module.exports.MAX_BYTES = MAX_BYTES;
module.exports.emailFor = emailFor;
module.exports.samePayload = samePayload;
