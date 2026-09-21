const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pending, valid } = require('../manual-reminders');
const reminder = { id: '1', message: 'Ligar à cliente', date: '2026-09-23', time: '' };
const lead = { status: 'Mensagem IG enviada', manualReminders: [reminder] };
test('date-only, old dates and optional Lisbon time', () => {
  assert.equal(pending(lead, new Date('2026-09-22T12:00Z'))[0].due, false);
  assert.equal(pending(lead, new Date('2026-09-23T00:00Z'))[0].due, true);
  assert.equal(pending(lead, new Date('2026-09-24T00:00Z'))[0].overdue, true);
  const timed = { ...lead, manualReminders: [{ ...reminder, time: '14:00' }] };
  assert.equal(pending(timed, new Date('2026-09-23T12:59Z'))[0].due, false);
  assert.equal(pending(timed, new Date('2026-09-23T13:00Z'))[0].due, true);
});
test('completion, lost/deleted leads and stage changes', () => {
  for (const patch of [{ status: 'Não deu cliente' }, { status: 'Por fazer' }, { deletedAt: 'now' }, { archivedAt: 'now' }, { manualReminders: [{ ...reminder, completedAt: 'now' }] }]) assert.deepEqual(pending({ ...lead, ...patch }), []);
  for (const status of ['Follow up WhatsApp', 'Pediu demonstração', 'Cliente ativo']) assert.equal(pending({ ...lead, status }).length, 1);
});
test('validation and multiple reminders sorted', () => {
  for (const patch of [{ message: ' ' }, { date: '2026-02-30' }, { time: '25:00' }]) assert.equal(valid({ ...reminder, ...patch }), false);
  assert.deepEqual(pending({ ...lead, manualReminders: [reminder, { ...reminder, id: '2', date: '2026-09-21' }] }).map(r => r.id), ['2', '1']);
});
