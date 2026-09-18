(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.UNEED_CONTACT_ALERTS = api;
})(typeof window !== "undefined" ? window : null, function () {
  function today(now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
  function dueDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const date = new Date(`${value}T12:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
    for (let days = 0; days < 5;) { date.setUTCDate(date.getUTCDate() + 1); if (![0, 6].includes(date.getUTCDay())) days++; }
    return date.toISOString().slice(0, 10);
  }
  function alertFor(prospect, date = today()) {
    if (prospect.deletedAt || prospect.archivedAt) return null;
    const records = prospect.contactRecords || {};
    let stage, action;
    if (prospect.status === "Mensagem IG enviada" && !records["Follow up WhatsApp"]?.date && !records["Break up por telefone ou WhatsApp"]?.date) { stage = "Mensagem IG enviada"; action = "Follow up"; }
    if (prospect.status === "Follow up WhatsApp" && !records["Break up por telefone ou WhatsApp"]?.date) { stage = "Follow up WhatsApp"; action = "Break up"; }
    if (!stage) return null;
    const sourceDate = records[stage]?.date, due = dueDate(sourceDate);
    if (!due) return null;
    return { stage, action, sourceDate, dueDate: due, due: due <= date, overdue: due < date, key: `${prospect.id}:${stage}:${sourceDate}` };
  }
  return { today, dueDate, alertFor };
});
