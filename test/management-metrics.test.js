const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {commercialCatalog,addonCatalog}=require('../kickoff-catalog');
const {normalizePayload}=require('../api/kickoff');
const M=require('../kickoffs/model');
test('management metrics is an optional monthly 12 euro addon across kickoff products',()=>{
  assert.equal(addonCatalog['management-metrics'].unitPrice,12);
  for(const [product,c] of Object.entries(commercialCatalog)){
    assert.ok(c.addons.includes('management-metrics'));
    const plan=Object.keys(c.plans)[0];
    const original=normalizePayload({product,plan,addons:[]});
    const added=normalizePayload({product,plan,addons:[{id:'management-metrics'}]});
    assert.equal(added.estimatedMonthlyPrice-original.estimatedMonthlyPrice,12);
  }
});
test('personal kickoff calculates metrics with customer taxes and preserves monthly billing',()=>{
  const input={product:'presenca',plan:'presenca-essencial',company:'Test',contact:'Test',phone:'910000000',email:'test@example.com',vat:23,retention:0,initialBase:0,paymentMethod:'bank_transfer',addons:[{id:'management-metrics'}]};
  const o=M.offer(input);
  assert.equal(o.total.base,51);assert.equal(o.total.total,62.73);
  assert.match(o.addons[0].description,/12 €\/mês/);
  assert.equal(M.offer({...input,vat:0}).total.total,51);
  for(const period of ['annual','once'])assert.throws(()=>M.offer({...input,period}),/mensal/);
});
test('proposal catalogue adds metrics without changing default service',()=>{
  const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../pricing.js'),'utf8'),context);
  const cats=context.window.UNEED_PRICING.categories;
  assert.equal(cats[0].id,'uneed-start');
  const items=cats.flatMap(c=>c.items).filter(i=>i.id==='addon:management-metrics');
  assert.equal(items.length,1);assert.equal(items[0].price,12);assert.equal(items[0].billing,'Mensal');
});
