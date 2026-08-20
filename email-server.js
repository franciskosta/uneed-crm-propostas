const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const port = Number(process.env.PORT || 8090);
const host = process.env.HOST || (process.env.RAILWAY_ENVIRONMENT ? "0.0.0.0" : "127.0.0.1");
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
const sessionCookie = "uneed_session";
const dataDir = path.join(root, ".local");
const dataFile = path.join(dataDir, "server-data.json");
const defaultEmailFrom = "UNEED <geral@uneed.pt>";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

let pgPool = null;
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
  return { users: [], sessions: [], appState: null, reminders: [] };
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
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

function prospectKeys(lead) {
  let domain = "";
  try { domain = new URL(lead.website || "").hostname.replace(/^www\./, "").toLowerCase(); } catch {}
  const instagram = String(lead.instagramUrl || "").toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "");
  const phone = String(lead.phone || "").replace(/\D/g, "").replace(/^351/, "");
  const namePlace = `${String(lead.name || "").toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "")}|${String(lead.municipality || "").toLowerCase()}`;
  return [lead.placeId && `place:${lead.placeId}`, domain && `domain:${domain}`, instagram && `instagram:${instagram}`, phone && `phone:${phone}`, namePlace !== "|" && `name:${namePlace}`].filter(Boolean);
}

async function inspectProspectWebsite(url) {
  if (!url) return { exists: false, hasBooking: false, hasWhatsapp: false, hasForm: false, text: "" };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const result = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "UNEED-CRM-Prospecting/1.0" } });
    clearTimeout(timer);
    const html = (await result.text()).slice(0, 120000);
    const lower = html.toLowerCase();
    return { exists: result.ok, hasBooking: /marcar|marcaç|booking|agendar/.test(lower), hasWhatsapp: /wa\.me|whatsapp/.test(lower), hasForm: /<form/.test(lower), text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 5000) };
  } catch {
    return { exists: false, hasBooking: false, hasWhatsapp: false, hasForm: false, text: "" };
  }
}

async function analyzeProspect(business, website, niche) {
  if (!process.env.OPENAI_API_KEY) {
    const score = Math.min(95, 55 + (!website.exists ? 25 : 0) + (!website.hasBooking ? 10 : 0) + (business.phone ? 5 : 0));
    return { score, shouldContact: score >= 60, opportunity: website.exists ? "Melhorar a conversão e centralizar pedidos" : "Criar uma presença digital própria", reason: website.exists ? "A presença atual não evidencia um percurso completo para pedidos." : "Não foi encontrado um website próprio funcional.", message: `Olá! Sou o Francisco da UNEED. Ao analisar ${business.name}, reparei numa oportunidade para facilitar os pedidos online com uma presença própria. Posso mostrar-lhe uma ideia simples, sem compromisso?`, confidence: 65 };
  }
  const prompt = `Avalia este negócio para UNEED Presença (website one-page, domínio, email, alojamento, manutenção e uma forma principal de receber pedidos). Responde apenas JSON com score (0-100), shouldContact, opportunity, reason, message em português de Portugal e confidence. Não inventes. Nicho: ${JSON.stringify(niche)} Negócio: ${JSON.stringify(business)} Website: ${JSON.stringify(website)}`;
  const result = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_PROSPECT_MODEL || "gpt-5-mini", input: prompt, text: { format: { type: "json_object" } } }) });
  if (!result.ok) throw new Error(`OpenAI respondeu ${result.status}`);
  const data = await result.json();
  return JSON.parse(data.output_text);
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
      if (!response.ok) throw new Error(`Google Places respondeu ${response.status}`);
      const data = await response.json();
      for (const place of data.places || []) {
        const business = { placeId: place.id, name: place.displayName?.text || "Sem nome", niche: payload.niche?.label || "", district: payload.district || "", municipality, address: place.formattedAddress || "", phone: place.nationalPhoneNumber || "", website: place.websiteUri || "", mapsUrl: place.googleMapsUri || "", rating: place.rating || null, reviewCount: place.userRatingCount || 0 };
        const keys = prospectKeys(business);
        if (keys.some((key) => seen.has(key))) { duplicates += 1; continue; }
        keys.forEach((key) => seen.add(key));
        const website = await inspectProspectWebsite(business.website);
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
  if (request.url.startsWith("/api/")) {
    handleApi(request, response).catch((error) => sendJson(response, 500, { ok: false, error: error.message }));
    return;
  }
  serveStatic(request, response).catch((error) => {
    response.writeHead(500);
    response.end(error.message);
  });
});

initDb().then(() => {
  server.listen(port, host, () => {
    console.log(`UNEED CRM em http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`);
    console.log("Railway: configurar DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, RESEND_API_KEY e EMAIL_FROM.");
  });
});
