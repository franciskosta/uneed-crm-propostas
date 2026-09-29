const {test}=require('node:test');const assert=require('node:assert/strict');const C=require('../customer-model');
test('base, VAT and withholding are separate; withholding excludes VAT',()=>{
 assert.deepEqual(C.fiscal(100,23,25),{base:100,vat:23,retention:25,total:123,net:98});
 assert.equal(C.fiscal(100,0,0).net,100);assert.equal(C.fiscal(100,0,11.5).net,88.5);
 assert.equal(C.fiscal(39,23,0).net,47.97);assert.throws(()=>C.fiscal(10,-1,0));
});
test('archive is reversible and does not delete commercial data',()=>{
 const s={proposals:[{id:'x',status:'Perdido',services:[]}]};C.archive(s,'x');assert.deepEqual(s.archivedCustomerIds,['x']);assert.equal(s.proposals.length,1);C.archive(s,'x',false);assert.deepEqual(s.archivedCustomerIds,[]);
 s.proposals[0].status='Aceite';assert.throws(()=>C.archive(s,'x'),/inativos/);
});
test('conversion preserves existing tax rates and propagates explicit changes',()=>{
 const s={proposals:[{id:'p',vatMode:'23',withholdingMode:'11.5'}]},l={id:'l',status:'Cliente ativo',customer:{proposalId:'p',service:'x',rows:[{selected:true,qty:1,price:100}]}};
 C.sync(s,l);assert.equal(s.proposals[0].vatMode,'23');assert.equal(s.proposals[0].withholdingMode,'11.5');
 l.customer.vatMode='0';l.customer.withholdingMode='25';C.sync(s,l);assert.equal(s.proposals[0].vatMode,'0');assert.equal(s.proposals[0].withholdingMode,'25');
});
