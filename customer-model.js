(function(root) {
  const types = { presence: 'UNEED Presença', bookings: 'Marcações', leads: 'Captação de leads', high_ticket: 'High Ticket', other: 'Outros' };
  const addons = [
    ['extra-email','Email extra',6], ['extra-language','Idioma extra',5],
    ['guided-assistant','Assistente Guiado',12], ['smart-assistant','Assistente Inteligente',29],
    ['backoffice','Backoffice',15], ['remove-credit','Remover crédito UNEED',5],
    ['sms','SMS',null], ['multi-location','Multi-estabelecimento',null],
    ['registrations','Inscrições',null], ['cards','Cartões',null]
  ].map(([id,name,price]) => ({id,name,price,billing:'Mensal'}));
  function typeOf(p) {
    if (p.customer?.type) return p.customer.type;
    const text = (p.services || []).map(s => `${s.id || ''} ${s.name || ''}`).join(' ').toLowerCase();
    if (/uneed.start|presen/.test(text)) return 'presence';
    if (/booking|marcaç/.test(text)) return 'bookings';
    if (/leads/.test(text)) return 'leads';
    return p.acquisitionStrategy === 'high_ticket' ? 'high_ticket' : 'other';
  }
  function amounts(rows) {
    return rows.reduce((a,s) => { if (!s.selected) return a; const v = Number(s.price)*Number(s.qty); if (!Number.isFinite(v) || v<0) throw new Error('Preço inválido'); const b=String(s.billing).toLowerCase(); a[b.includes('mensal')?'monthly':b.includes('anual')?'annual':'once'] += v; return a; },{monthly:0,annual:0,once:0});
  }
  function sync(state, lead, seed = {}) {
    const sale=lead.customer;
    if (!sale?.service || !sale.rows?.length) return null;
    amounts(sale.rows);
    state.proposals ||= [];
    let proposal=state.proposals.find(p => p.id === sale.proposalId || p.sourceProspectId === lead.id);
    if (!proposal) { proposal={...seed,id:`customer-sale:${lead.id}`,createdAt:new Date().toISOString(),status:'Aceite',followupDate:'',proposalSentDate:'',discount:0,vatMode:'0',withholdingMode:'0',billedAmount:0,paidAmount:0}; state.proposals.push(proposal); }
    sale.proposalId=proposal.id;
    Object.assign(proposal, { sourceProspectId:lead.id, companyId:lead.companyId || proposal.companyId, leadId:lead.leadId || proposal.leadId,
      companyName:sale.companyName || lead.name || '', clientName:sale.contactName || lead.contactName || lead.name || '',
      clientEmail:sale.email || lead.email || '', clientPhone:sale.phone || lead.phone || '',clientNif:sale.nif || '',
      companyWebsite:sale.website || lead.website || '', municipality:sale.municipality || lead.municipality || '', niche:sale.niche || lead.niche || '',
      services:sale.rows.map(r=>({...r})), customer:{...sale,active:lead.status==='Cliente ativo' && sale.active!==false},
      closedDate:sale.startDate,updatedAt:new Date().toISOString() });
    return proposal;
  }
  function records(state) {
    const groups=new Map();
    for (const p of state.proposals || []) {
      const key=p.companyId || p.customer?.proposalId || p.id;
      if (!groups.has(key)) groups.set(key,{id:key,proposals:[],name:p.companyName || p.clientName || 'Cliente sem nome'});
      groups.get(key).proposals.push(p);
    }
    return [...groups.values()].map(g => {
      const p=g.proposals.find(p=>p.customer) || g.proposals[0];
      const active=g.proposals.some(p=>p.customer ? p.customer.active!==false : ['Aceite','Em desenvolvimento','Concluído','Faturado'].includes(p.status));
      return {...g,proposal:p,type:typeOf(p),active,startDate:p.customer?.startDate || p.closedDate || (p.createdAt || '').slice(0,10),municipality:p.municipality || p.customer?.municipality || '',niche:p.niche || p.customer?.niche || ''};
    });
  }
  const api={types,addons,typeOf,amounts,sync,records};
  if(typeof module!=='undefined') module.exports=api;
  if(root) root.UNEED_CUSTOMERS=api;
})(typeof window!=='undefined'?window:null);
