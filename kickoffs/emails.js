const {shell,escapeHtml:h}=require('../api/kickoff-email');
const money=n=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(n);
function compose(row,link,payment,internal=false,invite=false) {
  const o=row.data.offer,a=row.data.answers,reference='UNEED-'+row.id.slice(0,8).toUpperCase();
  const lines=[o.company,o.planName,`Referência: ${reference}`,`Base: ${money(o.total.base)} · IVA: ${money(o.total.vat)} · Total: ${money(o.total.total)} · Retenção: ${money(o.total.retention)} · Líquido: ${money(o.total.net)} (${o.period==='monthly'?'mensal':o.period==='annual'?'anual':'pontual'})`,
    ...o.addons.map(x=>`${x.name} × ${x.quantity}${x.languages.length?' · '+x.languages.join(', '):''}: ${money(x.subtotal)}`),
    `Pagamento inicial: ${money(o.initial.net)} (base ${money(o.initial.base)}, IVA ${money(o.initial.vat)}, retenção ${money(o.initial.retention)})`,
    o.paymentMethod==='mbway'?`MB WAY: ${payment.mbway}`:`Transferência: ${payment.accountName} · ${payment.iban}`,
    ...(o.requiresDebit?['Débito direto: por validar pela UNEED',o.gocardless?`Ativar: ${o.gocardless}`:'A UNEED enviará o link de adesão.']:['Débito direto: não aplicável']),
    `Conteúdos: ${row.data.checks.content?'validados':o.requiresContent?'a validar':'não aplicável'}`,
    'O prazo começa após confirmação do pagamento e débito direto aplicáveis, conteúdos e validação UNEED.',
    ...(o.deadline?[`Prazo estimado: ${o.deadline}`]:[]),
    ...(internal?[`Contacto: ${o.contact} · ${o.email} · ${o.phone}`,`Alterações: ${a.changes||'—'}`,`Conteúdos: ${a.contentLinks||'—'}`]:[]),link];
  const title=invite?'O seu kickoff UNEED':internal?'Kickoff recebido':'Recebemos o seu kickoff';
  const body=lines.map(x=>`<p>${h(x)}</p>`).join('')+`<p><a href="${h(link)}">${internal?'Abrir no CRM':'Abrir o seu kickoff'}</a></p>`;
  return {subject:`${title} · ${reference}`,text:lines.join('\n'),html:shell({preview:title,eyebrow:'UNEED · Kickoff',title,intro:invite?o.intro:'Acompanhe os próximos passos pelo seu link.',body})};
}
module.exports={compose};
