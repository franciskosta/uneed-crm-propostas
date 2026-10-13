const { test } = require('node:test');
const assert = require('node:assert/strict');
const Intake = require('../lead-intake');

function base(overrides = {}) {
  return {
    schemaVersion: 'lead-intake-v1', idempotencyKey: '12345678-1234-4234-9234-123456789012',
    origin: 'uneed.pt', product: 'uneed',
    contact: { name: 'Francisco', email: 'francisco@example.pt', phone: '' },
    business: { name: 'Empresa', sector: 'Serviços', website: 'https://example.pt' },
    message: 'Quero falar sobre o projeto.', configuration: { need: 'other' },
    consent: { privacy: true, privacyVersion: '2026-10-13' },
    context: { pageUrl: 'https://uneed.pt/', utm: {} }, antiSpam: { website: '' }, ...overrides,
  };
}

test('360 prices are recalculated server-side and a general CTA does not invent a model', () => {
  const configured = Intake.normalize(base({ product: 'uneed_360', configuration: { model: 'subscription', modules: ['clientes','propostas'], clientEstimate: { initial: 1, monthly: 1, firstYear: 1 } } }));
  assert.deepEqual(configured.estimate, { currency: 'EUR', vatIncluded: false, initial: 850, monthly: 77, firstYear: 1774, priceStatus: 'estimated', clientEstimateMismatch: true });
  const general = Intake.normalize(base({ product: 'uneed_360', configuration: { need: 'team', modules: [] } }));
  assert.equal(general.configuration.model, null);
  assert.equal(general.estimate.priceStatus, 'requires_quote');
});

test('Presence applies current prices, quantities, languages and compatibility rules', () => {
  const payload = Intake.normalize(base({ origin: 'presenca.uneed.pt', product: 'uneed_presence', configuration: { plan: 'start', presenceNeed: 'booking', addons: [{ key: 'email_extra', quantity: 2 }, { key: 'idioma_extra', languages: ['EN','ES'], quantity: 99 }, { key: 'avaliacoes' }], clientEstimate: { monthly: 56 } } }));
  assert.equal(payload.estimate.initial, 0);
  assert.equal(payload.estimate.monthly, 66);
  assert.equal(payload.configuration.addons[1].quantity, 2);
  assert.throws(() => Intake.normalize(base({ origin: 'presenca.uneed.pt', product: 'uneed_presence', configuration: { plan: 'start', presenceNeed: 'contact', addons: [{ key: 'sms_100' }] } })), /compatível/);
});

test('contact, consent and origin are validated without accepting client prices', () => {
  assert.throws(() => Intake.normalize(base({ contact: { name: 'A', email: '', phone: '' } })), (error) => error.code === 'validation_failed' && error.fields.includes('contact.email_or_phone'));
  assert.throws(() => Intake.normalize(base({ origin: 'evil.example' })), (error) => error.fields.includes('origin'));
  assert.throws(() => Intake.normalize(base({ consent: { privacy: true, privacyVersion: 'old' } })), (error) => error.fields.includes('consent.privacyVersion'));
});

test('different requests from the same contact remain different prospect cards', () => {
  const state = { instagramProspects: [] };
  const payload = Intake.normalize(base());
  const rows = [
    { id: '11111111-1111-4111-8111-111111111111', reference: 'UNEED-LEAD-1', payload, estimate: payload.estimate, created_at: '2026-10-13T10:00:00Z' },
    { id: '22222222-2222-4222-8222-222222222222', reference: 'UNEED-LEAD-2', payload: { ...payload, message: 'Segundo pedido' }, estimate: payload.estimate, created_at: '2026-10-13T11:00:00Z' },
  ];
  assert.equal(Intake.mergeRows(state, rows).length, 2);
  assert.equal(Intake.mergeRows(state, rows).length, 0);
  assert.equal(state.instagramProspects.length, 2);
  assert.notEqual(state.instagramProspects[0].sourceIntakeId, state.instagramProspects[1].sourceIntakeId);
});

test('SMTP receipt requires an accepted recipient and records only aggregate delivery evidence', () => {
  const { smtpReceipt } = require('../kickoff-email');
  assert.deepEqual(smtpReceipt({ messageId: 'm1', accepted: ['recipient@example.pt'], rejected: [], pending: [] }), {
    sent: true, id: 'm1', acceptedCount: 1, rejectedCount: 0, pendingCount: 0,
  });
  assert.deepEqual(smtpReceipt({ messageId: 'm2', accepted: [], rejected: ['recipient@example.pt'] }), {
    sent: false, reason: 'smtp_rejected', acceptedCount: 0, rejectedCount: 1, pendingCount: 0,
  });
});

