const nodemailer = require("nodemailer");

let smtpTransporter;

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function paymentLabel(method) {
  return method === "mbway" ? "MB WAY" : "Transferência bancária";
}

function addonLines(payload) {
  if (!payload.addons.length) return ["Nenhum extra selecionado"];
  return payload.addons.map((addon) => {
    const detail = addon.languages?.length ? ` — ${addon.languages.map((item) => item.toUpperCase()).join(", ")}` : addon.quantity > 1 ? ` × ${addon.quantity}` : "";
    const price = addon.subtotal === null ? addon.price : `${addon.subtotal} € / mês`;
    return `${addon.name}${detail} — ${price}`;
  });
}

function paymentRows(payment) {
  if (payment.method === "mbway") return `<tr><td style="padding:7px 0;color:#69718a">Número MB WAY</td><td style="padding:7px 0;text-align:right;font-weight:800;color:#15164b">${escapeHtml(payment.mbway)}</td></tr>`;
  return `<tr><td style="padding:7px 0;color:#69718a">Titular</td><td style="padding:7px 0;text-align:right;font-weight:700;color:#15164b">${escapeHtml(payment.accountName)}</td></tr><tr><td style="padding:7px 0;color:#69718a">IBAN</td><td style="padding:7px 0;text-align:right;font-weight:800;color:#15164b">${escapeHtml(payment.iban)}</td></tr>`;
}

function shell({ preview, eyebrow, title, intro, body }) {
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#f4f5fa;font-family:Arial,Helvetica,sans-serif;color:#15162f"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5fa"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 10px 35px rgba(21,22,75,.10)"><tr><td style="background:#15164b;padding:24px 32px"><div style="font-size:30px;font-weight:900;letter-spacing:-1px;color:#fff">uneed<span style="color:#ef3655">.</span></div></td></tr><tr><td style="padding:34px 32px 18px"><div style="font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#ef3655">${escapeHtml(eyebrow)}</div><h1 style="margin:10px 0 12px;font-size:30px;line-height:1.15;color:#15164b">${escapeHtml(title)}</h1><p style="margin:0;font-size:16px;line-height:1.65;color:#69718a">${escapeHtml(intro)}</p></td></tr><tr><td style="padding:0 32px 34px">${body}</td></tr><tr><td style="padding:22px 32px;background:#f8f8fc;color:#777e94;font-size:12px;line-height:1.6">UNEED · <a href="mailto:geral@uneed.pt" style="color:#15164b">geral@uneed.pt</a><br>Guarde este email para consultar os dados do seu pedido.</td></tr></table></td></tr></table></body></html>`;
}

function customerEmail({ payload, payment, reference }) {
  const extras = addonLines(payload);
  const body = `<div style="margin:22px 0;padding:20px;border:1px solid #e1e3ed;border-radius:16px"><table role="presentation" width="100%" cellspacing="0"><tr><td style="padding:7px 0;color:#69718a">Referência</td><td style="padding:7px 0;text-align:right;font-weight:800;color:#15164b">${escapeHtml(reference)}</td></tr><tr><td style="padding:7px 0;color:#69718a">Plano</td><td style="padding:7px 0;text-align:right;font-weight:700;color:#15164b">${escapeHtml(payload.planName)}</td></tr><tr><td style="padding:7px 0;color:#69718a">Mensalidade</td><td style="padding:7px 0;text-align:right;font-weight:700;color:#15164b">${escapeHtml(payment.subtotalFormatted)} + IVA</td></tr><tr><td style="padding:7px 0;color:#69718a">Total a pagar agora</td><td style="padding:7px 0;text-align:right;font-size:20px;font-weight:900;color:#ef3655">${escapeHtml(payment.totalWithVatFormatted)}</td></tr></table></div><h2 style="margin:24px 0 10px;font-size:19px;color:#15164b">Extras selecionados</h2><ul style="margin:0;padding-left:20px;color:#4f566e;line-height:1.7">${extras.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul><div style="margin:24px 0;padding:20px;background:#fff1f4;border-radius:16px"><h2 style="margin:0 0 10px;font-size:19px;color:#15164b">Dados para pagamento</h2><table role="presentation" width="100%" cellspacing="0"><tr><td style="padding:7px 0;color:#69718a">Método</td><td style="padding:7px 0;text-align:right;font-weight:700;color:#15164b">${paymentLabel(payment.method)}</td></tr>${paymentRows(payment)}<tr><td style="padding:7px 0;color:#69718a">Referência</td><td style="padding:7px 0;text-align:right;font-weight:800;color:#15164b">${escapeHtml(reference)}</td></tr></table></div><div style="margin:24px 0;padding:20px;background:#15164b;border-radius:16px;color:#fff"><h2 style="margin:0 0 12px;font-size:19px">Para iniciarmos o serviço</h2><ol style="margin:0;padding-left:20px;line-height:1.8"><li>Confirmar o pagamento da primeira mensalidade.</li><li>Ativar e validar o débito direto GoCardless.</li><li>Validar toda a informação e conteúdos necessários.</li></ol><p style="margin:14px 0 0;color:#d9d9e8;line-height:1.6">Enviaremos separadamente o link individual GoCardless. O prazo de execução só começa quando estas três condições estiverem concluídas.</p></div><h2 style="margin:24px 0 10px;font-size:19px;color:#15164b">Resumo do que pediu</h2><p style="margin:0 0 8px;color:#69718a;line-height:1.65"><strong style="color:#15164b">Criar ou alterar:</strong> ${escapeHtml(payload.siteChanges)}</p><p style="margin:0;color:#69718a;line-height:1.65"><strong style="color:#15164b">Domínio:</strong> ${escapeHtml([payload.domainStatus, payload.domain].filter(Boolean).join(" — ") || "A definir")}</p>`;
  return {
    subject: `Pedido UNEED recebido — ${reference}`,
    html: shell({ preview: `Resumo e dados de pagamento do pedido ${reference}`, eyebrow: "Pedido recebido", title: `Obrigado, ${payload.contactName}.`, intro: "Recebemos a sua configuração. Abaixo encontra o resumo, os dados para o primeiro pagamento e os próximos passos.", body }),
    text: [`Pedido UNEED recebido — ${reference}`, "", `Olá ${payload.contactName},`, "", `Plano: ${payload.planName}`, `Mensalidade: ${payment.subtotalFormatted} + IVA`, `Total a pagar agora: ${payment.totalWithVatFormatted}`, `Método: ${paymentLabel(payment.method)}`, payment.method === "mbway" ? `MB WAY: ${payment.mbway}` : `Titular: ${payment.accountName}\nIBAN: ${payment.iban}`, `Referência: ${reference}`, "", "Extras:", ...extras.map((line) => `- ${line}`), "", "Para iniciarmos o serviço:", "1. Confirmar o primeiro pagamento.", "2. Ativar e validar o débito direto GoCardless.", "3. Validar toda a informação e conteúdos necessários.", "", "O prazo de execução só começa quando as três condições estiverem concluídas.", "", `O que pretende criar ou alterar: ${payload.siteChanges}`, "", "UNEED · geral@uneed.pt"].join("\n"),
  };
}

