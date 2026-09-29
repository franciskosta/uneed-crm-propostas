(()=>{
  'use strict';
  const token=location.pathname.split('/').filter(Boolean)[1]||'',tracking=location.pathname.startsWith('/inicio/');
  const host=document.querySelector('#kpBody'),status=document.querySelector('#kpStatus'),error=document.querySelector('#kpError');
  const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(n);
  let record,payment,step=1,timer,queue=Promise.resolve(),conflict=false;
  const captions=['Confirmar serviço','Dados e faturação','Configuração','Conteúdos e alterações','Pagamento e débito direto','Revisão e envio'];
  async function request(body){const r=await fetch('/api/kickoffs',{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Kickoff-Token':token},...(body?{body:JSON.stringify(body)}:{})});const p=await r.json().catch(()=>({error:'Resposta inválida. Tente mais tarde.'}));if(!r.ok){if(r.status===409)conflict=true;throw Error(p.error);}return p;}
  function totals(t){return `Base ${money(t.base)} + IVA ${money(t.vat)} = ${money(t.total)} − retenção ${money(t.retention)} = <strong>${money(t.net)} líquido</strong>`;}
  function summary(){const o=record.offer;return `<h2>${h(o.company)}</h2><p>${h(o.intro)}</p><h3>${h(o.planName)} · ${h(o.niche)}</h3><p>${totals(o.total)} / ${o.period==='monthly'?'mês':o.period==='annual'?'ano':'trabalho'}</p>${o.addons.map(a=>`<p>${h(a.name)} × ${a.quantity}${a.languages.length?' · '+h(a.languages.join(', ')):''}: ${money(a.subtotal)}</p>`).join('')}<p>${h(o.taxNotes)}</p><p>Prazo estimado: ${h(o.deadline||'A confirmar pela UNEED')}</p>`;}
  function pay(){const o=record.offer;return `<h3>Primeiro pagamento</h3><p>${totals(o.initial)}</p>${o.initial.net===0?'<p>Sem pagamento inicial.</p>':o.paymentMethod==='mbway'?`<p>MB WAY: <strong>${h(payment.mbway||'Contacte a UNEED para receber os dados.')}</strong></p>`:`<p>Titular: ${h(payment.accountName)}<br>IBAN: <strong>${h(payment.iban||'Contacte a UNEED para receber os dados.')}</strong></p>`}<p>Referência: <strong>${h(record.reference)}</strong></p><h3>Débito direto</h3>${!o.requiresDebit?'<p>Não aplicável.</p>':o.gocardless?`<p>Dia de cobrança pretendido: ${o.collectionDay}</p><a class="button primary" href="${h(o.gocardless)}" target="_blank" rel="noopener noreferrer">Ativar débito direto</a>`:'<p>A UNEED disponibilizará o link de adesão.</p>'}<p>Abrir o GoCardless não confirma o mandato. A equipa valida os pagamentos e o débito direto.</p>`;}
  function answers(){const f=host.querySelector('form');if(!f)return record.answers;return {...record.answers,...Object.fromEntries(new FormData(f)),accepted:f.elements.accepted?f.elements.accepted.checked:record.answers.accepted};}
  function save(action='save') {
    clearTimeout(timer);const snapshot=answers();record.answers=snapshot;
    queue=queue.catch(()=>{}).then(async()=>{
      if(conflict)throw Error('O kickoff foi alterado noutra sessão. Copie as alterações e recarregue a página.');
      status.textContent='A guardar…';error.textContent='';
      let p;
      try {p=await request({action,revision:record.revision,answers:snapshot,stage:step});}
      catch(e){if(!e.message.startsWith('Aguarde um instante'))throw e;await new Promise(resolve=>setTimeout(resolve,800));p=await request({action,revision:record.revision,answers:snapshot,stage:step});}
      record.revision=p.kickoff.revision;record.checks=p.kickoff.checks;record.status=p.kickoff.status;record.submittedAt=p.kickoff.submittedAt;
      status.textContent=p.warning||'Progresso guardado. Pode regressar pelo mesmo link.';
      return p;
    });return queue;
  }
  function field(key,label,multiline=false,required=false){const v=record.answers[key]??record.offer[key]??'';return `<label>${h(label)}${multiline?`<textarea name="${key}" ${required?'required':''}>${h(v)}</textarea>`:`<input name="${key}" value="${h(v)}" ${required?'required':''}>`}</label>`;}
  function render(){
    const o=record.offer;
    const serviceCopy=o.product==='marcacoes'?'Indique serviços, duração das marcações, equipa e disponibilidade.':o.product==='leads'?'Descreva a oferta, o público e as informações necessárias para qualificar os contactos.':'Descreva o negócio, os serviços e os contactos a apresentar no site.';
    const panels=[summary()+'<p>Esta oferta foi preparada pela UNEED. Para alterar o serviço ou preço, contacte a equipa.</p>',
      field('contact','Nome do contacto',false,true)+field('phone','Telefone',false,true)+`<p>Email de contacto: ${h(o.email)} (para alterar, contacte a UNEED)</p>`+field('taxId','NIF (9 dígitos)',false,true)+field('billingAddress','Morada de faturação',true,true),
      `<p>${h(serviceCopy)}</p>`+field('domain','Domínio pretendido ou existente')+field('services','Serviços / oferta e configurações',true)+field('hours','Horários e disponibilidade',true)+field('team','Equipa / destinatários dos contactos',true),
      field('siteType','Site novo ou alteração de site existente?')+field('currentUrl','URL atual (https://)')+field('keep','O que pretende manter?',true)+field('remove','O que pretende remover?',true)+field('changes','O que pretende criar ou alterar?',true,true)+field('newPages','Novas páginas / conteúdos',true)+field('references','Referências visuais e sites de que gosta',true)+field('contentLinks','Links para ficheiros/imagens partilhados com a UNEED',true)+'<p>Partilhe links de uma pasta ou envie os ficheiros para geral@uneed.pt com a referência. Este formulário não faz upload de ficheiros.</p>'+field('notes','Notas adicionais',true),
      pay(),summary()+`<h3>As suas informações</h3>${Object.entries(record.answers).filter(([k])=>k!=='accepted').map(([k,v])=>`<p><strong>${h(k)}</strong>: ${h(v)}</p>`).join('')}<label><input name="accepted" type="checkbox" required ${record.answers.accepted?'checked':''}> Confirmo a oferta e os dados, e autorizo o seu tratamento para preparação do serviço.</label><p>O prazo começa após os pagamentos, débito direto e conteúdos aplicáveis estarem validados pela UNEED.</p>`];
    host.innerHTML=`<div class="kickoff-progress"><span style="width:${step/6*100}%"></span></div><p>Passo ${step} de 6 · ${captions[step-1]}</p><section class="panel"><form>${panels[step-1]}<div>${step>1?'<button type="button" data-back class="button ghost">Anterior</button>':''}<button type="button" data-save class="button ghost">Guardar e continuar mais tarde</button><button type="submit" class="button primary">${step===6?'Confirmar e enviar':'Guardar e continuar'}</button></div></form></section>`;
    const f=host.querySelector('form');f.oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>save().catch(e=>{error.textContent=e.message;status.textContent='Alterações por guardar.';}),1600);};
    host.querySelector('[data-save]').onclick=()=>save().catch(e=>error.textContent=e.message);
    host.querySelector('[data-back]')?.addEventListener('click',async()=>{try{await save();step--;render();}catch(e){error.textContent=e.message;}});
    f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('[type=submit]');b.disabled=true;try{await save(step===6?'submit':'save');if(step===6){location.assign('/inicio/'+token);}else{step++;render();}}catch(e){error.textContent=e.message;}finally{b.disabled=false;}};
  }
  function track(){const c=record.checks,o=record.offer;const rows=[['Pedido recebido',!!record.submittedAt],['Primeiro pagamento',o.initial.net===0||c.payment],['Débito direto',!o.requiresDebit||c.debit],['Informações e conteúdos',!o.requiresContent||c.content],['Validação UNEED',c.validated],['Execução iniciada',c.execution]];
    host.innerHTML=`<section class="panel">${summary()}<p>Referência ${h(record.reference)}</p>${rows.map(([s,done])=>`<div class="kickoff-check ${done?'done':''}">${done?'✓':'○'} ${s}</div>`).join('')}${!record.submittedAt?`<a href="/kickoff/${token}" class="button primary">Concluir informação</a>`:record.status!=='completed'?`<a href="/kickoff/${token}" class="button ghost">Consultar / completar conteúdos</a>`:'<p>Kickoff concluído. A equipa acompanha a execução.</p>'}<details ${!c.payment||o.requiresDebit&&!c.debit?'open':''}><summary>Ver dados para pagamento e débito direto</summary>${pay()}</details><p>As confirmações são feitas pela UNEED. Atualize esta página para consultar o estado mais recente.</p></section>`;
  }
  request().then(async p=>{record=p.kickoff;payment=p.payment;try{const opened=await request({action:'open'});record=opened.kickoff;}catch{/* Opening telemetry must not prevent access. */}status.textContent='O seu kickoff está guardado e acessível por este link.';step=Math.max(1,Math.min(6,record.stage||1));if(tracking||record.status==='completed')track();else render();}).catch(e=>{status.textContent='';error.textContent=e.message;});
})();
