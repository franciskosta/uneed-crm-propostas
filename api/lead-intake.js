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
function validEmail(value) { return /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(String(value || "").trim()); }
const PRODUCT_LABELS = Object.freeze({ uneed: "Uneed", uneed_360: "Uneed 360º", uneed_presence: "Uneed Presença" });
const MODULE_LABELS = Object.freeze({ clientes: "Clientes e CRM", propostas: "Propostas e orçamentos", obras: "Obras e projetos", agenda: "Agenda", despesas: "Despesas", documentos: "Documentos" });
const MODEL_LABELS = Object.freeze({ purchase: "Compra", subscription: "Subscrição" });
const PRESENCE_NEED_LABELS = Object.freeze({ booking: "Marcações online", catalogue: "Catálogo", quote: "Pedidos de orçamento", contact: "Contactos e captação", institutional: "Website institucional", enrollment: "Inscrições", unsure: "Modalidade a definir contigo" });
function estimateLine(estimate = {}) {
  if (estimate.priceStatus === "not_applicable") return "";
  const parts = [];
  if (Number(estimate.initial) > 0) parts.push(`${estimate.initial} € inicial`);
  if (Number(estimate.monthly) > 0) parts.push(`${estimate.monthly} €/mês`);
  if (estimate.priceStatus === "requires_quote") return parts.length ? `Base estimada: ${parts.join(" · ")} + IVA; a opção personalizada será orçamentada à parte.` : "Será preparada uma proposta personalizada após análise.";
  if (estimate.priceStatus === "recurring_requires_quote") return `Estimativa inicial: ${parts.join(" · ")} + IVA; eventuais componentes recorrentes serão confirmadas após análise.`;
  return parts.length ? `Estimativa indicativa: ${parts.join(" · ")} + IVA.` : "";
}
function customerSummary(payload) {
  const configuration = payload.configuration || {};
  const product = payload.origin === "topclub.uneed.pt" ? "Uneed Presença × TOP Club" : PRODUCT_LABELS[payload.product] || "Uneed";
  if (payload.product === "uneed_360") {
    return {
      product,
      variant: MODEL_LABELS[configuration.model] || "Modelo a definir contigo",
      modules: (configuration.modules || []).map((module) => MODULE_LABELS[module] || module),
    };
  }
  if (payload.product === "uneed_presence") {
    return { product, variant: PRESENCE_NEED_LABELS[configuration.presenceNeed] || "Presença digital", modules: [] };
  }
  return { product, variant: "Pedido geral", modules: [] };
}
function baseAdminEmailFor(row) {
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
function baseCustomerEmailFor(row) {
  const payload = row.payload;
  const readable = customerSummary(payload);
  const modules = readable.modules;
  const addons = payload.configuration?.addons || [];
  const price = estimateLine(row.estimate);
  const summary = [
    `<strong>Referência:</strong> ${escapeHtml(row.reference)}`,
    `<strong>Pedido:</strong> ${escapeHtml(readable.product)}`,
    `<strong>Opção:</strong> ${escapeHtml(readable.variant)}`,
    payload.business?.name ? `<strong>Negócio:</strong> ${escapeHtml(payload.business.name)}` : "",
    payload.message ? `<strong>Mensagem:</strong> ${escapeHtml(payload.message)}` : "",
    modules.length ? `<strong>Módulos indicados:</strong> ${escapeHtml(modules.join(", "))}` : "",
    addons.length ? `<strong>Opções indicadas:</strong> ${escapeHtml(addons.map((addon) => `${addon.name} × ${addon.quantity}`).join(", "))}` : "",
    price ? `<strong>Valor:</strong> ${escapeHtml(price)}` : "",
  ].filter(Boolean);
  const body = `<div style="margin:22px 0;padding:20px;border:1px solid #e1e3ed;border-radius:16px;line-height:1.8;color:#4f566e">${summary.map((line) => `<p style="margin:0 0 8px">${line}</p>`).join("")}</div><div style="margin:22px 0;padding:20px;background:#f4f5fa;border-radius:16px;color:#4f566e;line-height:1.7"><strong style="color:#15164b">Próximo passo</strong><br>A equipa Uneed vai rever a informação e entrar em contacto contigo. Este email confirma apenas a receção do pedido; não constitui uma encomenda, adjudicação ou contrato.</div><p style="color:#4f566e;line-height:1.7">Se precisares de acrescentar alguma informação, responde a este email ou contacta <a href="mailto:geral@uneed.pt">geral@uneed.pt</a> · <a href="tel:+351934419375">+351 934 419 375</a>.</p>`;
  const plain = [
    `Olá ${payload.contact.name}.`, "", "Recebemos o teu pedido.", `Referência: ${row.reference}`,
    `Pedido: ${readable.product}`, `Opção: ${readable.variant}`, payload.business?.name ? `Negócio: ${payload.business.name}` : "",
    payload.message ? `Mensagem: ${payload.message}` : "", modules.length ? `Módulos indicados: ${modules.join(", ")}` : "",
    addons.length ? `Opções indicadas: ${addons.map((addon) => `${addon.name} × ${addon.quantity}`).join(", ")}` : "",
    price, "", "Próximo passo: a equipa Uneed vai rever a informação e entrar em contacto contigo.",
    "Este email confirma apenas a receção do pedido; não constitui uma encomenda, adjudicação ou contrato.", "",
    "Uneed · geral@uneed.pt · +351 934 419 375",
  ].filter(Boolean).join("\n");
  return {
    to: payload.contact.email,
    replyTo: process.env.KICKOFF_REPLY_TO || process.env.SMTP_USER || "geral@uneed.pt",
    subject: `Recebemos o teu pedido — ${row.reference}`,
    html: shell({ preview: `Confirmação de receção do pedido ${row.reference}`, eyebrow: "Pedido recebido", title: `Olá ${payload.contact.name}.`, intro: "Obrigado pelo teu contacto. Guardámos a informação que nos enviaste.", body, footerNote: "Se precisares, responde a este email." }),
    text: plain,
  };
}
function withTopclubBrief(message, row) {
  if (row.payload.origin !== "topclub.uneed.pt" || !row.payload.storybrandBrief) return message;
  const brief = row.payload.storybrandBrief;
  const content = `BRIEFING TOP CLUB\n\n${brief.text}\n\nPROMPT PARA CRIAÇÃO\n\n${brief.prompt}`;
  return {...message,
    subject: message.subject.replace('Novo pedido uneed_presence', 'Novo briefing TOP Club'),
    text: `${message.text}\n\n${content}`,
    html: message.html.replace('</body>', `<section style="max-width:640px;margin:24px auto;padding:24px;background:white;color:#15164b;font-family:Arial,sans-serif"><h2>O teu briefing TOP Club</h2><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-family:Arial,sans-serif;line-height:1.6">${escapeHtml(content)}</pre></section></body>`)};
}
function adminEmailFor(row) { return withTopclubBrief(baseAdminEmailFor(row),row); }
function customerEmailFor(row) { return withTopclubBrief(baseCustomerEmailFor(row),row); }
const NOTIFICATIONS = {
  admin: { status: "admin_notification_status", detail: "admin_notification_detail", email: adminEmailFor },
  customer: { status: "customer_notification_status", detail: "customer_notification_detail", email: customerEmailFor },
};
function notificationStatus(row, kind) {
  if (kind === "admin") return row.admin_notification_status || row.notification_status || "pending";
  return row.customer_notification_status || "not_applicable";
}
function publicResult(row, duplicate = false) {
  const normalized = (status) => status === "sending" ? "pending" : status;
  const admin = normalized(notificationStatus(row, "admin"));
  const customer = normalized(notificationStatus(row, "customer"));
  return { ok: true, accepted: true, duplicate, requestId: row.id, reference: row.reference, notification: admin, notifications: { admin, customer }, estimate: row.estimate };
}
async function attemptNotification(cfg, row, kind) {
  const definition = NOTIFICATIONS[kind];
  const current = notificationStatus(row, kind);
  if (!row || !definition || !["pending", "failed"].includes(current)) return row;
  if (kind === "customer" && !validEmail(row.payload?.contact?.email)) return row;
  const claimBody = { [definition.status]: "sending", updated_at: new Date().toISOString() };
  if (kind === "admin") claimBody.notification_status = "sending";
  const claimed = await db(cfg, `lead_intake_requests?id=eq.${encodeURIComponent(row.id)}&${definition.status}=eq.${current}`, {
    method: "PATCH", body: claimBody, prefer: "return=representation",
  });
  if (!claimed[0]) return { ...row, [definition.status]: "sending" };
  let notice;
  try { notice = await sendEmail(definition.email(claimed[0]), `lead-intake/${row.id}/${kind}`); }
  catch (notificationError) { notice = { sent: false, reason: "email_unavailable", detail: notificationError.message }; }
  const uncertain = ["smtp_unavailable", "email_unavailable"].includes(notice?.reason);
  const finalStatus = notice?.sent ? "sent" : uncertain ? "unknown" : "failed";
  const updateBody = {
    [definition.status]: finalStatus,
    [definition.detail]: notice?.sent
      ? { id: notice.id, acceptedCount: notice.acceptedCount ?? null, rejectedCount: notice.rejectedCount ?? null, pendingCount: notice.pendingCount ?? null }
      : { reason: notice?.reason || "email_unavailable" },
    updated_at: new Date().toISOString(),
  };
  if (kind === "admin") {
    // Keep the legacy four-state column compatible; the explicit admin column
    // carries the fail-closed ambiguous outcome.
    updateBody.notification_status = finalStatus === "unknown" ? "sending" : finalStatus;
    updateBody.notification_detail = updateBody[definition.detail];
  }
  try {
    await db(cfg, `lead_intake_requests?id=eq.${encodeURIComponent(row.id)}&${definition.status}=eq.sending`, {
      method: "PATCH",
      body: updateBody,
      prefer: "return=representation",
    });
  } catch (notificationError) { console.error("lead_intake_notification_status", kind, row.id, notificationError.message); }
  if (!notice?.sent) console.error("lead_intake_email_failed", kind, row.id, notice?.reason || "email_unavailable");
  return { ...claimed[0], ...updateBody };
}
async function attemptNotifications(cfg, row) {
  const kinds = ["admin", "customer"];
  const results = await Promise.allSettled(kinds.map((kind) => attemptNotification(cfg, row, kind)));
  const combined = { ...row };
  for (let index = 0; index < results.length; index += 1) {
    const kind = kinds[index], result = results[index];
    if (result.status === "rejected") {
      console.error("lead_intake_notification_attempt", kind, row.id, result.reason?.message || "unknown");
      continue;
    }
    const definition = NOTIFICATIONS[kind];
    combined[definition.status] = result.value[definition.status];
    combined[definition.detail] = result.value[definition.detail];
    if (kind === "admin") {
      combined.notification_status = result.value.notification_status;
      combined.notification_detail = result.value.notification_detail;
    }
  }
  return combined;
}
async function existingResult(cfg, row, storedPayload, status = 200) {
  if (!row || !samePayload(row.payload, storedPayload)) intake.fail("idempotency_conflict", "Esta chave de idempotência já foi usada para outro pedido.", ["idempotencyKey"], 409);
  const notified = await attemptNotifications(cfg, row);
  return { status, body: publicResult(notified, true) };
}

module.exports = async function handler(req, res) {
  const allowed = cors(req, res);
  if (req.method === "OPTIONS") return allowed ? res.status(204).end() : send(res, 403, { ok: false, error: { code: "origin_not_allowed", message: "Origem não autorizada." } });
  if (req.method !== "POST") return send(res, 405, { ok: false, error: { code: "method_not_allowed", message: "Método não permitido." } });
  if (!allowed) return send(res, 403, { ok: false, error: { code: "origin_not_allowed", message: "Origem não autorizada." } });
  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) return send(res, 415, { ok: false, error: { code: "content_type_invalid", message: "Envie JSON." } });
  const maxBytes = req.headers.origin === "https://topclub.uneed.pt" ? 192 * 1024 : MAX_BYTES;
  if (Number(req.headers["content-length"] || 0) > maxBytes) return send(res, 413, { ok: false, error: { code: "payload_too_large", message: "Pedido demasiado grande." } });
  let input = req.body;
  if (typeof input === "string") { if (Buffer.byteLength(input) > maxBytes) return send(res, 413, { ok: false, error: { code: "payload_too_large", message: "Pedido demasiado grande." } }); try { input = JSON.parse(input); } catch { return send(res, 400, { ok: false, error: { code: "invalid_json", message: "JSON inválido." } }); } }
  else { try { if (Buffer.byteLength(JSON.stringify(input ?? null)) > maxBytes) return send(res, 413, { ok: false, error: { code: "payload_too_large", message: "Pedido demasiado grande." } }); } catch { return send(res, 400, { ok: false, error: { code: "invalid_json", message: "JSON inválido." } }); } }
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
    const existing = await db(cfg, `lead_intake_requests?select=id,reference,payload,estimate,notification_status,admin_notification_status,admin_notification_detail,customer_notification_status,customer_notification_detail,updated_at&origin=eq.${encodeURIComponent(payload.origin)}&idempotency_key=eq.${encodeURIComponent(payload.idempotencyKey)}&limit=1`);
    if (existing[0]) { const result = await existingResult(cfg, existing[0], storedPayload); return send(res, result.status, result.body); }
    const ipHash = digest(cfg, requesterIp(req));
    const contactHash = digest(cfg, `${payload.contact.email}|${payload.contact.phone.replace(/\D/g, "")}`);
    const hour = new Date(Date.now() - 3600000).toISOString(), day = new Date(Date.now() - 86400000).toISOString();
    if (await limited(cfg, "ip_hash", ipHash, hour, 8) || await limited(cfg, "ip_hash", ipHash, day, 30) || await limited(cfg, "contact_hash", contactHash, hour, 5)) return send(res, 429, { ok: false, error: { code: "rate_limited", message: "Foram recebidos vários pedidos. Aguarde e tente novamente." } });
    const owner = await ownerId(cfg), id = crypto.randomUUID(), createdAt = new Date().toISOString();
    const customerNotificationStatus = validEmail(payload.contact.email) ? "pending" : "not_applicable";
    const row = { id, owner_id: owner, origin: payload.origin, product: payload.product, idempotency_key: payload.idempotencyKey, reference: reference(id, createdAt), payload: storedPayload, estimate: payload.estimate, status: "new", notification_status: "pending", admin_notification_status: "pending", customer_notification_status: customerNotificationStatus, ip_hash: ipHash, contact_hash: contactHash, created_at: createdAt, updated_at: createdAt };
    const inserted = await db(cfg, "lead_intake_requests?on_conflict=origin,idempotency_key", { method: "POST", body: row, prefer: "resolution=ignore-duplicates,return=representation" });
    if (!inserted[0]) {
      const raced = await db(cfg, `lead_intake_requests?select=id,reference,payload,estimate,notification_status,admin_notification_status,admin_notification_detail,customer_notification_status,customer_notification_detail,updated_at&origin=eq.${encodeURIComponent(payload.origin)}&idempotency_key=eq.${encodeURIComponent(payload.idempotencyKey)}&limit=1`);
      const result = await existingResult(cfg, raced[0], storedPayload);
      return send(res, result.status, result.body);
    }
    const saved = inserted[0];
    const notified = await attemptNotifications(cfg, saved);
    return send(res, 201, publicResult(notified));
  } catch (raw) { return error(res, raw); }
};

module.exports.ALLOWED_ORIGINS = ALLOWED_ORIGINS;
module.exports.MAX_BYTES = MAX_BYTES;
module.exports.adminEmailFor = adminEmailFor;
module.exports.customerEmailFor = customerEmailFor;
module.exports.validEmail = validEmail;
module.exports.samePayload = samePayload;
