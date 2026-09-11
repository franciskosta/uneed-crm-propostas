const dns = require("dns").promises;
const http = require("http");
const https = require("https");
const net = require("net");
const { RuntimeError } = require("./errors");

function isPrivateIp(address) {
  if (net.isIPv4(address)) { const p = address.split(".").map(Number); return p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && [0,2,168].includes(p[1])) || (p[0] === 198 && [18,19,51].includes(p[1])) || (p[0] === 203 && p[1] === 0 && p[2] === 113) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127); }
  const value = String(address).toLowerCase(); if (value.startsWith("::ffff:")) return isPrivateIp(value.slice(7)); return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fec") || value.startsWith("fed") || value.startsWith("fee") || value.startsWith("fef") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb") || value.startsWith("ff") || value.startsWith("2001:db8");
}

async function validatePublicUrl(value, lookup = dns.lookup) {
  let url; try { url = new URL(value); } catch { throw new RuntimeError("INPUT_INVALID", "URL inválido."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new RuntimeError("PERMISSION_DENIED", "URL/protocolo não permitido.");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, ""); if (["localhost", "metadata.google.internal"].includes(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) throw new RuntimeError("PERMISSION_DENIED", "Host interno bloqueado.");
  const addresses = net.isIP(hostname) ? [{ address: hostname, family: net.isIPv4(hostname) ? 4 : 6 }] : await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => isPrivateIp(item.address))) throw new RuntimeError("PERMISSION_DENIED", "Rede privada ou não resolvida bloqueada.");
  return { url, address: addresses[0].address, family: addresses[0].family };
}

function requestPinned(target, { timeoutMs, maxBytes, userAgent }) {
  return new Promise((resolve, reject) => {
    const transport = target.url.protocol === "https:" ? https : http; let size = 0; const chunks = [];
    const request = transport.request({ protocol: target.url.protocol, hostname: target.address, family: target.family, port: target.url.port || undefined, path: `${target.url.pathname}${target.url.search}`, method: "GET", servername: target.url.hostname, headers: { Host: target.url.host, "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml,text/plain;q=0.8", "Accept-Encoding": "identity" }, timeout: timeoutMs, rejectUnauthorized: true }, (response) => {
      response.on("data", (chunk) => { size += chunk.length; if (size > maxBytes) { request.destroy(new RuntimeError("INPUT_INVALID", "Página excede o limite de tamanho.")); return; } chunks.push(chunk); });
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });
    request.on("timeout", () => request.destroy(new RuntimeError("AI_TIMEOUT", "Página excedeu o timeout."))); request.on("error", reject); request.end();
  });
}

async function fetchPublicUrl(value, { timeoutMs = 8000, maxBytes = 750000, maxRedirects = 3, lookup = dns.lookup, requester = requestPinned, userAgent = "UNEED-Discover/0.1 (+https://uneed.pt)" } = {}) {
  let current = value; const redirects = [];
  for (let index = 0; index <= maxRedirects; index += 1) { const target = await validatePublicUrl(current, lookup); const response = await requester(target, { timeoutMs, maxBytes, userAgent });
    if ([301,302,303,307,308].includes(response.status)) { const location = response.headers.location; if (!location || index === maxRedirects) throw new RuntimeError("AI_BAD_RESPONSE", "Redirect inválido ou limite excedido."); current = new URL(location, target.url).href; redirects.push(current); continue; }
    return { ...response, finalUrl: target.url.href, redirects };
  }
  throw new RuntimeError("AI_BAD_RESPONSE", "Limite de redirects excedido.");
}

function decodeEntities(text) { return String(text || "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">"); }
function stripTags(text) { return decodeEntities(String(text || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }
function attr(tag, name) { return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] || ""; }
function normalizeUrl(value, base) { try { const url = new URL(value, base); url.hash = ""; ["utm_source","utm_medium","utm_campaign","fbclid","gclid"].forEach((key) => url.searchParams.delete(key)); return url.href; } catch { return null; } }

function extractPage(html, url, maxTextChars = 16000) {
  const cleaned = String(html || "").replace(/<(script|style|svg|noscript|template)[\s\S]*?<\/\1>/gi, " ").replace(/<(nav|footer)[\s\S]*?<\/\1>/gi, " ");
  const title = stripTags(cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]); const metaTags = cleaned.match(/<meta\b[^>]*>/gi) || []; const descriptionTag = metaTags.find((tag) => /name\s*=\s*["']description["']/i.test(tag)); const viewport = metaTags.some((tag) => /name\s*=\s*["']viewport["']/i.test(tag));
  const headings = [...cleaned.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].slice(0, 30).map((match) => stripTags(match[2])).filter(Boolean); const links = [...cleaned.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].slice(0, 150).map((match) => ({ url: normalizeUrl(match[1], url), text: stripTags(match[2]).slice(0, 160) })).filter((item) => item.url?.startsWith("http"));
  const forms = (cleaned.match(/<form\b/gi) || []).length; const text = stripTags(cleaned).slice(0, maxTextChars); const htmlTag = cleaned.match(/<html\b[^>]*>/i)?.[0] || "";
  return { title, metaDescription: descriptionTag ? attr(descriptionTag, "content") : "", headings, text, links, language: attr(htmlTag, "lang") || null, viewport, forms, canonical: normalizeUrl(attr((cleaned.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i) || [""])[0], "href"), url) };
}

module.exports = { isPrivateIp, validatePublicUrl, fetchPublicUrl, extractPage, normalizeUrl };
