function customerOptions(values, selected) {
  return Object.entries(values).map(([v,t])=>`<option value="${escapeAttr(v)}" ${String(selected)===v?'selected':''}>${escapeHtml(t)}</option>`).join('');
}
function customerActions(lead) {
  if (lead.status !== 'Cliente ativo') return '';
  const c=lead.customer, a=c?.rows ? UNEED_CUSTOMERS.amounts(c.rows) : null;
  return `<section class="customer-activation"><strong>Cliente ativo · ${c?.service?'Serviço configurado':'Completar ativação'}</strong>${a?`<p>${eur(a.monthly)}/mês · ${eur(a.once)} pontual${a.annual?` · ${eur(a.annual)}/ano`:''}</p>`:''}<button type="button" class="button primary mini" data-customer-lead="${escapeAttr(lead.id)}">${c?.service?'Serviço, add-ons e ficha':'Configurar serviço e ativação'}</button>${c?.service?`<span class="card-meta">Adjudicação: ${escapeHtml(c.deposit || 'não')} · DD: ${escapeHtml(c.directDebit || 'não')} · Contrato: ${escapeHtml(c.contract || 'não')}</span>`:''}</section>`;
}
function customerCatalog() { return (state.catalog || []).map((s,i)=>({...s,id:s.id || `catalog-${i}`})); }
function openCustomerEditor(lead, legacyProposal) {
  const current=lead?.customer || legacyProposal?.customer || (legacyProposal ? {service:legacyProposal.services?.[0]?.id || 'custom',rows:legacyProposal.services || [],type:UNEED_CUSTOMERS.typeOf(legacyProposal),active:['Aceite','Em desenvolvimento','Concluído','Faturado'].includes(legacyProposal.status)} : {});
  const c={...current};
  const catalog=customerCatalog();
  const primary=c.rows?.[0];
  const id=lead?.id || legacyProposal.id;
  const d=document.createElement('dialog'); d.className='customer-dialog';
  const value=(key,fallback='')=>escapeAttr(c[key] ?? fallback);
  const field=(key,label,fallback='',type='text')=>`<label>${label}<input name="${key}" type="${type}" value="${value(key,fallback)}"></label>`;
  d.innerHTML=`<form><header><div><p class="eyebrow">Ficha de cliente</p><h2>${escapeHtml(lead?.name || legacyProposal?.companyName || 'Cliente')}</h2></div><button type="button" class="button ghost" data-close>Fechar</button></header><p>Valores sem IVA. Ativar não emite faturas nem confirma pagamentos automaticamente.</p><div class="customer-form-grid">
    ${field('companyName','Empresa / nome comercial',lead?.name || legacyProposal?.companyName)}
    ${field('contactName','Pessoa de contacto',lead?.contactName || legacyProposal?.clientName)}
    ${field('email','Email',lead?.email || legacyProposal?.clientEmail,'email')}${field('phone','Telefone',lead?.phone || legacyProposal?.clientPhone)}
    ${field('nif','NIF',legacyProposal?.clientNif)}${field('address','Morada')}${field('postalCode','Código postal')}
    ${field('municipality','Localidade',lead?.municipality || legacyProposal?.municipality)}${field('niche','Nicho',lead?.niche || legacyProposal?.niche)}
    ${field('website','Website',lead?.website || legacyProposal?.companyWebsite)}${field('instagramUrl','Instagram',lead?.instagramUrl)}
    <label>Tipologia<select name="type">${customerOptions(UNEED_CUSTOMERS.types,c.type || (lead?.acquisitionStrategy==='high_ticket'?'high_ticket':'presence'))}</select></label>
    ${field('startDate','Data de início',today(),'date')}
    <label>Estado<select name="active">${customerOptions({yes:'Ativo',no:'Inativo / pausado'},c.active===false?'no':'yes')}</select></label>
    <label>Serviço adquirido<select name="service" required><option value="">Selecionar serviço</option>${catalog.map(s=>`<option value="${escapeAttr(s.id)}" ${c.service===s.id?'selected':''}>${escapeHtml(s.name)} · ${eur(s.price)} · ${escapeHtml(s.billing || 'Pontual')}</option>`).join('')}<option value="custom" ${c.service==='custom'?'selected':''}>Trabalho personalizado / High Ticket</option></select></label>
    ${lead ? `<label>Associar venda existente (evita duplicação)<select name="proposalId"><option value="">Nova venda ligada ao lead</option>${state.proposals.filter(p=>p.id===c.proposalId || (lead.companyId && p.companyId===lead.companyId)).map(p=>`<option value="${escapeAttr(p.id)}" ${c.proposalId===p.id?'selected':''}>${escapeHtml(p.companyName || p.clientName)} · ${escapeHtml(p.status)} · ${eur(totals(p).taxable)}</option>`).join('')}</select></label>` : ''}
    ${field('serviceName','Descrição do serviço',primary?.name || '')}
    ${field('price','Preço acordado (€)',primary?.price ?? '', 'number')}
    <label>Periodicidade<select name="billing">${customerOptions({'Mensal':'Mensal','Pronto pagamento':'Pontual','Anual':'Anual'},primary?.billing || 'Mensal')}</select></label>
    <label>Adjudicação paga?<select name="deposit">${customerOptions({'não':'Não','sim mbway':'Sim · MB WAY','sim TB':'Sim · transferência bancária'},c.deposit || 'não')}</select></label>
    <label>Débito direto ativo?<select name="directDebit">${customerOptions({'não':'Não','sim':'Sim','N/A':'N/A'},c.directDebit || 'não')}</select></label>
    <label>Contrato?<select name="contract">${customerOptions({'não':'Não','sim':'Sim','gerar':'Gerar / abrir rascunho'},c.contract || 'não')}</select></label>
    </div><fieldset><legend>Add-ons · seleção múltipla</legend><div class="customer-addons">${UNEED_CUSTOMERS.addons.map(a=>{const saved=c.rows?.find(r=>r.id===`addon:${a.id}`);return `<label><span><input type="checkbox" data-addon="${a.id}" ${saved?'checked':''}> ${escapeHtml(a.name)}</span><input aria-label="Quantidade ${escapeAttr(a.name)}" data-addon-qty="${a.id}" type="number" min="1" step="1" value="${saved?.qty || 1}"><input aria-label="Preço ${escapeAttr(a.name)}" data-addon-price="${a.id}" type="number" min="0" step="0.01" value="${saved?.price ?? a.price ?? ''}" placeholder="Preço a confirmar"><select aria-label="Periodicidade ${escapeAttr(a.name)}" data-addon-billing="${a.id}">${customerOptions({'Mensal':'€/mês','Pronto pagamento':'€ pontual','Anual':'€/ano'},saved?.billing || 'Mensal')}</select></label>`;}).join('')}</div></fieldset>
    <label>Informações do cliente / notas<textarea name="notes" rows="3">${escapeHtml(c.notes ?? lead?.notes ?? '')}</textarea></label>
    <p data-totals class="customer-total"></p><p data-error role="alert"></p><div class="deal-actions"><button type="submit" class="button primary">Guardar ficha e valores</button><button type="button" class="button ghost" data-contract>Gerar contrato</button><a class="button ghost" href="https://manage.gocardless.com/" target="_blank" rel="noopener">Abrir GoCardless</a><button type="button" class="button ghost" data-kickoff>Abrir kickoff</button></div><p class="card-meta">GoCardless abre a gestão; a escolha “Sim” regista apenas a confirmação manual. O kickoff abre sem enviar mensagens.</p></form>`;
  document.body.append(d); const form=d.querySelector('form');
  form.elements.price.min='0'; form.elements.price.step='0.01';
  function rows() {
    const price=form.elements.price.value;
    if(price==='' || !Number.isFinite(Number(price)) || Number(price)<0) throw new Error('Indica um preço válido para o serviço.');
    const result=[{id:form.elements.service.value,name:form.elements.serviceName.value.trim(),price:Number(price),qty:1,billing:form.elements.billing.value,selected:true}];
    // Preserve existing proposal lines that are not managed by the add-on picker.
    result.push(...(c.rows || []).slice(1).filter(r=>!String(r.id || '').startsWith('addon:')).map(r=>({...r})));
    for(const a of UNEED_CUSTOMERS.addons) {
      if(!d.querySelector(`[data-addon="${a.id}"]`).checked) continue;
      const p=d.querySelector(`[data-addon-price="${a.id}"]`).value,q=Number(d.querySelector(`[data-addon-qty="${a.id}"]`).value);
      if(p==='' || !Number.isFinite(Number(p)) || Number(p)<0 || !Number.isInteger(q) || q<1) throw new Error(`Confirma o preço e a quantidade de ${a.name}.`);
      result.push({id:`addon:${a.id}`,name:a.name,price:Number(p),qty:q,billing:d.querySelector(`[data-addon-billing="${a.id}"]`).value,selected:true});
    }
    return result;
  }
  function preview() { try {const a=UNEED_CUSTOMERS.amounts(rows());d.querySelector('[data-totals]').textContent=`${eur(a.monthly)}/mês · ${eur(a.once)} pontual · ${eur(a.annual)}/ano (sem IVA)`;}catch(e){d.querySelector('[data-totals]').textContent=e.message;} }
  form.elements.service.onchange=()=>{const s=catalog.find(s=>s.id===form.elements.service.value); if(s){form.elements.serviceName.value=s.name;form.elements.price.value=s.price;form.elements.billing.value=s.billing || 'Pronto pagamento';}preview();};
  form.addEventListener('input',preview); form.addEventListener('change',preview);
  function save(quiet=false) {
    if(quiet ? !form.checkValidity() : !form.reportValidity()) return null;
    try {
      if(!form.elements.service.value || !form.elements.serviceName.value.trim()) throw new Error('Seleciona e descreve o serviço adquirido.');
      const data={...c,...Object.fromEntries(new FormData(form)),rows:rows()};data.active=data.active==='yes';
      let p;
      if(lead){lead.customer=data; Object.assign(lead,{name:data.companyName,phone:data.phone,email:data.email,municipality:data.municipality,niche:data.niche,website:data.website,instagramUrl:data.instagramUrl,notes:data.notes});p=UNEED_CUSTOMERS.sync(state,lead,emptyProposal());}
      else {p=state.proposals.find(p=>p.id===legacyProposal.id);Object.assign(p,{customer:data,services:data.rows,companyName:data.companyName,clientName:data.contactName,clientEmail:data.email,clientPhone:data.phone,clientNif:data.nif,companyWebsite:data.website,municipality:data.municipality,niche:data.niche});}
      saveState(); renderAll(); d.querySelector('[data-error]').textContent='Ficha atualizada. '+(qs('#syncStatus')?.textContent || ''); return p;
    }catch(e){d.querySelector('[data-error]').textContent=e.message;return null;}
  }
  function contract(p) {
    const previous=state.contracts?.find(x=>x.proposalId===p.id);
    if(previous){activeContractId=previous.id;switchView('contracts');renderContractForm();}
    else createContractFromProposal(p);
    d.close();
  }
  form.onsubmit=e=>{e.preventDefault();const p=save();if(p){if(form.elements.contract.value==='gerar')contract(p);else d.close();}};
  form.addEventListener('change',event=>{if(form.elements.service.value && form.elements.serviceName.value.trim() && form.elements.price.value!==''){const p=save(true);if(p && event.target===form.elements.contract && event.target.value==='gerar')contract(p);}});
  d.querySelector('[data-contract]').onclick=()=>{const p=save();if(p)contract(p);};
  d.querySelector('[data-kickoff]').onclick=()=>{const p=save();if(!p)return; const t=form.elements.type.value;const params=new URLSearchParams({produto:t==='bookings'?'marcacoes':t==='leads'?'leads':'presenca',nicho:form.elements.niche.value,plano:form.elements.service.value==='uneed-start-monthly'?'presenca-essencial':form.elements.service.value}); window.open(t==='high_ticket'||t==='other'?'/kickoff-project.html':`/kickoff?${params}`,'_blank','noopener');};
  d.querySelector('[data-close]').onclick=()=>d.close(); d.onclose=()=>d.remove();preview();d.showModal();
}

