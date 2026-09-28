const crypto = require("node:crypto");
const { sendEmail } = require("./kickoff-email");

function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(payload);
}

function sameSecret(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return receivedBuffer.length > 0
    && receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method_not_allowed" });

  const expectedToken = process.env.KICKOFF_EMAIL_TEST_TOKEN;
  const authorization = String(req.headers.authorization || "");
  const receivedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expectedToken || !sameSecret(receivedToken, expectedToken)) {
    return send(res, 401, { ok: false, error: "unauthorized" });
  }

  const recipient = process.env.KICKOFF_NOTIFICATION_TO || "geral@uneed.pt";
  const result = await sendEmail({
    to: recipient,
    subject: "Teste SMTP UNEED concluído",
    text: "Teste técnico concluído. O envio de emails do kickoff UNEED está operacional. Este teste não criou qualquer pedido de kickoff.",
    html: "<!doctype html><html lang=\"pt\"><body style=\"margin:0;background:#f4f5fa;font-family:Arial,Helvetica,sans-serif;color:#15162f\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f4f5fa\"><tr><td align=\"center\" style=\"padding:28px 12px\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#fff;border-radius:22px;overflow:hidden\"><tr><td style=\"background:#15164b;padding:24px 32px;font-size:30px;font-weight:900;color:#fff\">uneed<span style=\"color:#ef3655\">.</span></td></tr><tr><td style=\"padding:34px 32px\"><div style=\"font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#ef3655\">Teste técnico</div><h1 style=\"margin:10px 0 12px;font-size:30px;color:#15164b\">Envio de email operacional</h1><p style=\"margin:0;font-size:16px;line-height:1.65;color:#69718a\">A configuração SMTP do kickoff UNEED enviou esta mensagem com sucesso. Este teste não criou qualquer pedido de cliente.</p></td></tr></table></td></tr></table></body></html>",
  }, "smtp-configuration-test/2026-09-28");

  if (!result.sent) {
    console.error("kickoff_email_test_failed", result.reason);
    return send(res, 502, { ok: false, error: "email_test_failed" });
  }
  return send(res, 200, { ok: true, sent: true });
};

module.exports.sameSecret = sameSecret;