function response() {
  return { statusCode: 0, headers: {}, setHeader(k,v){this.headers[k]=v;}, status(code){this.statusCode=code;return this;}, json(body){this.body=body;return this;}, end(){return this;} };
}

function mockDatabase(seed = null) {
  let stored = seed;
  const calls = [];
  const fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ url, method, body });
    if (method === 'GET' && url.includes('origin=eq.')) return { ok: true, status: 200, json: async () => stored ? [stored] : [] };
    if (method === 'GET') return { ok: true, status: 200, json: async () => [] };
    if (method === 'POST') { stored ||= body; return { ok: true, status: 201, json: async () => [stored] }; }
    if (method === 'PATCH') {
      const params = new URL(url).searchParams;
      for (const field of ['admin_notification_status', 'customer_notification_status', 'notification_status']) {
        const expected = params.get(field)?.replace('eq.', '');
        if (expected && stored[field] !== expected) return { ok: true, status: 200, json: async () => [] };
      }
      stored = { ...stored, ...body };
      return { ok: true, status: 200, json: async () => [stored] };
    }
    throw new Error(`Unexpected ${method}`);
  };
  return { fetch, calls, row: () => stored };
}

function request(body = base(), origin = 'https://uneed.pt') {
  return { method: 'POST', headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' }, body };
}

test('public endpoint persists before notification failure and rejects unapproved origins', async () => {
  const oldFetch = global.fetch;
  const oldEnv = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY, CRM_OWNER_USER_ID: process.env.CRM_OWNER_USER_ID, SMTP_HOST: process.env.SMTP_HOST, SMTP_USER: process.env.SMTP_USER, SMTP_PASSWORD: process.env.SMTP_PASSWORD };
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  delete process.env.SMTP_HOST; delete process.env.SMTP_USER; delete process.env.SMTP_PASSWORD;
  const database = mockDatabase(); global.fetch = database.fetch;
  delete require.cache[require.resolve('../api/lead-intake')];
  const handler = require('../api/lead-intake');
  try {
    const res = response(); await handler(request(), res);
    assert.equal(res.statusCode, 201); assert.equal(res.body.accepted, true); assert.equal(res.body.notification, 'failed');
    assert.ok(database.calls.find((call) => call.method === 'POST' && call.url.includes('lead_intake_requests')));
    assert.equal(database.row().notification_status, 'failed');
    const forbidden = response(); await handler(request(base(), 'https://evil.example'), forbidden);
    assert.equal(forbidden.statusCode, 403);
  } finally {
    global.fetch = oldFetch;
    for (const [key, value] of Object.entries(oldEnv)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
});

test('honeypot never returns a false accepted receipt or writes a lead', async () => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL, oldSecret = process.env.SUPABASE_SECRET_KEY, oldOwner = process.env.CRM_OWNER_USER_ID;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const database = mockDatabase(); global.fetch = database.fetch;
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  try {
    const res = response();
    await handler(request(base({ antiSpam: { website: '1' } })), res);
    assert.equal(res.statusCode, 422);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error.code, 'anti_spam_triggered');
    assert.deepEqual(res.body.error.fields, ['antiSpam.website']);
    assert.equal(database.calls.length, 0);
  } finally {
    global.fetch = oldFetch;
    oldUrl === undefined ? delete process.env.SUPABASE_URL : process.env.SUPABASE_URL = oldUrl;
    oldSecret === undefined ? delete process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY = oldSecret;
    oldOwner === undefined ? delete process.env.CRM_OWNER_USER_ID : process.env.CRM_OWNER_USER_ID = oldOwner;
    delete require.cache[require.resolve('../api/lead-intake')];
  }
});

