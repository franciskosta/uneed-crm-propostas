const crypto = require('node:crypto');
const { fiscal } = require('../customer-model');
const { commercialCatalog, addonCatalog, allowedLanguages } = require('../kickoff-catalog');
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
    return {id:a.id,name:def.name,quantity:qty,languages,unitPrice,subtotal:Math.round(unitPrice*qty*100)/100};
  });
  const vat=number(input.vat,100),retention=number(input.retention,100);
  const period=['monthly','annual','once'].includes(input.period)?input.period:'monthly';
  const total=fiscal(base+addons.reduce((s,a)=>s+a.subtotal,0),vat,retention);
  const initial=fiscal(number(input.initialBase),vat,retention);
  if(!['bank_transfer','mbway'].includes(input.paymentMethod))fail('Escolha transferência ou MB WAY.');
  const email=text(input.email,254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Email inválido.');
  const company=text(input.company,180),contact=text(input.contact,180);if(!company||!contact)fail('Indique empresa e contacto.');
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
  return {id,owner_id:owner,token_hash:null,revision:1,created_at:now,updated_at:now,data:{offer:prepared,status:'draft',checks:{payment:false,debit:false,content:false,validated:false,execution:false},answers:{contact:prepared.contact,phone:prepared.phone,taxId:prepared.taxId,billingAddress:prepared.billingAddress},stage:0,events:[{at:now,type:'created',actor:owner}],mail:{}}};
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
  return {id:row.id,revision:row.revision,reference:'UNEED-'+row.id.slice(0,8).toUpperCase(),offer:safeOffer,checks,answers,stage,status,expiresAt,submittedAt};
}
const answerFields=['contact','phone','taxId','billingAddress','siteType','currentUrl','domain','services','hours','team','keep','remove','changes','newPages','references','contentLinks','notes'];
function answers(input) {
  const out=Object.fromEntries(answerFields.map(k=>[k,text(input[k],k==='changes'?6000:2000)]));
  if(out.taxId && !/^\d{9}$/.test(out.taxId))fail('NIF inválido.');
  if(out.currentUrl)out.currentUrl=url(out.currentUrl);
  out.accepted=input.accepted===true;return out;
}
function complete(row) {const {checks:c,offer:o,submittedAt}=row.data;return !!(submittedAt && (o.initial.net===0||c.payment) && (!o.requiresDebit||c.debit) && (!o.requiresContent||c.content) && c.validated);}
module.exports={offer,create,event,issue,reveal,hash,available,publicView,answers,complete,fail,text};