function renderClients() {
  const grid=qs('#clientsGrid');if(!grid)return;
  const all=UNEED_CUSTOMERS.records(state);
  const term=(qs('#clientSearchInput')?.value || '').toLowerCase(),type=qs('#customerTypeFilter')?.value || '',location=qs('#customerLocationFilter')?.value || '',niche=qs('#customerNicheFilter')?.value || '';
  for(const [id,key,caption] of [['customerLocationFilter','municipality','Todas as localidades'],['customerNicheFilter','niche','Todos os nichos']]) {const el=qs('#'+id),old=el.value;el.innerHTML=`<option value="">${caption}</option>`+[...new Set(all.map(c=>c[key]).filter(Boolean))].sort().map(v=>`<option ${v===old?'selected':''}>${escapeHtml(v)}</option>`).join('');}
  const items=all.filter(c=>(!type||c.type===type)&&(!location||c.municipality===location)&&(!niche||c.niche===niche)&&(!term||JSON.stringify([c.name,c.proposal.clientName,c.proposal.clientEmail,c.proposal.clientNif]).toLowerCase().includes(term)));
  const active=all.filter(c=>c.active);
  const mrr=recurringProposals().reduce((s,p)=>s+recurringMonthlyValue(p),0);
  qs('#customerMetrics').innerHTML=`<article><strong>${active.length}</strong><span>Clientes ativos</span></article><article><strong>${eur(mrr)}</strong><span>Mensalidade contratada</span></article><article><strong>${eur(state.recurringTarget || 0)}</strong><span>Meta mensal recorrente</span></article>`+Object.entries(UNEED_CUSTOMERS.types).map(([id,label])=>`<article><strong>${active.filter(c=>c.type===id).length}</strong><span>${label}</span></article>`).join('');
  grid.innerHTML=Object.entries(UNEED_CUSTOMERS.types).map(([id,label])=>{const group=items.filter(c=>c.type===id);return group.length?`<section class="customer-group"><h2>${label} <small>${group.length}</small></h2><div class="customer-wall">${group.map(c=>`<button type="button" class="customer-tile" data-customer-proposal="${escapeAttr(c.proposal.id)}"><span class="customer-light ${c.active?'active':''}" aria-label="${c.active?'Ativo':'Pendente / inativo'}"></span><strong>${escapeHtml(c.name)}</strong><span>${c.active?'Ativo':'Pendente / inativo'} · ${escapeHtml(c.startDate || 'Sem data')}</span><small>${escapeHtml([c.municipality,c.niche].filter(Boolean).join(' · '))}</small></button>`).join('')}</div></section>`:'';}).join('') || '<p class="empty">Sem clientes para estes filtros.</p>';
}

