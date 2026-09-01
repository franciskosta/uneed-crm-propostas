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

function cleanVisualText(value, fallback, limit = 60) {
  const clean = String(value || "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s.,!?&+€%\/-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return (clean || fallback).slice(0, limit).trim() || fallback;
}

function inferScenePrompt(niche, brief) {
  const source = `${niche} ${brief}`.toLowerCase();
  if (/barbear|cabeleir|sal[aã]o|beleza|est[eé]tica|unha|spa|clinic/.test(source)) {
    return "premium beauty, salon or barber interior, elegant mirrors, warm practical lights, refined local business atmosphere";
  }
  if (/restaur|caf[eé]|pastel|comida|food|bar|hotel|alojamento/.test(source)) {
    return "premium hospitality interior, tables, ambient lighting, crafted service atmosphere, inviting local venue";
  }
  if (/cl[ií]nic|dent|sa[uú]de|fisi|terap|m[eé]dic/.test(source)) {
    return "modern private clinic interior, clean premium healthcare environment, calm light, professional reception details";
  }
  if (/imobili|condom|constru|obra|arquitet|engenh/.test(source)) {
    return "premium property, architecture and services environment, clean modern building details, professional business atmosphere";
  }
  if (/fitness|gin[aá]sio|personal|pilates|yoga/.test(source)) {
    return "premium fitness studio, elegant training space, modern equipment, energetic but refined mood";
  }
  return "premium local business environment, elegant realistic photography, professional service atmosphere";
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
  const brief = String(body.brief || "").trim().slice(0, 900);
  const visualName = cleanVisualText(name, "Cliente", 60);
  const visualNiche = cleanVisualText(niche, "negócio local", 60);
  const scenePrompt = inferScenePrompt(visualNiche, brief);

  const prompt = [
    "Create one ultra-realistic premium website hero background image only.",
    "This image will be inserted inside laptop and smartphone screens by another renderer, so it must NOT include devices, laptops, phones, UI panels, buttons, cards, text, letters, words, logos, signs, watermarks or brand marks.",
    `Business context: ${visualName}, ${visualNiche}.`,
    `Visual direction: ${scenePrompt}.`,
    brief ? `Additional context to influence the scene subtly: ${brief}.` : "",
    "The image should feel like a premium bespoke website background: cinematic, realistic, high-end, dark enough for a white logo and a red call-to-action button to sit on top, with generous clean negative space near the center/right.",
    "Use shallow depth of field, refined contrast, natural materials or service details related to the business, no people looking at camera, no readable signage, no typography.",
    "Landscape composition, polished commercial photography, elegant shadows, suitable for a Portuguese local business website hero.",
  ].filter(Boolean).join("\n");

  try {
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const response = await fetch("https://api.openai.com/v1/images/generations", {
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
      background: `data:image/jpeg;base64,${imageBase64}`,
      image: `data:image/jpeg;base64,${imageBase64}`,
      source: "openai-background",
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Erro ao contactar a IA." });
  }
};