test('an idempotent retry retries a failed notice once and changed content conflicts', async () => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL, oldSecret = process.env.SUPABASE_SECRET_KEY, oldOwner = process.env.CRM_OWNER_USER_ID;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const normalized = Intake.normalize(base()); const storedPayload = { ...normalized }; delete storedPayload.antiSpam;
  const database = mockDatabase({ id: '11111111-1111-4111-8111-111111111111', reference: 'UNEED-LEAD-1', payload: storedPayload, estimate: normalized.estimate, notification_status: 'failed', admin_notification_status: 'failed', customer_notification_status: 'not_applicable', updated_at: '2026-10-13T10:00:00Z' });
  global.fetch = database.fetch;
  const emailModule = require('../kickoff-email'); const originalSendEmail = emailModule.sendEmail; let sends = 0;
  emailModule.sendEmail = async () => { sends += 1; return { sent: true, id: 'mail-1' }; };
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  try {
    const retried = response(); await handler(request(), retried);
    assert.equal(retried.statusCode, 200); assert.equal(retried.body.duplicate, true); assert.equal(retried.body.notification, 'sent'); assert.equal(sends, 1);
    const repeated = response(); await handler(request(), repeated);
    assert.equal(repeated.statusCode, 200); assert.equal(sends, 1);
    const changed = response(); await handler(request(base({ message: 'Conteúdo diferente' })), changed);
    assert.equal(changed.statusCode, 409); assert.equal(changed.body.error.code, 'idempotency_conflict');
  } finally {
    emailModule.sendEmail = originalSendEmail; global.fetch = oldFetch;
    oldUrl === undefined ? delete process.env.SUPABASE_URL : process.env.SUPABASE_URL = oldUrl;
    oldSecret === undefined ? delete process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY = oldSecret;
    oldOwner === undefined ? delete process.env.CRM_OWNER_USER_ID : process.env.CRM_OWNER_USER_ID = oldOwner;
    delete require.cache[require.resolve('../api/lead-intake')];
  }
});

test('an ambiguous notification error never turns a persisted lead into a failed request or an automatic retry', async () => {
  const oldFetch = global.fetch, oldUrl = process.env.SUPABASE_URL, oldSecret = process.env.SUPABASE_SECRET_KEY, oldOwner = process.env.CRM_OWNER_USER_ID;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const database = mockDatabase(); global.fetch = database.fetch;
  const emailModule = require('../kickoff-email'); const originalSendEmail = emailModule.sendEmail;
  emailModule.sendEmail = async () => { throw new Error('provider down'); };
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  try {
    const res = response(); await handler(request(), res);
    assert.equal(res.statusCode, 201); assert.equal(res.body.accepted, true); assert.equal(res.body.notification, 'unknown');
    assert.equal(database.row().notification_status, 'sending');
    const retry = response(); await handler(request(), retry);
    assert.equal(retry.statusCode, 200); assert.equal(retry.body.notification, 'unknown');
  } finally {
    emailModule.sendEmail = originalSendEmail; global.fetch = oldFetch;
    oldUrl === undefined ? delete process.env.SUPABASE_URL : process.env.SUPABASE_URL = oldUrl;
    oldSecret === undefined ? delete process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY = oldSecret;
    oldOwner === undefined ? delete process.env.CRM_OWNER_USER_ID : process.env.CRM_OWNER_USER_ID = oldOwner;
    delete require.cache[require.resolve('../api/lead-intake')];
  }
});

test('admin and customer emails have independent states and retry never duplicates an accepted email', async () => {
  const oldFetch = global.fetch, oldUrl = process.env.SUPABASE_URL, oldSecret = process.env.SUPABASE_SECRET_KEY, oldOwner = process.env.CRM_OWNER_USER_ID;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const database = mockDatabase(); global.fetch = database.fetch;
  const emailModule = require('../kickoff-email'); const originalSendEmail = emailModule.sendEmail;
  const sends = [];
  emailModule.sendEmail = async (message, key) => {
    sends.push({ to: message.to, key });
    if (key.endsWith('/customer') && sends.filter((item) => item.key === key).length === 1) return { sent: false, reason: 'smtp_rejected' };
    return { sent: true, id: `mail-${sends.length}`, acceptedCount: 1, rejectedCount: 0, pendingCount: 0 };
  };
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  try {
    const first = response(); await handler(request(), first);
    assert.equal(first.statusCode, 201); assert.equal(first.body.accepted, true);
    assert.deepEqual(first.body.notifications, { admin: 'sent', customer: 'failed' });
    assert.equal(database.row().admin_notification_status, 'sent');
    assert.equal(database.row().customer_notification_status, 'failed');
    assert.equal(sends.filter((item) => item.key.endsWith('/admin')).length, 1);
    assert.equal(sends.filter((item) => item.key.endsWith('/customer')).length, 1);

    const retry = response(); await handler(request(), retry);
    assert.equal(retry.statusCode, 200); assert.deepEqual(retry.body.notifications, { admin: 'sent', customer: 'sent' });
    assert.equal(sends.filter((item) => item.key.endsWith('/admin')).length, 1);
    assert.equal(sends.filter((item) => item.key.endsWith('/customer')).length, 2);
  } finally {
    emailModule.sendEmail = originalSendEmail; global.fetch = oldFetch;
    oldUrl === undefined ? delete process.env.SUPABASE_URL : process.env.SUPABASE_URL = oldUrl;
    oldSecret === undefined ? delete process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY = oldSecret;
    oldOwner === undefined ? delete process.env.CRM_OWNER_USER_ID : process.env.CRM_OWNER_USER_ID = oldOwner;
    delete require.cache[require.resolve('../api/lead-intake')];
  }
});

