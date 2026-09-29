const crypto = require('node:crypto');
const { fiscal } = require('../customer-model');
const { commercialCatalog, addonCatalog, allowedLanguages } = require('../kickoff-catalog');
const templates=require('../kickoff-templates');
const text = (v, n=4000) => String(v ?? '').trim().slice(0,n);
function fail(message, status=400) { throw Object.assign(new Error(message), {status}); }
function number(v, max=1000000) { if(v==='' || v==null || !Number.isFinite(Number(v)) || Number(v)<0 || Number(v)>max) fail('Valor numérico inválido.'); return Number(v); }
function url(v, gc=false) {
  if(!v)return '';
  let u; try { u=new URL(v); } catch { fail('URL inválido.'); }
  if(u.protocol!=='https:' || u.username || u.password || (gc && !(u.hostname==='gocardless.com' || u.hostname.endsWith('.gocardless.com')))) fail('Use um URL HTTPS válido'+(gc?' do GoCardless.':'.'));
  return u.href;
}
function offer(input) {
  const product=text(input.product,30), catalog=commercialCatalog[product];
  if(!catalog) fail('Produto inválido.');
  const plan=text(input.plan,80); if(!catalog.plans[plan]) fail('Plano incompatível com o produto.');
  const base=number(input.basePrice ?? catalog.plans[plan].price);
  const seen=new Set();
  const addons=(Array.isArray(input.addons)?input.addons:[]).map(a=>{
    if(!catalog.addons.includes(a.id) || seen.has(a.id)) fail('Extra incompatível ou repetido.'); seen.add(a.id);
    const def=addonCatalog[a.id];
    const languages=Array.isArray(a.languages)?[...new Set(a.languages)]:[];
    if(languages.some(l=>!allowedLanguages.includes(l)))fail('Idioma inválido.');
    const qty=def.type==='languages'?languages.length:def.type==='quantity'?number(a.quantity,20):1;
    if(!Number.isInteger(qty)||qty<1)fail('Confirme quantidades e idiomas.');
    const unitPrice=number(a.unitPrice ?? def.unitPrice);
    return {id:a.id,name:def.name,description:def.description||'',quantity:qty,languages,unitPrice,subtotal:Math.round(unitPrice*qty*100)/100};
  });
  const vat=number(input.vat,100),retention=number(input.retention,100);
  const period=['monthly','annual','once'].includes(input.period)?input.period:'monthly';
  if(period!=='monthly'&&addons.some(a=>a.id==='management-metrics'))fail('Métricas de gestão é um extra mensal (12 €/mês + IVA). Prepare uma oferta mensal para o incluir.');
  const total=fiscal(base+addons.reduce((s,a)=>s+a.subtotal,0),vat,retention);
  const initial=fiscal(number(input.initialBase),vat,retention);
  if(!['bank_transfer','mbway'].includes(input.paymentMethod))fail('Escolha transferência ou MB WAY.');
  const email=text(input.email,254).toLowerCase();
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Email inválido.');
  const company=text(input.company,180),contact=text(input.contact,180);if(!company)fail('Indique o nome do negócio.');
  const day=number(input.collectionDay||1,28);if(day<1||!Number.isInteger(day))fail('Dia de cobrança inválido.');
  return {product,plan,planName:catalog.plans[plan].name,basePrice:base,addons,period,vat,retention,total,initial,initialBase:initial.base,
    company,contact,email,phone:text(input.phone,40),taxId:text(input.taxId,30),billingAddress:text(input.billingAddress,500),
    niche:text(input.niche,80),taxNotes:text(input.taxNotes,500),intro:text(input.intro,2000),deadline:text(input.deadline,300),
    paymentMethod:input.paymentMethod,gocardless:url(input.gocardless,true),collectionDay:day,
    requiresDebit:input.requiresDebit===true,requiresContent:input.requiresContent!==false,
    proposalId:text(input.proposalId,160),companyId:text(input.companyId,160),leadId:text(input.leadId,160),
    internalNotes:text(input.internalNotes,6000)};
}
function create(owner, input, now=new Date().toISOString()) {
  const id=crypto.randomUUID(), prepared=offer(input);
  return {id,owner_id:owner,token_hash:null,revision:1,created_at:now,updated_at:now,data:{offer:prepared,status:'draft',checks:{payment:false,debit:false,content:false,validated:false,execution:false},answers:{businessName:prepared.company,contact:prepared.contact,email:prepared.email,phone:prepared.phone,taxId:prepared.taxId,billingAddress:prepared.billingAddress},stage:0,events:[{at:now,type:'created',actor:owner}],mail:{}}};
}
function createTemplate(owner,templateId,company){
  const t=templates.get(templateId);if(!t)fail('Modelo de kickoff inválido.');
  const plan=commercialCatalog[t.product].plans[t.plan];
  const row=create(owner,{company,product:t.product,plan:t.plan,niche:t.niche,vat:23,retention:0,initialBase:plan.price,paymentMethod:'mbway',requiresDebit:true,requiresContent:true});
  row.data.templateId=t.id;return row;
}
function selectTemplateAddons(row,input){
  if(!row.data.templateId)fail('Este kickoff tem condições acordadas que não podem ser alteradas pelo cliente.',403);
  if(row.data.submittedAt)fail('O pedido já foi enviado. Contacte a UNEED para alterar os extras.',409);
  let addons;try{addons=templates.selection(row.data.offer.product,input);}catch(e){fail(e.message);}
  const o=row.data.offer;row.data.offer=offer({...o,addons,initialBase:o.basePrice+addons.reduce((sum,a)=>sum+a.subtotal,0)});
}
function event(row,type,actor,now=new Date().toISOString()) {
  row.updated_at=now; row.data.events.push({at:now,type,actor});
  // Stop rather than silently deleting audit history.
  if(row.data.events.length>2000)fail('Limite de eventos atingido. Contacte a UNEED.',409);
}
function tokenKey(secret) {return crypto.createHash('sha256').update('uneed-kickoffs-v1:'+secret).digest();}
function issue(row, secret, days=30) {
  days=number(days,365); if(days<1)fail('Validade mínima: 1 dia.');
  const token=crypto.randomBytes(32).toString('base64url'),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',tokenKey(secret),iv);
  const encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
  row.token_hash=hash(token);row.data.tokenCipher=[iv,cipher.getAuthTag(),encrypted].map(x=>x.toString('base64url')).join('.');
  row.data.expiresAt=new Date(Date.now()+days*86400000).toISOString();row.data.revoked=false;
  if(row.data.status==='draft')row.data.status='linked';
  return token;
}
function reveal(row,secret) {
  if(!row.data.tokenCipher)return null;
  const [iv,tag,data]=row.data.tokenCipher.split('.').map(x=>Buffer.from(x,'base64url'));
  const decipher=crypto.createDecipheriv('aes-256-gcm',tokenKey(secret),iv);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
}
function hash(token) {return crypto.createHash('sha256').update(token).digest('hex');}
function available(row) {if(!row || row.data.revoked || row.data.status==='cancelled' || Date.parse(row.data.expiresAt||'')<=Date.now() || !row.data.expiresAt)fail('Link inválido, expirado ou desativado.',404);}
function publicView(row) {
  const {offer:o,checks,answers,stage,status,expiresAt,submittedAt}=row.data;
  const {internalNotes,proposalId,companyId,leadId,...safeOffer}=o;
  const images=(row.data.images||[]).map(({id,name,status,size,width,height,error,createdAt})=>({id,name,status,size,width,height,error,createdAt}));
  return {id:row.id,revision:row.revision,reference:'UNEED-'+row.id.slice(0,8).toUpperCase(),templateId:row.data.templateId||null,notifications:{customer:row.data.mail?.['submitted-customer']?.status||null,admin:row.data.mail?.['submitted-admin']?.status||null},offer:safeOffer,checks,answers,stage,status,expiresAt,submittedAt,images};
}
const answerFields=['businessName','email','businessAddress','socialLinks','sectorNotes','contact','phone','taxId','billingAddress','siteType','currentUrl','domain','services','hours','team','keep','remove','changes','newPages','references','contentLinks','notes'];
function answers(input, validate=true) {
  const out=Object.fromEntries(answerFields.map(k=>[k,text(input[k],k==='changes'?6000:2000)]));
  if(validate && out.taxId && !/^\d{9}$/.test(out.taxId))fail('NIF inválido.');
  if(validate && out.currentUrl)out.currentUrl=url(out.currentUrl);
  if(validate && out.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))fail('Email inválido.');
  out.contentHelp=input.contentHelp===true;out.accepted=input.accepted===true;return out;
}
function complete(row) {const {checks:c,offer:o,submittedAt}=row.data;return !!(submittedAt && !(row.data.images||[]).some(x=>['pending','validating'].includes(x.status)) && (o.initial.net===0||c.payment) && (!o.requiresDebit||c.debit) && (!o.requiresContent||c.content) && c.validated);}
module.exports={offer,create,createTemplate,selectTemplateAddons,event,issue,reveal,hash,available,publicView,answers,complete,fail,text};
