const {fail} = require('./model');
function config() {
  return {url:(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'').replace(/\/$/,''),secret:process.env.SUPABASE_SECRET_KEY_V2||process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,
    anon:process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY};
}
function repository(fetcher=fetch) {
  const cfg=config();
  async function request(path,method='GET',body,headers={}) {
    if(!cfg.url||!cfg.secret)fail('Backend não configurado.',503);
    const r=await fetcher(cfg.url+'/rest/v1/'+path,{method,headers:{apikey:cfg.secret,Authorization:'Bearer '+cfg.secret,'Content-Type':'application/json',Prefer:'return=representation',...headers},...(body?{body:JSON.stringify(body)}:{})});
    if(!r.ok)fail(r.status===404?'A tabela de kickoffs ainda não foi ativada.':'Não foi possível guardar/carregar o kickoff.',503);
    return r.json();
  }
  return {cfg,request,
    async authenticate(req) {
      const bearer=req.headers.authorization;
      if(!bearer||!cfg.anon)fail('Inicie sessão no CRM.',401);
      const r=await fetcher(cfg.url+'/auth/v1/user',{headers:{apikey:cfg.anon,Authorization:bearer}});
      if(!r.ok)fail('Sessão inválida.',401); const user=await r.json();
      if(user.is_anonymous || !user.id)fail('Acesso não autorizado.',403);
      // A valid Auth account alone is not CRM membership. Query only its own state.
      const rows=await request('crm_state?select=user_id&user_id=eq.'+encodeURIComponent(user.id), 'GET',null,{apikey:cfg.anon,Authorization:bearer});
      if(!rows.some(x=>x.user_id===user.id))fail('Sem acesso ao CRM.',403);
      return user.id;
    },
    async get(id,owner) {return (await request('kickoff_flows?id=eq.'+encodeURIComponent(id)+(owner?'&owner_id=eq.'+encodeURIComponent(owner):'')+'&limit=1'))[0];},
    async byToken(hash) {return (await request('kickoff_flows?token_hash=eq.'+hash+'&limit=1'))[0];},
    async list(owner,offset=0) {return request('kickoff_flows?owner_id=eq.'+encodeURIComponent(owner)+'&order=created_at.desc&limit=100&offset='+offset);},
    async insert(row) {return (await request('kickoff_flows','POST',row))[0];},
    async save(row,revision) {
      const updated=await request('kickoff_flows?id=eq.'+row.id+'&owner_id=eq.'+row.owner_id+'&revision=eq.'+revision,'PATCH',{...row,revision:revision+1});
      if(!updated.length)fail('Este kickoff foi atualizado noutra sessão. Recarregue antes de continuar.',409);
      return updated[0];
    }
  };
}
module.exports={repository,config};
