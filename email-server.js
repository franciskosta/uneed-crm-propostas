const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MissionRepository } = require("./uneed-os/repository");
const { createMissionEngine } = require("./uneed-os/runtime");
const { MissionRunner } = require("./uneed-os/runner");

const root = __dirname;
const port = Number(process.env.PORT || 8090);
const host = process.env.HOST || (process.env.RAILWAY_ENVIRONMENT ? "0.0.0.0" : "127.0.0.1");
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
const sessionCookie = "uneed_session";
const dataDir = path.join(root, ".local");
const dataFile = process.env.UNEED_DATA_FILE || path.join(dataDir, "server-data.json");
const defaultEmailFrom = "UNEED <geral@uneed.pt>";
const soundzzzcapeApiUrl = String(process.env.SOUNDZZZCAPE_API_URL || "http://127.0.0.1:8765").replace(/\/$/, "");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

let pgPool = null;
let missionRepository = null;
let missionEngine = null;
let embeddedRunner = null;
const createRateLimits = new Map();
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require("pg");
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });
  } catch (error) {
    console.warn("PostgreSQL indisponivel, a usar ficheiro local:", error.message);
  }
}

function emptyData() {
  return { users: [], sessions: [], appState: null, reminders: [], missions: [] };
}

function ensureFileStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(emptyData(), null, 2));
}

function readFileStore() {
  ensureFileStore();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeFileStore(data) {
  ensureFileStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

async function query(sql, params = []) {
  if (!pgPool) return null;
  return pgPool.query(sql, params);
}

async function initDb() {
  if (!pgPool) {
    ensureFileStore();
    await ensureAdminUser();
    return;
  }
  await query(`
    create table if not exists users (
      id text primary key,
      email text unique not null,
      password_hash text not null,
      name text not null default 'UNEED',
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists sessions (
      token_hash text primary key,
      user_id text not null references users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists app_state (
      user_id text primary key references users(id) on delete cascade,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists email_reminders (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      payload jsonb not null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists missions (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      type text not null,
      objective text not null,
      priority text not null default 'normal',
      autonomy_level text not null,
      status text not null,
      target_type text not null,
      target_id text not null,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists missions_user_status_idx on missions(user_id, status, updated_at desc)");
  await query(fs.readFileSync(path.join(root, "migrations/001_uneed_os_runtime_v011.sql"), "utf8"));
  await ensureAdminUser();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored || "").split("$");
  if (!salt || !hash) return false;
  const attempt = hashPassword(password, salt).split("$")[2];
  return crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(hash, "hex"));
}

async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL || "geral@uneed.pt").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn("Define ADMIN_PASSWORD antes de colocar online. Login inicial local: geral@uneed.pt / uneed-local");
  }
  const passwordHash = hashPassword(password || "uneed-local");
  if (pgPool) {
    const existing = await query("select id from users where email=$1", [email]);
    if (!existing.rows.length) {
      await query("insert into users (id, email, password_hash, name) values ($1,$2,$3,$4)", [
        crypto.randomUUID(),
        email,
        passwordHash,
        "UNEED Admin",
      ]);
    }
    return;
  }
  const data = readFileStore();
  if (!data.users.some((user) => user.email === email)) {
    data.users.push({ id: crypto.randomUUID(), email, passwordHash, name: "UNEED Admin", createdAt: new Date().toISOString() });
    writeFileStore(data);
  }
}

function parseCookies(request) {
  return Object.fromEntries(String(request.headers.cookie || "").split(";").filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function setSessionCookie(response, token) {
  const secure = isProduction ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 14}${secure}`);
}

function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

async function getUserByEmail(email) {
  if (pgPool) {
    const result = await query("select * from users where email=$1", [email.toLowerCase()]);
    return result.rows[0] || null;
  }
  return readFileStore().users.find((user) => user.email === email.toLowerCase()) || null;
}

async function getSessionUser(request) {
  const authorization = String(request.headers.authorization || "");
  if (authorization.startsWith("Bearer ") && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try { const authResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: authorization, apikey: process.env.SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(5000) });
      if (authResponse.ok) { const user = await authResponse.json(); return { id: user.id, email: user.email, name: user.user_metadata?.name || user.email }; }
    } catch { return null; }
    return null;
  }
  const token = parseCookies(request)[sessionCookie];
  if (!token) return null;
  const tokenHash = hashToken(token);
  if (pgPool) {
    const result = await query(
      "select users.id, users.email, users.name from sessions join users on users.id=sessions.user_id where token_hash=$1 and expires_at>now()",
      [tokenHash],
    );
    return result.rows[0] || null;
  }
  const data = readFileStore();
  const session = data.sessions.find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt) > new Date());
  return session ? data.users.find((user) => user.id === session.userId) || null : null;
}

