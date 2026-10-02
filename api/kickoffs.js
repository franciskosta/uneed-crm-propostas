const M=require('../kickoffs/model');
const {repository}=require('../kickoffs/store');
const {sendEmail}=require('./kickoff-email');
const {compose}=require('../kickoffs/emails');
const images=require('../kickoffs/images');
const limits=new Map();
function rate(req) {
  const key=String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown');const now=Date.now();
  if(limits.size>5000)for(const [k,v] of limits)if(now-v.start>60000)limits.delete(k);
  const old=limits.get(key);const v=old&&now-old.start<60000?old:{start:now,n:0};v.n++;limits.set(key,v);
  if(v.n>120)M.fail('Demasiados pedidos. Aguarde um minuto.',429);
}
function internal(row) {const copy=structuredClone(row);delete copy.data.tokenCipher;delete copy.token_hash;return copy;}
function makeHandler(repo=repository(),mailer=sendEmail,imageClient) {
  async function payment(row) {
    const data=(await repo.request('crm_state?select=data&user_id=eq.'+encodeURIComponent(row.owner_id)+'&limit=1'))[0]?.data;
    const brand=data?.brand||{};
    return {accountName:M.text(brand.name,180),iban:M.text(brand.iban,80),mbway:M.text(process.env.KICKOFF_MBWAY_NUMBER||brand.mbway,40)};
  }
  async function notify(row,kind,token,pay) {
    const key=kind==='invite'?'invite':kind==='admin'?'submitted-admin':'submitted-customer';
    if(row.data.mail[key])return row; // Pending/unknown SMTP outcome is never automatically retried.
    row.data.mail[key]={status:'pending',at:new Date().toISOString()};M.event(row,'email_claimed:'+key,'system');
    row=await repo.save(row,row.revision);
    const link=kind==='admin'?'https://crm.uneed.pt/#kickoffs='+row.id:'https://crm.uneed.pt/'+(kind==='invite'?'kickoff/':'inicio/')+token;
    let result;try {result=await mailer({...compose(row,link,pay,kind==='admin',kind==='invite'),to:kind==='admin'?(process.env.KICKOFF_NOTIFICATION_TO||'geral@uneed.pt'):(row.data.offer.email||row.data.answers.email)},'kickoffs/'+row.id+'/'+key);} catch {result={sent:false};}
    // Merge with current progress, not the snapshot taken before SMTP.
    for(let attempt=0;attempt<3;attempt++) {
      const latest=await repo.get(row.id,row.owner_id);
      latest.data.mail[key]={status:result.sent?'accepted':result.reason==='missing_email_config'?'failed':'unknown',at:new Date().toISOString()};
      if(kind==='invite'&&result.sent&&latest.data.status==='linked')latest.data.status='sent';
      M.event(latest,'email_'+latest.data.mail[key].status+':'+key,'system');
      try{return await repo.save(latest,latest.revision);}catch(e){if(e.status!==409)throw e;}
    }
    M.fail('Pedido guardado; confirme o estado do email antes de reenviar.',409);
  }
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
    try {
      rate(req);
      if(!['GET','POST'].includes(req.method))M.fail('Método não permitido.',405);
      let b=req.body||{};if(typeof b==='string'){if(Buffer.byteLength(b)>60000)M.fail('Pedido demasiado grande.',413);try{b=JSON.parse(b);}catch{M.fail('JSON inválido.');}}
      if(Buffer.byteLength(JSON.stringify(b))>60000)M.fail('Pedido demasiado grande.',413);
      const token=String(req.headers['x-kickoff-token']||'');
      if(token) {
        if(!/^[A-Za-z0-9_-]{43}$/.test(token))M.fail('Link inválido.',404);
        let row=await repo.byToken(M.hash(token));M.available(row);
        if(req.method==='GET')return res.status(200).json({ok:true,kickoff:M.publicView(row),payment:await payment(row)});
        if(['image-reserve','image-finish','image-download'].includes(b.action)) {
          const result=await images.run(repo,row,b,'customer',imageClient);
          return res.status(200).json({ok:true,kickoff:M.publicView(result.row),upload:result.upload,downloadUrl:result.downloadUrl});
        }
        if(b.action==='open') {
          if(!row.data.openedAt){row.data.openedAt=new Date().toISOString();M.event(row,'public_page_opened','customer');row=await repo.save(row,row.revision);}
          return res.status(200).json({ok:true,kickoff:M.publicView(row)});
        }
        if(!['save','submit'].includes(b.action))M.fail('Ação não permitida.',403);
        if(row.data.status==='completed')M.fail('Kickoff já validado. Contacte a UNEED para alterações.',409);
        if(row.data.submittedAt && b.action==='submit')return res.status(200).json({ok:true,kickoff:M.publicView(row)});
        if(b.revision!==row.revision)M.fail('Existe uma versão mais recente. Recarregue a página antes de gravar.',409);
        if(Date.now()-Date.parse(row.updated_at)<750)M.fail('Aguarde um instante antes de voltar a guardar.',429);
        const nextAnswers=M.answers(b.answers||{},b.action==='submit');
        if(b.addons!==undefined)M.selectTemplateAddons(row,b.addons);
        if(row.data.submittedAt && JSON.stringify(nextAnswers)!==JSON.stringify(row.data.answers)){row.data.checks.content=false;row.data.checks.validated=false;}
        row.data.answers=nextAnswers;row.data.stage=Math.max(row.data.stage,Math.min(6,Math.max(1,Number(b.stage)||1)));
        row.data.status=row.data.submittedAt?'submitted':'started';
        if(b.action==='submit') {
          const a=row.data.answers;
          if(row.data.templateId){
            const required={businessName:'nome do negócio',contact:'nome do contacto',phone:'telefone',email:'email',taxId:'NIF',billingAddress:'morada de faturação'};
            const missing=Object.entries(required).filter(([key])=>!String(a[key]||row.data.offer[key]||'').trim()).map(([,label])=>label);
            if(missing.length)M.fail('Complete os campos obrigatórios antes de enviar: '+missing.join(', ')+'. Pode guardar e continuar mais tarde.');
            if(!/^\+?[\d\s()-]{7,25}$/.test(a.phone))M.fail('Indique um telefone válido.');
          }
          if(!a.accepted||!a.contact||!(row.data.offer.email||a.email))M.fail('Indique o seu nome, email e aceite os Termos e a Política de Privacidade. Os restantes dados podem ser completados depois.');
          if(row.data.templateId && !(await payment(row)).mbway)M.fail('MB WAY temporariamente indisponível. As respostas podem ser guardadas; contacte a UNEED.',503);
          const submittedAt=new Date().toISOString();
          row.data.legalAcceptance={termsVersion:'2026-10-02',privacyVersion:'2026-10-02',acceptedAt:submittedAt};
          row.data.submittedAt=submittedAt;row.data.status='submitted';
        }
        M.event(row,b.action==='submit'?'submitted':'progress_saved','customer');row=await repo.save(row,row.revision);
        if(b.action==='submit') {
          // Submission is durable even if a notification fails.
          try {const pay=await payment(row);row=await notify(row,'customer',token,pay);row=await notify(row,'admin',token,pay);}catch {return res.status(200).json({ok:true,kickoff:M.publicView(row),warning:'Pedido guardado. A equipa confirmará o envio do email.'});}
        }
        return res.status(200).json({ok:true,kickoff:M.publicView(row)});
      }
      const owner=await repo.authenticate(req);
      if(req.method==='GET') {
        const offset=Math.max(0,Math.min(100000,parseInt(req.query?.offset)||0));
        return res.status(200).json({ok:true,items:(await repo.list(owner,offset)).map(internal)});
      }
      if(b.action==='create-template'){
        const row=M.createTemplate(owner,b.templateId,b.company);
        if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(b.requestId||''))M.fail('Pedido inválido. Volte a abrir o modelo.');
        const existing=await repo.get(b.requestId,owner);
        if(existing){
          if(existing.data.templateId!==b.templateId||existing.data.offer.company!==row.data.offer.company)M.fail('Este pedido já foi utilizado.',409);
          M.available(existing);return res.status(200).json({ok:true,kickoff:internal(existing),url:'https://crm.uneed.pt/kickoff/'+M.reveal(existing,repo.cfg.secret)});
        }
        row.id=b.requestId;
        if(!(await payment(row)).mbway)M.fail('Configure o número MB WAY antes de criar links deste modelo.',503);
        const token=M.issue(row,repo.cfg.secret);M.event(row,'template_link_created',owner);
        const saved=await repo.insert(row);
        return res.status(201).json({ok:true,kickoff:internal(saved),url:'https://crm.uneed.pt/kickoff/'+token});
      }
      if(b.action==='create') {
        const row=await repo.insert(M.create(owner,b.offer||{}));return res.status(201).json({ok:true,kickoff:internal(row)});
      }
      if(!/^[a-f0-9-]{36}$/.test(String(b.id||'')))M.fail('Kickoff inválido.');
      let row=await repo.get(b.id,owner);if(!row)M.fail('Kickoff não encontrado.',404);
      if(b.action==='image-download') {
        const result=await images.run(repo,row,b,owner,imageClient);
        return res.status(200).json({ok:true,downloadUrl:result.downloadUrl});
      }
      if(b.action==='preview')return res.status(200).json({ok:true,kickoff:M.publicView(row),payment:await payment(row)});
      if(b.action==='link') {M.available(row);return res.status(200).json({ok:true,url:'https://crm.uneed.pt/kickoff/'+M.reveal(row,repo.cfg.secret)});}
      if(b.action==='duplicate')return res.status(201).json({ok:true,kickoff:internal(await repo.insert(row.data.templateId?M.createTemplate(owner,row.data.templateId,row.data.offer.company):M.create(owner,row.data.offer)))});
      if(b.revision!==row.revision)M.fail('O kickoff mudou. Atualize a lista.',409);
      if(b.action==='update') {if(row.data.status!=='draft')M.fail('Oferta bloqueada. Duplique para preparar uma nova versão.',409);row.data.offer=M.offer(b.offer||{});const o=row.data.offer;row.data.answers={businessName:o.company,contact:o.contact,email:o.email,phone:o.phone,taxId:o.taxId,billingAddress:o.billingAddress};}
      else if(b.action==='issue') {if(row.data.revoked||row.data.status==='cancelled')M.fail('Duplique o kickoff cancelado para criar uma nova oferta.',409);if(row.token_hash)M.fail('Já existe um link. Copie-o ou revogue-o.',409);M.issue(row,repo.cfg.secret,b.days||30);}
      else if(b.action==='revoke') {row.data.revoked=true;row.data.status='cancelled';}
      else if(b.action==='checks') {
        const c={};for(const key of ['payment','debit','content','validated','execution'])c[key]=b.checks?.[key]===true;
        row.data.checks=c;if(c.execution&&!M.complete(row))M.fail('Confirme os requisitos antes de iniciar a execução.');
        if(row.data.status==='cancelled')M.fail('Kickoff cancelado.',409);
        row.data.status=M.complete(row)?'completed':row.data.submittedAt?'submitted':row.data.status;
      }
      else if(b.action==='debitLink')row.data.offer.gocardless=M.offer({...row.data.offer,gocardless:b.url}).gocardless;
      else if(b.action==='send') {
        M.available(row);const pay=await payment(row),o=row.data.offer;
        if(o.initial.net>0&&(o.paymentMethod==='mbway'?!pay.mbway:!pay.iban||!pay.accountName))M.fail('Configure os dados de pagamento antes de enviar.');
        const kind=['invite','customer','admin'].includes(b.kind)?b.kind:'invite';
        if(kind==='invite'&&!o.email)M.fail('Indique um email no rascunho antes de enviar um convite. Pode partilhar o link manualmente.');
        if(kind!=='invite'&&!row.data.submittedAt)M.fail('Ainda não existe submissão.');
        const key=kind==='invite'?'invite':kind==='admin'?'submitted-admin':'submitted-customer';
        if(row.data.mail[key]) {
          if(b.confirmRetry!==true)M.fail('Já existe uma tentativa. Confirme o reenvio; poderá duplicar um email entregue.',409);
          M.event(row,'email_retry_authorized:'+key,owner);delete row.data.mail[key];row=await repo.save(row,row.revision);
        }
        row=await notify(row,kind,M.reveal(row,repo.cfg.secret),pay);
        return res.status(200).json({ok:true,kickoff:internal(row)});
      }
      else M.fail('Ação inválida.');
      M.event(row,b.action,owner);row=await repo.save(row,row.revision);
      return res.status(200).json({ok:true,kickoff:internal(row)});
    } catch(e) {return res.status(e.status||500).json({ok:false,error:e.status?e.message:'Não foi possível concluir. Recarregue e tente novamente.'});}
  };
}
module.exports=makeHandler();module.exports.makeHandler=makeHandler;
