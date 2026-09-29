(function(root){
const commercialCatalog = {
  presenca: {
    objective: "Presença digital profissional",
    defaultPlan: "presenca-essencial",
    plans: { "presenca-essencial": { name: "UNEED Presença", price: 39 } },
    addons: ["extra-email", "extra-language", "guided-assistant", "smart-assistant", "backoffice", "registrations", "remove-credit", "cards"],
  },
  marcacoes: {
    objective: "Marcações online",
    defaultPlan: "bookings-start-monthly",
    plans: {
      "bookings-start-monthly": { name: "BOOKINGS START", price: 59 },
      "bookings-pro-monthly": { name: "BOOKINGS PRO", price: 99 },
      "bookings-premium-monthly": { name: "BOOKINGS PREMIUM", price: 149 },
    },
    addons: ["extra-email", "extra-language", "guided-assistant", "smart-assistant", "sms", "multi-location", "remove-credit", "cards"],
  },
  leads: {
    objective: "Captação de leads",
    defaultPlan: "leads-start-monthly",
    plans: {
      "leads-start-monthly": { name: "LEADS START", price: 49 },
      "leads-flow-monthly": { name: "LEADS FLOW", price: 99 },
      "leads-ai-monthly": { name: "LEADS AI", price: 199 },
    },
    addons: ["extra-email", "extra-language", "guided-assistant", "smart-assistant", "backoffice", "remove-credit", "cards"],
  },
};

const addonCatalog = {
  "extra-email": { name: "Email profissional extra", unitPrice: 6, type: "quantity" },
  "extra-language": { name: "Idioma adicional", unitPrice: 5, type: "languages" },
  "guided-assistant": { name: "Assistente Guiado 24h", unitPrice: 12 },
  "smart-assistant": { name: "Assistente Inteligente 24h", unitPrice: 29 },
  backoffice: { name: "Backoffice de conteúdos", unitPrice: 15 },
  sms: { name: "Pacote SMS", price: "Por volume" },
  "multi-location": { name: "Multi-estabelecimento", price: "A confirmar" },
  registrations: { name: "Sistema de inscrições", price: "A confirmar" },
  "remove-credit": { name: "Remover “by uneed.pt”", unitPrice: 5 },
  cards: { name: "250 cartões por ano", price: "A confirmar" },
};

const allowedLanguages = ["en", "es", "fr", "de"];


const api={commercialCatalog,addonCatalog,allowedLanguages};
if(typeof module!=='undefined') module.exports=api;
if(root) root.UNEED_KICKOFF_CATALOG=api;
})(typeof window!=='undefined'?window:null);

