const test = require('node:test');
const assert = require('node:assert/strict');
let currentUser;
const runtime = require('../api/_mission-runtime');
runtime.authenticate = async () => currentUser;
const handler = require('../api/soundzzzcape/[...route]');

async function request(method='GET', route='status') {
  const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await handler({method,url:'/api/soundzzzcape/'+route,headers:{},query:{}},res);
  return res;
}

test('Soundzzzcape requires verified owner and never exposes destructive routes', async()=>{
  process.env.SOUNDZZZCAPE_OWNER_EMAILS='owner@example.com';
  delete process.env.SOUNDZZZCAPE_OWNER_IDS;
  delete process.env.SOUNDZZZCAPE_API_URL;
  currentUser=null;
  assert.equal((await request()).code,401);
  currentUser={id:'other',email:'other@example.com',email_confirmed_at:'2026-01-01'};
  assert.equal((await request()).code,403);
  currentUser={id:'owner',email:'owner@example.com'};
  assert.equal((await request()).code,403);
  currentUser.email_confirmed_at='2026-01-01';
  assert.equal((await request()).code,503);
  for(const [method,route] of [['DELETE','runs/abc'],['POST','runs/abc/publish'],['POST','channel'],['GET','../../secrets']]) {
    assert.equal((await request(method,route)).code,405);
  }
  for(const path of ['/status','/channel','/runs/abc','/analytics']) assert.ok(handler.readRoutes.test(path));
  for(const path of ['/autopilot/run','/runs/abc/approve']) assert.ok(handler.writeRoutes.test(path));
});
