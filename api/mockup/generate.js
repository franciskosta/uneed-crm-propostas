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

function findGeneratedImage(output) {
  if (!Array.isArray(output)) return "";
  for (const item of output) {
    if (item?.type === "image_generation_call" && item.result) return item.result;
    if (!Array.isArray(item?.content)) continue;
    for (const content of item.content) {
      if (content?.type === "output_image" && content.image_base64) return content.image_base64;
      if (content?.type === "image" && content.image_base64) return content.image_base64;
    }
  }
  return "";
}

function makeImageTool() {
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const tool = {
    type: "image_generation",
    model: imageModel,
    quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
    size: process.env.OPENAI_IMAGE_SIZE || "1536x1024",
    output_format: "jpeg",
  };
  if (!imageModel.includes("mini")) tool.input_fidelity = "high";
  return tool;
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "OPENAI_API_KEY não configurada na Vercel." });
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
  if (logoDataUrl.length > 4_000_000) {
    res.status(413).json({ error: "O logotipo é demasiado pesado. Usa uma imagem mais leve." });
    return;
  }

  const prompt = [
    "Create one premium landscape marketing mockup image for a digital agency outreach message.",
    "Visual style: realistic laptop and smartphone mockup on a dark elegant studio background, premium lighting, sharp product-advertising composition, similar to a modern SaaS website presentation.",
    "The laptop and smartphone screens must show a bespoke modern landing page concept for the client's business.",
    `Client/business name: ${name}.`,
    `Business area: ${niche}.`,
    `Primary CTA shown on the website: ${offer}.`,
    brief ? `Commercial notes to reflect subtly in the website concept: ${brief}.` : "",
    "Use the uploaded image as the client logo on the website screens. Preserve the logo identity, proportions, lettering and main visual characteristics as much as possible.",
    "If the uploaded logo has a white or noisy background, remove or visually clean the background for the mockup.",
    "If contrast requires it, create a white or monochrome version of the uploaded logo only inside the screen design, while keeping it recognizable.",
    "Make the screen UI look like a real high-quality website, not a flat wireframe. Include a hero section, clear CTA, and a few elegant service/benefit blocks.",
    "Visible text should be minimal and in Portuguese. Do not invent another brand name. Do not add watermarks.",
    "Output a single finished image ready to send by WhatsApp or Instagram DM.",
  ].filter(Boolean).join("\n");

  const content = [{ type: "input_text", text: prompt }];
  if (logoDataUrl.startsWith("data:image/")) {
    content.push({ type: "input_image", image_url: logoDataUrl, detail: "high" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-5",
        input: [{ role: "user", content }],
        tools: [makeImageTool()],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || "Não foi possível gerar o mockup por IA." });
      return;
    }

    const imageBase64 = findGeneratedImage(data.output);
    if (!imageBase64) {
      res.status(502).json({ error: "A IA não devolveu uma imagem." });
      return;
    }

    res.status(200).json({
      image: `data:image/jpeg;base64,${imageBase64}`,
      source: "openai",
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Erro ao contactar a IA." });
  }
};
