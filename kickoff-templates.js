(function(root){
  'use strict';
  const C=typeof module!=='undefined'?require('./kickoff-catalog'):root.UNEED_KICKOFF_CATALOG;
  const templates=[
    {id:'presenca-geral',product:'presenca',niche:'geral',title:'O seu negócio, online',subtitle:'Uma presença profissional, qualquer que seja a sua atividade.',art:'spark',tone:'indigo'},
    {id:'presenca-cabelo',product:'presenca',niche:'cabeleireiro',title:'Cabelo & estilo',subtitle:'Salões e barbearias com uma identidade à sua medida.',art:'scissors',tone:'rose'},
    {id:'presenca-beleza',product:'presenca',niche:'estetica',title:'Beleza & bem-estar',subtitle:'O espaço, os tratamentos e os detalhes que fazem a diferença.',art:'flower',tone:'peach'},
    {id:'presenca-saude',product:'presenca',niche:'clinica',title:'Saúde & cuidado',subtitle:'Especialidades, equipa e informação que inspira confiança.',art:'cross',tone:'mint'},
    {id:'presenca-vet',product:'presenca',niche:'veterinaria',title:'Cuidado de quatro patas',subtitle:'Uma página próxima dos tutores e dos seus companheiros.',art:'paw',tone:'blue'},
    {id:'presenca-restaurante',product:'presenca',niche:'restaurante',title:'À mesa do seu negócio',subtitle:'Sabores, ambiente e a próxima visita começam aqui.',art:'plate',tone:'peach'},
    {id:'presenca-b2b',product:'presenca',niche:'b2b',title:'Negócios que ligam negócios',subtitle:'Soluções, serviços e contactos comerciais num só lugar.',art:'grid',tone:'indigo'},
    ...['start','pro','premium'].map((level,i)=>({id:'marcacoes-'+level,product:'marcacoes',plan:'bookings-'+level+'-monthly',niche:'geral',title:['Marcações Start','Marcações Pro','Marcações Premium'][i],subtitle:'Serviços, equipa e disponibilidade. Vamos organizar a sua agenda.',art:'calendar',tone:'mint'})),
    ...['start','flow','ai'].map((level,i)=>({id:'leads-'+level,product:'leads',plan:'leads-'+level+'-monthly',niche:'geral',title:['Leads Start','Leads Flow','Leads AI'][i],subtitle:'A oferta certa, as perguntas certas e mais oportunidades.',art:'spark',tone:'blue'}))
  ].map(t=>({...t,plan:t.plan||C.commercialCatalog[t.product].defaultPlan}));
  function get(id){return templates.find(t=>t.id===id);}
  const descriptions={
    'management-metrics':'Indicadores para acompanhar a gestão do negócio, de acordo com os dados e integrações configurados.',
    'extra-email':'Mais uma conta de email profissional para a sua equipa.',
    'extra-language':'Apresente o seu negócio noutros idiomas.',
    'guided-assistant':'Respostas e encaminhamento através de opções preparadas.',
    'smart-assistant':'Perguntas livres com IA, com base na informação aprovada do negócio.',
    backoffice:'Edite os conteúdos definidos para o seu site.',
    'remove-credit':'Retire a assinatura UNEED do rodapé.'
  };
  function available(product){return C.commercialCatalog[product].addons.filter(id=>Number.isFinite(C.addonCatalog[id].unitPrice));}
  function selection(product,input){
    if(!Array.isArray(input)||input.length>20)throw Error('Seleção de extras inválida.');
    const seen=new Set();return input.map(a=>{
      if(!a||!available(product).includes(a.id)||seen.has(a.id))throw Error('Extra inválido ou repetido.');seen.add(a.id);
      const def=C.addonCatalog[a.id],languages=Array.isArray(a.languages)?[...new Set(a.languages)]:[];
      if(languages.some(l=>!C.allowedLanguages.includes(l)))throw Error('Idioma inválido.');
      const quantity=def.type==='languages'?languages.length:def.type==='quantity'?Number(a.quantity):1;
      if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw Error('Confirme a quantidade ou os idiomas do extra.');
      return {id:a.id,name:def.name,quantity,languages: def.type==='languages'?languages:[],unitPrice:def.unitPrice,subtotal:Math.round(def.unitPrice*quantity*100)/100};
    });
  }
  // Code-native illustrations: lightweight, no external tracking or image requests.
  function artwork(kind){const paths={spark:'M48 16 57 39 80 48 57 57 48 80 39 57 16 48 39 39Z',cross:'M35 19H61V35H77V61H61V77H35V61H19V35H35Z',grid:'M20 20H40V40H20ZM56 20H76V40H56ZM20 56H40V76H20ZM56 56H76V76H56Z',calendar:'M22 28H74V76H22ZM22 40H74M34 18V32M62 18V32M34 52H42M54 52H62M34 64H42',scissors:'M37 58 70 20M37 38 70 76M28 30A11 11 0 1 0 28 52A11 11 0 1 0 28 30M28 54A11 11 0 1 0 28 76A11 11 0 1 0 28 54',flower:'M48 48C10 10 75 0 48 48C90 10 100 75 48 48C90 90 20 100 48 48C0 90 0 20 48 48Z',paw:'M34 59Q48 40 62 59Q83 86 48 75Q13 86 34 59M22 36A7 10 0 1 0 23 36M40 23A7 10 0 1 0 41 23M60 23A7 10 0 1 0 61 23M77 37A7 10 0 1 0 78 37',plate:'M48 22A26 26 0 1 0 49 22M48 32A16 16 0 1 0 49 32M9 20V42M17 20V42M13 42V78M84 20V78'};return '<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[kind]||paths.spark)+'"/></svg>';}
  const api={templates,get,descriptions,available,selection,artwork};if(typeof module!=='undefined')module.exports=api;if(root)root.UNEED_KICKOFF_TEMPLATES=api;
})(typeof window!=='undefined'?window:null);