async function createSession(user, response) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  if (pgPool) {
    await query("insert into sessions (token_hash, user_id, expires_at) values ($1,$2,$3)", [tokenHash, user.id, expiresAt]);
  } else {
    const data = readFileStore();
    data.sessions.unshift({ tokenHash, userId: user.id, expiresAt, createdAt: new Date().toISOString() });
    writeFileStore(data);
  }
  setSessionCookie(response, token);
}

async function destroySession(request, response) {
  const token = parseCookies(request)[sessionCookie];
  if (token) {
    const tokenHash = hashToken(token);
    if (pgPool) await query("delete from sessions where token_hash=$1", [tokenHash]);
    else {
      const data = readFileStore();
      data.sessions = data.sessions.filter((item) => item.tokenHash !== tokenHash);
      writeFileStore(data);
    }
  }
  clearSessionCookie(response);
}

async function getAppState(userId) {
  if (pgPool) {
    const result = await query("select data from app_state where user_id=$1", [userId]);
    return result.rows[0]?.data || null;
  }
  return readFileStore().appState;
}

async function saveAppState(userId, appState) {
  if (pgPool) {
    await query(
      `insert into app_state (user_id, data, updated_at) values ($1,$2,now())
       on conflict (user_id) do update set data=excluded.data, updated_at=now()`,
      [userId, appState],
    );
    return;
  }
  const data = readFileStore();
  data.appState = appState;
  writeFileStore(data);
}

async function saveReminder(userId, reminder) {
  if (pgPool) await query("insert into email_reminders (id, user_id, payload) values ($1,$2,$3)", [reminder.id, userId, reminder]);
  else {
    const data = readFileStore();
    data.reminders.unshift(reminder);
    writeFileStore(data);
  }
}

async function listReminders(userId) {
  if (pgPool) {
    const result = await query("select payload from email_reminders where user_id=$1 order by created_at desc limit 200", [userId]);
    return result.rows.map((row) => row.payload);
  }
  return readFileStore().reminders || [];
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(payload));
}

async function proxySoundzzzcape(request, response, url) {
  const suffix = url.pathname.replace(/^\/api\/soundzzzcape/, "") || "/status";
  const target = `${soundzzzcapeApiUrl}/api${suffix}${url.search}`;
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (process.env.SOUNDZZZCAPE_CONTROL_TOKEN) headers.Authorization = `Bearer ${process.env.SOUNDZZZCAPE_CONTROL_TOKEN}`;
  const options = { method: request.method, headers, signal: AbortSignal.timeout(Number(process.env.SOUNDZZZCAPE_API_TIMEOUT_MS || 30000)) };
  if (request.method === "POST") options.body = await readBody(request);
  try {
    const upstream = await fetch(target, options);
    const payload = await upstream.json();
    sendJson(response, upstream.status, payload);
  } catch (error) {
    sendJson(response, 503, { ok: false, error: "soundzzzcape_agent_unavailable" });
  }
}

function prospectKeys(lead) {
  let domain = "";
  try { domain = new URL(lead.website || "").hostname.replace(/^www\./, "").toLowerCase(); } catch {}
  const instagram = String(lead.instagramUrl || "").toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "");
  const phone = String(lead.phone || "").replace(/\D/g, "").replace(/^351/, "");
  const namePlace = `${String(lead.name || "").toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "")}|${String(lead.municipality || "").toLowerCase()}`;
  return [lead.placeId && `place:${lead.placeId}`, domain && `domain:${domain}`, instagram && `instagram:${instagram}`, phone && `phone:${phone}`, namePlace !== "|" && `name:${namePlace}`].filter(Boolean);
}

function extractInstagramUrl(...sources) {
  const content = sources.filter(Boolean).join(" ").replace(/\\\//g, "/").replace(/&amp;/g, "&");
  const candidates = content.match(/https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._-]+/gi) || [];
  return candidates.find((url) => !/instagram\.com\/(?:p|reel|reels|stories|explore|accounts)\/?$/i.test(url))?.replace(/\/$/, "") || "";
}

