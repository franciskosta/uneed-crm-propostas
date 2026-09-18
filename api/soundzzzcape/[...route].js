const { authenticate } = require('../_mission-runtime');
const https = require('node:https');

function relay(url, method, token, body) {
  return new Promise((resolve,reject)=>{
    const cert=process.env.SOUNDZZZCAPE_RELAY_CA;
    const request=https.request(url,{method,ca:cert || undefined,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},timeout:20000},res=>{
      const chunks=[];let size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>16*1024*1024){request.destroy(new Error('response_too_large'));return;}chunks.push(chunk);});
      res.on('end',()=>{try{resolve({status:res.statusCode,payload:JSON.parse(Buffer.concat(chunks).toString())});}catch{reject(new Error('invalid_response'));}});
      res.on('error',reject);
    });
    request.on('timeout',()=>request.destroy(new Error('timeout')));request.on('error',reject);
    request.end(method==='POST'?JSON.stringify(body || {}):undefined);
  });
}

const readRoutes = /^\/(status|runs(?:\/[a-z0-9-]+)?|queue|content-bank|analytics|costs|approvals|system|channel)$/;
const writeRoutes = /^\/(autopilot\/(run|pause|resume)|runs\/[a-z0-9-]+\/(approve|reject)|content-bank\/reprioritize)$/;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ok:false,error:'unauthorized'});
    const allowed = String(process.env.SOUNDZZZCAPE_OWNER_IDS || '').split(',').map(x=>x.trim()).filter(Boolean);
    const emails = String(process.env.SOUNDZZZCAPE_OWNER_EMAILS || '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
    const verifiedOwner = Boolean(user.email_confirmed_at) && emails.includes(String(user.email || '').toLowerCase());
    if (!allowed.includes(user.id) && !verifiedOwner) return res.status(403).json({ok:false,error:'soundzzzcape_access_not_configured'});
    const pathname = new URL(req.url || '/', 'https://crm.uneed.pt').pathname;
    const path = pathname.startsWith('/api/soundzzzcape/')
      ? pathname.slice('/api/soundzzzcape'.length)
      : '/' + (Array.isArray(req.query.route) ? req.query.route.join('/') : String(req.query.route || ''));
    if (!(req.method === 'GET' && readRoutes.test(path)) && !(req.method === 'POST' && writeRoutes.test(path))) return res.status(405).json({ok:false,error:'operation_not_allowed'});
    const base = process.env.SOUNDZZZCAPE_API_URL;
    const token = process.env.SOUNDZZZCAPE_CONTROL_TOKEN;
    if (!base || !token || new URL(base).protocol !== 'https:') return res.status(503).json({ok:false,error:'soundzzzcape_worker_not_connected'});
    const url = new URL('/api'+path, base);
    if(req.query.refresh === 'true') url.searchParams.set('refresh','true');
    if(req.query.limit) url.searchParams.set('limit',String(req.query.limit));
    const result = await relay(url,req.method,token,req.body);
    return res.status(result.status).json(result.payload);
  } catch {
    return res.status(503).json({ok:false,error:'soundzzzcape_agent_unavailable'});
  }
};

module.exports.readRoutes = readRoutes;
module.exports.writeRoutes = writeRoutes;