function setupCustomerWorkspace() {
  const command=qs('#view-command'),history=qs('#view-history'),recurring=qs('#view-recurring');
  for(const [source,target,title] of [[command,qs('#view-instagram'),'Missões e decisões'],[qs('#view-pipeline'),qs('#view-instagram'),'Propostas em curso'],[history,qs('#view-performance'),'Histórico comercial'],[recurring,qs('#view-clients'),'Detalhe de mensalidades e metas']]) {if(!source||!target)continue;const details=document.createElement('details');details.className='panel workspace-secondary';details.innerHTML=`<summary>${title}</summary>`;while(source.firstChild)details.append(source.firstChild);target.append(details);}
  for(const id of ['customerTypeFilter','customerLocationFilter','customerNicheFilter']) qs('#'+id).addEventListener('change',renderClients);
  document.addEventListener('click',e=>{const b=e.target.closest('[data-customer-lead],[data-customer-proposal]');if(!b)return;e.preventDefault();const lead=state.instagramProspects.find(p=>p.id===b.dataset.customerLead);if(lead)return openCustomerEditor(lead);const p=state.proposals.find(p=>p.id===b.dataset.customerProposal);if(p)openCustomerEditor(state.instagramProspects.find(l=>l.id===p.sourceProspectId),p);});
}
