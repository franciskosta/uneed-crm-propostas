const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../kickoffs/model');
const {makeHandler}=require('../api/kickoffs');
const {repository}=require('../kickoffs/store');
const {commercialCatalog}=require('../kickoff-catalog');
const {compose}=require('../kickoffs/emails');
const fs=require('node:fs');
const base=()=>({product:'presenca',plan:'presenca-essencial',company:'Empresa teste',contact:'Contacto teste',phone:'910000000',email:'teste@example.com',vat:23,retention:0,initialBase:39,paymentMethod:'bank_transfer',requiresDebit:true,requiresContent:true});
test('gallery templates resolve to existing plans and trusted optional prices',()=>{
  const T=require('../kickoff-templates');for(const t of T.templates){const r=M.createTemplate('owner',t.id,'Negócio');assert.equal(r.data.offer.paymentMethod,'mbway');assert.equal(r.data.offer.addons.length,0);}
  const r=M.createTemplate('owner','presenca-vet','Clínica');M.selectTemplateAddons(r,[{id:'management-metrics',unitPrice:0}]);
  assert.equal(r.data.offer.total.base,51);assert.equal(r.data.offer.initial.net,62.73);assert.equal(r.data.checks.payment,false);
  assert.throws(()=>M.selectTemplateAddons(r,[{id:'cards'}]));assert.throws(()=>M.selectTemplateAddons(r,[{id:'extra-language',languages:[]}]));
  M.selectTemplateAddons(r,[{id:'extra-email',quantity:2},{id:'extra-language',languages:['en','fr']}]);assert.equal(r.data.offer.total.base,61);
  r.data.submittedAt='now';assert.throws(()=>M.selectTemplateAddons(r,[]),/já foi enviado/);
  assert.throws(()=>M.selectTemplateAddons(M.create('owner',base()),[]),/condições acordadas/);
});
test('name-only creation is authenticated, retry-safe and does not send invitations',async()=>{
  const f=fixture(),b={action:'create-template',templateId:'presenca-vet',company:'Clínica',requestId:require('node:crypto').randomUUID()};
  assert.equal((await f.call(b,null,'POST',false)).status,401);
  const a=await f.call(b),retry=await f.call(b);assert.equal(a.status,201);assert.equal(retry.url,a.url);assert.equal(f.rows.size,1);assert.equal(f.mails.length,0);
  assert.equal(a.kickoff.data.offer.email,'');assert.equal((await f.call({...b,company:'Outro'})).status,409);
});
test('template submission persists metrics amount and sends reply-ready notifications once',async()=>{
  const f=fixture(),r=M.createTemplate('owner','presenca-geral','Negócio'),token=M.issue(r,f.repo.cfg.secret);r.updated_at='2020-01-01';await f.repo.insert(r);
  const b={action:'submit',revision:1,stage:6,addons:[{id:'management-metrics',unitPrice:0}],answers:{businessName:'Negócio',contact:'Teste',email:'cliente@example.com',phone:'910000000',taxId:'123456789',billingAddress:'Rua de teste',accepted:true}};
  const result=await f.call(b,token);assert.equal(result.status,200);assert.equal(result.kickoff.offer.initial.net,62.73);assert.equal(result.kickoff.notifications.customer,'accepted');
  assert.equal(f.mails[1].replyTo,'cliente@example.com');assert.match(f.mails[1].text,/GoCardless/);assert.match(f.mails[0].text,/62,73/);assert.equal(result.kickoff.checks.payment,false);
  await f.call(b,token);assert.equal(f.mails.length,2);
});
test('template submission requires complete billing and contact data but drafts remain available',async()=>{
  const f=fixture(),r=M.createTemplate('owner','presenca-geral','Negócio'),token=M.issue(r,f.repo.cfg.secret);r.updated_at='2020-01-01';await f.repo.insert(r);
  const b={action:'submit',revision:1,answers:{businessName:'Negócio',contact:'Teste',email:'cliente@example.com',accepted:true}};
  const result=await f.call(b,token);assert.equal(result.status,400);assert.match(result.error,/telefone, NIF, morada/);assert.equal(f.mails.length,0);assert.equal(f.rows.get(r.id).data.submittedAt,undefined);
  assert.equal((await f.call({...b,action:'save'},token)).status,200);
});
test('kickoff can be prepared before collecting contact and billing details',()=>{
  const row=M.create('owner',{...base(),contact:'',email:'',phone:'',taxId:'',billingAddress:'',niche:'veterinaria'});
  assert.equal(row.data.answers.businessName,'Empresa teste');
  assert.equal(row.data.answers.contact,'');assert.equal(row.data.offer.total.base,39);
  assert.ok(M.issue(row,'test'));assert.throws(()=>M.offer({...base(),email:'invalid'}),/Email/);
});
test('intake whitelists sector data and permits incomplete drafts without commercial mutation',()=>{
  const a=M.answers({sectorNotes:'Urgências até às 20h',contentHelp:true,businessName:'Negócio',email:'a@',taxId:'123',basePrice:0},false);
  assert.equal(a.sectorNotes,'Urgências até às 20h');assert.equal(a.contentHelp,true);assert.equal(a.taxId,'123');assert.equal(a.basePrice,undefined);
  assert.throws(()=>M.answers(a),/NIF/);
});
test('sector templates and pending checklist distinguish intake from execution approval',()=>{
  const I=require('../kickoff-intake');assert.equal(I.nicheKey('Clínicas veterinárias'),'veterinaria');assert.equal(I.nicheKey('Cabeleireiros'),'cabeleireiro');assert.equal(I.nicheKey('Outro negócio'),'geral');
  const row=M.create('owner',base());row.data.answers.contentHelp=true;
  assert.ok(I.pending(row.data).includes('NIF'));assert.ok(I.pending(row.data).includes('Apoio UNEED na preparação dos conteúdos'));
  row.data.submittedAt='now';assert.equal(M.complete(row),false);
});
function fixture() {
  const rows=new Map();let mails=[];
  const repo={cfg:{secret:'test-secret-not-production'},
    async authenticate(req){if(req.headers.authorization!=='Bearer test')M.fail('Unauthorized',401);return 'owner';},
    async request(){return [{data:{brand:{name:'UNEED',iban:'PT-TEST',mbway:'910000000'}}}];},
    async get(id,owner){const r=rows.get(id);return r&&(!owner||r.owner_id===owner)?structuredClone(r):undefined;},
    async byToken(hash){return structuredClone([...rows.values()].find(x=>x.token_hash===hash));},
    async list(owner){return structuredClone([...rows.values()].filter(x=>x.owner_id===owner));},
    async insert(r){rows.set(r.id,structuredClone(r));return structuredClone(r);},
    async save(row,version){const old=rows.get(row.id);if(old.revision!==version)M.fail('Conflict',409);row={...row,revision:version+1};rows.set(row.id,structuredClone(row));return structuredClone(row);}
  };
  const handler=makeHandler(repo,async message=>{mails.push(message);return {sent:true};});
  async function call(body,token,method='POST',authorized=true){let result;const res={setHeader(){},status(status){this.code=status;return this;},json(data){result={status:this.code,...data};return result;}};await handler({method,body,headers:{'x-real-ip':M.hash(Math.random().toString()),...(authorized?{authorization:'Bearer test'}:{}),...(token?{'x-kickoff-token':token}:{})}},res);return result;}
  async function linked(){let r=M.create('owner',base());const token=M.issue(r,repo.cfg.secret);r.updated_at='2020-01-01T00:00:00Z';await repo.insert(r);return {r,token};}
  return {repo,rows,mails,call,linked};
}
test('catalog reuse preserves all original plans and server prices',()=>{for(const [product,c] of Object.entries(commercialCatalog))for(const [plan,p] of Object.entries(c.plans)){const o=M.offer({...base(),product,plan});assert.equal(o.total.base,p.price);}});
test('legacy kickoff still uses the unchanged shared catalog',()=>{const {normalizePayload}=require('../api/kickoff');const p=normalizePayload({product:'marcacoes',plan:'bookings-pro-monthly',addons:[{id:'extra-email',quantity:2}]});assert.equal(p.baseMonthlyPrice,99);assert.equal(p.estimatedMonthlyPrice,111);});
test('public opening records only one event and refreshed revision',async()=>{const f=fixture(),{token}=await f.linked();const a=await f.call({action:'open'},token),b=await f.call({action:'open'},token);assert.equal(a.kickoff.revision,b.kickoff.revision);assert.equal([...f.rows.values()][0].data.events.filter(x=>x.type==='public_page_opened').length,1);});
test('fiscal totals use client VAT and retention, not fixed 23 percent',()=>{const o=M.offer({...base(),vat:6,retention:25,basePrice:100,initialBase:50,addons:[]});assert.deepEqual(o.total,{base:100,vat:6,retention:25,total:106,net:81});assert.equal(o.initial.net,40.5);assert.equal(M.offer({...base(),vat:0}).total.net,39);});
test('quantities and languages recalculate server-side ignoring claimed totals',()=>{const o=M.offer({...base(),addons:[{id:'extra-email',quantity:3},{id:'extra-language',languages:['en','fr']}],total:{net:0}});assert.equal(o.total.base,67);});
test('pending prices, negative values, invalid plans, addons and languages are refused',()=>{for(const input of [{initialBase:''},{vat:-1},{plan:'unknown'},{addons:[{id:'cards'}]},{addons:[{id:'sms',unitPrice:1}]},{addons:[{id:'extra-language',languages:['xx']}]},{addons:[{id:'extra-email',quantity:1.5}]}])assert.throws(()=>M.offer({...base(),...input}));});
test('GoCardless URL validation excludes arbitrary hosts, scripts and lookalikes',()=>{for(const u of ['javascript:alert(1)','https://gocardless.com.evil.test','https://user@gocardless.com','http://gocardless.com'])assert.throws(()=>M.offer({...base(),gocardless:u}));assert.equal(M.offer({...base(),gocardless:'https://pay.gocardless.com/test'}).gocardless,'https://pay.gocardless.com/test');});
test('token encrypted at rest and public projection hides notes and CRM links',()=>{const row=M.create('owner',{...base(),internalNotes:'SECRET',proposalId:'crm-private'});const token=M.issue(row,'key');assert.equal(M.reveal(row,'key'),token);assert.equal(row.token_hash,M.hash(token));assert.ok(!JSON.stringify(row).includes(token));const view=JSON.stringify(M.publicView(row));assert.ok(!view.includes('SECRET'));assert.ok(!view.includes('crm-private'));assert.ok(!view.includes('tokenCipher'));assert.throws(()=>M.reveal(row,'wrong-key'));});
test('invalid expired revoked links fail closed',()=>{assert.throws(()=>M.available(null));const row=M.create('o',base());M.issue(row,'k');row.data.expiresAt='2020-01-01';assert.throws(()=>M.available(row));M.issue(row,'k');row.data.revoked=true;assert.throws(()=>M.available(row));});
test('completion requires submission and applicable validated prerequisites',()=>{const r=M.create('o',base());r.data.checks={payment:true,debit:true,content:true,validated:true};assert.equal(M.complete(r),false);r.data.submittedAt='now';assert.equal(M.complete(r),true);r.data.checks.debit=false;assert.equal(M.complete(r),false);r.data.offer.requiresDebit=false;assert.equal(M.complete(r),true);});
test('anonymous internal requests rejected, list contains no token material',async()=>{const f=fixture();await f.linked();assert.equal((await f.call({},null,'GET',false)).status,401);const result=await f.call({},null,'GET');assert.equal(result.items.length,1);assert.ok(!JSON.stringify(result).includes('tokenCipher'));assert.ok(!JSON.stringify(result).includes('token_hash'));});
test('owner isolation prevents access by internal UUID',async()=>{const f=fixture();const row=M.create('different-owner',base());await f.repo.insert(row);assert.equal((await f.call({action:'preview',id:row.id})).status,404);});
test('public GET projects scoped offer only; arbitrary public mutation refused',async()=>{const f=fixture(),{r,token}=await f.linked();const p=await f.call({},token,'GET',false);assert.equal(p.status,200);assert.equal(p.kickoff.id,r.id);assert.equal((await f.call({action:'checks',checks:{validated:true}},token)).status,403);});
test('optimistic revision conflict does not overwrite saved data',async()=>{const f=fixture(),{r,token}=await f.linked();const p=await f.call({action:'save',revision:0,answers:{changes:'lost'}},token);assert.equal(p.status,409);assert.equal(f.rows.get(r.id).data.answers.changes,undefined);});
test('public progress strips commercial/internal injection and persists resume',async()=>{const f=fixture(),{r,token}=await f.linked();const p=await f.call({action:'save',revision:1,stage:3,answers:{changes:'new page',internalNotes:'oops',basePrice:0,contact:'new name'}},token);assert.equal(p.status,200);const stored=f.rows.get(r.id);assert.equal(stored.data.offer.basePrice,39);assert.equal(stored.data.answers.internalNotes,undefined);assert.equal((await f.call({},token,'GET')).kickoff.stage,3);});
test('submission is durable, sends mocked emails once and cannot be replayed to duplicate',async()=>{const f=fixture(),{r,token}=await f.linked();const b={action:'submit',revision:1,stage:6,answers:{accepted:true,contact:'Test',phone:'910000000',taxId:'123456789',billingAddress:'Address',changes:'New site'}};const p=await f.call(b,token);assert.equal(p.status,200);assert.equal(f.mails.length,2);assert.equal(f.mails[0].to,base().email);assert.equal(f.mails[1].to,'geral@uneed.pt');assert.equal((await f.call(b,token)).status,200);assert.equal(f.mails.length,2);assert.equal(f.rows.get(r.id).data.status,'submitted');});
test('sent offers cannot be edited in place; duplicate resets state and token',async()=>{const f=fixture(),{r}=await f.linked();assert.equal((await f.call({action:'update',id:r.id,revision:1,offer:base()})).status,409);const p=await f.call({action:'duplicate',id:r.id});assert.equal(p.status,201);assert.notEqual(p.kickoff.id,r.id);assert.equal(p.kickoff.data.status,'draft');assert.equal(p.kickoff.data.tokenCipher,undefined);});
test('payload size limit is enforced without trusting Content-Length',async()=>{const f=fixture();assert.equal((await f.call({padding:'x'.repeat(61000)})).status,413);});
test('partial intake submission succeeds and notifies without approving execution',async()=>{
  const f=fixture(),{r,token}=await f.linked();const row=f.rows.get(r.id);row.data.offer.email='';
  const p=await f.call({action:'submit',revision:1,stage:6,answers:{contact:'Teste',email:'cliente@example.com',accepted:true,contentHelp:true,sectorNotes:'Especialidades a confirmar'}},token);
  assert.equal(p.status,200);assert.equal(f.mails[0].to,'cliente@example.com');assert.equal(f.mails.length,2);
  const saved=f.rows.get(r.id);assert.equal(saved.data.answers.sectorNotes,'Especialidades a confirmar');assert.equal(saved.data.checks.content,false);assert.equal(M.complete(saved),false);
  assert.match(f.mails[1].text,/Informação a completar/);assert.match(f.mails[1].text,/Preciso de ajuda/);
});
test('email-free link cannot send an invitation to a missing recipient',async()=>{
  const f=fixture(),{r}=await f.linked();f.rows.get(r.id).data.offer.email='';
  const result=await f.call({action:'send',id:r.id,revision:1,kind:'invite'});
  assert.equal(result.status,400);assert.match(result.error,/email/);assert.equal(f.mails.length,0);
});
test('generic public kickoff no longer renders an extras shop',()=>{
  const html=fs.readFileSync(require.resolve('../kickoff.html'),'utf8'),js=fs.readFileSync(require.resolve('../kickoff.js'),'utf8');
  assert.ok(!html.includes('Extras disponíveis'));assert.ok(!js.includes('renderAddons'));assert.match(html,/Guardar para depois/);assert.match(html,/kickoff-intake.js/);
});
test('emails escape user HTML and include fiscal data without internal notes',()=>{const r=M.create('o',{...base(),company:'<script>alert(1)</script>',internalNotes:'PRIVATE'});const e=compose(r,'https://crm.uneed.pt/inicio/test',{iban:'TEST',accountName:'UNEED'});assert.ok(!e.html.includes('<script>'));assert.ok(!e.html.includes('PRIVATE'));assert.match(e.text,/Retenção/);});
test('API auth validates user server-side and requires owner CRM state',async()=>{const env={...process.env};process.env.SUPABASE_URL='https://test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='secret';process.env.SUPABASE_ANON_KEY='anon';try{const repo=repository(async(url)=>({ok:true,json:async()=>url.includes('/auth/')?{id:'owner'}:[]}));await assert.rejects(repo.authenticate({headers:{authorization:'Bearer test'}}),/Sem acesso/);}finally{process.env=env;}});
test('release includes internal and token UI without replacing legacy kickoff',()=>{const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');assert.match(read('index.html'),/data-view="kickoffs"/);const cfg=JSON.parse(read('vercel.json'));assert.ok(cfg.rewrites.some(r=>r.source==='/kickoff'));assert.ok(cfg.rewrites.some(r=>r.source==='/kickoff/:token'));assert.ok(cfg.rewrites.some(r=>r.source==='/inicio/:token'));for(const f of ['kickoff-catalog.js','kickoffs-ui.js','kickoffs.css','kickoff-personal.html','kickoff-personal.js'])assert.ok(read('build-vercel.js').includes(f));assert.match(read('supabase/migrations/20260929015421_kickoff_flows.sql'),/revoke all on public.kickoff_flows from public, anon, authenticated/);});