async function inspectProspectWebsite(url) {
  if (!url) return { exists: false, hasBooking: false, hasWhatsapp: false, hasForm: false, instagramUrl: "", text: "" };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const result = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "UNEED-CRM-Prospecting/1.0" } });
    clearTimeout(timer);
    const html = (await result.text()).slice(0, 120000);
    const lower = html.toLowerCase();
    return { exists: result.ok, hasBooking: /marcar|marcaç|booking|agendar/.test(lower), hasWhatsapp: /wa\.me|whatsapp/.test(lower), hasForm: /<form/.test(lower), instagramUrl: extractInstagramUrl(url, html), text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 5000) };
  } catch {
    return { exists: false, hasBooking: false, hasWhatsapp: false, hasForm: false, instagramUrl: extractInstagramUrl(url), text: "" };
  }
}

async function analyzeProspect(business, website, niche) {
  const fallbackAnalysis = () => {
    const score = Math.min(95, 55 + (!website.exists ? 25 : 0) + (!website.hasBooking ? 10 : 0) + (business.phone ? 5 : 0));
    return { score, shouldContact: score >= 60, opportunity: website.exists ? "Simplificar os pedidos e marcações" : "Reunir a informação do negócio numa página própria", reason: website.exists ? "A presença atual não evidencia um percurso completo para pedidos." : "Não foi encontrado um website próprio funcional.", message: `Olá ${business.name}! Sou o Francisco, da Uneed Soluções Digitais.\n\nEstive a conhecer a vossa presença online e gostei da forma como apresentam o negócio 🙂\n\nReparei que uma página própria poderia ajudar a reunir a informação e tornar os pedidos de marcação mais simples.\n\nNa Uneed criamos páginas profissionais prontas a usar, com domínio, email, alojamento, suporte e marcações integradas. Começa nos 39€ + IVA/mês, sem fidelização.\n\nFaria sentido preparar-vos uma simulação personalizada, sem qualquer compromisso da vossa parte?`, confidence: 65 };
  };
  const openAiProspectKey = process.env.OPENAI_PROSPECT_API_KEY || process.env.OPENAI_API_KEY;
  if (!openAiProspectKey) return fallbackAnalysis();
  const prompt = `Avalia este negócio para UNEED Presença. Responde apenas JSON com score (0-100), shouldContact, opportunity, reason, message em português de Portugal e confidence. Mantém reason em uma ou duas frases curtas. Não inventes factos nem digas que visitaste fisicamente o espaço. Escreve como uma pessoa atenta e simpática, não como um relatório ou anúncio. A message deve ser calorosa, simples e pronta a enviar por Instagram, com exatamente 5 parágrafos curtos separados por duas quebras de linha: 1) "Olá [nome]! Sou o Francisco, da Uneed Soluções Digitais."; 2) uma observação positiva e natural baseada apenas num dado real, começando por exemplo por "Estive a ver..." ou "Gostei de..."; 3) algo concreto que uma página própria poderia facilitar, explicado sem termos técnicos; 4) "Na Uneed criamos páginas profissionais prontas a usar, com domínio, email, alojamento, suporte e marcações integradas. Começa nos 39€ + IVA/mês, sem fidelização."; 5) uma pergunta suave como "Faria sentido preparar-vos uma simulação personalizada, sem qualquer compromisso da vossa parte?". O tratamento é sempre profissional e dirigido à empresa ou instituição. Nunca trates o destinatário por tu e nunca uses tu, te, tens, queres, podes, teu, tua, contigo ou para ti. Podes usar a vossa marca, o vosso espaço, a sua empresa, consigo e gostaria. Evita expressões artificiais como "trabalho com salões para melhorar a presença online", "captar mais clientes", "tornar a gestão mais eficiente", "oportunidade simples", "forte confiança da clientela" ou "recomendado contacto". Não uses linguagem técnica, listas ou elogios exagerados. Usa no máximo um smile simples, apenas se ficar natural. Nicho: ${JSON.stringify(niche)} Negócio: ${JSON.stringify(business)} Website: ${JSON.stringify(website)}`;
  const result = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${openAiProspectKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_PROSPECT_MODEL || "gpt-4o-mini", input: prompt, text: { format: { type: "json_object" } } }) });
  if (!result.ok) {
    let detail = "";
    try {
      detail = (await result.json())?.error?.message || "";
    } catch {}
    if (/does not have access to model|organization must be verified|verify organization|model .*not found/i.test(String(detail))) return fallbackAnalysis();
    throw new Error(`OpenAI respondeu ${result.status}${detail ? `: ${detail}` : ""}`);
  }
  const data = await result.json();
  const outputText = data.output_text || data.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text")?.text;
  if (!outputText) {
    throw new Error(`A OpenAI não devolveu texto analisável${data.status ? ` (estado: ${data.status})` : ""}`);
  }
  return JSON.parse(outputText.replace(/^```json\s*|\s*```$/g, "").trim());
}

