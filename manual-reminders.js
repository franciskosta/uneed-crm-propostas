(function (root) {
  function clock(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
  }
  function enabled(p) { return !p.deletedAt && !p.archivedAt && p.status !== 'Não deu cliente' && p.status !== 'Por fazer'; }
  function valid(r) {
    if (!r.message?.trim() || r.message.length > 2000 || !/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) return false;
    const d = new Date(`${r.date}T12:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === r.date && (!r.time || /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time));
  }
  function pending(p, now = new Date()) {
    if (!enabled(p)) return [];
    const c = clock(now);
    return (p.manualReminders || []).filter(r => !r.completedAt && valid(r)).map(r => ({ ...r, due: r.date < c.date || (r.date === c.date && (!r.time || r.time <= c.time)), overdue: r.date < c.date || (r.date === c.date && !!r.time && r.time < c.time) })).sort((a,b) => `${a.date}${a.time || '00:00'}`.localeCompare(`${b.date}${b.time || '00:00'}`));
  }
  const api = { clock, enabled, valid, pending };
  if (typeof module !== 'undefined') module.exports = api;
  if (root) root.UNEED_REMINDERS = api;
})(typeof window !== 'undefined' ? window : null);