test('a request without email only notifies UNEED and customer copy stays not applicable', async () => {
  const oldFetch = global.fetch, oldUrl = process.env.SUPABASE_URL, oldSecret = process.env.SUPABASE_SECRET_KEY, oldOwner = process.env.CRM_OWNER_USER_ID;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const database = mockDatabase(); global.fetch = database.fetch;
  const emailModule = require('../kickoff-email'); const originalSendEmail = emailModule.sendEmail; const sends = [];
  emailModule.sendEmail = async (message, key) => { sends.push({ message, key }); return { sent: true, id: 'mail-admin', acceptedCount: 1 }; };
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  try {
    const input = base({ contact: { name: 'Francisco', email: '', phone: '+351 934 419 375' } });
    const res = response(); await handler(request(input), res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body.notifications, { admin: 'sent', customer: 'not_applicable' });
    assert.equal(sends.length, 1); assert.ok(sends[0].key.endsWith('/admin'));
  } finally {
    emailModule.sendEmail = originalSendEmail; global.fetch = oldFetch;
    oldUrl === undefined ? delete process.env.SUPABASE_URL : process.env.SUPABASE_URL = oldUrl;
    oldSecret === undefined ? delete process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY = oldSecret;
    oldOwner === undefined ? delete process.env.CRM_OWNER_USER_ID : process.env.CRM_OWNER_USER_ID = oldOwner;
    delete require.cache[require.resolve('../api/lead-intake')];
  }
});

test('customer receipt is factual and does not imply an order or contract', () => {
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  const payload = Intake.normalize(base()); const row = { reference: 'UNEED-LEAD-TESTE', payload, estimate: payload.estimate };
  const message = handler.customerEmailFor(row);
  assert.equal(message.to, 'francisco@example.pt');
  assert.match(message.text, /UNEED-LEAD-TESTE/);
  assert.match(message.text, /Recebemos o teu pedido/);
  assert.match(message.text, /Pedido: Uneed/);
  assert.doesNotMatch(message.text, /uneed_presence|uneed_360/);
  assert.match(message.text, /confirma apenas a receção/i);
  assert.match(message.text, /não constitui uma encomenda, adjudicação ou contrato/i);
});

test('customer receipt translates Presence and 360 configuration into commercial labels', () => {
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  const presence = Intake.normalize(base({ origin: 'presenca.uneed.pt', product: 'uneed_presence', configuration: { plan: 'start', presenceNeed: 'booking', addons: [] } }));
  const presenceMessage = handler.customerEmailFor({ reference: 'PRESENCE-1', payload: presence, estimate: presence.estimate });
  assert.match(presenceMessage.text, /Pedido: Uneed Presença/);
  assert.match(presenceMessage.text, /Opção: Marcações online/);
  assert.doesNotMatch(presenceMessage.text, /uneed_presence|booking/);

  const threeSixty = Intake.normalize(base({ product: 'uneed_360', configuration: { model: 'subscription', modules: ['clientes', 'propostas'] } }));
  const threeSixtyMessage = handler.customerEmailFor({ reference: '360-1', payload: threeSixty, estimate: threeSixty.estimate });
  assert.match(threeSixtyMessage.text, /Pedido: Uneed 360º/);
  assert.match(threeSixtyMessage.text, /Opção: Subscrição/);
  assert.match(threeSixtyMessage.text, /Módulos indicados: Clientes e CRM, Propostas e orçamentos/);
  assert.doesNotMatch(threeSixtyMessage.text, /uneed_360|clientes, propostas/);
});

test('general request receipt does not promise that an inapplicable price will be confirmed', () => {
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  const payload = Intake.normalize(base());
  const message = handler.customerEmailFor({ reference: 'GENERAL-1', payload, estimate: payload.estimate });
  assert.doesNotMatch(message.text, /valor|preço|confirmad/i);
});

test('object payload size is enforced even without Content-Length', async () => {
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  const res = response();
  await handler(request(base({ message: 'x'.repeat(handler.MAX_BYTES + 1) })), res);
  assert.equal(res.statusCode, 413); assert.equal(res.body.error.code, 'payload_too_large');
});