async function discoverProspects(payload) {
  if (!process.env.GOOGLE_PLACES_API_KEY) throw new Error("Falta configurar GOOGLE_PLACES_API_KEY no servidor");
  const known = new Set((payload.knownKeys || []).slice(0, 20000));
  const seen = new Set(known);
  const results = [];
  let duplicates = 0;
  let rejected = 0;
  const rejectedKeys = [];
  const municipalities = (payload.municipalities || []).slice(0, 308);
  const target = Math.max(1, Math.min(Number(payload.limit) || 20, 60));
  for (const municipality of municipalities) {
    if (results.length >= target) break;
    let center = null;
    try {
      const centerResponse = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": "places.location" }, body: JSON.stringify({ textQuery: `município de ${municipality}, Portugal`, languageCode: "pt-PT", maxResultCount: 1 }) });
      const centerData = centerResponse.ok ? await centerResponse.json() : {};
      center = centerData.places?.[0]?.location || null;
    } catch {}
    let pageToken = "";
    for (let page = 0; page < 3 && results.length < target; page++) {
      const body = { textQuery: `${payload.niche?.query || payload.niche?.label} em ${municipality}, Portugal`, languageCode: "pt-PT", maxResultCount: 20 };
      if (center) body.locationBias = { circle: { center, radius: Math.max(1000, Math.min(Number(payload.radiusKm) || 10, 50) * 1000) } };
      if (pageToken) body.pageToken = pageToken;
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.websiteUri,places.googleMapsUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,nextPageToken" }, body: JSON.stringify(body) });
      if (!response.ok) {
        let detail = "";
        try {
          detail = (await response.json())?.error?.message || "";
        } catch {}
        throw new Error(`Google Places respondeu ${response.status}${detail ? `: ${detail}` : ""}`);
      }
      const data = await response.json();
      for (const place of data.places || []) {
        const listedInstagram = extractInstagramUrl(place.websiteUri || "");
        const business = { placeId: place.id, name: place.displayName?.text || "Sem nome", niche: payload.niche?.label || "", district: payload.district || "", municipality, address: place.formattedAddress || "", phone: place.nationalPhoneNumber || "", website: listedInstagram ? "" : (place.websiteUri || ""), instagramUrl: listedInstagram, mapsUrl: place.googleMapsUri || "", rating: place.rating || null, reviewCount: place.userRatingCount || 0 };
        const keys = prospectKeys(business);
        if (keys.some((key) => seen.has(key))) { duplicates += 1; continue; }
        keys.forEach((key) => seen.add(key));
        const website = await inspectProspectWebsite(business.website);
        if (!business.instagramUrl && website.instagramUrl) business.instagramUrl = website.instagramUrl;
        const analysis = await analyzeProspect(business, website, payload.niche);
        if (!analysis.shouldContact || Number(analysis.score || 0) < Number(payload.minScore || 0)) { rejected += 1; rejectedKeys.push(...keys); continue; }
        results.push({ ...business, score: Number(analysis.score || 0), opportunity: analysis.opportunity || "", notes: analysis.reason || "", message: analysis.message || "", confidence: Number(analysis.confidence || 0), hasWebsite: website.exists, hasBooking: website.hasBooking, hasWhatsappTree: website.hasWhatsapp });
        if (results.length >= target) break;
      }
      pageToken = data.nextPageToken || "";
      if (!pageToken) break;
    }
  }
  return { results, duplicates, rejected, rejectedKeys: [...new Set(rejectedKeys)] };
}

async function sendViaResend(email) {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: "missing_email_config" };
  const apiResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || defaultEmailFrom,
      to: email.to,
      subject: email.subject,
      text: email.body,
    }),
  });
  if (!apiResponse.ok) return { sent: false, reason: await apiResponse.text() };
  return { sent: true, provider: "resend", providerResponse: await apiResponse.json() };
}

