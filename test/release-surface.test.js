const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
test('production release includes prospecting, reminders and kickoff together', () => {
  assert.match(read('index.html'), /data-view="instagram">PROSPEÇÃO/);
  assert.match(read('index.html'), /manual-reminders.js/);
  assert.match(read('index.html'), /customer-model.js/);
  assert.match(read('index.html'), /customer-ui.js/);
  const nav=read('index.html').match(/<nav class="nav-tabs"[\s\S]*?<\/nav>/)[0];
  assert.match(nav, /data-view="settings"[\s\S]*data-view="soundzzzcape"/);
  assert.doesNotMatch(nav, /data-view="(?:command|pipeline|recurring|history)"/);
  for (const file of ['kickoff.html', 'kickoff.css', 'kickoff.js', 'manual-reminders.js', 'contact-alerts.js']) {
    assert.match(read('build-vercel.js'), new RegExp(file.replaceAll('.', '\\.')));
    assert.ok(read(file).length);
  }
  assert.match(read('api/kickoff-email.js'), /nodemailer/);
  assert.ok(JSON.parse(read('vercel.json')).rewrites.some(r => r.source === '/kickoff'));
});
