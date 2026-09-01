const fs = require("fs");
const path = require("path");

async function verifySession(req) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!supabaseUrl || !anonKey || !token) return null;

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

function isOpenAiAccessError(message) {
  return /does not have access to model|organization must be verified|verify organization|model .*not found/i.test(String(message || ""));
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  return new Blob([bytes], { type: match[1] });
}

function getTemplateBlob() {
  const templatePath = path.join(process.cwd(), "assets", "mockup-template-premium.png");
  if (!fs.existsSync(templatePath)) return null;
  const bytes = fs.readFileSync(templatePath);
  return new Blob([bytes], { type: "image/png" });
}

function rateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxRequests = Number(process.env.OPENAI_MOCKUP_HOURLY_LIMIT || 20);
  globalThis.__uneedMockupRateLimit = globalThis.__uneedMockupRateLimit || new Map();
  const requests = (globalThis.__uneedMockupRateLimit.get(userId) || []).filter((item) => now - item < windowMs);
  if (requests.length >= maxRequests) return false;
  requests.push(now);
  globalThis.__uneedMockupRateLimit.set(userId, requests);
  return true;
}

function cleanVisualText(value, fallback, limit = 34) {
  const clean = String(value || "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s.,!?&+€%\/-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return (clean || fallback).slice(0, limit).trim() || fallback;
}

function inferMockupHeadline(brief, niche) {
  const source = `${brief} ${niche}`.toLowerCase();
  if (/marcaç|marcac|agenda|hor[aá]rio|horario|booking|reserva/.test(source)) return "Marcações online simples";
  if (/whatsapp|contacto|contato|mensagem/.test(source)) return "Contactos mais rápidos";
  if (/site|website|presen|digital/.test(source)) return "Presença digital profissional";
  return "Mais pedidos online";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  const user = await verifySession(req);
  if (!user?.id) {
    res.status(401).json({ error: "É necessário iniciar sessão para gerar mockups por IA." });
    return;
  }
  if (!rateLimit(user.id)) {
    res.status(429).json({ error: "Limite horário de mockups atingido. Tenta novamente mais tarde." });
    return;
  }

  const apiKey = process.env.OPENAI_IMAGE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "OPENAI_IMAGE_API_KEY não configurada na Vercel." });
    return;
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: "Pedido inválido." });
      return;
    }
  }

  const name = String(body.name || "Cliente").trim().slice(0, 80);
  const niche = String(body.niche || "negócio local").trim().slice(0, 120);
  const offer = String(body.offer || "Pedir diagnóstico gratuito").trim().slice(0, 120);
  const brief = String(body.brief || "").trim().slice(0, 900);
  const logoDataUrl = String(body.logoDataUrl || "").trim();
  const visualName = cleanVisualText(name, "Cliente", 34);
  const visualNiche = cleanVisualText(niche, "negócio local", 34);
  const visualCta = cleanVisualText(offer, "Pedir diagnóstico", 22);
  if (logoDataUrl.length > 4_000_000) {
    res.status(413).json({ error: "O logotipo é demasiado pesado. Usa uma imagem mais leve." });
    return;
  }

  const prompt = [
    "Create one ultra-realistic premium landscape advertising mockup image for a digital agency outreach message.",
    "Use the supplied premium device mockup image as the main visual reference. Keep its overall composition: realistic open laptop on the left/center, realistic smartphone on the right, dark matte studio background, premium lighting, elegant shadows and a polished commercial look.",
    "Replace the website shown on the device screens with a clearly different bespoke website concept for this specific client. Keep the devices, perspective, proportions, background mood and premium photographic style close to the reference image, but redesign the screen content from scratch.",
    "Inside the laptop and phone screens, create a premium realistic landing page hero with a large photographic background related to the business area, subtle dark overlay, the client logo, and one red call-to-action button. Use fewer elements, more breathing room and a balanced editorial composition.",
    "The screen design must feel like a finished premium website preview, not a template: strong image-led hero, logo/nav area, one clear CTA button, a few elegant cards or icons below the fold, refined spacing, dark navy, white and red UNEED-style accents.",
    `Client/business name for context: ${visualName}.`,
    `Business area for choosing the hero background image and visual mood: ${visualNiche}.`,
    brief ? `Commercial notes to reflect visually, mostly through layout and icons, not long text: ${brief}.` : "",
    "Use the uploaded client logo image as the actual client logo artwork on the website screens. Preserve the logo identity, proportions, lettering and main visual characteristics as much as possible. Do not redraw or retype the logo unless unavoidable.",
    "If the uploaded logo has a white or noisy background, visually clean/remove the background for the screen design. If contrast requires it, use a clean white or monochrome version inside the screen while keeping the logo recognizable.",
    "TEXT RULES ARE CRITICAL: do not generate headings, paragraphs, menu labels, service labels, chips, subtitles or small readable text inside the website screens. Avoid all Portuguese body copy because distorted text is unacceptable.",
    `The only readable text allowed, apart from the client logo itself, is the CTA button label exactly: "${visualCta}".`,
    "If the CTA label cannot be rendered perfectly, use a red button with a simple white arrow or short white line instead of text.",
    "Represent all other content as realistic UI structure: image blocks, icons, cards, lines, calendars, WhatsApp-style button icons, booking widgets and abstract interface shapes. No pseudo-words, no fake navigation labels, no lorem ipsum, no random accents, no distorted typography.",
    "The phone screen should show a simplified responsive version of the same image-led hero, with logo and CTA only; no cramped text.",
    "No watermarks, no extra brands, no unrelated text. Output a single finished image ready to send by WhatsApp or Instagram DM.",
  ].filter(Boolean).join("\n");

  try {
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const templateBlob = getTemplateBlob();
    const logoBlob = dataUrlToBlob(logoDataUrl);

    async function requestEdit(imageFieldName = "image[]", includeFidelity = true) {
      const form = new FormData();
      form.append("model", imageModel);
      form.append("prompt", prompt);
      if (templateBlob) form.append(imageFieldName, templateBlob, "mockup-template-premium.png");
      if (logoBlob) form.append(imageFieldName, logoBlob, "client-logo.png");
      form.append("quality", process.env.OPENAI_IMAGE_QUALITY || "medium");
      form.append("size", process.env.OPENAI_IMAGE_SIZE || "1536x1024");
      if (includeFidelity) form.append("input_fidelity", "high");
      return fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
      });
    }

    let response;
    if (templateBlob || logoBlob) {
      response = await requestEdit("image[]");
      if (!response.ok && response.status === 400) {
        const firstError = await response.clone().json().catch(() => null);
        const message = firstError?.error?.message || "";
        if (/input_fidelity|unknown parameter|invalid/i.test(message)) {
          response = await requestEdit("image[]", false);
        } else if (/image|file|multipart/i.test(message)) {
          response = await requestEdit("image", true);
          if (!response.ok && response.status === 400) {
            const secondError = await response.clone().json().catch(() => null);
            if (/input_fidelity|unknown parameter|invalid/i.test(secondError?.error?.message || "")) {
              response = await requestEdit("image", false);
            }
          }
        }
      }
    } else {
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: imageModel,
          prompt,
          quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
          size: process.env.OPENAI_IMAGE_SIZE || "1536x1024",
        }),
      });
    }

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || "Não foi possível gerar o mockup por IA.";
      res.status(response.status).json({
        error: message,
        model: imageModel,
        source: "openai",
      });
      return;
    }

    const imageBase64 = data?.data?.[0]?.b64_json || "";
    if (!imageBase64) {
      res.status(502).json({ error: "A IA não devolveu uma imagem." });
      return;
    }

    res.status(200).json({
      image: `data:image/jpeg;base64,${imageBase64}`,
      source: "openai",
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Erro ao contactar a IA." });
  }
};