function adminEmail({ payload, payment, reference }) {
  const extras = addonLines(payload);
  const body = `<div style="margin:22px 0;padding:20px;border:1px solid #e1e3ed;border-radius:16px;line-height:1.7;color:#4f566e"><strong style="color:#15164b">Negócio:</strong> ${escapeHtml(payload.businessName)}<br><strong style="color:#15164b">Contacto:</strong> ${escapeHtml(payload.contactName)} · ${escapeHtml(payload.phone)} · ${escapeHtml(payload.email)}<br><strong style="color:#15164b">NIF:</strong> ${escapeHtml(payload.taxId || "Por completar")}<br><strong style="color:#15164b">Morada:</strong> ${escapeHtml(payload.billingAddress || "Por completar")}<br><strong style="color:#15164b">Plano:</strong> ${escapeHtml(payload.planName)}<br><strong style="color:#15164b">Total:</strong> ${escapeHtml(payment.totalWithVatFormatted)} (${escapeHtml(payment.subtotalFormatted)} + IVA)<br><strong style="color:#15164b">Pagamento:</strong> ${paymentLabel(payment.method)}<br><strong style="color:#15164b">Extras:</strong> ${escapeHtml(extras.join("; "))}<br><strong style="color:#15164b">Criar/alterar:</strong> ${escapeHtml(payload.siteChanges)}<br><strong style="color:#15164b">Referências:</strong> ${escapeHtml(payload.referenceUrls || "Não indicadas")}<br><strong style="color:#15164b">Notas:</strong> ${escapeHtml(payload.notes || "Sem notas")}</div><div style="padding:18px;background:#fff1f4;border-radius:16px;color:#15164b"><strong>Ação:</strong> confirmar o primeiro pagamento, enviar/validar o mandato GoCardless e validar a informação antes de iniciar o prazo.</div>`;
  return {
    subject: `Novo kickoff — ${payload.businessName} — ${reference}`,
    html: shell({ preview: `Novo pedido ${reference}`, eyebrow: "Novo pedido de ativação", title: payload.businessName, intro: `Pedido guardado como “a aguardar pagamento”. Referência ${reference}.`, body }),
    text: [`Novo kickoff — ${reference}`, `Negócio: ${payload.businessName}`, `Contacto: ${payload.contactName} · ${payload.phone} · ${payload.email}`, `Plano: ${payload.planName}`, `Total: ${payment.totalWithVatFormatted}`, `Pagamento: ${paymentLabel(payment.method)}`, `Extras: ${extras.join("; ")}`, `Criar/alterar: ${payload.siteChanges}`, "", "Ação: confirmar pagamento, validar GoCardless e validar informação antes de iniciar."].join("\n"),
  };
}

async function sendEmail(message, idempotencyKey) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.KICKOFF_EMAIL_FROM || process.env.EMAIL_FROM || user;
  if (!host || !user || !password || !from) return { sent: false, reason: "missing_email_config" };
  try {
    if (!smtpTransporter) {
      smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: String(process.env.SMTP_SECURE || port === 465).toLowerCase() !== "false",
        auth: { user, pass: password },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });
    }
    const messageId = `<${idempotencyKey.replace(/[^a-z0-9/_-]/gi, "-").replaceAll("/", ".")}@uneed.pt>`;
    const result = await smtpTransporter.sendMail({
      from,
      to: message.to,
      replyTo: message.replyTo && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(message.replyTo) ? message.replyTo : process.env.KICKOFF_REPLY_TO || user,
      subject: message.subject,
      html: message.html,
      text: message.text,
      messageId,
    });
    return { sent: true, id: result.messageId };
  } catch (error) {
    return { sent: false, reason: "smtp_unavailable", detail: error.message };
  }
}

module.exports = { adminEmail, customerEmail, sendEmail, shell, escapeHtml };
