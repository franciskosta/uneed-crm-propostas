// Local-only browser smoke test. In-memory persistence and mocked SMTP, no production data.
// Run with Playwright available through NODE_PATH: node scripts/smoke-kickoffs-ui.js
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const chromium=process.env.KICKOFF_SMOKE_SERVER_ONLY?null:require('playwright').chromium;
const {makeHandler}=require('../api/kickoffs');
const M=require('../kickoffs/model');
const root=path.join(__dirname,'..');const rows=new Map();let sent=0;
const repo={cfg:{secret:'local-fixture'},authenticate:async()=> 'local-owner',request:async()=>[{data:{brand:{name:'UNEED',iban:'PT-LOCAL-TEST'}}}],
  get:async(id,owner)=>{const r=rows.get(id);return r&&(!owner||r.owner_id===owner)?structuredClone(r):null;},
  byToken:async hash=>structuredClone([...rows.values()].find(x=>x.token_hash===hash)),
  list:async()=>structuredClone([...rows.values()]),insert:async r=>{rows.set(r.id,structuredClone(r));return r;},
  save:async(r,v)=>{if(rows.get(r.id).revision!==v)M.fail('Conflict',409);const saved={...r,revision:v+1};rows.set(r.id,structuredClone(saved));return saved;}};
let localOrigin;const images=new Map();
const imageClient={createSignedUploadUrl:async key=>({data:{signedUrl:localOrigin+'/fixture-upload/'+encodeURIComponent(key)}}),
  download:async key=>images.has(key)?{data:new Blob([images.get(key)])}:{error:'not found'},
  upload:async(key,bytes)=>{if(images.has(key))return {error:'exists'};images.set(key,Buffer.from(bytes));return {data:{path:key}};},
  createSignedUrl:async key=>({data:{signedUrl:localOrigin+'/fixture-download/'+encodeURIComponent(key)}})};
const handler=makeHandler(repo,async()=>{sent++;return {sent:true};},imageClient);
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/fixture-upload/')){const key=decodeURIComponent(url.pathname.slice('/fixture-upload/'.length));if(images.has(key)){res.statusCode=409;res.end();return;}const chunks=[];for await(const chunk of req)chunks.push(chunk);images.set(key,Buffer.concat(chunks));res.setHeader('content-type','application/json');res.end('{}');return;}
  if(url.pathname.startsWith('/fixture-download/')){const data=images.get(decodeURIComponent(url.pathname.slice('/fixture-download/'.length)));res.setHeader('content-type','image/png');res.end(data);return;}
  if(url.pathname==='/api/kickoffs'){let raw='';for await(const chunk of req)raw+=chunk;req.body=raw?JSON.parse(raw):{};req.query=Object.fromEntries(url.searchParams);res.status=n=>{res.statusCode=n;return res;};res.json=d=>{res.setHeader('content-type','application/json');res.end(JSON.stringify(d));};return handler(req,res);}
  if(url.pathname.startsWith('/api/')){res.setHeader('content-type','application/json');res.end('{}');return;}
  if(url.pathname==='/supabase-config.js'){res.setHeader('content-type','text/javascript');res.end('window.UNEED_SUPABASE={};');return;}
  const file=url.pathname==='/'?'index.html':/^\/(kickoff|inicio)\//.test(url.pathname)?'kickoff-personal.html':url.pathname.slice(1);
  const filename=path.resolve(root,file);if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.statusCode=404;res.end();return;}
  res.setHeader('content-type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(filename));
});
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  localOrigin=origin;
  if(process.env.KICKOFF_SMOKE_SERVER_ONLY){const row=M.create('local-owner',{product:'presenca',plan:'presenca-essencial',company:'Clínica Exemplo (teste local)',niche:'veterinaria',gocardless:'https://pay.gocardless.com/test-only',requiresDebit:true,contact:'Teste',email:'test@example.com',phone:'910000000',vat:0,retention:0,initialBase:0,paymentMethod:'bank_transfer'});row.data.stage=1;const token=M.issue(row,repo.cfg.secret);rows.set(row.id,row);await require('sharp')({create:{width:1200,height:800,channels:3,background:'#e71849'}}).png().toFile('/private/tmp/uneed-upload-fixture.png');console.log('Local fixture: '+origin+'/kickoff/'+token);await new Promise(()=>{});return;}
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(origin);await page.evaluate(()=>{getSupabaseClient=()=>({auth:{getSession:async()=>({data:{session:{access_token:'local-test'}}})}});});
  await page.getByRole('button',{name:'Kickoffs',exact:true}).click();await page.getByRole('button',{name:'Criar kickoff',exact:true}).click();
  const d=page.locator('dialog');await d.locator('[name=company]').fill('Clínica Exemplo');await d.getByText('Dados já conhecidos · opcionais',{exact:true}).click();await d.locator('[name=contact]').fill('Pessoa de Teste');await d.locator('[name=email]').fill('test@example.com');await d.locator('[name=phone]').fill('910000000');await d.getByText('Condições já acordadas · confirmar valores e impostos',{exact:true}).click();await d.locator('[name=vat]').fill('23');await d.locator('[name=retention]').fill('25');await d.locator('[name=initialBase]').fill('39');await d.locator('[name=niche]').selectOption('clinica');
  await d.getByText('Extras já contratados',{exact:true}).click();await d.locator('[data-addon="extra-email"]').check();await d.locator('[data-qty="extra-email"]').fill('2');
  await page.screenshot({path:'/private/tmp/uneed-kickoffs-editor.png',fullPage:true});
  await d.getByRole('button',{name:'Guardar e preparar link'}).click();await page.getByRole('button',{name:'Gerar link',exact:true}).click();
  await page.getByRole('button',{name:'Copiar link',exact:true}).waitFor();assert.equal(rows.size,1);
  const row=[...rows.values()][0],token=M.reveal(row,repo.cfg.secret);assert.equal(row.data.offer.total.base,51);assert.equal(row.data.offer.total.net,49.98);
  await page.goto(origin+'/kickoff/'+token);await page.getByRole('button',{name:'Guardar e continuar',exact:true}).click();
  await page.getByRole('button',{name:'Guardar e continuar',exact:true}).click();
  await page.locator('[name=services]').fill('Consultas e marcações');await page.getByRole('button',{name:'Guardar e continuar',exact:true}).click();
  await page.locator('[name=changes]').fill('Preparar website e conteúdos de apresentação.');await page.getByRole('button',{name:'Guardar e continuar',exact:true}).click();await page.locator('[name=taxId]').fill('123456789');await page.locator('[name=billingAddress]').fill('Morada de teste');await page.getByRole('button',{name:'Guardar e continuar',exact:true}).click();
  await page.locator('[name=accepted]').check();await page.getByRole('button',{name:'Confirmar e enviar',exact:true}).click();await page.waitForURL('**/inicio/*');await page.locator('.kickoff-check').filter({hasText:'Pedido recebido'}).waitFor();assert.equal(sent,2);
  await page.screenshot({path:'/private/tmp/uneed-kickoffs-tracking.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/private/tmp/uneed-kickoffs-mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No mobile horizontal overflow');assert.deepEqual(errors,[]);console.log('PASS: CRM generator → token → six steps → submission → tracking; mocked SMTP twice; mobile overflow absent.');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