async function requireUser(request, response) {
  const user = await getSessionUser(request);
  if (!user) sendJson(response, 401, { ok: false, error: "unauthorized" });
  return user;
}

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/health") {
    let database = "file"; try { if (pgPool) { await query("select 1"); database = "postgresql"; } } catch { sendJson(response, 503, { ok: false, application: "ok", database: "error" }); return; }
    sendJson(response, 200, { ok: true, application: "ok", database, runner: embeddedRunner ? "embedded" : "external", aiConfigured: Boolean(process.env.OPENAI_API_KEY), searchConfigured: Boolean(process.env.OPENAI_API_KEY) }); return;
  }

  if (url.pathname === "/api/auth/me") {
    const user = await getSessionUser(request);
    sendJson(response, 200, { ok: true, user: user ? { email: user.email, name: user.name } : null });
    return;
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const payload = JSON.parse(await readBody(request));
    const user = await getUserByEmail(payload.email || "");
    const hash = user?.password_hash || user?.passwordHash;
    if (!user || !verifyPassword(payload.password || "", hash)) {
      sendJson(response, 401, { ok: false, error: "invalid_credentials" });
      return;
    }
    await createSession(user, response);
    sendJson(response, 200, { ok: true, user: { email: user.email, name: user.name } });
    return;
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    await destroySession(request, response);
    sendJson(response, 200, { ok: true });
    return;
  }

  const user = await requireUser(request, response);
  if (!user) return;

  if (url.pathname.startsWith("/api/soundzzzcape")) {
    const owners = String(process.env.SOUNDZZZCAPE_OWNER_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
    const emails = String(process.env.SOUNDZZZCAPE_OWNER_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    if (!owners.includes(user.id) && !(user.email_confirmed_at && emails.includes(String(user.email || '').toLowerCase()))) {
      sendJson(response, 403, {ok:false,error:'soundzzzcape_access_not_configured'});
      return;
    }
    await proxySoundzzzcape(request, response, url);
    return;
  }

  if (url.pathname === "/api/state" && request.method === "GET") {
    sendJson(response, 200, { ok: true, state: await getAppState(user.id) });
    return;
  }

  if (url.pathname === "/api/state" && request.method === "PUT") {
    const payload = JSON.parse(await readBody(request));
    await saveAppState(user.id, payload.state || null);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/prospect/search" && request.method === "POST") {
    const payload = JSON.parse(await readBody(request));
    if (!payload.niche || !payload.district || !Array.isArray(payload.municipalities) || !payload.municipalities.length) {
      sendJson(response, 400, { ok: false, error: "Seleciona nicho, distrito e pelo menos um município" });
      return;
    }
    sendJson(response, 200, { ok: true, ...(await discoverProspects(payload)) });
    return;
  }

  if (url.pathname === "/api/email/reminders" && request.method === "GET") {
    sendJson(response, 200, { ok: true, reminders: await listReminders(user.id) });
    return;
  }

  if (url.pathname === "/api/email/reminders" && request.method === "POST") {
    const payload = JSON.parse(await readBody(request));
    if (!payload.to || !payload.subject || !payload.body) {
      sendJson(response, 400, { ok: false, error: "missing_email_fields" });
      return;
    }
    const sendResult = await sendViaResend(payload);
    const reminder = {
      id: crypto.randomUUID(),
      proposalId: payload.proposalId || "",
      dueDate: payload.dueDate || new Date().toISOString().slice(0, 10),
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      sent: sendResult.sent,
      status: sendResult.sent ? "sent" : "queued",
      provider: sendResult.provider || "",
      reason: sendResult.reason || "",
      createdAt: new Date().toISOString(),
    };
    await saveReminder(user.id, reminder);
    sendJson(response, 200, { ok: true, sent: reminder.sent, reminder });
    return;
  }

  const missionMatch = url.pathname.match(/^\/api\/missions\/([^/]+)(?:\/(decision|cancel|retry))?$/);

  if (url.pathname === "/api/missions" && request.method === "GET") {
    sendJson(response, 200, { ok: true, missions: await missionEngine.repository.list(user.id) });
    return;
  }

  if (url.pathname === "/api/missions" && request.method === "POST") {
    const payload = JSON.parse(await readBody(request));
    const timestamps = (createRateLimits.get(user.id) || []).filter((time) => Date.now() - time < 60000); if (timestamps.length >= Number(process.env.MISSION_CREATE_RATE_LIMIT || 5)) { sendJson(response, 429, { ok: false, error: "rate_limit" }); return; } timestamps.push(Date.now()); createRateLimits.set(user.id, timestamps);
    const created = await missionEngine.create({ ...payload, requestedBy: user.id });
    sendJson(response, created.duplicate ? 200 : 202, { ok: true, mission: created.mission, duplicate: created.duplicate });
    return;
  }

  if (missionMatch && !missionMatch[2] && request.method === "GET") {
    const mission = await missionEngine.repository.get(missionMatch[1], user.id);
    sendJson(response, mission ? 200 : 404, mission ? { ok: true, mission } : { ok: false, error: "not_found" });
    return;
  }

  if (missionMatch?.[2] === "decision" && request.method === "POST") {
    const payload = JSON.parse(await readBody(request));
    const mission = await missionEngine.decide(missionMatch[1], { approved: payload.approved, note: payload.note || "", decidedBy: user.id });
    sendJson(response, 200, { ok: true, mission });
    return;
  }

  if (missionMatch?.[2] === "cancel" && request.method === "POST") { sendJson(response, 200, { ok: true, mission: await missionEngine.cancel(missionMatch[1], user.id) }); return; }
  if (missionMatch?.[2] === "retry" && request.method === "POST") { sendJson(response, 200, { ok: true, mission: await missionEngine.retry(missionMatch[1], user.id) }); return; }
  if (url.pathname === "/api/missions-stats" && request.method === "GET") { sendJson(response, 200, { ok: true, stats: await missionRepository.stats(user.id) }); return; }

  sendJson(response, 404, { ok: false, error: "not_found" });
}

function serveFile(filePath, response) {
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  });
}

