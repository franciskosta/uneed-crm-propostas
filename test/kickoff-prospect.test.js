const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const I=require('../kickoff-intake');
test('niche filter includes supported niches even before first kickoff',()=>{
  const options=I.nicheOptions([]);assert.equal(options.veterinaria,'Clínica veterinária');assert.equal(options.cabeleireiro,'Cabeleireiro / barbearia');
  assert.equal(I.nicheOptions(['Indústria','clinica'])['Indústria'],'Indústria');
});
test('prospecting seed carries identity without creating a commercial sale',()=>{
  const lead={id:'prospect-1',name:'Clínica Exemplo',niche:'Clínicas veterinárias',email:'public@example.com',phone:'910000000',companyId:'company-1',leadId:'lead-1'};
  const copy=structuredClone(lead),seed=I.prospectSeed(lead);
  assert.equal(seed.company,lead.name);assert.equal(seed.niche,lead.niche);assert.equal(seed.email,lead.email);assert.equal(seed.leadId,'lead-1');assert.equal(seed.companyId,'company-1');assert.equal(seed.basePrice,undefined);assert.deepEqual(lead,copy);
});
test('customer corrections take precedence over prospecting values',()=>{
  const seed=I.prospectSeed({id:'p',name:'Old',phone:'old',customer:{companyName:'New',phone:'new',contactName:'Ana',nif:'123456789',address:'Rua A'}});
  assert.equal(seed.company,'New');assert.equal(seed.contact,'Ana');assert.equal(seed.phone,'new');assert.equal(seed.taxId,'123456789');assert.equal(seed.billingAddress,'Rua A');
});
test('kanban directly exposes kickoff preparation and list explains filters',()=>{
  const app=fs.readFileSync(require.resolve('../app.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  assert.match(app,/data-prospect-kickoff/);assert.match(app,/KickoffsUI.fromProspect/);assert.match(html,/Fase do kickoff/);assert.match(html,/Não é o estado comercial do lead/);
});
