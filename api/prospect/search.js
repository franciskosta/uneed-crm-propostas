const { buildLeadIntelligence, classifyUrl } = require("../../lead-intelligence");

const GOOGLE_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
function send(res, status, payload) { res.status(status).setHeader("Cache-Control", "no-store").json(payload); }
async function authenticate(req) { const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, ""); const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY; if (!token || !url || !key) return false; const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: key } }); return response.ok; }
function keysFor(item) { let domain = ""; try { domain = new URL(item.website || "").hostname.replace(/^www\./, "").toLowerCase(); } catch {} const instagram = String(item.instagramUrl || "").toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, ""); const phone = String(item.phone || "").replace(/\D/g, "").replace(/^351/, ""); const name = `${String(item.name || "").toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "")}|${String(item.municipality || "").toLowerCase()}`; return [item.placeId && `place:${item.placeId}`, domain && `domain:${domain}`, instagram && `instagram:${instagram}`, phone && `phone:${phone}`, name !== "|" && `name:${name}`].filter(Boolean); }
function extractInstagramUrl(...sources) { const content = sources.filter(Boolean).join(" ").replaceAll("\\/", "/"); const lower = content.toLowerCase(); const mark = lower.indexOf("instagram.com/"); if (mark < 0) return ""; const begin = lower.lastIndexOf("http", mark); if (begin < 0) return ""; let end = content.length; for (const char of ["\"", "'", "<", " ", ")"]) { const found = content.indexOf(char, mark); if (found >= 0 && found < end) end = found; } const url = content.slice(begin, end).replace(/\/$/, ""); return url.includes("instagram.com/") ? url : ""; }
async function inspectWebsite(url) { if (!url) return { exists: false, hasBooking: false, hasWhatsapp: false, hasCta: false, instagramUrl: "", text: "" }; try { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 5000); const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "UNEED-CRM-Prospecting/1.0" } }); clearTimeout(timer); const html = (await response.text()).slice(0, 120000); const lower = html.toLowerCase(); return { exists: response.ok, hasBooking: /marcar|marcaç|booking|agendar/.test(lower), hasWhatsapp: /wa\.me|whatsapp/.test(lower), hasCta: /contact|contacto|pedir|reserv|marcar|agendar/.test(lower), instagramUrl: extractInstagramUrl(url, html), text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 5000) }; } catch { return { exists: false, hasBooking: false, hasWhatsapp: false, hasCta: false, instagramUrl: extractInstagramUrl(url), text: "" }; } }
async function googleSearch(body) { const response = await fetch(GOOGLE_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.googleMapsUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.location,nextPageToken" }, body: JSON.stringify(body) }); if (!response.ok) { let detail = ""; try { detail = (await response.json())?.error?.message || ""; } catch {} throw new Error(`Google Places respondeu ${response.status}${detail ? `: ${detail}` : ""}`); } return response.json(); }

async function discover(params) {
  if (!process.env.GOOGLE_PLACES_API_KEY) throw new Error("Falta configurar GOOGLE_PLACES_API_KEY na Vercel");
  const seen = new Set((params.knownKeys || []).slice(0, 20000)); const results = []; const rejectedKeys = []; let duplicates = 0; let rejected = 0; const target = Math.max(1, Math.min(Number(params.limit) || 20, 60));
  for (const municipality of (params.municipalities || []).slice(0, 308)) {
    if (results.length >= target) break;
    let center = null; try { const data = await googleSearch({ textQuery: `município de ${municipality}, Portugal`, languageCode: "pt-PT", maxResultCount: 1 }); center = data.places?.[0]?.location || null; } catch {}
    let pageToken = "";
    for (let page = 0; page < 3 && results.length < target; page += 1) {
      const body = { textQuery: `${params.niche?.query || params.niche?.label} em ${municipality}, Portugal`, languageCode: "pt-PT", maxResultCount: 20 };
      if (pageToken) body.pageToken = pageToken;
      if (center) body.locationBias = { circle: { center, radius: Math.max(1000, Math.min(Number(params.radiusKm) || 10, 50) * 1000) } };
      const data = await googleSearch(body);
      for (const place of data.places || []) {
        const rawWebsite = place.websiteUri || ""; const classification = classifyUrl(rawWebsite);
        const candidate = { placeId: place.id, name: place.displayName?.text || "Sem nome", niche: params.niche?.label || "", district: params.district || "", municipality, address: place.formattedAddress || "", phone: place.nationalPhoneNumber || "", website: classification.official ? classification.url : "", instagramUrl: extractInstagramUrl(rawWebsite), mapsUrl: place.googleMapsUri || "", rating: place.rating || null, reviewCount: place.userRatingCount || 0, externalReferences: classification.official || !classification.url ? [] : [{ url: classification.url, type: classification.type }] };
        const keys = keysFor({ ...candidate, website: candidate.website || rawWebsite }); if (keys.some((key) => seen.has(key))) { duplicates += 1; continue; } keys.forEach((key) => seen.add(key));
        const website = await inspectWebsite(candidate.website); if (!candidate.instagramUrl && website.instagramUrl) candidate.instagramUrl = website.instagramUrl;
        const intelligence = buildLeadIntelligence({ ...candidate, hasBooking: website.hasBooking, hasCta: website.hasCta, confidence: website.exists ? 70 : 55 }, params.catalog || []);
        if (intelligence.commercialScore < Number(params.minScore || 0)) { rejected += 1; rejectedKeys.push(...keys); continue; }
        results.push({ ...candidate, ...intelligence, score: intelligence.commercialScore, confidence: intelligence.confidence, opportunity: intelligence.mainOpportunity, notes: intelligence.whyThisLead, message: intelligence.initialMessage, hasWebsite: Boolean(intelligence.officialWebsite), hasBooking: website.hasBooking, hasWhatsappTree: website.hasWhatsapp, source: "automated_lead_factory", discoverySource: "google_places" });
        if (results.length >= target) break;
      }
      pageToken = data.nextPageToken || ""; if (!pageToken) break;
    }
  }
  return { results, duplicates, rejected, rejectedKeys: [...new Set(rejectedKeys)], policyVersion: "lead-intelligence-v0.1" };
}

module.exports = async function handler(req, res) { if (req.method !== "POST") return send(res, 405, { ok: false, error: "method_not_allowed" }); try { if (!(await authenticate(req))) return send(res, 401, { ok: false, error: "Sessão inválida ou expirada" }); const params = typeof req.body === "string" ? JSON.parse(req.body) : req.body; if (!params?.niche || !params.district || !Array.isArray(params.municipalities) || !params.municipalities.length) return send(res, 400, { ok: false, error: "Seleciona nicho, distrito e pelo menos um município" }); return send(res, 200, { ok: true, ...(await discover(params)) }); } catch (error) { return send(res, 500, { ok: false, error: error.message || "Falha na prospeção" }); } };

module.exports.discover = discover;
module.exports.keysFor = keysFor;