function hasSupabaseFrontendConfig() {
  try {
    const config = fs.readFileSync(path.join(root, "supabase-config.js"), "utf8");
    return /url:\s*"https:\/\/[^"]+\.supabase\.co"/.test(config) && /anonKey:\s*"ey/.test(config);
  } catch {
    return false;
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const publicPaths = new Set([
    "/login.html",
    "/suporte",
    "/suporte.html",
    "/styles.css",
    "/suporte.js",
    "/supabase-config.js",
    "/assets/favicon.ico",
    "/assets/uneed-logo-branco.png",
    "/assets/uneed-logo-login.png",
  ]);
  const user = await getSessionUser(request);
  const frontendAuth = hasSupabaseFrontendConfig();

  if (!frontendAuth && !user && !publicPaths.has(url.pathname)) {
    response.writeHead(302, { Location: "/login.html" });
    response.end();
    return;
  }
  if (!frontendAuth && user && url.pathname === "/login.html") {
    response.writeHead(302, { Location: "/" });
    response.end();
    return;
  }

  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = safePath === "/" ? "index.html" : safePath === "/suporte" ? "suporte.html" : safePath;
  const filePath = path.join(root, resolvedPath);
  serveFile(filePath, response);
}

const server = http.createServer((request, response) => {
  request.requestId = request.headers["x-request-id"] || crypto.randomUUID();
  response.setHeader("X-Request-Id", request.requestId);
  const allowedOrigin = process.env.FRONTEND_ORIGIN;
  if (allowedOrigin && request.headers.origin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  }
  if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }
  if (request.url.startsWith("/api/")) {
    handleApi(request, response).catch((error) => { console.error(JSON.stringify({ level: "error", message: "api_request_failed", request_id: request.requestId, code: error.code || error.message })); sendJson(response, 500, { ok: false, error: error.code || "internal_error", requestId: request.requestId }); });
    return;
  }
  serveStatic(request, response).catch((error) => {
    response.writeHead(500);
    response.end(error.message);
  });
});

initDb().then(() => {
  missionRepository = new MissionRepository({ query: pgPool ? query : null, pool: pgPool, readStore: readFileStore, writeStore: writeFileStore });
  missionEngine = createMissionEngine(missionRepository);
  const useEmbeddedRunner = process.env.MISSION_RUNNER_EMBEDDED === "true" || !pgPool;
  if (useEmbeddedRunner) { embeddedRunner = new MissionRunner({ engine: missionEngine, repository: missionRepository, workerId: `api-${process.pid}`, concurrency: Number(process.env.MISSION_WORKER_CONCURRENCY || 1) }); embeddedRunner.recoverStale().then(() => setInterval(() => embeddedRunner.tick().catch((error) => console.error(JSON.stringify({ level: "error", message: "embedded_runner_tick", code: error.code || error.message }))), Number(process.env.MISSION_POLL_MS || 1500))); }
  server.listen(port, host, () => {
    console.log(`UNEED CRM em http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`);
    console.log("Railway: configurar DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, RESEND_API_KEY e EMAIL_FROM.");
  });
});
