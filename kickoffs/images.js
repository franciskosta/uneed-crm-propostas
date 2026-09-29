const crypto=require('node:crypto');
const sharp=require('sharp');
const {StorageClient}=require('@supabase/storage-js');
const M=require('./model');
const BUCKET='kickoff-images',MAX_FILE=10*1024*1024,MAX_TOTAL=100*1024*1024,MAX_FILES=20;
const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
function storage(cfg) {
  return new StorageClient(cfg.url+'/storage/v1',{apikey:cfg.secret,Authorization:'Bearer '+cfg.secret}).from(BUCKET);
}
function safeName(name,extension) {
  const base=String(name||'imagem').replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N}_. -]/gu,'_').slice(0,100)||'imagem';
  return base+'.'+extension;
}
function publicFiles(row) {
  return (row.data.images||[]).map(({id,name,status,size,width,height,error,createdAt})=>({id,name,status,size,width,height,error,createdAt}));
}
async function validate(bytes,mime) {
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX_FILE)M.fail('Imagem vazia ou superior a 10 MB.');
  const signature=bytes.subarray(0,12);
  const detected=signature[0]===255&&signature[1]===216&&signature[2]===255?'image/jpeg':
    signature.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':
    signature.toString('ascii',0,4)==='RIFF'&&signature.toString('ascii',8,12)==='WEBP'?'image/webp':null;
  if(!types[mime]||detected!==mime)M.fail('O conteúdo não corresponde a uma imagem JPG, PNG ou WebP válida.');
  try {
    const image=sharp(bytes,{failOn:'warning',limitInputPixels:40000000,animated:true});
    const meta=await image.metadata();
    if(!meta.width||!meta.height||meta.width*meta.height>40000000||(meta.pages||1)>1)M.fail('Use uma imagem estática até 40 megapíxeis.');
    // Full decoding catches corrupt data; no transformed pixels are stored.
    await image.stats();
    return {width:meta.width,height:meta.height,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  }catch(e){if(e.status)throw e;M.fail('Não foi possível validar a imagem. Exporte-a novamente como JPG, PNG ou WebP.');}
}
async function run(repo,row,body,actor,client=storage(repo.cfg)) {
  row.data.images ||= [];
  if(body.action==='image-download') {
    const file=row.data.images.find(x=>x.id===body.fileId&&x.status==='ready');
    if(!file)M.fail('Imagem indisponível.',404);
    const result=await client.createSignedUrl(file.path,60,{download:file.name});
    if(result.error||!result.data?.signedUrl)M.fail('Não foi possível preparar o download.',503);
    return {row,downloadUrl:result.data.signedUrl};
  }
  if(row.data.status==='completed')M.fail('Kickoff concluído. Contacte a UNEED para enviar mais imagens.',409);
  if(body.revision!==row.revision)M.fail('O kickoff mudou. Atualize antes de enviar imagens.',409);
  if(body.action==='image-reserve') {
    if(!types[body.mime]||!Number.isInteger(body.size)||body.size<1||body.size>MAX_FILE)M.fail('Use JPG, PNG ou WebP até 10 MB por imagem.');
    const total=row.data.images.reduce((s,x)=>s+(x.status==='ready'?2*x.size:2*MAX_FILE),0);
    if(row.data.images.length>=MAX_FILES||total+2*MAX_FILE>MAX_TOTAL)M.fail('Limite de imagens deste kickoff atingido. Contacte a UNEED.',409);
    const id=crypto.randomUUID(),ext=types[body.mime],prefix=row.owner_id+'/'+row.id+'/'+id;
    const file={id,name:safeName(body.name,ext),mime:body.mime,size:body.size,status:'pending',incoming:prefix+'/incoming.'+ext,path:prefix+'/original.'+ext,createdAt:new Date().toISOString()};
    row.data.images.push(file);M.event(row,'image_reserved',actor);row=await repo.save(row,row.revision);
    const result=await client.createSignedUploadUrl(file.incoming,{upsert:false});
    if(result.error||!result.data?.signedUrl)M.fail('Não foi possível iniciar o upload. Atualize o kickoff e contacte a UNEED.',503);
    return {row,upload:{id,signedUrl:result.data.signedUrl,mime:file.mime}};
  }
  if(body.action!=='image-finish')M.fail('Ação de imagem inválida.');
  const file=row.data.images.find(x=>x.id===body.fileId);if(!file)M.fail('Imagem não encontrada.',404);
  if(file.status==='ready')return {row};
  if(file.status==='rejected')M.fail('Imagem rejeitada. Envie um ficheiro válido.');
  // A durable claim prevents concurrent expensive decodes and quota races.
  if(file.status==='validating'&&Date.now()-Date.parse(file.validationStartedAt||row.updated_at)<300000)M.fail('Imagem em validação. Aguarde; uma validação interrompida pode ser retomada após 5 minutos.',409);
  file.status='validating';file.validationStartedAt=new Date().toISOString();M.event(row,'image_validation_started',actor);row=await repo.save(row,row.revision);
  let meta,bytes,validationError;
  try {
    const incoming=await client.download(file.incoming);
    if(incoming.error||!incoming.data)M.fail('Upload incompleto. Tente validar novamente.');
    if(incoming.data.size>MAX_FILE)M.fail('Imagem superior a 10 MB.');
    bytes=Buffer.from(await incoming.data.arrayBuffer());meta=await validate(bytes,file.mime);
    if(meta.size!==file.size)M.fail('O tamanho recebido não corresponde ao ficheiro selecionado.');
  }catch(e){validationError=e.status?e.message:'Não foi possível validar a imagem.';}
  if(!validationError) {
    const promoted=await client.upload(file.path,bytes,{contentType:file.mime,upsert:false,cacheControl:'60'});
    if(promoted.error){
      // Recovery after a crash between the immutable copy and the document commit.
      const previous=await client.download(file.path);
      const prior=previous.data&&previous.data.size<=MAX_FILE?Buffer.from(await previous.data.arrayBuffer()):null;
      if(!prior||crypto.createHash('sha256').update(prior).digest('hex')!==meta.sha256)validationError='Não foi possível guardar a imagem validada. Contacte a UNEED.';
    }
  }
  for(let attempt=0;attempt<3;attempt++) {
    const latest=await repo.get(row.id,row.owner_id);M.available(latest);
    const current=latest.data.images.find(x=>x.id===file.id);
    if(validationError){current.status='rejected';current.error=validationError;}
    else {Object.assign(current,meta,{status:'ready'});latest.data.checks.content=false;latest.data.checks.validated=false;}
    M.event(latest,validationError?'image_rejected':'image_ready',actor);
    try{return {row:await repo.save(latest,latest.revision)};}catch(e){if(e.status!==409)throw e;}
  }
  M.fail('A imagem foi processada. Atualize o kickoff para confirmar o resultado.',409);
}
module.exports={run,validate,publicFiles,MAX_FILE,MAX_TOTAL,MAX_FILES,BUCKET};
