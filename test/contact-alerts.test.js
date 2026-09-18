const test = require('node:test');
const assert = require('node:assert/strict');
const { dueDate, alertFor, today } = require('../contact-alerts');
test('five business days skip weekends and survive month/year boundaries', () => {
  assert.equal(dueDate('2026-09-11'), '2026-09-18');
  assert.equal(dueDate('2026-09-12'), '2026-09-18');
  assert.equal(dueDate('2026-12-28'), '2027-01-04');
  assert.equal(dueDate('2026-02-30'), null);
  assert.equal(dueDate(''), null);
  assert.equal(today(new Date('2026-09-18T23:30:00Z')), '2026-09-19');
});
test('backdated contacts become due immediately without changing their date', () => {
  const lead = { id: 'p1', status: 'Mensagem IG enviada', contactRecords: { 'Mensagem IG enviada': { date: '2026-09-10' } } };
  assert.equal(alertFor(lead, '2026-09-16').due, false);
  assert.equal(alertFor(lead, '2026-09-17').due, true);
  assert.equal(alertFor(lead, '2026-09-18').overdue, true);
  assert.equal(lead.contactRecords['Mensagem IG enviada'].date, '2026-09-10');
  lead.contactRecords['Follow up WhatsApp'] = { date: '2026-09-18' };
  assert.equal(alertFor(lead), null);
  lead.status = 'Follow up WhatsApp';
  assert.equal(alertFor(lead, '2026-09-25').action, 'Break up');
  for (const status of ['Cliente ativo', 'Não deu cliente', 'Pediu demonstração', 'Break up por telefone ou WhatsApp']) {
    lead.status = status; assert.equal(alertFor(lead), null);
  }
});
test('notification identity is stable and changes with owner, contact stage or date', () => {
  const { reminderId } = require('../api/contact-alerts');
  assert.equal(reminderId('u1','p1:first:2026-09-11'), reminderId('u1','p1:first:2026-09-11'));
  assert.notEqual(reminderId('u1','p1:first:2026-09-11'), reminderId('u2','p1:first:2026-09-11'));
  assert.notEqual(reminderId('u1','p1:first:2026-09-11'), reminderId('u1','p1:follow:2026-09-11'));
});
test('repeated checks send one internal email and persist the sent receipt', async (t) => {
  const { run } = require('../api/contact-alerts');
  const originalFetch = global.fetch;
  const variables = ['SUPABASE_URL','SUPABASE_SECRET_KEY_V2','RESEND_API_KEY','EMAIL_FROM'];
  const previous = variables.map((key) => process.env[key]);
  variables.forEach((key) => { process.env[key] = key === 'SUPABASE_URL' ? 'https://test.invalid' : 'fixture'; });
  t.after(() => { global.fetch = originalFetch; variables.forEach((key, i) => { if (previous[i] === undefined) delete process.env[key]; else process.env[key] = previous[i]; }); });
  let record, sends = 0;
  const result = (data) => ({ ok: true, status: 200, json: async () => data });
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.resend.com')) { sends++; const body = JSON.parse(options.body); assert.deepEqual(body.to, ['geral@uneed.pt']); assert.doesNotMatch(body.text, /Private Lead|912345678/); assert.ok(options.headers['Idempotency-Key']); return result({ id: 'email1' }); }
    if (url.includes('crm_state?')) return result([{ user_id: 'owner', data: { instagramProspects: [{ id:'lead', name:'Private Lead', phone:'912345678', status:'Mensagem IG enviada', contactRecords:{ 'Mensagem IG enviada': { date:'2020-01-01' } } }] } }]);
    if (options.method === 'POST') { record ||= { ...JSON.parse(options.body), created_at: new Date().toISOString() }; return result([record]); }
    if (options.method === 'PATCH') { Object.assign(record, JSON.parse(options.body)); return result([record]); }
    return result([record]);
  };
  assert.equal((await run('owner')).sent, 1);
  assert.equal((await run('owner')).sent, 0);
  assert.equal(sends, 1);
  assert.equal(record.status, 'contact_sent');
});
