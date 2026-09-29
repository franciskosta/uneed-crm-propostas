const KickoffGallery=(()=>{
  const T=UNEED_KICKOFF_TEMPLATES,C=UNEED_KICKOFF_CATALOG;
  let callbacks,clientName='',group='presenca';
  const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(n);
  function render(){
    const host=document.querySelector('#kickoffGallery');
    host.innerHTML=`<header class="kg-hero"><div><p class="kg-eyebrow">UM BOM COMEÇO MUDA TUDO</p><h2>O próximo projeto<br>começa <em>aqui.</em></h2><p>Escolhe o modelo. Dá-lhe um nome. Partilha o link.<br>O cliente trata do resto, ao seu ritmo.</p>${clientName?`<p class="kg-client">A preparar para <strong>${h(clientName)}</strong></p>`:''}</div><div class="kg-hero-mark" aria-hidden="true">${T.artwork('spark')}<span>feito para<br><strong>começar.</strong></span></div></header><nav class="kg-tabs" aria-label="Tipos de kickoff">${Object.entries({presenca:'Presença digital',marcacoes:'Marcações',leads:'Captação de leads'}).map(([id,label])=>`<button type="button" data-group="${id}" aria-pressed="${id===group}">${label}</button>`).join('')}</nav><div class="kg-grid">${T.templates.filter(t=>t.product===group).map(t=>{const p=C.commercialCatalog[t.product].plans[t.plan];return `<button type="button" class="kg-card" data-template="${t.id}"><div class="kg-art kg-${t.tone}" aria-hidden="true"><span class="kg-orbit"></span><span class="kg-art-icon">${T.artwork(t.art)}</span><span class="kg-browser"><i></i><i></i><i></i><b></b><b></b></span><span class="kg-art-label">uneed.</span></div><div class="kg-card-copy"><span class="kg-eyebrow">${h(p.name)}</span><h3>${h(t.title)}</h3><p>${h(t.subtitle)}</p><div class="kg-card-footer"><span><strong>${money(p.price)}</strong> / mês + IVA</span><span class="kg-arrow" aria-hidden="true">↗</span></div></div></button>`;}).join('')}</div><p class="kg-fine">Modelos com preços de catálogo, IVA de 23% e sem retenção. Para condições fiscais ou comerciais diferentes, <button type="button" data-advanced>preparar uma oferta acordada</button>. Os links anteriores e o acompanhamento continuam abaixo.</p>`;
    host.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{group=b.dataset.group;render();});
    host.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>choose(b.dataset.template));
    host.querySelector('[data-advanced]').onclick=()=>callbacks.advanced(clientName);
  }
  function choose(id){
    const t=T.get(id),plan=C.commercialCatalog[t.product].plans[t.plan];
    const d=document.createElement('dialog');d.className='customer-dialog kg-dialog';
    d.innerHTML=`<button type="button" class="kg-close" aria-label="Fechar">×</button><p class="kg-eyebrow">${h(t.title)}</p><h2>Para quem vamos<br>preparar este começo?</h2><p>${money(plan.price)} / mês + IVA. O cliente pode escolher extras no final.</p><form><label>Nome do cliente ou negócio<input name="company" maxlength="180" required autocomplete="organization" placeholder="Ex.: Studio Aurora" value="${h(clientName)}"></label><button class="button primary" type="submit">Criar link personalizado <span aria-hidden="true">↗</span></button></form><p role="status" data-feedback></p>`;
    document.body.append(d);d.querySelector('.kg-close').onclick=()=>d.close();d.onclose=()=>d.remove();d.showModal();
    const requestId=crypto.randomUUID();
    d.querySelector('form').onsubmit=async e=>{
      e.preventDefault();const f=e.currentTarget,b=f.querySelector('button'),company=f.elements.company.value.trim();if(!company){f.elements.company.focus();return;}
      b.disabled=true;const feedback=d.querySelector('[data-feedback]');feedback.textContent='A preparar o link…';
      try{const result=await callbacks.api({action:'create-template',templateId:id,company,requestId});
        f.innerHTML=`<label>Link de ${h(company)}<input readonly data-link value="${h(result.url)}"></label><button type="button" class="button primary" data-copy>Copiar link</button><a class="button ghost" href="${h(result.url)}" target="_blank" rel="noopener noreferrer">Abrir kickoff</a>`;
        feedback.textContent='Pronto a partilhar. Nenhum email foi enviado. No final, o cliente recebe confirmação e a UNEED recebe a notificação para responder com o GoCardless.';
        f.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(result.url);feedback.textContent='Link copiado. Pode enviá-lo por WhatsApp, email ou outro canal.';}catch{f.querySelector('[data-link]').select();feedback.textContent='Selecione e copie o link acima.';}};
        callbacks.refresh();
      }catch(err){feedback.textContent=err.message;b.disabled=false;}
    };
  }
  function start(name=''){clientName=name;render();document.querySelector('#kickoffGallery').scrollIntoView({behavior:'smooth',block:'start'});}
  function init(options){callbacks=options;render();}
  return {init,start};
})();
