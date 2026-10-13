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
      const expected = new URL(url).searchParams.get('notification_status')?.replace('eq.', '');
      if (expected && stored.notification_status !== expected) return { ok: true, status: 200, json: async () => [] };
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

test('an idempotent retry retries a failed notice once and changed content conflicts', async () => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL, oldSecret = process.env.SUPABASE_SECRET_KEY, oldOwner = process.env.CRM_OWNER_USER_ID;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const normalized = Intake.normalize(base()); const storedPayload = { ...normalized }; delete storedPayload.antiSpam;
  const database = mockDatabase({ id: '11111111-1111-4111-8111-111111111111', reference: 'UNEED-LEAD-1', payload: storedPayload, estimate: normalized.estimate, notification_status: 'failed', updated_at: '2026-10-13T10:00:00Z' });
  global.fetch = database.fetch;
  const emailModule = require('../api/kickoff-email'); const originalSendEmail = emailModule.sendEmail; let sends = 0;
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

test('a thrown notification error never turns a persisted lead into a failed request', async () => {
  const oldFetch = global.fetch, oldUrl = process.env.SUPABASE_URL, oldSecret = process.env.SUPABASE_SECRET_KEY, oldOwner = process.env.CRM_OWNER_USER_ID;
  process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SECRET_KEY = 'secret'; process.env.CRM_OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const database = mockDatabase(); global.fetch = database.fetch;
  const emailModule = require('../api/kickoff-email'); const originalSendEmail = emailModule.sendEmail;
  emailModule.sendEmail = async () => { throw new Error('provider down'); };
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  try {
    const res = response(); await handler(request(), res);
    assert.equal(res.statusCode, 201); assert.equal(res.body.accepted, true); assert.equal(res.body.notification, 'failed');
    assert.equal(database.row().notification_status, 'failed');
  } finally {
    emailModule.sendEmail = originalSendEmail; global.fetch = oldFetch;
    oldUrl === undefined ? delete process.env.SUPABASE_URL : process.env.SUPABASE_URL = oldUrl;
    oldSecret === undefined ? delete process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY = oldSecret;
    oldOwner === undefined ? delete process.env.CRM_OWNER_USER_ID : process.env.CRM_OWNER_USER_ID = oldOwner;
    delete require.cache[require.resolve('../api/lead-intake')];
  }
});

test('object payload size is enforced even without Content-Length', async () => {
  delete require.cache[require.resolve('../api/lead-intake')]; const handler = require('../api/lead-intake');
  const res = response();
  await handler(request(base({ message: 'x'.repeat(handler.MAX_BYTES + 1) })), res);
  assert.equal(res.statusCode, 413); assert.equal(res.body.error.code, 'payload_too_large');
});
