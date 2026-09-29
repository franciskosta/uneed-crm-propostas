const crypto = require("node:crypto");
const { adminEmail, customerEmail, sendEmail } = require("./kickoff-email");

const { commercialCatalog, addonCatalog, allowedLanguages } = require('../kickoff-catalog');

function cleanText(value, maxLength = 4000) {
  return String(value || "").trim().slice(0, maxLength);
}

function resolveCommercial(productValue, planValue) {
  const requestedProduct = cleanText(productValue, 40).toLowerCase();
  const product = commercialCatalog[requestedProduct] ? requestedProduct : "presenca";
  const catalog = commercialCatalog[product];
  const requestedPlan = cleanText(planValue, 80);
  const planId = catalog.plans[requestedPlan] ? requestedPlan : catalog.defaultPlan;
  return { product, planId, ...catalog.plans[planId], objective: catalog.objective, allowedAddons: catalog.addons };
}

function normalizePayload(received) {
  const commercial = resolveCommercial(received.product, received.plan);
  const rawAddons = Array.isArray(received.addons) ? received.addons.slice(0, 20) : [];
  const seenAddonIds = new Set();
  const addons = rawAddons.map((rawAddon) => {
    const id = cleanText(rawAddon?.id, 80);
    if (!commercial.allowedAddons.includes(id) || seenAddonIds.has(id)) return null;
    seenAddonIds.add(id);
    const definition = addonCatalog[id];
    const languages = definition.type === "languages" && Array.isArray(rawAddon.languages)
      ? rawAddon.languages.map((language) => cleanText(language, 10).toLowerCase())
        .filter((language, index, values) => allowedLanguages.includes(language) && values.indexOf(language) === index)
      : [];
    const quantity = definition.type === "quantity"
      ? Math.max(1, Math.min(20, Number.parseInt(rawAddon.quantity, 10) || 1))
      : definition.type === "languages" ? languages.length : 1;
    if (definition.type === "languages" && !quantity) return null;
    const subtotal = Number.isFinite(definition.unitPrice) ? definition.unitPrice * quantity : null;
    return {
      id,
      name: definition.name,
      price: Number.isFinite(definition.unitPrice) ? `${definition.unitPrice}€ / mês` : definition.price,
      unitPrice: Number.isFinite(definition.unitPrice) ? definition.unitPrice : null,
      quantity,
      languages,
      subtotal,
    };
  }).filter(Boolean);
  const knownExtrasMonthlyPrice = addons.reduce((total, addon) => total + (addon.subtotal || 0), 0);
  const hasPendingPrices = addons.some((addon) => addon.subtotal === null);

  return {
    objective: received.configuredFlow === true ? commercial.objective : cleanText(received.objective, 120),
    addons,
    businessName: cleanText(received.businessName, 180),
    contactName: cleanText(received.contactName, 180),
    phone: cleanText(received.phone, 40),
    email: cleanText(received.email, 254).toLowerCase(),
    taxId: cleanText(received.taxId, 20),
    billingAddress: cleanText(received.billingAddress, 500),
    currentUrl: cleanText(received.currentUrl, 500),
    domainStatus: cleanText(received.domainStatus, 120),
    domain: cleanText(received.domain, 240),
    services: cleanText(received.services),
    hours: cleanText(received.hours, 2000),
    team: cleanText(received.team, 2000),
    siteChanges: cleanText(received.siteChanges, 6000),
    referenceUrls: cleanText(received.referenceUrls, 2000),
    notes: cleanText(received.notes),
    paymentMethod: cleanText(received.paymentMethod, 40),
    paymentStatus: "awaiting_payment",
    consent: received.consent === true,
    source: cleanText(received.source, 120),
    product: commercial.product,
    niche: cleanText(received.niche, 80).toLowerCase(),
    configuredFlow: received.configuredFlow === true,
    plan: commercial.planId,
    planName: commercial.name,
    baseMonthlyPrice: commercial.price,
    knownExtrasMonthlyPrice,
    estimatedMonthlyPrice: commercial.price + knownExtrasMonthlyPrice,
    currency: "EUR",
    priceStatus: hasPendingPrices ? "pending_addon_validation" : addons.length ? "estimated_total" : "base_confirmed",
    pageUrl: cleanText(received.pageUrl, 800),
  };
}

function validationError(payload) {
  if (!payload.objective || !payload.businessName || !payload.contactName || !payload.phone || !payload.email || !payload.siteChanges || !payload.paymentMethod || !payload.consent) return "missing_required_fields";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return "invalid_email";
  if (payload.taxId && !/^\d{9}$/.test(payload.taxId)) return "invalid_tax_id";
  if (!["bank_transfer", "mbway"].includes(payload.paymentMethod)) return "invalid_payment_method";
  return "";
}

function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(payload);
}

