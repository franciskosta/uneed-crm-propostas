function supportSupabaseClient() {
  const config = window.UNEED_SUPABASE || {};
  if (!config.url || !config.anonKey || !window.supabase) return null;
  return window.supabase.createClient(config.url, config.anonKey);
}

function ticketCode() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UNEED-${stamp}-${suffix}`;
}

function value(id) {
  return document.querySelector(id).value.trim();
}

function setStatus(message, tone = "neutral") {
  const status = document.querySelector("#supportStatus");
  status.textContent = message;
  status.dataset.tone = tone;
}

document.querySelector("#supportForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  setStatus("A enviar pedido...");

  const payload = {
    code: ticketCode(),
    client_name: value("#supportName"),
    company_name: value("#supportCompany"),
    email: value("#supportEmail"),
    phone: value("#supportPhone"),
    project_url: value("#supportProjectUrl"),
    category: value("#supportCategory"),
    priority: value("#supportPriority"),
    status: "Novo",
    subject: value("#supportSubject"),
    message: value("#supportMessage"),
  };

  try {
    const client = supportSupabaseClient();
    if (!client) throw new Error("Supabase não configurado.");
    const { error } = await client.from("support_tickets").insert(payload);
    if (error) throw error;
    document.querySelector("#supportForm").reset();
    setStatus(`Pedido enviado com sucesso. Código do ticket: ${payload.code}`, "success");
  } catch (error) {
    setStatus("Não foi possível enviar o pedido. Por favor envie email para geral@uneed.pt.", "error");
  } finally {
    button.disabled = false;
  }
});