function supabaseHeaders(secretKey, prefer = "") {
  return {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function checkStorage(supabaseUrl, secretKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/kickoff_submissions?select=id&limit=1`, {
    headers: supabaseHeaders(secretKey),
  });
  if (!response.ok) throw new Error(`kickoff_storage_check_failed:${response.status}`);
  return true;
}

async function loadPaymentConfig(supabaseUrl, secretKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/crm_state?select=data&limit=1`, {
    headers: supabaseHeaders(secretKey),
  });
  if (!response.ok) throw new Error(`payment_config_failed:${response.status}`);
  const rows = await response.json();
  const brand = rows[0]?.data?.brand || {};
  return {
    accountName: cleanText(brand.name, 180),
    iban: cleanText(brand.iban, 80),
    mbway: cleanText(process.env.KICKOFF_MBWAY_NUMBER || brand.mbway, 40),
  };
}

function money(value) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

module.exports = async function handler(req, res) {
  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY_V2 || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (req.method === "GET") {
    if (!supabaseUrl || !secretKey) return send(res, 503, { ok: false, error: "backend_not_configured" });
    try {
      await checkStorage(supabaseUrl, secretKey);
      const paymentConfig = await loadPaymentConfig(supabaseUrl, secretKey);
      return send(res, 200, { ok: true, ready: true, storage: "kickoff_submissions", paymentMethods: { bankTransfer: Boolean(paymentConfig.accountName && paymentConfig.iban), mbway: Boolean(paymentConfig.mbway) } });
    } catch (error) {
      console.error("kickoff_health_failed", error.message);
      return send(res, 503, { ok: false, error: "backend_unavailable" });
    }
  }

  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method_not_allowed" });

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > 100000) return send(res, 413, { ok: false, error: "payload_too_large" });

  let received = req.body;
  if (typeof received === "string") {
    try { received = JSON.parse(received); } catch { return send(res, 400, { ok: false, error: "invalid_json" }); }
  }
  if (!received || typeof received !== "object" || Array.isArray(received)) return send(res, 400, { ok: false, error: "invalid_json" });
  if (cleanText(received.website, 200)) return send(res, 200, { ok: true, reference: "UNEED-RECEBIDO" });

  const payload = normalizePayload(received);
  const invalid = validationError(payload);
  if (invalid) return send(res, 400, { ok: false, error: invalid });
  if (payload.priceStatus === "pending_addon_validation") return send(res, 409, { ok: false, error: "price_requires_validation" });

  if (!supabaseUrl || !secretKey) return send(res, 503, { ok: false, error: "backend_not_configured" });

  const nonce = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const reference = `UNEED-${createdAt.slice(2, 10).replaceAll("-", "")}-${nonce.slice(0, 5).toUpperCase()}`;
  let paymentConfig;
  try {
    await checkStorage(supabaseUrl, secretKey);
    paymentConfig = await loadPaymentConfig(supabaseUrl, secretKey);
    if (payload.paymentMethod === "bank_transfer" && (!paymentConfig.accountName || !paymentConfig.iban)) return send(res, 503, { ok: false, error: "payment_method_unavailable" });
    if (payload.paymentMethod === "mbway" && !paymentConfig.mbway) return send(res, 503, { ok: false, error: "payment_method_unavailable" });
    const databaseResponse = await fetch(`${supabaseUrl}/rest/v1/kickoff_submissions`, {
      method: "POST",
      headers: supabaseHeaders(secretKey, "return=minimal"),
      body: JSON.stringify({ reference, payload, status: "awaiting_payment", created_at: createdAt }),
    });

    if (!databaseResponse.ok) {
      console.error("kickoff_submission_failed", databaseResponse.status, await databaseResponse.text());
      return send(res, 502, { ok: false, error: "submission_failed" });
    }
  } catch (error) {
    console.error("kickoff_submission_failed", error.message);
    return send(res, 502, { ok: false, error: "submission_failed" });
  }

  const subtotal = payload.estimatedMonthlyPrice;
  const totalWithVat = Math.round(subtotal * 1.23 * 100) / 100;
  const payment = {
    method: payload.paymentMethod,
    subtotalFormatted: money(subtotal),
    totalWithVatFormatted: money(totalWithVat),
    accountName: payload.paymentMethod === "bank_transfer" ? paymentConfig.accountName : "",
    iban: payload.paymentMethod === "bank_transfer" ? paymentConfig.iban : "",
    mbway: payload.paymentMethod === "mbway" ? paymentConfig.mbway : "",
  };
  const customer = customerEmail({ payload, payment, reference });
  const admin = adminEmail({ payload, payment, reference });
  const [customerNotification, adminNotification] = await Promise.all([
    sendEmail({ ...customer, to: payload.email }, `kickoff/${reference}/customer`),
    sendEmail({ ...admin, to: process.env.KICKOFF_NOTIFICATION_TO || "geral@uneed.pt" }, `kickoff/${reference}/admin`),
  ]);
  if (!customerNotification.sent) console.error("kickoff_customer_email_failed", reference, customerNotification.reason);
  if (!adminNotification.sent) console.error("kickoff_admin_email_failed", reference, adminNotification.reason);
  return send(res, 201, {
    ok: true,
    reference,
    notified: adminNotification.sent,
    customerEmailSent: customerNotification.sent,
    payment,
  });
};

module.exports.normalizePayload = normalizePayload;
module.exports.validationError = validationError;
