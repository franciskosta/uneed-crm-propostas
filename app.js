const STORAGE_KEY = "uneed-proposals-crm-v1";

function isPasswordRecoveryUrl() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  hashParams.forEach((value, key) => params.set(key, value));
  return params.get("type") === "recovery" || params.has("access_token") || params.has("code");
}

function appOrigin() {
  const localHosts = ["localhost", "127.0.0.1"];
  if (localHosts.includes(window.location.hostname)) return window.location.origin;
  return "https://crm.uneed.pt";
}

if (isPasswordRecoveryUrl()) {
  window.location.replace(`${appOrigin()}/login.html${window.location.search}${window.location.hash}`);
}

if (window.location.pathname.replace(/\/$/, "") === "/suporte") {
  window.location.replace(`/suporte.html${window.location.search}${window.location.hash}`);
}

const statuses = [
  "Novo pedido",
  "Orçamento enviado",
  "Follow-up",
  "Aceite",
  "Em desenvolvimento",
  "Concluído",
  "Faturado",
  "Perdido",
];

const pipelineStatuses = [
  "Novo pedido",
  "Orçamento enviado",
  "Follow-up",
  "Aceite",
  "Em desenvolvimento",
  "Concluído",
  "Faturado",
  "Perdido",
];

const leadSources = [
  "Instagram",
  "Referência",
  "Website UNEED",
  "WhatsApp",
  "Email",
  "Cliente atual",
  "Outro",
];

const opportunityCategories = [
  "Landing page",
  "Website",
  "Avença",
  "Sistema de marcações",
  "Suporte",
  "Branding/Design",
  "Outro",
];

const lostReasons = [
  "Preço",
  "Sem urgência",
  "Escolheu concorrente",
  "Não respondeu",
  "Não era fit",
  "Sem orçamento",
  "Outro",
];

const wonStatuses = ["Aceite", "Em desenvolvimento", "Concluído", "Faturado"];
const sentStatuses = ["Orçamento enviado", "Follow-up", ...wonStatuses, "Perdido"];
const decidedStatuses = [...wonStatuses, "Perdido"];

const recurringMilestones = [250, 500, 1000, 2500, 5000, 10000];

const ticketStatuses = [
  "Novo",
  "Em análise",
  "A aguardar cliente",
  "Em resolução",
  "Resolvido",
  "Fechado",
];

const ticketPriorities = ["Baixa", "Normal", "Alta", "Urgente"];

const instagramProspectStatuses = [
  "Por fazer",
  "Mensagem IG enviada",
  "Follow up WhatsApp",
  "Break up por telefone ou WhatsApp",
  "Não deu cliente",
  "Pediu demonstração",
  "Cliente ativo",
];

const contractStatuses = ["Rascunho", "Enviado", "Aceite", "Recusado", "Cancelado"];

const defaultContractServiceOptions = [
  ["uneed_presenca", "UNEED Presença"],
  ["website_mensal", "Website mensal"],
  ["website_catalogo", "Website catálogo"],
  ["loja_online", "Loja online"],
  ["landing_page", "Landing page"],
  ["manutencao_wordpress", "Manutenção WordPress"],
  ["alojamento", "Alojamento"],
  ["dominio", "Domínio"],
  ["email_profissional", "Email profissional"],
  ["sistema_marcacoes", "Sistema de marcações"],
  ["gestao_google_ads", "Gestão Google Ads"],
  ["gestao_meta_ads", "Gestão Meta Ads"],
  ["conteudos_redes_sociais", "Conteúdos redes sociais"],
  ["projeto_personalizado", "Projeto personalizado"],
];

const defaultContractAddonOptions = [
  ["email_extra", "Email extra"],
  ["backoffice_catalogo", "Backoffice catálogo"],
  ["assistente_guiado_24h", "Assistente guiado 24h"],
  ["assistente_inteligente_24h", "Assistente inteligente 24h"],
  ["sms_lembretes", "SMS/lembretes"],
  ["pagamento_online", "Pagamento online"],
  ["loja_online_extra", "Extras loja online"],
  ["integracoes_personalizadas", "Integrações personalizadas"],
  ["alteracoes_adicionais", "Alterações adicionais"],
  ["relatorios", "Relatórios"],
  ["remocao_credito_uneed", "Remoção crédito Uneed"],
  ["outros_addons", "Outros add-ons"],
];

const prospectNiches = [
  ["cabeleireiros", "Cabeleireiros, salões e barbearias", "cabeleireiro salão barbearia"],
  ["estetica", "Estética, unhas e maquilhagem", "centro estética unhas maquilhagem"],
  ["bem_estar", "Massagem, spa e terapias", "massagem spa terapias bem estar"],
  ["saude", "Clínicas, dentistas e fisioterapia", "clínica dentista fisioterapia"],
  ["veterinaria", "Clínicas veterinárias", "clínica veterinária"],
  ["fitness", "Personal trainers, pilates e yoga", "personal trainer estúdio pilates yoga"],
  ["fotografia", "Fotógrafos e espaços de eventos", "fotógrafo espaço eventos"],
  ["oficinas", "Oficinas, pneus e detalhe automóvel", "oficina pneus detalhe automóvel"],
  ["obras", "Construção, remodelações e manutenção", "remodelações construção manutenção"],
  ["servicos_casa", "Eletricistas, canalizadores e climatização", "eletricista canalizador climatização"],
  ["limpeza", "Limpeza e jardinagem", "empresa limpeza jardinagem"],
  ["grafica", "Gráficas, brindes e personalizados", "gráfica brindes impressão personalizada"],
  ["distribuidores", "Distribuidores e fornecedores B2B", "distribuidor fornecedor profissional"],
  ["mobiliario", "Mobiliário e soluções por medida", "mobiliário por medida cozinhas roupeiros"],
  ["profissionais", "Contabilidade, seguros e consultoria", "contabilidade seguros consultoria"],
  ["imobiliario", "Mediadores e consultores imobiliários", "consultor agência imobiliária"],
  ["formacao", "Formadores e centros de formação", "centro formação cursos"],
  ["instituicoes", "Creches, lares e associações", "creche lar associação"],
  ["restauracao", "Restaurantes e catering", "restaurante catering"],
].map(([id, label, query]) => ({ id, label, query }));

let portugalMunicipalities = [];

function pricingItems() {
  return (window.UNEED_PRICING?.categories || []).flatMap((category) => (
    (category.items || []).map((item) => ({ ...item, category: category.title }))
  ));
}

function catalogFromPricing() {
  return pricingItems().map((item) => ({
    id: item.id,
    category: item.category,
    billing: item.billing,
    commitment: item.commitment,
    includes: item.includes,
    pitch: item.pitch,
    objective: item.objective,
    tag: item.tag,
    featured: item.featured,
    cta: item.cta,
    name: `${item.name}${item.billing && item.billing !== "Pronto pagamento" ? ` (${item.billing.toLowerCase()})` : ""}`,
    price: item.price,
  }));
}

const defaultCatalog = catalogFromPricing().length
  ? catalogFromPricing()
  : [
      { name: "LP Conversão", price: 890 },
      { name: "Site Profissional", price: 1290 },
      { name: "Agenda Pro", price: 69 },
      { name: "Email profissional 15GB", price: 8 },
    ];

const seedProposals = [
  {
    id: crypto.randomUUID(),
    clientName: "Ana Martins",
    companyName: "Clínica Aurora",
    clientNif: "",
    clientEmail: "ana@clinica-aurora.pt",
    clientPhone: "+351 910 000 000",
    leadSource: "Instagram",
    opportunityCategory: "Landing page",
    leadDate: new Date().toISOString().slice(0, 10),
    proposalSentDate: new Date().toISOString().slice(0, 10),
    closedDate: "",
    lostReason: "",
    npsScore: "",
    status: "Orçamento enviado",
    followupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString().slice(0, 10),
    sampleUrl: "https://uneed.pt/amostra/clinica-aurora",
    services: [
      {
        name: "LEADS FLOW",
        qty: 1,
        price: 990,
        selected: true,
        category: "UNEED LEADS",
        billing: "Pronto pagamento",
        commitment: "",
        objective: "LP + pré-qualificação",
        pitch: "Landing page com diagnóstico interativo e qualificação do lead antes do WhatsApp.",
        includes: "Tudo do LEADS START, diagnóstico interativo, pré-qualificação do lead, passagem contextualizada para WhatsApp e maior qualidade de contactos.",
      },
    ],
    discount: 120,
    vatMode: "0",
    withholdingMode: "0",
    paymentTerms: "50% na adjudicação + 50% na entrega.",
    paymentIban: "",
    paidAmount: 0,
    billedAmount: 0,
    internalNotes: "Cliente quer lançar antes do fim do mês.",
    proposalNotes: "Inclui design responsivo, configuração base e acompanhamento até publicação.",
    activities: [
      {
        id: crypto.randomUUID(),
        type: "Email enviado",
        note: "Proposta enviada com amostra da landing.",
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let serverSyncTimer = null;
let isHydratingFromServer = true;
let supabaseClientInstance = null;
let supabaseUserId = null;
let syncStatusTimer = null;
let state = loadState();
migrateBrandDefaults();
hydratePricingDefaults();
isHydratingFromServer = false;
let activeId = state.proposals[0]?.id || null;
let activeContractId = state.contracts?.[0]?.id || null;
let followupAscending = true;
let catalogCategoryFilter = "";

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    brand: {
      name: "UNEED",
      email: "hello@uneed.pt",
      phone: "+351 934 419 375",
      website: "https://uneed.pt",
      iban: "",
      paymentTerms: "50% na adjudicação + 50% na entrega.",
      color: "#181d49",
    },
    catalog: defaultCatalog,
    monthTarget: 5000,
    recurringTarget: 1000,
    fiscal: {
      yearlyWithheldAdjustment: 0,
    },
    proposals: seedProposals,
    tickets: [],
    instagramProspects: [],
    contracts: [],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueServerSync();
}

function setSyncStatus(message, tone = "neutral") {
  const item = qs("#syncStatus");
  if (!item) return;
  item.textContent = message;
  item.dataset.tone = tone;
  clearTimeout(syncStatusTimer);
  if (tone === "success") {
    syncStatusTimer = setTimeout(() => {
      item.textContent = supabaseConfigured() ? "Supabase ligado" : "Modo local";
      item.dataset.tone = "neutral";
    }, 2200);
  }
}

function supabaseConfigured() {
  const config = window.UNEED_SUPABASE || {};
  return Boolean(config.url && config.anonKey && window.supabase);
}

function getSupabaseClient() {
  if (!supabaseConfigured()) return null;
  if (!supabaseClientInstance) {
    supabaseClientInstance = window.supabase.createClient(window.UNEED_SUPABASE.url, window.UNEED_SUPABASE.anonKey);
  }
  return supabaseClientInstance;
}

function queueServerSync() {
  if (isHydratingFromServer) return;
  clearTimeout(serverSyncTimer);
  serverSyncTimer = setTimeout(() => {
    if (supabaseConfigured()) {
      setSyncStatus("A sincronizar...");
      syncSupabaseState().catch(() => {});
      return;
    }
    fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    }).catch(() => {});
  }, 350);
}

async function syncSupabaseState() {
  const client = getSupabaseClient();
  if (!client) return;
  let userId = supabaseUserId;
  if (!userId) {
    const { data } = await client.auth.getUser();
    userId = data.user?.id;
    supabaseUserId = userId || null;
  }
  if (!userId) return;
  const { error } = await client
    .from("crm_state")
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  setSyncStatus(error ? "Erro ao sincronizar Supabase" : "Guardado no Supabase", error ? "error" : "success");
}

async function loadSupabaseState() {
  const client = getSupabaseClient();
  if (!client) return false;
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "/login.html";
    return true;
  }
  supabaseUserId = sessionData.session.user.id;
  const { data, error } = await client
    .from("crm_state")
    .select("data")
    .eq("user_id", supabaseUserId)
    .maybeSingle();
  if (error) {
    setSyncStatus("Erro Supabase. A usar cópia local.", "error");
    return true;
  }
  if (!data?.data) {
    await syncSupabaseState();
    setSyncStatus("Supabase ligado", "success");
    return true;
  }
  isHydratingFromServer = true;
  state = data.data;
  migrateBrandDefaults();
  hydratePricingDefaults();
  activeId = state.proposals[0]?.id || activeId;
  activeContractId = state.contracts?.[0]?.id || activeContractId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  await loadSupportTickets();
  renderAll();
  isHydratingFromServer = false;
  setSyncStatus("Supabase ligado", "success");
  return true;
}

async function loadServerState() {
  if (await loadSupabaseState()) return;
  try {
    const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }
    if (!response.ok) return;
    const payload = await response.json();
    if (!payload.state) {
      queueServerSync();
      return;
    }
    isHydratingFromServer = true;
    state = payload.state;
    migrateBrandDefaults();
    hydratePricingDefaults();
    activeId = state.proposals[0]?.id || activeId;
    activeContractId = state.contracts?.[0]?.id || activeContractId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
  } catch {
    // Modo local sem API: continua com localStorage.
  } finally {
    isHydratingFromServer = false;
  }
}

function migrateBrandDefaults() {
  state.brand ||= {};
  if (!state.brand.name) state.brand.name = "UNEED";
  if (!state.brand.email || state.brand.email === "hello@uneed.pt") state.brand.email = "hello@uneed.pt";
  if (!state.brand.phone || state.brand.phone === "+351 900 000 000") state.brand.phone = "+351 934 419 375";
  if (!state.brand.website) state.brand.website = "https://uneed.pt";
  if (!("iban" in state.brand)) state.brand.iban = "";
  if (!("paymentTerms" in state.brand)) state.brand.paymentTerms = "50% na adjudicação + 50% na entrega.";
  if (!state.brand.color || state.brand.color === "#111111") state.brand.color = "#181d49";
  if (!("recurringTarget" in state)) state.recurringTarget = 1000;
  state.fiscal ||= {};
  if (!("yearlyWithheldAdjustment" in state.fiscal)) state.fiscal.yearlyWithheldAdjustment = 0;
  state.proposals ||= [];
  state.proposals.forEach((proposal) => {
    if (proposal.status === "Em análise") proposal.status = "Novo pedido";
    if (proposal.status === "A aguardar cliente") proposal.status = "Follow-up";
    if (!("leadSource" in proposal)) proposal.leadSource = "Instagram";
    if (!("opportunityCategory" in proposal)) proposal.opportunityCategory = inferOpportunityCategory(proposal);
    if (!("leadDate" in proposal)) proposal.leadDate = dateOnly(proposal.createdAt || today());
    if (!("proposalSentDate" in proposal)) {
      proposal.proposalSentDate = sentStatuses.includes(proposal.status) ? dateOnly(proposal.updatedAt || proposal.createdAt || today()) : "";
    }
    if (!("closedDate" in proposal)) {
      proposal.closedDate = decidedStatuses.includes(proposal.status) ? dateOnly(proposal.updatedAt || proposal.createdAt || today()) : "";
    }
    if (!("lostReason" in proposal)) proposal.lostReason = "";
    if (!("npsScore" in proposal)) proposal.npsScore = "";
    if (!("withholdingMode" in proposal)) proposal.withholdingMode = "0";
    if (!("paymentTerms" in proposal)) proposal.paymentTerms = state.brand.paymentTerms || "";
  });
  state.tickets ||= [];
  state.contractServiceOptions = normalizeContractOptions(state.contractServiceOptions, defaultContractServiceOptions, "service");
  state.contractAddonOptions = normalizeContractOptions(state.contractAddonOptions, defaultContractAddonOptions, "addon");
  state.contracts ||= [];
  state.contracts.forEach((contract) => {
    if (!contract.id) contract.id = crypto.randomUUID();
    if (!contract.contractNumber) contract.contractNumber = nextContractNumber();
    if (!contractStatuses.includes(contract.status)) contract.status = "Rascunho";
    contract.services ||= [];
    contract.addons ||= [];
    if (!("directDebitRequired" in contract)) contract.directDebitRequired = true;
    if (!("loyalty" in contract)) contract.loyalty = false;
    if (!("loyaltyMonths" in contract)) contract.loyaltyMonths = 0;
    if (!("cancelNoticeDays" in contract)) contract.cancelNoticeDays = 30;
    if (!("version" in contract)) contract.version = 1;
    if (!("versions" in contract)) contract.versions = [];
    if (!("createdAt" in contract)) contract.createdAt = new Date().toISOString();
    if (!("updatedAt" in contract)) contract.updatedAt = contract.createdAt;
  });
  state.instagramProspects ||= [];
  state.prospectStats ||= { duplicatesSkipped: 0, rejected: 0, searches: 0 };
  state.prospectRejectedKeys ||= [];
  state.instagramProspects.forEach((prospect) => {
    if (!prospect.id) prospect.id = crypto.randomUUID();
    if (!instagramProspectStatuses.includes(prospect.status)) prospect.status = "Por fazer";
    if (!("hasWebsite" in prospect)) prospect.hasWebsite = false;
    if (!("hasBooking" in prospect)) prospect.hasBooking = false;
    if (!("hasWhatsappTree" in prospect)) prospect.hasWhatsappTree = false;
    if (!("createdAt" in prospect)) prospect.createdAt = new Date().toISOString();
    if (!("updatedAt" in prospect)) prospect.updatedAt = prospect.createdAt;
    if (prospect.message) prospect.message = formalizeProspectMessage(prospect.message);
  });
  saveState();
}

function slugOptionId(label, type = "option") {
  const slug = String(label || type)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${type}_${slug || crypto.randomUUID()}`;
}

function normalizeContractOption(option, type = "option") {
  if (Array.isArray(option)) {
    return { id: option[0], label: option[1], active: true };
  }
  const label = option?.label || option?.name || "Opção sem nome";
  return {
    id: option?.id || slugOptionId(label, type),
    label,
    active: option?.active !== false,
  };
}

function normalizeContractOptions(currentOptions, defaultOptions, type) {
  const usedIds = new Set();
  const normalized = (currentOptions || []).map((option) => normalizeContractOption(option, type)).filter((option) => {
    if (!option.id || usedIds.has(option.id)) return false;
    usedIds.add(option.id);
    return true;
  });

  defaultOptions.forEach(([id, label]) => {
    if (!usedIds.has(id)) normalized.push({ id, label, active: true });
  });

  return normalized;
}

function editableContractOptions(type) {
  const key = type === "addon" ? "contractAddonOptions" : "contractServiceOptions";
  const defaults = type === "addon" ? defaultContractAddonOptions : defaultContractServiceOptions;
  state[key] = normalizeContractOptions(state[key], defaults, type);
  return state[key];
}

function contractOptionPairs(type, activeOnly = false) {
  return editableContractOptions(type)
    .filter((option) => !activeOnly || option.active !== false)
    .map((option) => [option.id, option.label]);
}

function hydratePricingDefaults() {
  state.catalog ||= [];
  state.pricingVersion ||= "";
  const legacyCatalogNames = [
    "Landing page premium",
    "Website institucional",
    "Loja online base",
    "Sistema de marcação / reservas",
    "Copywriting comercial",
    "SEO técnico inicial",
    "Manutenção mensal",
  ];
  const looksLegacy = state.catalog.length === legacyCatalogNames.length &&
    legacyCatalogNames.every((name) => state.catalog.some((item) => item.name === name));
  const currentPricingVersion = window.UNEED_PRICING?.updatedAt || "";
  if (!state.catalog.length || looksLegacy || state.pricingVersion !== currentPricingVersion) {
    state.catalog = defaultCatalog;
    state.pricingVersion = currentPricingVersion;
  }
  saveState();
}

function serviceFromPricingItem(item) {
  return {
    name: `${item.name}${item.billing && item.billing !== "Pronto pagamento" ? ` (${item.billing.toLowerCase()})` : ""}`,
    qty: 1,
    price: Number(item.price || 0),
    selected: true,
    category: item.category,
    billing: item.billing,
    commitment: item.commitment,
    includes: item.includes,
    pitch: item.pitch,
    objective: item.objective,
    tag: item.tag,
    featured: item.featured,
    cta: item.cta,
  };
}

function applyPricingCatalog() {
  state.catalog = defaultCatalog.map((item) => ({ ...item }));
  state.pricingVersion = window.UNEED_PRICING?.updatedAt || today();
  saveState();
  renderAll();
}

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function eur(value) {
  return Number(value || 0).toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number(value || 0) % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function parseRate(value) {
  return Number(String(value || "0").replace(",", "."));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateOnly(value = today()) {
  if (!value) return today();
  return String(value).slice(0, 10);
}

function monthKey(dateString = today()) {
  return dateOnly(dateString).slice(0, 7);
}

function quarterKey(dateString = today()) {
  const date = new Date(dateString);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-T${quarter}`;
}

function quarterMeta(quarter = quarterKey()) {
  const [yearText, quarterText] = String(quarter).split("-T");
  const year = Number(yearText);
  const number = Number(quarterText || 1);
  const labels = {
    1: "1.º trimestre",
    2: "2.º trimestre",
    3: "3.º trimestre",
    4: "4.º trimestre",
  };
  const periods = {
    1: "janeiro a março",
    2: "abril a junho",
    3: "julho a setembro",
    4: "outubro a dezembro",
  };
  const dueMonths = {
    1: 4,
    2: 8,
    3: 10,
    4: 1,
  };
  const dueYear = number === 4 ? year + 1 : year;
  const dueMonth = dueMonths[number] || 4;
  const declarationDate = new Date(Date.UTC(dueYear, dueMonth, 20));
  const paymentDate = new Date(Date.UTC(dueYear, dueMonth, 25));
  return {
    key: quarter,
    label: `${labels[number] || `${number}.º trimestre`} de ${year}`,
    period: periods[number] || "",
    declarationDue: declarationDate.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }),
    paymentDue: paymentDate.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

function vatSchedule(year = new Date().getFullYear()) {
  return [1, 2, 3, 4].map((quarter) => quarterMeta(`${year}-T${quarter}`));
}

function selectedServices(proposal) {
  return (proposal.services || []).filter((service) => service.selected && Number(service.qty) > 0);
}

function subtotal(proposal) {
  return selectedServices(proposal).reduce((sum, service) => {
    return sum + Number(service.qty || 0) * Number(service.price || 0);
  }, 0);
}

function totals(proposal) {
  const beforeDiscount = subtotal(proposal);
  const discount = Math.min(Number(proposal.discount || 0), beforeDiscount);
  const taxable = beforeDiscount - discount;
  const vatRate = parseRate(proposal.vatMode);
  const withholdingRate = parseRate(proposal.withholdingMode);
  const vat = taxable * (vatRate / 100);
  const withholding = taxable * (withholdingRate / 100);
  const total = taxable + vat;
  const receivable = total - withholding;
  const paid = Number(proposal.paidAmount || 0);
  const billed = Number(proposal.billedAmount || 0);
  return {
    beforeDiscount,
    discount,
    taxable,
    vat,
    vatRate,
    withholding,
    withholdingRate,
    total,
    receivable,
    paid,
    billed,
    open: Math.max(receivable - paid, 0),
  };
}

function pipelineValueSummary(sum) {
  const parts = [`Base ${eur(sum.taxable)}`];
  if (sum.vatRate) parts.push(`+ IVA ${sum.vatRate}% (${eur(sum.vat)})`);
  if (sum.withholdingRate) parts.push(`- retenção ${sum.withholdingRate}% (${eur(sum.withholding)})`);
  return parts.join(" · ");
}

function recognizedRevenue(proposal) {
  if (proposal.status !== "Faturado") return Number(proposal.billedAmount || 0);
  const explicit = Number(proposal.billedAmount || 0);
  return explicit > 0 ? explicit : totals(proposal).total;
}

function revenueMonth(proposal) {
  return monthKey(proposal.updatedAt || proposal.createdAt || today());
}

function monthlyStats(month) {
  const proposals = state.proposals.filter((proposal) => monthKey(proposal.createdAt || today()) === month || revenueMonth(proposal) === month);
  const sent = state.proposals.filter((proposal) => monthKey(proposal.createdAt || today()) === month).length;
  const billed = state.proposals
    .filter((proposal) => revenueMonth(proposal) === month)
    .reduce((sum, proposal) => sum + recognizedRevenue(proposal), 0);
  const recurring = state.proposals
    .filter((proposal) => revenueMonth(proposal) === month)
    .reduce((sum, proposal) => sum + recurringMonthlyValue(proposal), 0);
  const won = proposals.filter((proposal) => ["Aceite", "Em desenvolvimento", "Concluído", "Faturado"].includes(proposal.status)).length;
  const lost = proposals.filter((proposal) => proposal.status === "Perdido").length;
  return { month, sent, billed, recurring, won, lost, count: proposals.length };
}

function fiscalStats(month = monthKey()) {
  return state.proposals
    .filter((proposal) => proposal.status === "Faturado" && revenueMonth(proposal) === month)
    .reduce(
      (sum, proposal) => {
        const value = totals(proposal);
        sum.taxable += value.taxable;
        sum.vat += value.vat;
        sum.withholding += value.withholding;
        sum.invoiced += value.total;
        sum.receivable += value.receivable;
        return sum;
      },
      { taxable: 0, vat: 0, withholding: 0, invoiced: 0, receivable: 0 },
    );
}

function fiscalQuarterStats(quarter = quarterKey()) {
  return state.proposals
    .filter((proposal) => proposal.status === "Faturado")
    .reduce(
      (sum, proposal) => {
        const revenueDate = proposal.updatedAt || proposal.createdAt || today();
        const split = splitTaxableByBilling(proposal);
        if (quarterKey(revenueDate) === quarter) {
          addFiscal(sum, fiscalFromTaxable(split.once + split.annual, proposal));
        }
        addFiscal(sum, fiscalFromTaxable(split.monthly, proposal, monthsInQuarter(quarter, revenueDate)));
        return sum;
      },
      { taxable: 0, vat: 0, withholding: 0, invoiced: 0, receivable: 0 },
    );
}

function fiscalYearStats(year = new Date().getFullYear()) {
  return state.proposals
    .filter((proposal) => proposal.status === "Faturado")
    .reduce(
      (sum, proposal) => {
        const revenueDate = proposal.updatedAt || proposal.createdAt || today();
        const split = splitTaxableByBilling(proposal);
        if (new Date(revenueDate).getFullYear() === Number(year)) {
          addFiscal(sum, fiscalFromTaxable(split.once + split.annual, proposal));
        }
        addFiscal(sum, fiscalFromTaxable(split.monthly, proposal, monthsInYear(year, revenueDate)));
        return sum;
      },
      { taxable: 0, vat: 0, withholding: 0, invoiced: 0, receivable: 0 },
    );
}

function billingTotals(proposal) {
  return selectedServices(proposal).reduce(
    (sum, service) => {
      const value = Number(service.qty || 0) * Number(service.price || 0);
      const billing = String(service.billing || "Pronto pagamento").toLowerCase();
      if (billing.includes("mensal")) sum.monthly += value;
      else if (billing.includes("anual")) sum.annual += value;
      else sum.once += value;
      return sum;
    },
    { once: 0, monthly: 0, annual: 0 },
  );
}

function splitTaxableByBilling(proposal) {
  const beforeDiscount = subtotal(proposal);
  const discount = Math.min(Number(proposal.discount || 0), beforeDiscount);
  const split = billingTotals(proposal);
  const applyDiscountShare = (value) => {
    if (!beforeDiscount) return 0;
    return Math.max(value - discount * (value / beforeDiscount), 0);
  };
  return {
    once: applyDiscountShare(split.once),
    monthly: applyDiscountShare(split.monthly),
    annual: applyDiscountShare(split.annual),
  };
}

function fiscalFromTaxable(taxable, proposal, multiplier = 1) {
  const base = Number(taxable || 0) * multiplier;
  const vat = base * (parseRate(proposal.vatMode) / 100);
  const withholding = base * (parseRate(proposal.withholdingMode) / 100);
  return {
    taxable: base,
    vat,
    withholding,
    invoiced: base + vat,
    receivable: base + vat - withholding,
  };
}

function addFiscal(target, value) {
  target.taxable += value.taxable;
  target.vat += value.vat;
  target.withholding += value.withholding;
  target.invoiced += value.invoiced;
  target.receivable += value.receivable;
  return target;
}

function monthsInQuarter(quarter = quarterKey(), activeFrom = today()) {
  const meta = quarterMeta(quarter);
  const [yearText, quarterText] = String(quarter).split("-T");
  const year = Number(yearText);
  const number = Number(quarterText || 1);
  const startMonth = (number - 1) * 3;
  const now = new Date();
  const start = new Date(activeFrom);
  let count = 0;
  for (let month = startMonth; month < startMonth + 3; month++) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    if (monthStart > now && meta.key === quarterKey()) continue;
    if (monthEnd >= start) count += 1;
  }
  return count;
}

function monthsInYear(year = new Date().getFullYear(), activeFrom = today()) {
  const now = new Date();
  const start = new Date(activeFrom);
  let count = 0;
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    if (monthStart > now) continue;
    if (monthEnd >= start) count += 1;
  }
  return count;
}

function recurringMonthlyValue(proposal) {
  if (proposal.status !== "Faturado") return 0;
  return billingTotals(proposal).monthly;
}

function recurringProposals() {
  return state.proposals.filter((proposal) => recurringMonthlyValue(proposal) > 0);
}

function normalizeTicket(ticket = {}) {
  return {
    id: ticket.id || crypto.randomUUID(),
    code: ticket.code || `UNEED-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    clientName: ticket.clientName || ticket.client_name || "",
    companyName: ticket.companyName || ticket.company_name || "",
    email: ticket.email || "",
    phone: ticket.phone || "",
    projectUrl: ticket.projectUrl || ticket.project_url || "",
    category: ticket.category || "Suporte geral",
    priority: ticket.priority || "Normal",
    status: ticket.status || "Novo",
    subject: ticket.subject || "",
    message: ticket.message || "",
    internalNotes: ticket.internalNotes || ticket.internal_notes || "",
    createdAt: ticket.createdAt || ticket.created_at || new Date().toISOString(),
    updatedAt: ticket.updatedAt || ticket.updated_at || ticket.created_at || new Date().toISOString(),
  };
}

function ticketIsOpen(ticket) {
  return !["Resolvido", "Fechado"].includes(ticket.status);
}

async function loadSupportTickets() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { data, error } = await client
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return;
    state.tickets = (data || []).map(normalizeTicket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Se a tabela ainda não existir, a tab Tickets continua em modo local.
  }
}

async function updateTicket(id, patch) {
  const ticket = state.tickets.find((item) => item.id === id);
  if (!ticket) return;
  Object.assign(ticket, patch, { updatedAt: new Date().toISOString() });
  saveState();
  renderTickets();

  const client = getSupabaseClient();
  if (!client) return;
  const payload = {};
  if ("status" in patch) payload.status = patch.status;
  if ("priority" in patch) payload.priority = patch.priority;
  if ("internalNotes" in patch) payload.internal_notes = patch.internalNotes;
  payload.updated_at = ticket.updatedAt;
  try {
    await client.from("support_tickets").update(payload).eq("id", id);
    setSyncStatus("Ticket atualizado", "success");
  } catch {
    setSyncStatus("Ticket guardado localmente", "error");
  }
}

function ticketEmailHref(ticket) {
  const subject = encodeURIComponent(`Re: ${ticket.code} - ${ticket.subject || "Pedido de suporte UNEED"}`);
  const body = encodeURIComponent(
    `Olá ${ticket.clientName || ""},\n\nRecebemos o teu pedido de suporte (${ticket.code}) e estamos a analisar.\n\nResumo do pedido:\n${ticket.message || ""}\n\nObrigado,\nUNEED`,
  );
  return `mailto:${ticket.email || ""}?subject=${subject}&body=${body}`;
}

function safeExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function recurringMilestoneStatus(monthly) {
  const reached = recurringMilestones.filter((value) => monthly >= value);
  const next = recurringMilestones.find((value) => monthly < value) || null;
  return {
    reached,
    next,
    current: reached.at(-1) || 0,
    missing: next ? Math.max(next - monthly, 0) : 0,
  };
}

function serviceMeta(service) {
  return [service.category, service.billing, service.commitment].filter(Boolean).join(" · ");
}

function serviceFromCatalogItem(item) {
  return {
    name: item.name || "Novo serviço",
    qty: 1,
    price: Number(item.price || 0),
    selected: true,
    category: item.category || "Serviço personalizado",
    billing: item.billing || "Pronto pagamento",
    commitment: item.commitment || "",
    includes: item.includes || "",
    pitch: item.pitch || "",
    objective: item.objective || "",
    tag: item.tag || "",
    featured: Boolean(item.featured),
    cta: item.cta || "",
  };
}

function proposalHeadline(proposal) {
  const featured = selectedServices(proposal).find((service) => service.pitch || service.cta);
  if (featured?.pitch) return featured.pitch;
  return "Sistema digital preparado para converter visitantes em contactos, marcações e oportunidades reais.";
}

function getActiveProposal() {
  return state.proposals.find((proposal) => proposal.id === activeId) || null;
}

function emptyProposal() {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return {
    id: crypto.randomUUID(),
    clientName: "",
    companyName: "",
    clientNif: "",
    clientEmail: "",
    clientPhone: "",
    leadSource: "Instagram",
    opportunityCategory: "Outro",
    leadDate: today(),
    proposalSentDate: "",
    closedDate: "",
    lostReason: "",
    npsScore: "",
    status: "Novo pedido",
    followupDate: today(),
    validUntil: date.toISOString().slice(0, 10),
    sampleUrl: "",
    services: [],
    discount: 0,
    vatMode: "0",
    withholdingMode: "0",
    paymentTerms: state.brand.paymentTerms || "50% na adjudicação + 50% na entrega.",
    paymentIban: "",
    paidAmount: 0,
    billedAmount: 0,
    internalNotes: "",
    proposalNotes: "Proposta válida até à data indicada. O projeto inicia após aprovação e pagamento da entrada acordada.",
    activities: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function ensureServiceRows(proposal) {
  proposal.services ||= [];
}

function fillStatusSelects() {
  const proposalStatus = qs("#proposalStatus");
  const statusFilter = qs("#statusFilter");
  proposalStatus.innerHTML = statuses.map((status) => `<option>${status}</option>`).join("");
  statusFilter.innerHTML = `<option value="">Todos os estados</option>${statuses.map((status) => `<option>${status}</option>`).join("")}`;

  const leadSource = qs("#leadSource");
  const opportunityCategory = qs("#opportunityCategory");
  const lostReason = qs("#lostReason");
  if (leadSource) leadSource.innerHTML = leadSources.map((source) => `<option>${source}</option>`).join("");
  if (opportunityCategory) opportunityCategory.innerHTML = opportunityCategories.map((category) => `<option>${category}</option>`).join("");
  if (lostReason) {
    lostReason.innerHTML = `<option value="">Selecionar se a proposta for perdida</option>${lostReasons.map((reason) => `<option>${reason}</option>`).join("")}`;
  }

  const ticketStatusFilter = qs("#ticketStatusFilter");
  const ticketPriorityFilter = qs("#ticketPriorityFilter");
  if (ticketStatusFilter) {
    ticketStatusFilter.innerHTML = `<option value="">Todos os estados</option>${ticketStatuses.map((status) => `<option>${status}</option>`).join("")}`;
  }
  if (ticketPriorityFilter) {
    ticketPriorityFilter.innerHTML = `<option value="">Todas as prioridades</option>${ticketPriorities.map((priority) => `<option>${priority}</option>`).join("")}`;
  }

  const instagramStatus = qs("#instagramStatus");
  const instagramStatusFilter = qs("#instagramStatusFilter");
  if (instagramStatus) {
    instagramStatus.innerHTML = instagramProspectStatuses.map((status) => `<option>${status}</option>`).join("");
  }
  if (instagramStatusFilter) {
    instagramStatusFilter.innerHTML = `<option value="">Todos os estados</option>${instagramProspectStatuses.map((status) => `<option>${status}</option>`).join("")}`;
  }
  const instagramNiche = qs("#instagramNiche");
  if (instagramNiche) {
    instagramNiche.innerHTML = `<option value="">Sem nicho</option>${prospectNiches.map((item) => `<option>${escapeHtml(item.label)}</option>`).join("")}`;
  }
}

function renderQuickProductSelect() {
  const select = qs("#quickProductSelect");
  if (!select) return;
  select.innerHTML = (state.catalog || [])
    .map((item, index) => `<option value="${index}">${escapeHtml(item.name)} · ${escapeHtml(item.billing || "Pronto pagamento")} · ${eur(item.price)}</option>`)
    .join("");
}

function addPricingItemToActiveProposal(item) {
  const proposal = readForm();
  proposal.services ||= [];
  proposal.services.push(serviceFromCatalogItem(item));
  const index = state.proposals.findIndex((entry) => entry.id === proposal.id);
  if (index >= 0) state.proposals[index] = proposal;
  saveState();
  renderAll();
}

function showSuccessModal(message = "A proposta foi gravada e sincronizada com o CRM.") {
  const modal = qs("#successModal");
  if (!modal) return;
  modal.querySelector("p").textContent = message;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeSuccessModal() {
  const modal = qs("#successModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

async function updateAccountPassword(event) {
  event.preventDefault();
  const passwordInput = qs("#newPassword");
  const confirmInput = qs("#confirmNewPassword");
  const nextPassword = passwordInput.value.trim();
  const confirmation = confirmInput.value.trim();

  if (nextPassword.length < 8) {
    showSuccessModal("A nova password deve ter pelo menos 8 caracteres.");
    return;
  }
  if (nextPassword !== confirmation) {
    showSuccessModal("As passwords não coincidem. Confirma e tenta novamente.");
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    showSuccessModal("Supabase não está configurado neste ambiente. A password online só pode ser alterada quando o CRM estiver ligado ao Supabase.");
    return;
  }

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    showSuccessModal("A tua sessão expirou. Faz login novamente e volta a tentar alterar a password.");
    window.setTimeout(() => {
      window.location.href = "/login.html";
    }, 1600);
    return;
  }

  const { error } = await client.auth.updateUser({ password: nextPassword });
  if (error) {
    showSuccessModal(error.message || "Não foi possível alterar a password. Tenta novamente.");
    return;
  }

  passwordInput.value = "";
  confirmInput.value = "";
  showSuccessModal("Password alterada com sucesso. Podes continuar a usar o CRM normalmente.");
}

function updateProposal(id, patch) {
  const proposal = state.proposals.find((item) => item.id === id);
  if (!proposal) return;
  if (patch.status && statusIsSent(patch.status) && !proposal.proposalSentDate) {
    patch.proposalSentDate = today();
  }
  if (patch.status && statusIsDecided(patch.status) && !proposal.closedDate) {
    patch.closedDate = today();
  }
  if (patch.status === "Faturado" && !Number(proposal.billedAmount || 0)) {
    const sum = totals(proposal);
    patch.billedAmount = sum.total;
    patch.paidAmount = Math.max(Number(proposal.paidAmount || 0), sum.receivable);
  }
  Object.assign(proposal, patch, { updatedAt: new Date().toISOString() });
  saveState();
  renderAll();
}

function deleteProposal(id) {
  const proposal = state.proposals.find((item) => item.id === id);
  if (!proposal) return;
  const ok = confirm(`Eliminar a proposta de ${proposal.companyName || proposal.clientName || "cliente sem nome"}?`);
  if (!ok) return;
  state.proposals = state.proposals.filter((item) => item.id !== id);
  activeId = state.proposals[0]?.id || null;
  if (!activeId) {
    const fresh = emptyProposal();
    state.proposals.push(fresh);
    activeId = fresh.id;
  }
  saveState();
  renderAll();
}

function reminderHref(proposal) {
  const to = proposal.clientEmail || "";
  const subject = encodeURIComponent(`Lembrete follow-up UNEED - ${proposal.companyName || proposal.clientName || "proposta"}`);
  const body = encodeURIComponent(
    `Olá ${proposal.clientName || ""},\n\nEstou a fazer follow-up à proposta da UNEED para ${
      proposal.companyName || "o seu projeto"
    }.\n\nSe fizer sentido, posso esclarecer dúvidas ou ajustar a proposta ao que precisa.\n\nObrigado,\nUNEED`,
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

function reminderEmail(proposal) {
  return {
    to: proposal.clientEmail || "",
    subject: `Follow-up proposta UNEED - ${proposal.companyName || proposal.clientName || "proposta"}`,
    body: `Olá ${proposal.clientName || ""},\n\nEstou a fazer follow-up à proposta da UNEED para ${
      proposal.companyName || "o seu projeto"
    }.\n\nSe fizer sentido, posso esclarecer dúvidas ou ajustar a proposta ao que precisa.\n\nObrigado,\nUNEED`,
  };
}

async function openReminderEmail(proposal) {
  const email = reminderEmail(proposal);
  if (!email.to) {
    showSuccessModal("Este cliente ainda não tem email. Adiciona um email à proposta antes de criar o lembrete.");
    return;
  }
  const mailto = `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
  navigator.clipboard?.writeText(`Para: ${email.to}\nAssunto: ${email.subject}\n\n${email.body}`).catch(() => {});
  try {
    const client = getSupabaseClient();
    if (client) {
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        await client.from("email_reminders").insert({
          user_id: userId,
          proposal_id: proposal.id,
          due_date: proposal.followupDate || today(),
          to_email: email.to,
          subject: email.subject,
          body: email.body,
          status: "prepared",
        });
        window.location.href = mailto;
        showSuccessModal("Lembrete registado no Supabase. O email foi preparado para enviares manualmente.");
        return;
      }
    }

    const response = await fetch("/api/email/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposalId: proposal.id,
        dueDate: proposal.followupDate || today(),
        to: email.to,
        subject: email.subject,
        body: email.body,
      }),
    });
    if (response.ok) {
      const result = await response.json();
      showSuccessModal(result.sent
        ? "Email enviado pelo backend e registado no histórico de lembretes."
        : "Lembrete registado no backend. Para envio automático, configura a chave de email no servidor. Também vou abrir o teu email para poderes enviar manualmente já.");
      if (!result.sent) window.location.href = mailto;
      return;
    }
  } catch {
    // Modo estático: sem backend ativo, abrimos o cliente de email.
  }
  window.location.href = mailto;
  showSuccessModal("O email de follow-up foi preparado. A app local não envia emails automaticamente/offline; abre o teu cliente de email para reveres e enviares. Também copiei o texto para a área de transferência quando possível.");
}

function handleEmailReminderClick(event) {
  const button = event.target.closest("[data-email-reminder]");
  if (!button) return false;
  event.preventDefault();
  event.stopPropagation();
  const proposal = state.proposals.find((item) => item.id === button.dataset.emailReminder);
  if (proposal) openReminderEmail(proposal);
  return true;
}

function proposalLabel(proposal) {
  return selectedServices(proposal).map((service) => service.name).join(", ") || "Proposta sem serviços";
}

function hasRecurringServices(proposal) {
  return selectedServices(proposal).some((service) => String(service.billing || "").toLowerCase().includes("mensal"));
}

function inferOpportunityCategory(proposal) {
  if (proposal?.opportunityCategory) return proposal.opportunityCategory;
  const service = selectedServices(proposal || {})[0] || (proposal?.services || [])[0];
  const category = String(service?.category || service?.billing || service?.name || "").toLowerCase();
  if (category.includes("lead") || category.includes("landing") || category.includes("lp")) return "Landing page";
  if (category.includes("book") || category.includes("agenda") || category.includes("marca")) return "Sistema de marcações";
  if (category.includes("mensal") || category.includes("aven")) return "Avença";
  if (category.includes("brand") || category.includes("design")) return "Branding/Design";
  if (category.includes("suporte")) return "Suporte";
  if (category.includes("site") || category.includes("web")) return "Website";
  return "Outro";
}

function daysBetween(start, end) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.max(Math.round((endDate - startDate) / 86400000), 0);
}

function statusIsWon(status) {
  return wonStatuses.includes(status);
}

function statusIsSent(status) {
  return sentStatuses.includes(status);
}

function statusIsDecided(status) {
  return decidedStatuses.includes(status);
}

function proposalCloseDate(proposal) {
  return proposal.closedDate || (statusIsDecided(proposal.status) ? dateOnly(proposal.updatedAt || proposal.createdAt || today()) : "");
}

function performanceStats() {
  const proposals = state.proposals || [];
  const currentMonth = monthKey();
  const leadsMonth = proposals.filter((proposal) => monthKey(proposal.leadDate || proposal.createdAt || today()) === currentMonth);
  const sentMonth = proposals.filter((proposal) => {
    const sentDate = proposal.proposalSentDate || (statusIsSent(proposal.status) ? proposal.updatedAt || proposal.createdAt : "");
    return sentDate && monthKey(sentDate) === currentMonth;
  });
  const won = proposals.filter((proposal) => statusIsWon(proposal.status));
  const lost = proposals.filter((proposal) => proposal.status === "Perdido");
  const decided = proposals.filter((proposal) => statusIsDecided(proposal.status));
  const wonWithValue = won.filter((proposal) => totals(proposal).receivable > 0);
  const closeDurations = decided
    .map((proposal) => daysBetween(proposal.leadDate || proposal.createdAt, proposalCloseDate(proposal)))
    .filter((value) => value !== null);
  const recurring = recurringProposals();
  const lostRecurringMonth = lost.filter((proposal) => {
    const closed = proposalCloseDate(proposal);
    return hasRecurringServices(proposal) && closed && monthKey(closed) === currentMonth;
  });
  const npsValues = proposals
    .map((proposal) => Number(proposal.npsScore))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 10);
  const average = (items) => (items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : 0);
  const byCategory = proposals.reduce((map, proposal) => {
    const category = proposal.opportunityCategory || inferOpportunityCategory(proposal);
    map[category] ||= { category, leads: 0, sent: 0, won: 0, lost: 0, value: 0 };
    map[category].leads += 1;
    if (statusIsSent(proposal.status) || proposal.proposalSentDate) map[category].sent += 1;
    if (statusIsWon(proposal.status)) {
      map[category].won += 1;
      map[category].value += totals(proposal).receivable;
    }
    if (proposal.status === "Perdido") map[category].lost += 1;
    return map;
  }, {});
  const lossReasons = lost.reduce((map, proposal) => {
    const reason = proposal.lostReason || "Sem motivo";
    map[reason] = (map[reason] || 0) + 1;
    return map;
  }, {});
  const sources = proposals.reduce((map, proposal) => {
    const source = proposal.leadSource || "Sem origem";
    map[source] = (map[source] || 0) + 1;
    return map;
  }, {});
  const mrr = recurring.reduce((sum, proposal) => sum + recurringMonthlyValue(proposal), 0);
  const churnBase = recurring.length + lostRecurringMonth.length;
  return {
    proposals,
    leadsMonth,
    sentMonth,
    won,
    lost,
    decided,
    closeRate: decided.length ? (won.length / decided.length) * 100 : 0,
    avgCloseDays: average(closeDurations),
    avgTicket: wonWithValue.length ? wonWithValue.reduce((sum, proposal) => sum + totals(proposal).receivable, 0) / wonWithValue.length : 0,
    mrr,
    estimatedLtv: recurring.length ? (mrr / recurring.length) * 12 : 0,
    churnRate: churnBase ? (lostRecurringMonth.length / churnBase) * 100 : 0,
    nps: npsValues.length ? average(npsValues) : null,
    byCategory: Object.values(byCategory).sort((a, b) => b.value - a.value || b.leads - a.leads),
    lossReasons: Object.entries(lossReasons).sort((a, b) => b[1] - a[1]),
    sources: Object.entries(sources).sort((a, b) => b[1] - a[1]),
  };
}

function renderForm() {
  const proposal = getActiveProposal();
  if (!proposal) return;
  ensureServiceRows(proposal);

  qs("#proposalId").value = proposal.id;
  qs("#clientName").value = proposal.clientName || "";
  qs("#companyName").value = proposal.companyName || "";
  qs("#clientNif").value = proposal.clientNif || "";
  qs("#clientEmail").value = proposal.clientEmail || "";
  qs("#clientPhone").value = proposal.clientPhone || "";
  qs("#leadSource").value = proposal.leadSource || "Instagram";
  qs("#opportunityCategory").value = proposal.opportunityCategory || inferOpportunityCategory(proposal);
  qs("#leadDate").value = proposal.leadDate || dateOnly(proposal.createdAt || today());
  qs("#proposalSentDate").value = proposal.proposalSentDate || "";
  qs("#closedDate").value = proposal.closedDate || "";
  qs("#lostReason").value = proposal.lostReason || "";
  qs("#npsScore").value = proposal.npsScore || "";
  qs("#proposalStatus").value = proposal.status || "Novo pedido";
  qs("#followupDate").value = proposal.followupDate || "";
  qs("#validUntil").value = proposal.validUntil || "";
  qs("#sampleUrl").value = proposal.sampleUrl || "";
  qs("#discount").value = proposal.discount || 0;
  qs("#vatMode").value = proposal.vatMode || "0";
  qs("#withholdingMode").value = proposal.withholdingMode || "0";
  qs("#paymentTerms").value = proposal.paymentTerms || state.brand.paymentTerms || "";
  qs("#paymentIban").value = proposal.paymentIban || state.brand.iban || "";
  qs("#paidAmount").value = proposal.paidAmount || 0;
  qs("#billedAmount").value = proposal.billedAmount || 0;
  qs("#internalNotes").value = proposal.internalNotes || "";
  qs("#proposalNotes").value = proposal.proposalNotes || "";
  renderProposalSummary(proposal);
  renderActivities(proposal);
  renderQuickProductSelect();

  qs("#serviceRows").innerHTML = proposal.services
    .map((service, index) => {
      return `
        <div class="service-row" data-index="${index}">
          <div class="service-name">
            <input type="checkbox" ${service.selected ? "checked" : ""} data-field="selected" aria-label="Selecionar serviço" />
            <div class="service-name-stack">
              <input type="text" value="${escapeAttr(service.name)}" data-field="name" aria-label="Nome do serviço" />
              ${serviceMeta(service) ? `<span class="service-meta">${escapeHtml(serviceMeta(service))}</span>` : ""}
            </div>
          </div>
          <input type="number" min="1" step="1" value="${Number(service.qty || 1)}" data-field="qty" aria-label="Quantidade" />
          <input type="number" min="0" step="0.01" value="${Number(service.price || 0)}" data-field="price" aria-label="Preço" />
          <button class="remove-row" type="button" data-remove-service="${index}" title="Remover">×</button>
        </div>
      `;
    })
    .join("");

  renderPreview();
}

function readForm() {
  const proposal = getActiveProposal() || emptyProposal();
  proposal.clientName = qs("#clientName").value.trim();
  proposal.companyName = qs("#companyName").value.trim();
  proposal.clientNif = qs("#clientNif").value.trim();
  proposal.clientEmail = qs("#clientEmail").value.trim();
  proposal.clientPhone = qs("#clientPhone").value.trim();
  proposal.leadSource = qs("#leadSource").value;
  proposal.opportunityCategory = qs("#opportunityCategory").value;
  proposal.leadDate = qs("#leadDate").value || dateOnly(proposal.createdAt || today());
  proposal.proposalSentDate = qs("#proposalSentDate").value;
  proposal.closedDate = qs("#closedDate").value;
  proposal.lostReason = qs("#lostReason").value;
  proposal.npsScore = qs("#npsScore").value === "" ? "" : Number(qs("#npsScore").value);
  proposal.status = qs("#proposalStatus").value;
  if (statusIsSent(proposal.status) && !proposal.proposalSentDate) proposal.proposalSentDate = today();
  if (statusIsDecided(proposal.status) && !proposal.closedDate) proposal.closedDate = today();
  if (proposal.status !== "Perdido") proposal.lostReason = "";
  proposal.followupDate = qs("#followupDate").value;
  proposal.validUntil = qs("#validUntil").value;
  proposal.sampleUrl = qs("#sampleUrl").value.trim();
  proposal.discount = Number(qs("#discount").value || 0);
  proposal.vatMode = qs("#vatMode").value;
  proposal.withholdingMode = qs("#withholdingMode").value;
  proposal.paymentTerms = qs("#paymentTerms").value.trim();
  proposal.paymentIban = qs("#paymentIban").value.trim();
  proposal.paidAmount = Number(qs("#paidAmount").value || 0);
  proposal.billedAmount = Number(qs("#billedAmount").value || 0);
  proposal.internalNotes = qs("#internalNotes").value.trim();
  proposal.proposalNotes = qs("#proposalNotes").value.trim();
  proposal.updatedAt = new Date().toISOString();

  proposal.services = qsa(".service-row").map((row) => {
    const index = Number(row.dataset.index);
    const service = proposal.services[index] || {};
    return {
      ...service,
      name: row.querySelector('[data-field="name"]').value.trim(),
      qty: Number(row.querySelector('[data-field="qty"]').value || 1),
      price: Number(row.querySelector('[data-field="price"]').value || 0),
      selected: row.querySelector('[data-field="selected"]').checked,
    };
  });

  return proposal;
}

function renderProposalSummary(proposal) {
  const sum = totals(proposal);
  const overdue = proposal.followupDate && proposal.followupDate < today() && !["Faturado", "Perdido"].includes(proposal.status);
  const lastActivity = (proposal.activities || [])[0]?.createdAt?.slice(0, 10) || "Sem registo";
  qs("#proposalSummary").innerHTML = `
    <div class="summary-pill">
      <span>Total</span>
      <strong>${eur(sum.total)}</strong>
    </div>
    <div class="summary-pill">
      <span>Líquido</span>
      <strong>${eur(sum.receivable)}</strong>
    </div>
    <div class="summary-pill ${overdue ? "alert" : ""}">
      <span>Follow-up</span>
      <strong>${proposal.followupDate || "Sem data"}</strong>
    </div>
    <div class="summary-pill">
      <span>Último contacto</span>
      <strong>${lastActivity}</strong>
    </div>
  `;
}

function renderActivities(proposal) {
  const activities = proposal.activities || [];
  qs("#activityList").innerHTML =
    activities
      .map(
        (activity) => `
          <article class="activity-item">
            <strong>${escapeHtml(activity.type)}</strong>
            <span>${new Date(activity.createdAt).toLocaleString("pt-PT")}</span>
            <p>${escapeHtml(activity.note)}</p>
          </article>
        `,
      )
      .join("") || `<div class="empty">Ainda sem histórico comercial.</div>`;
}

function addActivity(type, note) {
  const proposal = readForm();
  proposal.activities ||= [];
  proposal.activities.unshift({
    id: crypto.randomUUID(),
    type,
    note,
    createdAt: new Date().toISOString(),
  });
  proposal.updatedAt = new Date().toISOString();
  const index = state.proposals.findIndex((item) => item.id === proposal.id);
  if (index >= 0) state.proposals[index] = proposal;
  saveState();
  renderAll();
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function scheduleFollowup(days) {
  const proposal = readForm();
  proposal.followupDate = addDays(days);
  if (proposal.status === "Novo pedido" || proposal.status === "Orçamento enviado") proposal.status = "Follow-up";
  qs("#followupDate").value = proposal.followupDate;
  qs("#proposalStatus").value = proposal.status;
  addActivity("Nota interna", `Follow-up agendado para ${proposal.followupDate}.`);
}

function upsertActiveProposal() {
  const proposal = readForm();
  const index = state.proposals.findIndex((item) => item.id === proposal.id);
  if (index >= 0) {
    state.proposals[index] = proposal;
  } else {
    state.proposals.unshift(proposal);
    activeId = proposal.id;
  }
  saveState();
  renderAll();
  showSuccessModal();
}

function renderPreview() {
  const proposal = getActiveProposal();
  if (!proposal) return;
  const brand = state.brand;
  const sum = totals(proposal);
  const split = billingTotals(proposal);
  const services = selectedServices(proposal);
  const iban = proposal.paymentIban || state.brand.iban || "";
  const recurring = hasRecurringServices(proposal);
  const qrImageUrl = proposal.sampleUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(proposal.sampleUrl)}`
    : "";

  qs("#proposalPreview").innerHTML = `
    <article class="quote-page ${proposal.sampleUrl ? "" : "quote-no-qr"}" style="--brand:${escapeAttr(brand.color)}">
      <header class="quote-head">
        <div>
          <div class="quote-logo"><img src="./assets/uneed-logo-branco.png" alt="UNEED" /></div>
          <h2 class="quote-title">Proposta digital para ${escapeHtml(proposal.companyName || proposal.clientName || "novo cliente")}</h2>
          <p class="quote-subtitle">${escapeHtml(proposalHeadline(proposal))}</p>
        </div>
        <div class="quote-meta">
          <strong>${escapeHtml(brand.name)}</strong>
          <span>${escapeHtml(brand.email)}<br>${escapeHtml(brand.phone)}<br>${escapeHtml(brand.website)}</span>
          ${qrImageUrl ? `<div class="qr"><img src="${qrImageUrl}" alt="QR code da amostra" /><span class="print-url">${escapeHtml(proposal.sampleUrl)}</span></div>` : ""}
        </div>
      </header>

      <div class="quote-body">
        <section class="quote-client">
          <div class="quote-block">
            <span>Cliente</span>
            <strong>${escapeHtml(proposal.clientName || "Por preencher")}</strong>
            <p>${escapeHtml(proposal.companyName || "")}${proposal.clientNif ? `<br>NIF: ${escapeHtml(proposal.clientNif)}` : ""}</p>
          </div>
          <div class="quote-block">
            <span>Validade</span>
            <strong>${proposal.validUntil || "Por definir"}</strong>
            <p>${escapeHtml(proposal.clientEmail || proposal.clientPhone || "")}</p>
          </div>
        </section>

        <table class="quote-table">
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Modalidade</th>
              <th>Qtd.</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${
              services.length
                ? services
                    .map(
                      (service) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(service.name)}</strong>
                    ${service.pitch ? `<em>${escapeHtml(service.pitch)}</em>` : ""}
                    ${service.includes ? `<small>${escapeHtml(service.includes)}</small>` : ""}
                  </td>
                  <td>${escapeHtml([service.billing || "Pronto pagamento", service.commitment].filter(Boolean).join(" · "))}</td>
                  <td>${Number(service.qty || 0)}</td>
                  <td>${eur(Number(service.qty || 0) * Number(service.price || 0))}</td>
                </tr>
              `,
                    )
                    .join("")
                : `<tr><td colspan="4">Seleciona serviços para construir o orçamento.</td></tr>`
            }
          </tbody>
        </table>

        <section class="quote-bottom">
          <div class="quote-block payment-block">
            <span>Observações e pagamento</span>
            <p>${escapeHtml(proposal.proposalNotes || "Proposta válida até à data indicada. O projeto inicia após aprovação e pagamento da entrada acordada.")}</p>
            ${proposal.paymentTerms ? `<p><strong>Pagamento:</strong> ${escapeHtml(proposal.paymentTerms)}</p>` : ""}
            ${recurring ? `<p><strong>Avenças:</strong> as mensalidades funcionam por débito direto através da GoCardless. O cliente autoriza o mandato antes da primeira cobrança e recebe aviso antes dos pagamentos. A GoCardless opera pagamentos bancários por débito direto/SEPA e aplica mecanismos de segurança e proteção do pagador.</p>` : ""}
            ${iban ? `<p><strong>NIB/IBAN:</strong> ${escapeHtml(iban)}</p>` : ""}
            ${proposal.sampleUrl ? `<p><strong>Amostra:</strong> ${escapeHtml(proposal.sampleUrl)}</p>` : ""}
          </div>
          <div class="total-box">
            <div class="total-line"><span>Pontual/setup</span><strong>${eur(split.once)}</strong></div>
            <div class="total-line"><span>Mensalidade</span><strong>${eur(split.monthly)}</strong></div>
            <div class="total-line"><span>Anual</span><strong>${eur(split.annual)}</strong></div>
            <div class="total-line"><span>Desconto</span><strong>${eur(sum.discount)}</strong></div>
            <div class="total-line"><span>IVA</span><strong>${eur(sum.vat)}</strong></div>
            ${sum.withholding ? `<div class="total-line"><span>Retenção</span><strong>-${eur(sum.withholding)}</strong></div>` : ""}
            <div class="total-line grand"><span>Total ref.</span><strong>${eur(sum.total)}</strong></div>
            ${sum.withholding ? `<div class="total-line net"><span>Líquido a receber</span><strong>${eur(sum.receivable)}</strong></div>` : ""}
          </div>
        </section>
      </div>

      <footer class="quote-footer">
        <span>${escapeHtml(brand.name)} · Proposta gerada localmente</span>
        <span>${new Date().toLocaleDateString("pt-PT")}</span>
      </footer>
    </article>
  `;
}

function renderDashboard() {
  const openStatuses = new Set(["Novo pedido", "Orçamento enviado", "Follow-up", "Aceite", "Em desenvolvimento"]);
  const proposals = state.proposals;
  const currentMonth = monthKey();
  const recurringMonthly = recurringProposals().reduce((sum, proposal) => sum + recurringMonthlyValue(proposal), 0);
  const openValue = proposals.filter((p) => openStatuses.has(p.status)).reduce((sum, p) => sum + totals(p).total, 0);
  const billedOneOff = proposals
    .filter((p) => monthKey(p.updatedAt || p.createdAt || today()) === currentMonth)
    .reduce((sum, p) => {
      const billing = billingTotals(p);
      return sum + recognizedRevenue(p) - (p.status === "Faturado" ? billing.monthly : 0);
    }, 0);
  const billed = Math.max(billedOneOff, 0) + recurringMonthly;
  const currentQuarter = quarterKey();
  const fiscal = fiscalQuarterStats(currentQuarter);
  const fiscalYear = fiscalYearStats();
  const quarter = quarterMeta(currentQuarter);
  const manualWithheld = Number(state.fiscal?.yearlyWithheldAdjustment || 0);
  const annualWithheld = fiscalYear.withholding + manualWithheld;
  const closed = proposals.filter((p) => ["Aceite", "Em desenvolvimento", "Concluído", "Faturado"].includes(p.status)).length;
  const decided = proposals.filter((p) => ["Aceite", "Em desenvolvimento", "Concluído", "Faturado", "Perdido"].includes(p.status)).length;
  const followups = proposals.filter((p) => p.followupDate && !["Faturado", "Perdido"].includes(p.status));

  qs("#metricPipeline").textContent = eur(openValue);
  qs("#metricBilled").textContent = eur(billed);
  qs("#metricCloseRate").textContent = `${decided ? Math.round((closed / decided) * 100) : 0}%`;
  qs("#metricFollowups").textContent = String(followups.length);
  qs("#metricTaxable").textContent = eur(fiscal.taxable);
  qs("#metricVatDue").textContent = eur(fiscal.vat);
  qs("#metricWithheld").textContent = eur(fiscal.withholding);
  qs("#metricReceivable").textContent = eur(fiscal.receivable);
  qs("#fiscalQuarterLabel").textContent = `${quarter.label} · ${quarter.period}`;
  qs("#vatDueHint").textContent = `${quarter.label}: ${quarter.period}. Pagamento até ${quarter.paymentDue}.`;
  qs("#withheldYearHint").textContent = `Ano: ${eur(annualWithheld)} acumulados`;
  qs("#vatScheduleTooltip").innerHTML = vatSchedule().map((item) => `
    <span>
      <strong>${escapeHtml(item.label.replace(` de ${new Date().getFullYear()}`, ""))}</strong>
      ${escapeHtml(item.period)} · declaração até ${escapeHtml(item.declarationDue)} · pagamento até ${escapeHtml(item.paymentDue)}
    </span>
  `).join("");

  const ordered = [...followups].sort((a, b) => {
    return followupAscending
      ? (a.followupDate || "").localeCompare(b.followupDate || "")
      : (b.followupDate || "").localeCompare(a.followupDate || "");
  });

  qs("#nextActions").innerHTML =
    ordered
      .slice(0, 7)
      .map((p) => {
        const overdue = p.followupDate < today();
        return `
          <article class="action-item ${overdue ? "is-overdue" : ""}">
            <button data-open="${p.id}" type="button">
              <strong>${escapeHtml(p.companyName || p.clientName || "Cliente sem nome")}</strong>
              <span>${overdue ? "Atrasado desde" : "Follow-up"} ${p.followupDate} · ${eur(totals(p).total)}</span>
            </button>
            <button class="button ghost mini" data-email-reminder="${p.id}" type="button">Email lembrete</button>
          </article>
        `;
      })
      .join("") || `<div class="empty">Sem follow-ups pendentes.</div>`;

  renderGoal(billed);
}

function renderGoal(billedThisMonth) {
  const target = Number(state.monthTarget || 0);
  const progress = target ? Math.min((billedThisMonth / target) * 100, 100) : 0;
  const activeRecurring = recurringProposals();
  const recurringMonthly = activeRecurring.reduce((sum, proposal) => sum + recurringMonthlyValue(proposal), 0);
  const recurringProgress = state.recurringTarget ? Math.min((recurringMonthly / Number(state.recurringTarget || 0)) * 100, 100) : 0;
  qs("#monthTarget").value = target;
  qs("#targetMeterFill").style.width = `${progress}%`;
  qs("#targetSummary").textContent = `${Math.round(progress)}% da meta mensal · ${eur(billedThisMonth)} faturados`;
  qs("#sideRecurringValue").textContent = `${eur(recurringMonthly)}/mês`;
  qs("#sideRecurringFill").style.width = `${recurringProgress}%`;
  qs("#sideRecurringSummary").textContent = `${Math.round(recurringProgress)}% da meta · ${activeRecurring.length} ativas`;

  const sent = state.proposals.filter((p) => ["Orçamento enviado", "Follow-up", "Aceite", "Em desenvolvimento", "Concluído", "Faturado"].includes(p.status)).length;
  const won = state.proposals.filter((p) => ["Aceite", "Em desenvolvimento", "Concluído", "Faturado"].includes(p.status)).length;
  const followupsDone = state.proposals.filter((p) => p.status === "Follow-up").length;

  const achievements = [
    { icon: "€", title: "Meta mensal", text: progress >= 100 ? "Meta atingida." : `${eur(Math.max(target - billedThisMonth, 0))} até à meta.` },
    { icon: "↑", title: "Propostas enviadas", text: `${sent} propostas já entraram em circulação.` },
    { icon: "✓", title: "Negócios ganhos", text: `${won} oportunidades aceites ou em produção.` },
    { icon: "!", title: "Ritmo comercial", text: `${followupsDone} propostas estão em follow-up ativo.` },
  ];

  qs("#achievements").innerHTML = achievements
    .map(
      (item) => `
        <div class="achievement">
          <div class="badge">${item.icon}</div>
          <div><strong>${item.title}</strong><span>${item.text}</span></div>
        </div>
      `,
    )
    .join("");
}

function renderHistory() {
  const grid = qs("#historyGrid");
  if (!grid) return;
  const months = [...new Set(state.proposals.flatMap((proposal) => [monthKey(proposal.createdAt || today()), revenueMonth(proposal)]))]
    .filter(Boolean)
    .sort()
    .reverse();

  grid.innerHTML = months
    .map((month) => {
      const stats = monthlyStats(month);
      const progress = state.monthTarget ? Math.round(Math.min((stats.billed / Number(state.monthTarget || 0)) * 100, 100)) : 0;
      return `
        <article class="history-card">
          <h2>${escapeHtml(month)}</h2>
          <div class="history-stats">
            <div class="client-metric"><span>Propostas</span><strong>${stats.sent}</strong></div>
            <div class="client-metric"><span>Faturado</span><strong>${eur(stats.billed)}</strong></div>
            <div class="client-metric"><span>Avenças/mês</span><strong>${eur(stats.recurring)}</strong></div>
            <div class="client-metric"><span>Ganhas</span><strong>${stats.won}</strong></div>
            <div class="client-metric"><span>Meta</span><strong>${progress}%</strong></div>
          </div>
        </article>
      `;
    })
    .join("") || `<div class="empty">Ainda não há histórico mensal.</div>`;
}

function renderPipeline() {
  const term = qs("#searchInput").value.trim().toLowerCase();
  const filter = qs("#statusFilter").value;
  const proposals = state.proposals.filter((proposal) => {
    const haystack = [proposal.clientName, proposal.companyName, proposal.status, ...(proposal.services || []).map((s) => s.name)].join(" ").toLowerCase();
    return (!term || haystack.includes(term)) && (!filter || proposal.status === filter);
  });

  qs("#kanban").innerHTML = pipelineStatuses
    .map((status) => {
      const cards = proposals.filter((proposal) => proposal.status === status);
      return `
        <section class="kanban-column" data-drop-status="${escapeAttr(status)}">
          <h2>${status}<span>${cards.length}</span></h2>
          ${
            cards
              .map((proposal) => {
                const sum = totals(proposal);
                return `
                  <details class="deal-card ${proposal.followupDate && proposal.followupDate < today() && !["Faturado", "Perdido"].includes(proposal.status) ? "is-overdue" : ""}" data-open="${proposal.id}" draggable="true">
                    <summary class="deal-summary">
                      <span>
                        <strong>${escapeHtml(proposal.companyName || proposal.clientName || "Sem nome")}</strong>
                        <span class="card-meta">${escapeHtml(proposalLabel(proposal))}</span>
                      </span>
                      <span class="deal-value">
                        <strong>${eur(sum.receivable)}</strong>
                        <small>Líquido</small>
                      </span>
                    </summary>
                    <div class="deal-card-body">
                      <span class="card-meta fiscal-breakdown">${escapeHtml(pipelineValueSummary(sum))}</span>
                      <span class="card-meta">Cliente: ${escapeHtml(proposal.clientName || "sem nome")}</span>
                      <span class="card-meta">Follow-up: ${proposal.followupDate || "sem data"}</span>
                      <select class="status-select" data-status-id="${proposal.id}">
                        ${statuses.map((item) => `<option ${item === proposal.status ? "selected" : ""}>${item}</option>`).join("")}
                      </select>
                      <div class="deal-actions">
                        <button class="button ghost mini" data-open="${proposal.id}" type="button">Editar</button>
                        <button class="button danger mini" data-delete-proposal="${proposal.id}" type="button">Apagar</button>
                      </div>
                    </div>
                  </details>
                `;
              })
              .join("") || `<div class="empty">Sem propostas.</div>`
          }
        </section>
      `;
    })
    .join("");
}

function emptyInstagramProspect() {
  return {
    id: crypto.randomUUID(),
    name: "",
    instagramUrl: "",
    phone: "",
    niche: "",
    status: "Por fazer",
    hasWebsite: false,
    hasBooking: false,
    hasWhatsappTree: false,
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formalizeProspectMessage(message) {
  return String(message || "")
    .replace(/\bQueres que eu prepare\b/gi, "Faria sentido preparar")
    .replace(/\bQueres\b/gi, "Gostaria")
    .replace(/\bTens\b/gi, "Tem")
    .replace(/\bPodes\b/gi, "Pode")
    .replace(/\bteus\b/gi, "seus")
    .replace(/\btuas\b/gi, "suas")
    .replace(/\bteu\b/gi, "seu")
    .replace(/\btua\b/gi, "sua")
    .replace(/\bcontigo\b/gi, "consigo")
    .replace(/\bpara ti\b/gi, "para si");
}

function prospectMessageParagraphs(message) {
  const text = formalizeProspectMessage(message).trim();
  if (!text) return [];
  const explicitParagraphs = text.split(/\n\s*\n|\n+/).map((part) => part.trim()).filter(Boolean);
  if (explicitParagraphs.length > 1) return explicitParagraphs;
  return text.split(/(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/u).map((part) => part.trim()).filter(Boolean);
}

function renderProspectMessage(prospect) {
  const paragraphs = prospectMessageParagraphs(prospect.message);
  return `<details class="prospect-message"><summary>Mensagem preparada</summary><div class="prospect-message-paragraphs">${paragraphs.map((paragraph, index) => `<div class="prospect-message-paragraph"><p>${escapeHtml(paragraph)}</p><button class="prospect-copy-button" data-copy-prospect="${escapeAttr(prospect.id)}" data-copy-paragraph="${index}" type="button" aria-label="Copiar parágrafo ${index + 1}">Copiar</button></div>`).join("")}</div></details>`;
}

function prospectSignalLabel(prospect) {
  const signals = [];
  signals.push(prospect.hasWebsite ? "Site: sim" : "Site: não");
  signals.push(prospect.hasBooking ? "Marcações: sim" : "Marcações: não");
  signals.push(prospect.hasWhatsappTree ? "WhatsApp/link tree: sim" : "WhatsApp/link tree: não");
  return signals.join(" · ");
}

function normalizedProspectKeys(prospect) {
  const domain = (() => { try { return new URL(prospect.website || "").hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } })();
  const instagram = String(prospect.instagramUrl || "").toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "");
  const phone = String(prospect.phone || "").replace(/\D/g, "").replace(/^351/, "");
  const namePlace = `${String(prospect.name || "").toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "")}|${String(prospect.municipality || "").toLowerCase()}`;
  return [prospect.placeId && `place:${prospect.placeId}`, domain && `domain:${domain}`, instagram && `instagram:${instagram}`, phone && `phone:${phone}`, namePlace !== "|" && `name:${namePlace}`].filter(Boolean);
}

function knownProspectKeys() {
  return [...new Set([...(state.instagramProspects || []).flatMap(normalizedProspectKeys), ...(state.prospectRejectedKeys || [])])];
}

async function loadPortugalMunicipalities() {
  try {
    const response = await fetch("./portugal-municipalities.json");
    portugalMunicipalities = (await response.json()).filter((item) => item.name && item.district);
    const islands = {
      "Região Autónoma dos Açores": ["Angra do Heroísmo", "Calheta", "Corvo", "Horta", "Lagoa", "Lajes das Flores", "Lajes do Pico", "Madalena", "Nordeste", "Ponta Delgada", "Povoação", "Praia da Vitória", "Ribeira Grande", "Santa Cruz da Graciosa", "Santa Cruz das Flores", "São Roque do Pico", "Velas", "Vila do Porto", "Vila Franca do Campo"],
      "Região Autónoma da Madeira": ["Calheta", "Câmara de Lobos", "Funchal", "Machico", "Ponta do Sol", "Porto Moniz", "Porto Santo", "Ribeira Brava", "Santa Cruz", "Santana", "São Vicente"],
    };
    Object.entries(islands).forEach(([district, names]) => names.forEach((name) => portugalMunicipalities.push({ name, district })));
  } catch {
    portugalMunicipalities = [];
  }
  const district = qs("#prospectDistrict");
  const filter = qs("#prospectDistrictFilter");
  const districts = [...new Set(portugalMunicipalities.map((item) => item.district))].sort((a, b) => a.localeCompare(b, "pt"));
  if (district) district.innerHTML = districts.map((item) => `<option>${escapeHtml(item)}</option>`).join("");
  if (filter) filter.innerHTML = `<option value="">Todos os distritos</option>${districts.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}`;
  updateMunicipalityOptions();
  updateMunicipalityFilter();
}

function updateMunicipalityOptions() {
  const district = qs("#prospectDistrict")?.value || "";
  const items = portugalMunicipalities.filter((item) => item.district === district).sort((a, b) => a.name.localeCompare(b.name, "pt"));
  const select = qs("#prospectMunicipality");
  if (select) select.innerHTML = `<option value="">Todos os municípios</option>${items.map((item) => `<option>${escapeHtml(item.name)}</option>`).join("")}`;
}

function updateMunicipalityFilter() {
  const district = qs("#prospectDistrictFilter")?.value || "";
  const names = [...new Set((state.instagramProspects || []).filter((item) => !district || item.district === district).map((item) => item.municipality).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt"));
  const select = qs("#prospectMunicipalityFilter");
  if (select) select.innerHTML = `<option value="">Todos os municípios</option>${names.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}`;
}

function updateNicheFilter() {
  const select = qs("#prospectNicheFilter");
  if (!select) return;
  const selected = select.value;
  const niches = [...new Set([
    ...prospectNiches.map((item) => item.label),
    ...(state.instagramProspects || []).map((item) => item.niche).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b, "pt"));
  select.innerHTML = `<option value="">Todos os nichos</option><option value="__none__">Sem nicho (contactos antigos)</option>${niches.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}`;
  if (selected === "__none__" || niches.includes(selected)) select.value = selected;
}

async function generateProspects() {
  const button = qs("#prospectGenerateBtn");
  const status = qs("#prospectRunStatus");
  const district = qs("#prospectDistrict").value;
  const selectedMunicipality = qs("#prospectMunicipality").value;
  const municipalities = selectedMunicipality ? [selectedMunicipality] : portugalMunicipalities.filter((item) => item.district === district).map((item) => item.name);
  const niche = prospectNiches.find((item) => item.id === qs("#prospectNiche").value) || prospectNiches[0];
  button.disabled = true;
  status.hidden = false;
  status.dataset.tone = "progress";
  status.textContent = `A pesquisar ${municipalities.length} município(s)…`;
  try {
    const headers = { "Content-Type": "application/json" };
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.auth.getSession();
      if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    const response = await fetch("/api/prospect/search", { method: "POST", headers, body: JSON.stringify({ niche, district, municipalities, radiusKm: Number(qs("#prospectRadius").value), limit: Number(qs("#prospectLimit").value), minScore: Number(qs("#prospectMinScore").value), knownKeys: knownProspectKeys() }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Não foi possível concluir a pesquisa");
    const added = [];
    for (const lead of payload.results || []) {
      if (normalizedProspectKeys(lead).some((key) => knownProspectKeys().includes(key))) continue;
      added.push({ ...emptyInstagramProspect(), ...lead, message: formalizeProspectMessage(lead.message), id: crypto.randomUUID(), status: "Por fazer", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    state.instagramProspects.unshift(...added);
    state.prospectStats.searches += 1;
    state.prospectStats.duplicatesSkipped += Number(payload.duplicates || 0);
    state.prospectStats.rejected += Number(payload.rejected || 0);
    state.prospectRejectedKeys = [...new Set([...(state.prospectRejectedKeys || []), ...(payload.rejectedKeys || [])])].slice(-20000);
    saveState();
    updateMunicipalityFilter();
    renderInstagramProspecting();
    status.dataset.tone = "success";
    status.textContent = `${added.length} adicionados ao Kanban · ${payload.duplicates || 0} repetidos evitados · ${payload.rejected || 0} rejeitados pelo score.`;
  } catch (error) {
    status.dataset.tone = "error";
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

function renderInstagramProspecting() {
  const board = qs("#instagramKanban");
  if (!board) return;
  state.instagramProspects ||= [];
  updateNicheFilter();

  const term = (qs("#instagramSearchInput")?.value || "").trim().toLowerCase();
  const filter = qs("#instagramStatusFilter")?.value || "";
  const nicheFilter = qs("#prospectNicheFilter")?.value || "";
  const districtFilter = qs("#prospectDistrictFilter")?.value || "";
  const municipalityFilter = qs("#prospectMunicipalityFilter")?.value || "";
  const prospects = state.instagramProspects.filter((prospect) => {
    const haystack = [
      prospect.name,
      prospect.instagramUrl,
      prospect.phone,
      prospect.status,
      prospect.notes,
      prospect.district,
      prospect.municipality,
      prospect.niche,
      prospect.opportunity,
      prospectSignalLabel(prospect),
    ].join(" ").toLowerCase();
    const matchesNiche = !nicheFilter || (nicheFilter === "__none__" ? !prospect.niche : prospect.niche === nicheFilter);
    return (!term || haystack.includes(term)) && (!filter || prospect.status === filter) && matchesNiche && (!districtFilter || prospect.district === districtFilter) && (!municipalityFilter || prospect.municipality === municipalityFilter);
  });

  const total = state.instagramProspects.length;
  const messaged = state.instagramProspects.filter((item) => item.status !== "Por fazer").length;
  const demos = state.instagramProspects.filter((item) => item.status === "Pediu demonstração").length;
  const active = state.instagramProspects.filter((item) => item.status === "Cliente ativo").length;
  const conversionBase = Math.max(total, 1);
  qs("#instagramMetricTotal").textContent = total;
  qs("#instagramMetricMessaged").textContent = messaged;
  qs("#instagramMetricDemo").textContent = demos;
  qs("#instagramMetricActive").textContent = active;
  qs("#prospectMetricScore").textContent = total ? Math.round(state.instagramProspects.reduce((sum, item) => sum + Number(item.score || 0), 0) / total) : 0;
  qs("#prospectMetricDuplicates").textContent = state.prospectStats?.duplicatesSkipped || 0;
  qs("#instagramConversionMetric").textContent = `${Math.round(((demos + active) / conversionBase) * 100)}%`;

  board.innerHTML = instagramProspectStatuses
    .map((status) => {
      const cards = prospects.filter((prospect) => prospect.status === status);
      return `
        <section class="kanban-column prospect-column" data-instagram-drop-status="${escapeAttr(status)}">
          <h2>${escapeHtml(status)}<span>${cards.length}</span></h2>
          ${
            cards
              .map((prospect) => `
                <article class="deal-card prospect-card" data-instagram-open="${escapeAttr(prospect.id)}" draggable="true">
                  <div class="deal-summary">
                    <span>
                      <strong>${escapeHtml(prospect.name || "Contacto sem nome")}</strong>
                      <span class="card-meta">${escapeHtml(prospect.phone || "Sem telefone")}</span>
                    </span>
                    <span class="prospect-score">${prospect.hasWebsite ? "Site" : "Sem site"}</span>
                  </div>
                  <div class="deal-card-body">
                    ${safeExternalUrl(prospect.instagramUrl) ? `<a class="prospect-link" href="${escapeAttr(safeExternalUrl(prospect.instagramUrl))}" target="_blank" rel="noopener">Contactar pelo Instagram</a>` : `<span class="card-meta">Instagram não encontrado · usar telefone</span>`}
                    ${prospect.niche ? `<span class="card-meta">Nicho: ${escapeHtml(prospect.niche)}</span>` : `<span class="card-meta">Nicho por classificar</span>`}
                    <span class="card-meta prospect-signals">${escapeHtml(prospectSignalLabel(prospect))}</span>
                    ${prospect.score ? `<span class="prospect-score-line">Score ${escapeHtml(prospect.score)} · ${escapeHtml(prospect.district || "")} / ${escapeHtml(prospect.municipality || "")}</span>` : ""}
                    ${safeExternalUrl(prospect.website) ? `<a class="prospect-link" href="${escapeAttr(safeExternalUrl(prospect.website))}" target="_blank" rel="noopener">Abrir website</a>` : ""}
                    ${safeExternalUrl(prospect.mapsUrl) ? `<a class="prospect-link" href="${escapeAttr(safeExternalUrl(prospect.mapsUrl))}" target="_blank" rel="noopener">Google Maps</a>` : ""}
                    ${prospect.message ? renderProspectMessage(prospect) : ""}
                    ${prospect.notes ? `<details class="prospect-message"><summary>Análise do lead</summary><p>${escapeHtml(prospect.notes)}</p></details>` : ""}
                    <select class="status-select" data-instagram-status-id="${escapeAttr(prospect.id)}">
                      ${instagramProspectStatuses.map((item) => `<option ${item === prospect.status ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
                    </select>
                    <div class="deal-actions">
                      <button class="button ghost mini" data-instagram-edit="${escapeAttr(prospect.id)}" type="button">Editar</button>
                      <button class="button danger mini" data-instagram-delete="${escapeAttr(prospect.id)}" type="button">Apagar</button>
                    </div>
                  </div>
                </article>
              `)
              .join("") || `<div class="empty">Sem contactos.</div>`
          }
        </section>
      `;
    })
    .join("");
}

function readInstagramProspectForm() {
  const id = qs("#instagramProspectId").value || crypto.randomUUID();
  const existing = state.instagramProspects.find((prospect) => prospect.id === id);
  return {
    ...(existing || emptyInstagramProspect()),
    id,
    name: qs("#instagramName").value.trim(),
    instagramUrl: qs("#instagramUrl").value.trim(),
    phone: qs("#instagramPhone").value.trim(),
    status: qs("#instagramStatus").value || "Por fazer",
    niche: qs("#instagramNiche").value,
    hasWebsite: qs("#instagramHasWebsite").checked,
    hasBooking: qs("#instagramHasBooking").checked,
    hasWhatsappTree: qs("#instagramHasWhatsappTree").checked,
    notes: qs("#instagramNotes").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function clearInstagramProspectForm() {
  qs("#instagramProspectId").value = "";
  qs("#instagramName").value = "";
  qs("#instagramUrl").value = "";
  qs("#instagramPhone").value = "";
  qs("#instagramStatus").value = "Por fazer";
  qs("#instagramNiche").value = "";
  qs("#instagramHasWebsite").checked = false;
  qs("#instagramHasBooking").checked = false;
  qs("#instagramHasWhatsappTree").checked = false;
  qs("#instagramNotes").value = "";
}

function editInstagramProspect(id) {
  const prospect = state.instagramProspects.find((item) => item.id === id);
  if (!prospect) return;
  qs("#instagramProspectId").value = prospect.id;
  qs("#instagramName").value = prospect.name || "";
  qs("#instagramUrl").value = prospect.instagramUrl || "";
  qs("#instagramPhone").value = prospect.phone || "";
  qs("#instagramStatus").value = prospect.status || "Por fazer";
  qs("#instagramNiche").value = prospect.niche || "";
  qs("#instagramHasWebsite").checked = Boolean(prospect.hasWebsite);
  qs("#instagramHasBooking").checked = Boolean(prospect.hasBooking);
  qs("#instagramHasWhatsappTree").checked = Boolean(prospect.hasWhatsappTree);
  qs("#instagramNotes").value = prospect.notes || "";
  switchView("instagram");
  qs("#instagramName").focus();
}

function upsertInstagramProspect() {
  const prospect = readInstagramProspectForm();
  const index = state.instagramProspects.findIndex((item) => item.id === prospect.id);
  if (index >= 0) {
    state.instagramProspects[index] = prospect;
  } else {
    state.instagramProspects.unshift({ ...prospect, createdAt: new Date().toISOString() });
  }
  clearInstagramProspectForm();
  saveState();
  renderAll();
}

function updateInstagramProspect(id, patch) {
  const prospect = state.instagramProspects.find((item) => item.id === id);
  if (!prospect) return;
  Object.assign(prospect, patch, { updatedAt: new Date().toISOString() });
  saveState();
  renderInstagramProspecting();
}

function deleteInstagramProspect(id) {
  state.instagramProspects = state.instagramProspects.filter((item) => item.id !== id);
  if (qs("#instagramProspectId")?.value === id) clearInstagramProspectForm();
  saveState();
  renderInstagramProspecting();
}

function renderTickets() {
  const board = qs("#ticketsBoard");
  if (!board) return;
  state.tickets ||= [];
  const term = (qs("#ticketSearchInput")?.value || "").trim().toLowerCase();
  const statusFilter = qs("#ticketStatusFilter")?.value || "";
  const priorityFilter = qs("#ticketPriorityFilter")?.value || "";
  const tickets = [...state.tickets]
    .map(normalizeTicket)
    .filter((ticket) => {
      const haystack = [
        ticket.code,
        ticket.clientName,
        ticket.companyName,
        ticket.email,
        ticket.phone,
        ticket.projectUrl,
        ticket.category,
        ticket.priority,
        ticket.status,
        ticket.subject,
        ticket.message,
      ].join(" ").toLowerCase();
      return (!term || haystack.includes(term)) &&
        (!statusFilter || ticket.status === statusFilter) &&
        (!priorityFilter || ticket.priority === priorityFilter);
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  qs("#ticketMetricNew").textContent = String(state.tickets.filter((ticket) => ticket.status === "Novo").length);
  qs("#ticketMetricOpen").textContent = String(state.tickets.filter(ticketIsOpen).length);
  qs("#ticketMetricUrgent").textContent = String(state.tickets.filter((ticket) => ticket.priority === "Urgente").length);
  qs("#ticketMetricResolved").textContent = String(state.tickets.filter((ticket) => ["Resolvido", "Fechado"].includes(ticket.status)).length);
  qs("#supportPublicUrl").textContent = `${window.location.origin}/suporte`;

  board.innerHTML = tickets
    .map((ticket) => {
      const urgent = ticket.priority === "Urgente";
      const created = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("pt-PT") : "";
      return `
        <article class="ticket-card ${urgent ? "is-urgent" : ""}" data-ticket-id="${escapeAttr(ticket.id)}">
          <header class="ticket-head">
            <div>
              <span class="ticket-code">${escapeHtml(ticket.code)}</span>
              <strong>${escapeHtml(ticket.subject || "Pedido sem assunto")}</strong>
              <p>${escapeHtml([ticket.companyName, ticket.clientName, ticket.email].filter(Boolean).join(" · "))}</p>
            </div>
            <span class="ticket-priority">${escapeHtml(ticket.priority)}</span>
          </header>
          <div class="ticket-message">${escapeHtml(ticket.message || "Sem descrição.")}</div>
          <div class="ticket-meta-grid">
            <div><span>Categoria</span><strong>${escapeHtml(ticket.category)}</strong></div>
            <div><span>Entrada</span><strong>${escapeHtml(created)}</strong></div>
            <div><span>Projeto</span><strong>${safeExternalUrl(ticket.projectUrl) ? `<a href="${escapeAttr(safeExternalUrl(ticket.projectUrl))}" target="_blank" rel="noopener">Abrir</a>` : "Sem link"}</strong></div>
          </div>
          <label>
            Notas internas
            <textarea data-ticket-notes="${escapeAttr(ticket.id)}" rows="2" placeholder="Ex: responder até amanhã, pedir acesso, aguardar conteúdos...">${escapeHtml(ticket.internalNotes)}</textarea>
          </label>
          <div class="ticket-actions">
            <select data-ticket-status="${escapeAttr(ticket.id)}">
              ${ticketStatuses.map((status) => `<option ${status === ticket.status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
            <select data-ticket-priority="${escapeAttr(ticket.id)}">
              ${ticketPriorities.map((priority) => `<option ${priority === ticket.priority ? "selected" : ""}>${priority}</option>`).join("")}
            </select>
            <a class="button ghost mini" href="${ticketEmailHref(ticket)}">Responder</a>
          </div>
        </article>
      `;
    })
    .join("") || `<div class="empty">Ainda não há tickets. Partilha o link /suporte com os clientes.</div>`;
}

function renderRecurring() {
  const list = qs("#recurringList");
  if (!list) return;
  const active = recurringProposals().sort((a, b) => recurringMonthlyValue(b) - recurringMonthlyValue(a));
  const monthly = active.reduce((sum, proposal) => sum + recurringMonthlyValue(proposal), 0);
  const target = Number(state.recurringTarget || 0);
  const progress = target ? Math.min((monthly / target) * 100, 100) : 0;
  const average = active.length ? monthly / active.length : 0;
  const missing = Math.max(target - monthly, 0);
  const annualized = monthly * 12;
  const milestone = recurringMilestoneStatus(monthly);

  qs("#recurringMonthlyValue").textContent = eur(monthly);
  qs("#recurringCount").textContent = String(active.length);
  qs("#recurringAverage").textContent = eur(average);
  qs("#recurringProgress").textContent = `${Math.round(progress)}%`;
  qs("#recurringMissing").textContent = eur(missing);
  qs("#recurringTarget").value = target;
  qs("#recurringTargetFill").style.width = `${progress}%`;
  qs("#recurringSummary").textContent = progress >= 100
    ? `Meta batida. Tens ${eur(monthly)} de receita mensal recorrente, equivalente a ${eur(annualized)} por ano.`
    : `${eur(monthly)} / ${eur(target)} por mês. Faltam ${eur(missing)} para desbloquear a próxima meta.`;

  const achievements = [
    {
      icon: "MRR",
      title: "Motor recorrente",
      text: active.length ? `${active.length} avenças já reduzem a pressão de vender tudo de novo todos os meses.` : "Primeira missão: transformar uma proposta mensal em avença faturada.",
    },
    {
      icon: "12x",
      title: "Valor anualizado",
      text: `${eur(annualized)} de previsão anual se as avenças se mantiverem ativas.`,
    },
    {
      icon: "GO",
      title: "Próximo degrau",
      text: milestone.next ? `${eur(milestone.missing)} até aos ${eur(milestone.next)} mensais.` : "Todos os degraus definidos foram desbloqueados.",
    },
  ];

  qs("#recurringAchievements").innerHTML = achievements
    .map(
      (item) => `
        <div class="achievement">
          <div class="badge">${item.icon}</div>
          <div><strong>${item.title}</strong><span>${item.text}</span></div>
        </div>
      `,
    )
    .join("");

  qs("#recurringAchievements").insertAdjacentHTML("beforeend", `
    <div class="milestone-track" aria-label="Degraus de avenças">
      ${recurringMilestones.map((value) => `
        <span class="${monthly >= value ? "is-reached" : ""}">${eur(value)}</span>
      `).join("")}
    </div>
  `);

  qs("#recurringLeaderboard").innerHTML = active
    .slice(0, 5)
    .map((proposal, index) => `
      <article class="action-item">
        <button data-open="${proposal.id}" type="button">
          <strong>#${index + 1} ${escapeHtml(proposal.companyName || proposal.clientName || "Cliente sem nome")}</strong>
          <span>${escapeHtml(proposalLabel(proposal))} · ${eur(recurringMonthlyValue(proposal))}/mês</span>
        </button>
      </article>
    `)
    .join("") || `<div class="empty">Ainda não há avenças faturadas.</div>`;

  list.innerHTML = active
    .map((proposal) => {
      const monthlyValue = recurringMonthlyValue(proposal);
      return `
        <article class="recurring-card">
          <div>
            <span class="recurring-status">Ativa</span>
            <strong>${escapeHtml(proposal.companyName || proposal.clientName || "Cliente sem nome")}</strong>
            <p>${escapeHtml(proposalLabel(proposal))}</p>
          </div>
          <div class="recurring-card-metrics">
            <div><span>Mensal</span><strong>${eur(monthlyValue)}</strong></div>
            <div><span>Anualizado</span><strong>${eur(monthlyValue * 12)}</strong></div>
            <div><span>Desde</span><strong>${escapeHtml((proposal.updatedAt || proposal.createdAt || today()).slice(0, 10))}</strong></div>
          </div>
          <div class="client-order-actions">
            <button class="button ghost mini" data-open="${proposal.id}" type="button">Editar</button>
            <button class="button ghost mini" data-email-reminder="${proposal.id}" type="button">Email</button>
          </div>
        </article>
      `;
    })
    .join("") || `<div class="empty">Quando marcares uma proposta mensal como Faturado, ela aparece aqui automaticamente.</div>`;
}

function renderClients() {
  const grid = qs("#clientsGrid");
  if (!grid) return;
  const term = (qs("#clientSearchInput")?.value || "").trim().toLowerCase();
  const groups = new Map();
  state.proposals.forEach((proposal) => {
    const key = [proposal.companyName, proposal.clientName, proposal.clientEmail, proposal.clientNif].filter(Boolean).join(" · ") || "Cliente sem nome";
    const haystack = [key, proposal.clientPhone, proposal.status, proposalLabel(proposal)].join(" ").toLowerCase();
    if (term && !haystack.includes(term)) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(proposal);
  });

  grid.innerHTML = [...groups.entries()]
    .map(([client, proposals]) => {
      const total = proposals.reduce((sum, proposal) => sum + totals(proposal).total, 0);
      const billed = proposals.reduce((sum, proposal) => sum + recognizedRevenue(proposal), 0);
      const open = proposals.filter((proposal) => !["Faturado", "Perdido"].includes(proposal.status)).length;
      const activeRecurring = proposals.some((proposal) => recurringMonthlyValue(proposal) > 0);
      const first = proposals[0];
      return `
        <article class="client-card">
          <header class="client-head">
            <div>
              <strong>${escapeHtml(first.companyName || first.clientName || "Cliente sem nome")}</strong>
              <span>${escapeHtml([first.clientName, first.clientEmail, first.clientPhone, first.clientNif ? `NIF ${first.clientNif}` : ""].filter(Boolean).join(" · "))}</span>
            </div>
            <div class="client-head-actions">
              ${activeRecurring ? `<span class="status-pill is-active">Avença ativa</span>` : ""}
              <button class="button ghost mini" data-open="${first.id}" type="button">Abrir</button>
            </div>
          </header>
          <div class="client-metrics">
            <div class="client-metric"><span>Propostas</span><strong>${proposals.length}</strong></div>
            <div class="client-metric"><span>Em aberto</span><strong>${open}</strong></div>
            <div class="client-metric"><span>Faturado</span><strong>${eur(billed)}</strong></div>
          </div>
          <div class="client-meta">Valor total proposto: <strong>${eur(total)}</strong></div>
          <div class="client-orders">
            ${proposals
              .map(
                (proposal) => `
                  <div class="client-order">
                    <div>
                      <strong>${escapeHtml(proposalLabel(proposal))}</strong>
                      <span>${eur(totals(proposal).total)} · Follow-up: ${proposal.followupDate || "sem data"}</span>
                    </div>
                    <select data-client-status="${proposal.id}">
                      ${statuses.map((status) => `<option ${status === proposal.status ? "selected" : ""}>${status}</option>`).join("")}
                    </select>
                    <input type="date" value="${proposal.followupDate || ""}" data-client-followup="${proposal.id}" />
                    <div class="client-order-actions">
                      <button class="button ghost mini" data-email-reminder="${proposal.id}" type="button">Email</button>
                      <button class="button ghost mini" data-open="${proposal.id}" type="button">Editar</button>
                      <button class="button danger mini" data-delete-proposal="${proposal.id}" type="button">Apagar</button>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
      `;
    })
    .join("") || `<div class="empty">Sem clientes para mostrar.</div>`;
}

function renderSettings() {
  qs("#brandName").value = state.brand.name || "";
  qs("#brandEmail").value = state.brand.email || "";
  qs("#brandPhone").value = state.brand.phone || "";
  qs("#brandWebsite").value = state.brand.website || "";
  qs("#brandIban").value = state.brand.iban || "";
  qs("#brandPaymentTerms").value = state.brand.paymentTerms || "";
  qs("#brandColor").value = state.brand.color || "#111111";
  qs("#yearlyWithheldAdjustment").value = Number(state.fiscal?.yearlyWithheldAdjustment || 0);

  const catalog = state.catalog || [];
  const categoryList = [...new Set(catalog.map((service) => service.category || "Serviços personalizados"))].sort();
  if (catalogCategoryFilter && !categoryList.includes(catalogCategoryFilter)) catalogCategoryFilter = "";
  qs("#catalogCategoryFilter").innerHTML = `<option value="">Todas as categorias</option>${categoryList.map((category) => `<option value="${escapeAttr(category)}" ${category === catalogCategoryFilter ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}`;

  const groups = catalog.reduce((acc, service, index) => {
    const category = service.category || "Serviços personalizados";
    if (catalogCategoryFilter && category !== catalogCategoryFilter) return acc;
    acc[category] ||= [];
    acc[category].push({ service, index });
    return acc;
  }, {});

  qs("#catalogRows").innerHTML = Object.entries(groups)
    .map(([category, entries]) => `
      <details class="catalog-accordion" open>
        <summary>
          <span>${escapeHtml(category)}</span>
          <strong>${entries.length} serviços</strong>
        </summary>
        <div class="catalog-group">
          ${entries.map(({ service, index }) => `
        <details class="catalog-row" data-index="${index}">
          <summary class="catalog-service-summary">
            <span>
              <strong>${escapeHtml(service.name || "Serviço sem nome")}</strong>
              <small>${escapeHtml(service.category || "Sem categoria")} · ${escapeHtml(service.billing || "Pronto pagamento")} · ${eur(service.price || 0)}</small>
            </span>
            <button class="remove-row" type="button" data-remove-catalog="${index}" title="Remover serviço" aria-label="Remover serviço">×</button>
          </summary>
          <div class="catalog-service-body">
          <div class="catalog-card-head">
            <label class="catalog-name">
              Nome do serviço
              <input type="text" value="${escapeAttr(service.name)}" data-catalog-field="name" aria-label="Serviço" />
            </label>
            <label class="catalog-price">
              Preço
              <input type="number" min="0" step="0.01" value="${Number(service.price || 0)}" data-catalog-field="price" aria-label="Preço" />
            </label>
          </div>
          <div class="catalog-meta-grid">
            <label>
              Categoria
              <input type="text" value="${escapeAttr(service.category || "")}" data-catalog-field="category" placeholder="Ex: UNEED LEADS" />
            </label>
            <label>
              Modalidade
              <select data-catalog-field="billing">
                ${["Pronto pagamento", "Mensal", "Anual", "Setup"].map((option) => `<option ${option === (service.billing || "Pronto pagamento") ? "selected" : ""}>${option}</option>`).join("")}
              </select>
            </label>
            <label>
              Compromisso
              <input type="text" value="${escapeAttr(service.commitment || "")}" data-catalog-field="commitment" placeholder="Ex: mínimo 12 meses" />
            </label>
          </div>
          <label>
            Legenda/subtítulo
            <textarea rows="2" data-catalog-field="pitch" placeholder="Frase curta que aparece por baixo do serviço">${escapeHtml(service.pitch || "")}</textarea>
          </label>
          <label>
            O que inclui
            <textarea rows="3" data-catalog-field="includes" placeholder="Itens incluídos no serviço">${escapeHtml(service.includes || "")}</textarea>
          </label>
          </div>
        </details>
          `).join("")}
        </div>
      </details>
    `)
    .join("") || `<div class="empty">Sem serviços nesta categoria.</div>`;
  renderContractOptionSettings("service");
  renderContractOptionSettings("addon");
  renderPricingMatrix();
}

function renderContractOptionSettings(type) {
  const container = qs(type === "addon" ? "#contractAddonOptionRows" : "#contractServiceOptionRows");
  if (!container) return;
  const options = editableContractOptions(type);
  container.innerHTML = options.map((option, index) => `
    <div class="contract-option-row" data-contract-option-type="${type}" data-contract-option-index="${index}">
      <label class="contract-option-name">
        Nome
        <input type="text" value="${escapeAttr(option.label)}" data-contract-option-field="label" />
      </label>
      <label class="contract-option-toggle">
        <input type="checkbox" ${option.active !== false ? "checked" : ""} data-contract-option-field="active" />
        <span>Ativo</span>
      </label>
      <button class="remove-row" type="button" data-remove-contract-option title="Remover opção" aria-label="Remover opção">×</button>
    </div>
  `).join("") || `<div class="empty">Sem opções.</div>`;
}

function saveContractOptionSettings() {
  ["service", "addon"].forEach((type) => {
    const key = type === "addon" ? "contractAddonOptions" : "contractServiceOptions";
    const rows = qsa(`[data-contract-option-type="${type}"]`);
    state[key] = rows.map((row) => {
      const current = editableContractOptions(type)[Number(row.dataset.contractOptionIndex)] || {};
      const label = row.querySelector('[data-contract-option-field="label"]').value.trim() || "Opção sem nome";
      return {
        id: current.id || slugOptionId(label, type),
        label,
        active: row.querySelector('[data-contract-option-field="active"]').checked,
      };
    });
  });
  saveState();
  if (activeContractId) renderContractForm();
}

function renderPricingMatrix() {
  const matrix = qs("#pricingMatrix");
  const note = qs("#pricingNote");
  if (!matrix || !note) return;
  const catalog = state.catalog || [];
  if (!catalog.length) {
    note.textContent = "Sem serviços no catálogo.";
    matrix.innerHTML = "";
    return;
  }
  const categories = catalog.reduce((groups, item, index) => {
    const title = item.category || "Serviços personalizados";
    groups[title] ||= [];
    groups[title].push({ ...item, catalogIndex: index });
    return groups;
  }, {});
  const categoryEntries = Object.entries(categories);
  note.textContent = `${categoryEntries.length} categorias · ${catalog.length} serviços · tabela alimentada pelo catálogo editável, valores sem IVA.`;
  matrix.innerHTML = categoryEntries.map(([title, items]) => `
    <section class="pricing-category">
      <h3>${escapeHtml(title)}</h3>
      <div class="pricing-table-wrap">
        <table class="pricing-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Pagamento</th>
              <th>Valor</th>
              <th>Compromisso</th>
              <th>Inclui</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr class="${item.featured ? "is-featured" : ""}">
                <td>
                  ${item.featured ? `<span class="pricing-badge">Mais procurado</span>` : ""}
                  <strong>${escapeHtml(item.name)}</strong>
                  ${item.pitch ? `<small>${escapeHtml(item.pitch)}</small>` : ""}
                </td>
                <td>${escapeHtml(item.billing || "")}</td>
                <td>${eur(item.price)}</td>
                <td>${escapeHtml(item.commitment || "-")}</td>
                <td>${escapeHtml(item.includes || "")}</td>
                <td><button class="button ghost mini" type="button" data-add-pricing="${item.catalogIndex}">Adicionar</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `).join("");
}

function renderPerformance() {
  const stats = performanceStats();
  const totalOpportunities = stats.proposals.length;
  const source = stats.sources[0];
  const focus = stats.leadsMonth.length === 0
    ? "Criar novas leads este mês"
    : stats.closeRate < 35
      ? "Melhorar follow-ups e motivos de perda"
      : "Escalar o que já está a converter";

  qs("#perfFocus").textContent = focus;
  qs("#perfLeadsMonth").textContent = stats.leadsMonth.length;
  qs("#perfTopSource").textContent = source ? `Top origem: ${source[0]} (${source[1]})` : "Sem origem dominante";
  qs("#perfSentMonth").textContent = stats.sentMonth.length;
  qs("#perfCloseRate").textContent = `${Math.round(stats.closeRate)}%`;
  qs("#perfWinLoss").textContent = `${stats.won.length} ganhos · ${stats.lost.length} perdidos`;
  qs("#perfAvgCloseDays").textContent = `${Math.round(stats.avgCloseDays)} dias`;
  qs("#perfAvgTicket").textContent = eur(stats.avgTicket);
  qs("#perfMrr").textContent = `${eur(stats.mrr)}/mês`;
  qs("#perfLtv").textContent = `LTV estimado 12m: ${eur(stats.estimatedLtv)}`;
  qs("#perfChurn").textContent = `${Math.round(stats.churnRate)}%`;
  qs("#perfNps").textContent = stats.nps === null ? "-" : stats.nps.toFixed(1).replace(".", ",");

  qs("#perfCategoryList").innerHTML = stats.byCategory.length
    ? stats.byCategory.map((item) => {
        const decisions = item.won + item.lost;
        const rate = decisions ? Math.round((item.won / decisions) * 100) : 0;
        return `
          <div class="performance-row">
            <div>
              <strong>${escapeHtml(item.category)}</strong>
              <span>${item.leads} leads · ${item.sent} propostas · ${item.won} ganhos</span>
            </div>
            <div>
              <strong>${rate}%</strong>
              <span>${eur(item.value)}</span>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="empty-state">Ainda não há dados suficientes.</p>`;

  qs("#perfLossList").innerHTML = stats.lossReasons.length
    ? stats.lossReasons.map(([reason, count]) => `
        <div class="performance-row">
          <div>
            <strong>${escapeHtml(reason)}</strong>
            <span>${count} oportunidade${count === 1 ? "" : "s"} perdida${count === 1 ? "" : "s"}</span>
          </div>
          <div><strong>${Math.round((count / Math.max(stats.lost.length, 1)) * 100)}%</strong></div>
        </div>
      `).join("")
    : `<p class="empty-state">Quando uma proposta for perdida, o motivo aparece aqui.</p>`;

  const quarter = quarterMeta();
  const target = Number(state.monthTarget || 0) * 3;
  const quarterRevenue = fiscalQuarterStats().receivable;
  const okrs = [
    {
      icon: "EUR",
      title: "Receita trimestral",
      text: `${eur(quarterRevenue)} de ${eur(target)} no ${quarter.label.toLowerCase()}.`,
    },
    {
      icon: "%",
      title: "Taxa de fecho",
      text: `${Math.round(stats.closeRate)}% de conversão em oportunidades decididas.`,
    },
    {
      icon: "MRR",
      title: "Motor de avenças",
      text: `${eur(stats.mrr)}/mês em receita recorrente ativa.`,
    },
    {
      icon: "NPS",
      title: "Experiência do cliente",
      text: stats.nps === null ? "Ainda sem NPS registado." : `NPS médio ${stats.nps.toFixed(1).replace(".", ",")} em 10.`,
    },
  ];
  qs("#perfOkrList").innerHTML = okrs.map((item) => `
    <div class="achievement">
      <span>${item.icon}</span>
      <div>
        <strong>${item.title}</strong>
        <p>${item.text}</p>
      </div>
    </div>
  `).join("");

  const funnel = [
    ["Leads", totalOpportunities],
    ["Propostas", stats.proposals.filter((proposal) => statusIsSent(proposal.status) || proposal.proposalSentDate).length],
    ["Decididas", stats.decided.length],
    ["Ganhas", stats.won.length],
  ];
  const max = Math.max(funnel[0][1], 1);
  qs("#perfFunnel").innerHTML = funnel.map(([label, count]) => `
    <div class="funnel-step">
      <div>
        <strong>${label}</strong>
        <span>${count}</span>
      </div>
      <div class="funnel-bar"><span style="width:${Math.max((count / max) * 100, count ? 8 : 0)}%"></span></div>
    </div>
  `).join("");
}

function nextContractNumber() {
  const year = new Date().getFullYear();
  const currentYearContracts = (state.contracts || []).filter((contract) => String(contract.contractNumber || "").includes(`-${year}-`));
  return `UNEED-${year}-${String(currentYearContracts.length + 1).padStart(3, "0")}`;
}

function emptyContract(seed = {}) {
  const now = new Date().toISOString();
  const services = selectedServices(seed);
  const recurring = hasRecurringServices(seed);
  const sum = seed.id ? totals(seed) : { taxable: 0 };
  return {
    id: crypto.randomUUID(),
    contractNumber: nextContractNumber(),
    status: "Rascunho",
    commercialName: seed.companyName || seed.clientName || "",
    fiscalName: seed.companyName || seed.clientName || "",
    nif: seed.clientNif || "",
    address: "",
    email: seed.clientEmail || "",
    phone: seed.clientPhone || "",
    contactPerson: seed.clientName || "",
    representativeRole: "Gerente",
    clientType: "Empresa",
    contractDate: today(),
    mainService: services[0]?.name || seed.opportunityCategory || "",
    startDate: today(),
    implementation: services[0]?.commitment || "10 a 15 dias úteis",
    activationValue: recurring ? 0 : Number(sum.taxable || 0),
    monthlyValue: recurring ? recurringMonthlyValue(seed) : 0,
    periodicity: recurring ? "Mensal" : "Anual",
    vatRate: seed.vatMode === "23" ? "23" : "0",
    paymentMethod: recurring ? "Débito direto SEPA" : "Transferência bancária",
    directDebitRequired: recurring,
    paymentException: "",
    loyalty: recurring,
    loyaltyMonths: recurring ? 12 : 0,
    cancelNoticeDays: 30,
    services: services.length ? ["projeto_personalizado"] : [],
    addons: [],
    notes: seed.proposalNotes || "Contrato sem fidelização, salvo acordo escrito em contrário.",
    version: 1,
    versions: [],
    createdAt: now,
    updatedAt: now,
    sentAt: "",
    acceptedAt: "",
  };
}

function getActiveContract() {
  state.contracts ||= [];
  if (!activeContractId && state.contracts[0]) activeContractId = state.contracts[0].id;
  if (!activeContractId) {
    const contract = emptyContract();
    state.contracts.unshift(contract);
    activeContractId = contract.id;
  }
  return state.contracts.find((contract) => contract.id === activeContractId) || state.contracts[0];
}

function createContractFromProposal(proposal = getActiveProposal()) {
  const contract = emptyContract(proposal || {});
  const names = selectedServices(proposal || {}).map((service) => service.name).filter(Boolean);
  contract.mainService = names[0] || contract.mainService || "Serviços digitais UNEED";
  state.contracts ||= [];
  state.contracts.unshift(contract);
  activeContractId = contract.id;
  saveState();
  switchView("contracts");
  renderAll();
  showSuccessModal(`Contrato ${contract.contractNumber} preparado a partir da proposta.`);
}

function duplicateActiveContract() {
  const current = getActiveContract();
  if (!current) return;
  const contract = {
    ...JSON.parse(JSON.stringify(current)),
    id: crypto.randomUUID(),
    contractNumber: nextContractNumber(),
    status: "Rascunho",
    version: 1,
    versions: [],
    sentAt: "",
    acceptedAt: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.contracts.unshift(contract);
  activeContractId = contract.id;
  saveState();
  renderContractForm();
  showSuccessModal(`Cópia criada: ${contract.contractNumber}.`);
}

function checkedContractKeys(selector) {
  return qsa(selector).filter((input) => input.checked).map((input) => input.value);
}

function contractOptionLabels(options, keys) {
  return options.filter(([key]) => keys.includes(key)).map(([, label]) => label);
}

function renderContractChecks(containerId, options, selectedKeys, type) {
  const container = qs(containerId);
  if (!container) return;
  container.innerHTML = options.map(([key, label]) => `
    <label class="check-card">
      <input type="checkbox" value="${escapeAttr(key)}" data-contract-${type} ${selectedKeys.includes(key) ? "checked" : ""} />
      <span>${escapeHtml(label)}</span>
    </label>
  `).join("");
}

function readContractForm() {
  const contract = getActiveContract() || emptyContract();
  contract.commercialName = qs("#contractCommercialName").value.trim();
  contract.fiscalName = qs("#contractFiscalName").value.trim();
  contract.nif = qs("#contractNif").value.trim();
  contract.address = qs("#contractAddress").value.trim();
  contract.email = qs("#contractEmail").value.trim();
  contract.phone = qs("#contractPhone").value.trim();
  contract.contactPerson = qs("#contractContactPerson").value.trim();
  contract.representativeRole = qs("#contractRepresentativeRole").value.trim();
  contract.clientType = qs("#contractClientType").value;
  contract.contractNumber = qs("#contractNumber").value.trim() || contract.contractNumber || nextContractNumber();
  contract.contractDate = qs("#contractDate").value || today();
  contract.mainService = qs("#contractMainService").value.trim();
  contract.startDate = qs("#contractStartDate").value || "";
  contract.implementation = qs("#contractImplementation").value.trim();
  contract.activationValue = Number(qs("#contractActivation").value || 0);
  contract.monthlyValue = Number(qs("#contractMonthly").value || 0);
  contract.periodicity = qs("#contractPeriodicity").value;
  contract.vatRate = qs("#contractVat").value;
  contract.paymentMethod = qs("#contractPaymentMethod").value;
  contract.status = qs("#contractStatus").value;
  contract.cancelNoticeDays = Number(qs("#contractCancelNotice").value || 30);
  contract.directDebitRequired = qs("#contractDirectDebit").checked;
  contract.loyalty = qs("#contractLoyalty").checked;
  contract.loyaltyMonths = Number(qs("#contractLoyaltyMonths").value || 0);
  contract.paymentException = qs("#contractPaymentException").value.trim();
  contract.services = checkedContractKeys("[data-contract-service]");
  contract.addons = checkedContractKeys("[data-contract-addon]");
  contract.notes = qs("#contractNotes").value.trim();
  contract.updatedAt = new Date().toISOString();
  if (contract.status === "Enviado" && !contract.sentAt) contract.sentAt = today();
  if (contract.status === "Aceite" && !contract.acceptedAt) contract.acceptedAt = today();
  return contract;
}

function renderContractForm() {
  const contract = getActiveContract();
  if (!contract || !qs("#contractPreview")) return;
  qs("#contractId").value = contract.id;
  qs("#contractCommercialName").value = contract.commercialName || "";
  qs("#contractFiscalName").value = contract.fiscalName || "";
  qs("#contractNif").value = contract.nif || "";
  qs("#contractAddress").value = contract.address || "";
  qs("#contractEmail").value = contract.email || "";
  qs("#contractPhone").value = contract.phone || "";
  qs("#contractContactPerson").value = contract.contactPerson || "";
  qs("#contractRepresentativeRole").value = contract.representativeRole || "";
  qs("#contractClientType").value = contract.clientType || "Empresa";
  qs("#contractNumber").value = contract.contractNumber || nextContractNumber();
  qs("#contractDate").value = contract.contractDate || today();
  qs("#contractMainService").value = contract.mainService || "";
  qs("#contractStartDate").value = contract.startDate || "";
  qs("#contractImplementation").value = contract.implementation || "";
  qs("#contractActivation").value = Number(contract.activationValue || 0);
  qs("#contractMonthly").value = Number(contract.monthlyValue || 0);
  qs("#contractPeriodicity").value = contract.periodicity || "Mensal";
  qs("#contractVat").value = contract.vatRate || "23";
  qs("#contractPaymentMethod").value = contract.paymentMethod || "Débito direto SEPA";
  qs("#contractStatus").value = contract.status || "Rascunho";
  qs("#contractCancelNotice").value = Number(contract.cancelNoticeDays || 30);
  qs("#contractDirectDebit").checked = contract.directDebitRequired !== false;
  qs("#contractLoyalty").checked = Boolean(contract.loyalty);
  qs("#contractLoyaltyMonths").value = Number(contract.loyaltyMonths || 0);
  qs("#contractPaymentException").value = contract.paymentException || "";
  qs("#contractNotes").value = contract.notes || "";
  renderContractChecks("#contractServiceChecks", contractOptionPairs("service", true), contract.services || [], "service");
  renderContractChecks("#contractAddonChecks", contractOptionPairs("addon", true), contract.addons || [], "addon");
  renderContractPreview(contract);
  renderContractsList();
}

function contractClauseBlocks(contract) {
  const services = contract.services || [];
  const addons = contract.addons || [];
  const has = (key) => services.includes(key) || addons.includes(key);
  const exclusions = [
    !has("loja_online") && "loja online e pagamentos automáticos integrados",
    !has("pagamento_online") && "pagamento online automático",
    !has("gestao_google_ads") && !has("gestao_meta_ads") && "gestão de campanhas de publicidade",
    !has("assistente_guiado_24h") && !has("assistente_inteligente_24h") && "chatbot, assistentes de IA e automações avançadas",
    !has("projeto_personalizado") && "desenvolvimento personalizado, integrações complexas, callbacks e funcionalidades à medida",
  ].filter(Boolean);

  const blocks = [
    ["Objeto", "A Uneed presta ao Cliente os serviços digitais identificados no Anexo I, incluindo criação, disponibilização, alojamento, manutenção, suporte e demais componentes selecionadas. Qualquer serviço não indicado expressamente será considerado adicional e poderá ser orçamentado à parte."],
    ["Natureza do serviço", "Salvo acordo escrito em contrário, nos planos mensais o Cliente não compra o website, página, plataforma, sistema de marcações, templates, código, estrutura técnica ou infraestrutura. Estes elementos permanecem propriedade, metodologia ou infraestrutura da Uneed. O Cliente recebe apenas o direito de utilização enquanto o contrato estiver ativo e pago."],
    ["Serviços incluídos e exclusões", `Estão incluídos os serviços e add-ons listados no Anexo I. Não estão incluídos, salvo contratação específica: ${exclusions.join(", ")}.`],
    ["Implementação", `A implementação inicia-se após aceitação do contrato, validação do meio de pagamento e entrega dos conteúdos, acessos e informações necessários. O prazo previsto é ${contract.implementation || "a definir"} e pode ser ajustado por atrasos imputáveis ao Cliente.`],
    ["Conteúdos e responsabilidade do Cliente", "O Cliente é responsável pela veracidade, legalidade e atualização dos conteúdos, imagens, marcas, textos, contactos, preços e demais elementos fornecidos à Uneed."],
  ];

  if (has("sistema_marcacoes")) blocks.push(["Marcações, pedidos e contactos", "O sistema de marcações organiza e facilita pedidos de contacto ou reserva. Salvo configuração expressa em contrário, os pedidos não constituem confirmação automática, cabendo ao Cliente confirmar, reagendar, aceitar ou recusar marcações junto dos seus clientes finais."]);
  if (has("assistente_guiado_24h") || has("assistente_inteligente_24h")) blocks.push(["Assistentes virtuais e IA", "Os assistentes virtuais destinam-se a prestar informação geral, responder a perguntas frequentes e encaminhar pedidos. Não substituem atendimento humano, diagnóstico, aconselhamento profissional, decisão clínica, jurídica, financeira ou outra decisão especializada."]);
  if (has("assistente_inteligente_24h")) blocks.push(["Uso justo de IA", "O assistente inteligente funciona com base em informação aprovada pelo Cliente e poderá estar sujeito a limites mensais de respostas, mensagens, créditos ou pedidos. Utilização adicional, chamadas por IA e automações avançadas serão orçamentadas à parte."]);
  if (has("dominio") || has("email_profissional") || has("alojamento")) blocks.push(["Domínio, email e alojamento", "Quando incluídos, domínio, email e alojamento são disponibilizados enquanto o contrato estiver ativo e pago. A transferência de domínio pode ser solicitada no fim do contrato desde que não existam valores em dívida e seja tecnicamente possível."]);
  if (has("gestao_google_ads") || has("gestao_meta_ads")) blocks.push(["Publicidade digital", "A gestão de anúncios não garante resultados comerciais, vendas, leads, ROAS, posicionamento ou desempenho específico, salvo objetivo escrito e expressamente contratado. Orçamentos de media spend são suportados pelo Cliente."]);

  blocks.push(
    ["Propriedade intelectual e utilização", "Textos, layouts, componentes, templates, sistemas, código, fluxos, funcionalidades, metodologias e infraestrutura técnica desenvolvidos ou disponibilizados pela Uneed podem integrar propriedade intelectual, metodologia própria ou ativos reutilizáveis da Uneed. Salvo acordo escrito em contrário, o Cliente adquire apenas o direito de utilização enquanto o serviço estiver ativo e pago, não adquirindo automaticamente a propriedade integral do código, plataforma, sistema, templates ou infraestrutura técnica."],
    ["Preço e pagamento", `O Cliente pagará ${eur(contract.activationValue || 0)} de ativação/setup e ${eur(contract.monthlyValue || 0)} por ${String(contract.periodicity || "mensal").toLowerCase()}. Salvo indicação em contrário, os valores acrescem de IVA à taxa legal aplicável.`],
    ["Débito direto", "Nos serviços mensais, o pagamento recorrente poderá ser processado por débito direto SEPA através da GoCardless ou de outra entidade de pagamentos utilizada pela Uneed. A revogação do débito direto não cancela automaticamente o contrato, devendo o Cliente comunicar a intenção de cancelamento nos termos previstos."],
    ["Duração e cancelamento", contract.loyalty ? `O contrato tem fidelização de ${contract.loyaltyMonths || 0} meses. Após esse período, o Cliente pode cancelar mediante comunicação escrita com aviso prévio mínimo de ${contract.cancelNoticeDays || 30} dias.` : `Salvo indicação escrita em contrário, o contrato não tem fidelização. O Cliente pode cancelar mediante comunicação escrita com aviso prévio mínimo de ${contract.cancelNoticeDays || 30} dias.`],
    ["Proteção de dados", "As partes comprometem-se a cumprir o RGPD e legislação nacional aplicável. Quando tratar dados por conta do Cliente, a Uneed atua como subcontratante e processa os dados apenas na medida necessária à prestação dos serviços."],
    ["Limitação de responsabilidade", "A Uneed não garante resultados comerciais específicos. Na medida permitida por lei, a responsabilidade da Uneed fica limitada ao valor pago pelo Cliente nos três meses anteriores ao facto que originou a responsabilidade, salvo dolo ou responsabilidade legalmente não limitável."],
    ["Lei aplicável e aceitação", "O contrato rege-se pela lei portuguesa e considera-se aceite por assinatura, confirmação escrita, aceitação eletrónica, início da prestação dos serviços ou pagamento de qualquer valor previsto, desde que previamente disponibilizado ao Cliente."],
  );

  return blocks;
}

function renderContractPreview(contract) {
  const preview = qs("#contractPreview");
  if (!preview) return;
  const serviceLabels = contractOptionLabels(contractOptionPairs("service"), contract.services || []);
  const addonLabels = contractOptionLabels(contractOptionPairs("addon"), contract.addons || []);
  const clauses = contractClauseBlocks(contract);
  qs("#contractPreviewTitle").textContent = contract.contractNumber || "Contrato";
  preview.innerHTML = `
    <article class="contract-page">
      <header class="contract-cover">
        <div>
          <img src="./assets/uneed-logo-branco.png" alt="UNEED" />
          <h1>Contrato de prestação de serviços digitais</h1>
          <p>${escapeHtml(contract.mainService || "Serviços digitais UNEED")}</p>
        </div>
        <aside>
          <span>Nº contrato</span><strong>${escapeHtml(contract.contractNumber || "")}</strong>
          <span>Data</span><strong>${escapeHtml(contract.contractDate || today())}</strong>
          <span>Versão</span><strong>v${Number(contract.version || 1)}</strong>
        </aside>
      </header>
      <section class="contract-parties">
        <div><span>Prestadora</span><strong>UNEED Soluções Digitais</strong><p>Representada por Francisco Costa</p></div>
        <div><span>Cliente</span><strong>${escapeHtml(contract.fiscalName || contract.commercialName || "Cliente")}</strong><p>NIF ${escapeHtml(contract.nif || "por preencher")} · ${escapeHtml(contract.address || "morada por preencher")}</p><p>Representante: ${escapeHtml(contract.contactPerson || "por preencher")} ${contract.representativeRole ? `(${escapeHtml(contract.representativeRole)})` : ""}</p></div>
      </section>
      <section class="contract-summary-box">
        <div><span>Ativação/setup</span><strong>${eur(contract.activationValue || 0)}</strong><small>${contract.vatRate === "23" ? "+ IVA 23%" : "IVA não aplicável"}</small></div>
        <div><span>Mensalidade</span><strong>${eur(contract.monthlyValue || 0)}</strong><small>${contract.vatRate === "23" ? "+ IVA 23%" : "IVA não aplicável"}</small></div>
        <div><span>Prazo implementação</span><strong>${escapeHtml(contract.implementation || "A definir")}</strong></div>
      </section>
      <section class="contract-clauses">
        ${clauses.map(([title, body], index) => `<article><h2>${index + 1}. ${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></article>`).join("")}
      </section>
      <section class="contract-annex">
        <h2>Anexo I - Serviços contratados</h2>
        <div class="contract-annex-grid">
          <div><h3>Serviços</h3>${serviceLabels.length ? `<ul>${serviceLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}</ul>` : "<p>Sem serviços selecionados.</p>"}</div>
          <div><h3>Add-ons</h3>${addonLabels.length ? `<ul>${addonLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}</ul>` : "<p>Sem add-ons selecionados.</p>"}</div>
        </div>
        <p><strong>Observações:</strong> ${escapeHtml(contract.notes || "Sem observações adicionais.")}</p>
        ${contract.paymentException ? `<p><strong>Exceção de pagamento:</strong> ${escapeHtml(contract.paymentException)}</p>` : ""}
      </section>
      <footer class="contract-signatures">
        <div><span>UNEED</span><strong>Francisco Costa</strong></div>
        <div><span>Cliente</span><strong>${escapeHtml(contract.contactPerson || contract.fiscalName || "")}</strong></div>
      </footer>
      <p class="contract-footer">${escapeHtml(contract.contractNumber || "")} · ${escapeHtml(contract.contractDate || today())}</p>
    </article>
  `;
}

function renderContractsList() {
  const list = qs("#contractsList");
  if (!list) return;
  state.contracts ||= [];
  list.innerHTML = state.contracts.length ? state.contracts.map((contract) => `
    <article class="contract-list-item ${contract.id === activeContractId ? "is-active" : ""}">
      <div>
        <strong>${escapeHtml(contract.fiscalName || contract.commercialName || "Cliente sem nome")}</strong>
        <span>${escapeHtml(contract.contractNumber || "")} · v${Number(contract.version || 1)} · ${escapeHtml(contract.status || "Rascunho")}</span>
      </div>
      <div>
        <span>${eur(contract.monthlyValue || 0)}/mês</span>
        <button class="button ghost" type="button" data-open-contract="${escapeAttr(contract.id)}">Abrir</button>
      </div>
    </article>
  `).join("") : `<p class="empty-state">Ainda não existem contratos gerados.</p>`;
}

function saveActiveContract({ version = false } = {}) {
  const contract = readContractForm();
  if (version) {
    contract.versions ||= [];
    contract.versions.push({ version: contract.version || 1, savedAt: new Date().toISOString(), data: JSON.parse(JSON.stringify(contract)) });
    contract.version = Number(contract.version || 1) + 1;
  }
  const index = state.contracts.findIndex((item) => item.id === contract.id);
  if (index >= 0) state.contracts[index] = contract;
  else state.contracts.unshift(contract);
  activeContractId = contract.id;
  saveState();
  renderContractForm();
  return contract;
}

function renderAll() {
  fillStatusSelects();
  renderForm();
  renderDashboard();
  renderPerformance();
  renderContractForm();
  renderPipeline();
  renderInstagramProspecting();
  renderTickets();
  renderRecurring();
  renderClients();
  renderHistory();
  renderSettings();
}

function switchView(view) {
  qsa(".nav-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === view));
  qsa(".view").forEach((section) => section.classList.toggle("is-active", section.id === `view-${view}`));
}

function openProposal(id) {
  activeId = id;
  switchView("proposal");
  renderForm();
}

function bindEvents() {
  qsa(".nav-tab").forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));

  qs("#newProposalBtn").addEventListener("click", () => {
    const proposal = emptyProposal();
    state.proposals.unshift(proposal);
    activeId = proposal.id;
    saveState();
    switchView("proposal");
    renderAll();
  });

  qs("#newContractBtn")?.addEventListener("click", () => {
    const contract = emptyContract();
    state.contracts.unshift(contract);
    activeContractId = contract.id;
    saveState();
    switchView("contracts");
    renderAll();
  });

  qs("#createContractFromProposalBtn")?.addEventListener("click", () => createContractFromProposal(readForm()));

  qs("#contractForm")?.addEventListener("input", () => {
    const contract = readContractForm();
    renderContractPreview(contract);
    renderContractsList();
  });

  qs("#contractForm")?.addEventListener("change", () => {
    const contract = readContractForm();
    renderContractPreview(contract);
    renderContractsList();
  });

  qs("#saveContractBtn")?.addEventListener("click", () => {
    const contract = saveActiveContract({ version: true });
    showSuccessModal(`Contrato ${contract.contractNumber} guardado e sincronizado.`);
  });

  qs("#printContractBtn")?.addEventListener("click", () => {
    saveActiveContract();
    document.body.classList.add("printing-contract");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-contract"), 500);
  });

  qs("#duplicateContractBtn")?.addEventListener("click", duplicateActiveContract);

  qs("#shareContractBtn")?.addEventListener("click", () => {
    const contract = getActiveContract();
    const url = `${appOrigin()}/#contract=${encodeURIComponent(contract?.id || "")}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    showSuccessModal(`Link interno do contrato copiado: ${url}`);
  });

  qs("#contractsList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-contract]");
    if (!button) return;
    activeContractId = button.dataset.openContract;
    renderContractForm();
  });

  qs("#logoutBtn").addEventListener("click", async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut().catch(() => {});
      window.location.href = "/login.html";
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login.html";
  });

  qs("#proposalForm").addEventListener("submit", (event) => {
    event.preventDefault();
    upsertActiveProposal();
  });

  qs("#closeSuccessModal").addEventListener("click", closeSuccessModal);
  qs("#successModal").addEventListener("click", (event) => {
    if (event.target.id === "successModal") closeSuccessModal();
  });

  qs("#proposalForm").addEventListener("input", () => {
    const proposal = readForm();
    renderProposalSummary(proposal);
    renderPreview();
  });

  qs("#proposalStatus").addEventListener("change", () => {
    const status = qs("#proposalStatus").value;
    if (statusIsSent(status) && !qs("#proposalSentDate").value) qs("#proposalSentDate").value = today();
    if (statusIsDecided(status) && !qs("#closedDate").value) qs("#closedDate").value = today();
    const proposal = readForm();
    renderProposalSummary(proposal);
    renderPreview();
  });

  qs("#serviceRows").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-service]");
    if (!removeButton) return;
    const proposal = getActiveProposal();
    proposal.services.splice(Number(removeButton.dataset.removeService), 1);
    saveState();
    renderForm();
  });

  qs("#addCustomServiceBtn").addEventListener("click", () => {
    const proposal = readForm();
    proposal.services.push({ name: "Novo serviço", qty: 1, price: 0, selected: true });
    saveState();
    renderForm();
  });

  qs("#quickAddProductBtn").addEventListener("click", () => {
    const item = state.catalog[Number(qs("#quickProductSelect").value)];
    if (!item) return;
    addPricingItemToActiveProposal(item);
  });

  qs("#clearServicesBtn").addEventListener("click", () => {
    const proposal = readForm();
    proposal.services = [];
    const index = state.proposals.findIndex((entry) => entry.id === proposal.id);
    if (index >= 0) state.proposals[index] = proposal;
    saveState();
    renderAll();
  });

  qs("#addActivityBtn").addEventListener("click", () => {
    const type = qs("#activityType").value;
    const note = qs("#activityNote").value.trim();
    if (!note) return;
    qs("#activityNote").value = "";
    addActivity(type, note);
  });

  qs("#followup3Btn").addEventListener("click", () => scheduleFollowup(3));
  qs("#followup7Btn").addEventListener("click", () => scheduleFollowup(7));

  qs("#markAcceptedBtn").addEventListener("click", () => {
    qs("#proposalStatus").value = "Aceite";
    addActivity("Nota interna", "Proposta marcada como aceite.");
  });

  qs("#markBilledBtn").addEventListener("click", () => {
    const proposal = readForm();
    const sum = totals(proposal);
    qs("#proposalStatus").value = "Faturado";
    qs("#billedAmount").value = sum.total.toFixed(2);
    qs("#paidAmount").value = Math.max(Number(proposal.paidAmount || 0), sum.receivable).toFixed(2);
    addActivity("Pagamento", `Proposta marcada como faturada no valor de ${eur(sum.total)}.`);
  });

  qs("#deleteProposalBtn").addEventListener("click", () => {
    const proposal = getActiveProposal();
    if (proposal) deleteProposal(proposal.id);
  });

  qs("#printProposalBtn").addEventListener("click", () => {
    const proposal = readForm();
    if (proposal.status === "Novo pedido" || proposal.status === "Em análise") proposal.status = "Orçamento enviado";
    const index = state.proposals.findIndex((item) => item.id === proposal.id);
    if (index >= 0) state.proposals[index] = proposal;
    saveState();
    renderAll();
    window.print();
  });

  qs("#emailFollowupBtn").addEventListener("click", () => {
    const proposal = readForm();
    openReminderEmail(proposal);
  });

  qs("#kanban").addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-proposal]");
    if (deleteButton) {
      event.stopPropagation();
      deleteProposal(deleteButton.dataset.deleteProposal);
      return;
    }
    if (event.target.closest(".deal-summary")) return;
    const select = event.target.closest("[data-status-id]");
    if (select) return;
    const card = event.target.closest("[data-open]");
    if (card) openProposal(card.dataset.open);
  });

  qs("#kanban").addEventListener("change", (event) => {
    const select = event.target.closest("[data-status-id]");
    if (!select) return;
    updateProposal(select.dataset.statusId, { status: select.value });
  });

  qs("#kanban").addEventListener("dragstart", (event) => {
    const card = event.target.closest(".deal-card");
    if (!card) return;
    card.classList.add("is-dragging");
    event.dataTransfer.setData("text/plain", card.dataset.open);
    event.dataTransfer.effectAllowed = "move";
  });

  qs("#kanban").addEventListener("dragend", (event) => {
    event.target.closest(".deal-card")?.classList.remove("is-dragging");
    qsa(".kanban-column").forEach((column) => column.classList.remove("is-drop-target"));
  });

  qs("#kanban").addEventListener("dragover", (event) => {
    const column = event.target.closest("[data-drop-status]");
    if (!column) return;
    event.preventDefault();
    qsa(".kanban-column").forEach((item) => item.classList.remove("is-drop-target"));
    column.classList.add("is-drop-target");
  });

  qs("#kanban").addEventListener("drop", (event) => {
    const column = event.target.closest("[data-drop-status]");
    if (!column) return;
    event.preventDefault();
    updateProposal(event.dataTransfer.getData("text/plain"), { status: column.dataset.dropStatus });
  });

  qs("#instagramProspectForm").addEventListener("submit", (event) => {
    event.preventDefault();
    upsertInstagramProspect();
  });

  qs("#clearInstagramProspectBtn").addEventListener("click", clearInstagramProspectForm);
  qs("#instagramSearchInput").addEventListener("input", renderInstagramProspecting);
  qs("#instagramStatusFilter").addEventListener("change", renderInstagramProspecting);
  qs("#prospectNicheFilter").addEventListener("change", renderInstagramProspecting);
  qs("#prospectGeneratorForm").addEventListener("submit", (event) => { event.preventDefault(); generateProspects(); });
  qs("#prospectDistrict").addEventListener("change", updateMunicipalityOptions);
  qs("#prospectDistrictFilter").addEventListener("change", () => { updateMunicipalityFilter(); renderInstagramProspecting(); });
  qs("#prospectMunicipalityFilter").addEventListener("change", renderInstagramProspecting);

  qs("#instagramKanban").addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy-prospect]");
    if (copyButton) {
      event.preventDefault();
      event.stopPropagation();
      const prospect = state.instagramProspects.find((item) => item.id === copyButton.dataset.copyProspect);
      const paragraph = prospectMessageParagraphs(prospect?.message)[Number(copyButton.dataset.copyParagraph)];
      if (paragraph) {
        navigator.clipboard?.writeText(paragraph).then(() => {
          copyButton.textContent = "Copiado";
          setTimeout(() => { copyButton.textContent = "Copiar"; }, 1400);
        }).catch(() => {});
      }
      return;
    }
    const deleteButton = event.target.closest("[data-instagram-delete]");
    if (deleteButton) {
      event.stopPropagation();
      deleteInstagramProspect(deleteButton.dataset.instagramDelete);
      return;
    }
    const editButton = event.target.closest("[data-instagram-edit]");
    if (editButton) {
      event.stopPropagation();
      editInstagramProspect(editButton.dataset.instagramEdit);
    }
  });

  qs("#instagramKanban").addEventListener("change", (event) => {
    const select = event.target.closest("[data-instagram-status-id]");
    if (!select) return;
    updateInstagramProspect(select.dataset.instagramStatusId, { status: select.value });
  });

  qs("#instagramKanban").addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-instagram-open]");
    if (!card) return;
    card.classList.add("is-dragging");
    event.dataTransfer.setData("text/plain", card.dataset.instagramOpen);
    event.dataTransfer.effectAllowed = "move";
  });

  qs("#instagramKanban").addEventListener("dragend", (event) => {
    event.target.closest("[data-instagram-open]")?.classList.remove("is-dragging");
    qsa("[data-instagram-drop-status]").forEach((column) => column.classList.remove("is-drop-target"));
  });

  qs("#instagramKanban").addEventListener("dragover", (event) => {
    const column = event.target.closest("[data-instagram-drop-status]");
    if (!column) return;
    event.preventDefault();
    qsa("[data-instagram-drop-status]").forEach((item) => item.classList.remove("is-drop-target"));
    column.classList.add("is-drop-target");
  });

  qs("#instagramKanban").addEventListener("drop", (event) => {
    const column = event.target.closest("[data-instagram-drop-status]");
    if (!column) return;
    event.preventDefault();
    updateInstagramProspect(event.dataTransfer.getData("text/plain"), { status: column.dataset.instagramDropStatus });
  });

  qs("#nextActions").addEventListener("click", (event) => {
    if (handleEmailReminderClick(event)) return;
    const item = event.target.closest("[data-open]");
    if (item) openProposal(item.dataset.open);
  });

  qs("#clientsGrid").addEventListener("click", (event) => {
    if (handleEmailReminderClick(event)) return;
    const deleteButton = event.target.closest("[data-delete-proposal]");
    if (deleteButton) {
      event.stopPropagation();
      deleteProposal(deleteButton.dataset.deleteProposal);
      return;
    }
    const item = event.target.closest("[data-open]");
    if (item) openProposal(item.dataset.open);
  });

  qs("#clientsGrid").addEventListener("change", (event) => {
    const select = event.target.closest("[data-client-status]");
    if (select) {
      updateProposal(select.dataset.clientStatus, { status: select.value });
      return;
    }
    const followup = event.target.closest("[data-client-followup]");
    if (followup) updateProposal(followup.dataset.clientFollowup, { followupDate: followup.value });
  });

  qs("#recurringLeaderboard").addEventListener("click", (event) => {
    const item = event.target.closest("[data-open]");
    if (item) openProposal(item.dataset.open);
  });

  qs("#recurringList").addEventListener("click", (event) => {
    if (handleEmailReminderClick(event)) return;
    const item = event.target.closest("[data-open]");
    if (item) openProposal(item.dataset.open);
  });

  qs("#ticketSearchInput").addEventListener("input", renderTickets);
  qs("#ticketStatusFilter").addEventListener("change", renderTickets);
  qs("#ticketPriorityFilter").addEventListener("change", renderTickets);
  qs("#refreshTicketsBtn").addEventListener("click", async () => {
    await loadSupportTickets();
    renderTickets();
    showSuccessModal("Tickets atualizados a partir do Supabase.");
  });
  qs("#copySupportUrlBtn").addEventListener("click", () => {
    const url = `${window.location.origin}/suporte`;
    navigator.clipboard?.writeText(url).catch(() => {});
    showSuccessModal(`Link de suporte copiado: ${url}`);
  });
  qs("#ticketsBoard").addEventListener("change", (event) => {
    const status = event.target.closest("[data-ticket-status]");
    if (status) {
      updateTicket(status.dataset.ticketStatus, { status: status.value });
      return;
    }
    const priority = event.target.closest("[data-ticket-priority]");
    if (priority) {
      updateTicket(priority.dataset.ticketPriority, { priority: priority.value });
      return;
    }
    const notes = event.target.closest("[data-ticket-notes]");
    if (notes) updateTicket(notes.dataset.ticketNotes, { internalNotes: notes.value.trim() });
  });

  qs("#clientSearchInput").addEventListener("input", renderClients);

  qs("#sortFollowupsBtn").addEventListener("click", () => {
    followupAscending = !followupAscending;
    renderDashboard();
  });

  qs("#searchInput").addEventListener("input", renderPipeline);
  qs("#statusFilter").addEventListener("change", renderPipeline);

  qs("#monthTarget").addEventListener("change", () => {
    state.monthTarget = Number(qs("#monthTarget").value || 0);
    saveState();
    renderDashboard();
  });

  qs("#recurringTarget").addEventListener("change", () => {
    state.recurringTarget = Number(qs("#recurringTarget").value || 0);
    saveState();
    renderRecurring();
  });

  qs("#brandForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.brand = {
      name: qs("#brandName").value.trim(),
      email: qs("#brandEmail").value.trim(),
      phone: qs("#brandPhone").value.trim(),
      website: qs("#brandWebsite").value.trim(),
      iban: qs("#brandIban").value.trim(),
      paymentTerms: qs("#brandPaymentTerms").value.trim(),
      color: qs("#brandColor").value,
    };
    state.fiscal ||= {};
    state.fiscal.yearlyWithheldAdjustment = Number(qs("#yearlyWithheldAdjustment").value || 0);
    saveState();
    renderAll();
  });

  qs("#passwordForm")?.addEventListener("submit", updateAccountPassword);

  qs("#catalogForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const nextCatalog = [...(state.catalog || [])];
    qsa(".catalog-row").forEach((row) => {
      const index = Number(row.dataset.index);
      nextCatalog[index] = {
        ...(nextCatalog[index] || {}),
        id: nextCatalog[index]?.id || crypto.randomUUID(),
        name: row.querySelector('[data-catalog-field="name"]').value.trim(),
        price: Number(row.querySelector('[data-catalog-field="price"]').value || 0),
        category: row.querySelector('[data-catalog-field="category"]').value.trim(),
        billing: row.querySelector('[data-catalog-field="billing"]').value,
        commitment: row.querySelector('[data-catalog-field="commitment"]').value.trim(),
        pitch: row.querySelector('[data-catalog-field="pitch"]').value.trim(),
        includes: row.querySelector('[data-catalog-field="includes"]').value.trim(),
      };
    });
    state.catalog = nextCatalog.filter(Boolean);
    saveState();
    renderAll();
  });

  qs("#catalogCategoryFilter").addEventListener("change", () => {
    catalogCategoryFilter = qs("#catalogCategoryFilter").value;
    renderSettings();
  });

  qs("#syncPricingBtn").addEventListener("click", applyPricingCatalog);

  qs("#pricingMatrix").addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-pricing]");
    if (!button) return;
    const item = state.catalog[Number(button.dataset.addPricing)];
    if (!item) return;
    switchView("proposal");
    addPricingItemToActiveProposal(item);
  });

  qs("#addCatalogServiceBtn").addEventListener("click", () => {
    state.catalog.push({
      id: crypto.randomUUID(),
      name: "Novo serviço",
      category: "Serviços personalizados",
      billing: "Pronto pagamento",
      commitment: "",
      pitch: "Legenda curta do serviço.",
      includes: "",
      price: 0,
    });
    renderSettings();
  });

  qs("#catalogRows").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-catalog]");
    if (!removeButton) return;
    event.preventDefault();
    event.stopPropagation();
    state.catalog.splice(Number(removeButton.dataset.removeCatalog), 1);
    renderSettings();
  });

  qs("#addContractServiceOptionBtn").addEventListener("click", () => {
    editableContractOptions("service").push({
      id: `custom_service_${crypto.randomUUID()}`,
      label: "Novo serviço de contrato",
      active: true,
    });
    renderSettings();
  });

  qs("#addContractAddonOptionBtn").addEventListener("click", () => {
    editableContractOptions("addon").push({
      id: `custom_addon_${crypto.randomUUID()}`,
      label: "Novo add-on de contrato",
      active: true,
    });
    renderSettings();
  });

  qs("#saveContractOptionsBtn").addEventListener("click", () => {
    saveContractOptionSettings();
    showSuccessModal("Opções dos contratos guardadas.");
  });

  document.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-contract-option]");
    if (!removeButton) return;
    const row = removeButton.closest("[data-contract-option-type]");
    if (!row) return;
    saveContractOptionSettings();
    const type = row.dataset.contractOptionType;
    const list = editableContractOptions(type);
    list.splice(Number(row.dataset.contractOptionIndex), 1);
    saveState();
    renderSettings();
    if (activeContractId) renderContractForm();
  });

  qs("#exportDataBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `uneed-crm-backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  qs("#importDataBtn").addEventListener("click", () => qs("#importFile").click());
  qs("#importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    state = JSON.parse(await file.text());
    migrateBrandDefaults();
    hydratePricingDefaults();
    activeId = state.proposals[0]?.id || null;
    activeContractId = state.contracts?.[0]?.id || null;
    saveState();
    renderAll();
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replaceAll("\n", " ");
}

function createQrSvg(text) {
  try {
    const qr = makeQr(text);
    const size = qr.length;
    const scale = 6;
    const pad = 4;
    const rects = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (qr[y][x]) rects.push(`<rect x="${x + pad}" y="${y + pad}" width="1" height="1"/>`);
      }
    }
    const view = size + pad * 2;
    return `<svg class="qr-svg" viewBox="0 0 ${view} ${view}" width="${view * scale}" height="${view * scale}" role="img" aria-label="QR code"><rect width="${view}" height="${view}" fill="#fff"/>${rects.join("")}</svg>`;
  } catch {
    return "";
  }
}

function makeQr(text) {
  const bytes = [...new TextEncoder().encode(text)];
  const versions = [
    { version: 1, data: 19, ecc: 7, align: [] },
    { version: 2, data: 34, ecc: 10, align: [6, 18] },
    { version: 3, data: 55, ecc: 15, align: [6, 22] },
    { version: 4, data: 80, ecc: 20, align: [6, 26] },
    { version: 5, data: 108, ecc: 26, align: [6, 30] },
  ];
  const spec = versions.find((item) => bytes.length + 2 <= item.data);
  if (!spec) throw new Error("QR data too long");

  const data = encodeQrData(bytes, spec.data);
  const ecc = reedSolomonRemainder(data, spec.ecc);
  const codewords = [...data, ...ecc];
  const size = 21 + (spec.version - 1) * 4;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const set = (x, y, dark, reserve = true) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = Boolean(dark);
    if (reserve) reserved[y][x] = true;
  };

  drawFinder(set, 3, 3);
  drawFinder(set, size - 4, 3);
  drawFinder(set, 3, size - 4);

  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  for (const y of spec.align) {
    for (const x of spec.align) {
      const nearFinder = (x === 6 && y === 6) || (x === 6 && y === size - 7) || (x === size - 7 && y === 6);
      if (!nearFinder) drawAlignment(set, x, y);
    }
  }

  set(8, size - 8, true);
  reserveFormat(reserved, size);
  placeData(modules, reserved, codewords, size);
  applyMask(modules, reserved, size);
  drawFormat(modules, reserved, size, 0);
  return modules;
}

function encodeQrData(bytes, capacity) {
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));
  appendBits(bits, 0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0; data.length < capacity; pad ^= 1) data.push(pad ? 0x11 : 0xec);
  return data;
}

function appendBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
}

function reedSolomonRemainder(data, degree) {
  const generator = reedSolomonGenerator(degree);
  const result = Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ result.shift();
    result.push(0);
    generator.forEach((coefficient, index) => {
      result[index] ^= gfMul(coefficient, factor);
    });
  }
  return result;
}

function reedSolomonGenerator(degree) {
  let result = [1];
  for (let i = 0; i < degree; i++) {
    const next = Array(result.length + 1).fill(0);
    result.forEach((coefficient, index) => {
      next[index] ^= gfMul(coefficient, 1);
      next[index + 1] ^= gfMul(coefficient, gfPow(2, i));
    });
    result = next;
  }
  return result.slice(1);
}

function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function gfPow(x, power) {
  let result = 1;
  for (let i = 0; i < power; i++) result = gfMul(result, x);
  return result;
}

function drawFinder(set, cx, cy) {
  for (let y = -4; y <= 4; y++) {
    for (let x = -4; x <= 4; x++) {
      const dist = Math.max(Math.abs(x), Math.abs(y));
      set(cx + x, cy + y, dist !== 2 && dist !== 4);
    }
  }
}

function drawAlignment(set, cx, cy) {
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      const dist = Math.max(Math.abs(x), Math.abs(y));
      set(cx + x, cy + y, dist !== 1);
    }
  }
}

function reserveFormat(reserved, size) {
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
}

function placeData(modules, reserved, codewords, size) {
  const bits = codewords.flatMap((byte) => {
    const out = [];
    appendBits(out, byte, 8);
    return out;
  });
  let index = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right--;
    for (let vert = 0; vert < size; vert++) {
      const y = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (!reserved[y][x]) modules[y][x] = Boolean(bits[index++] || 0);
      }
    }
    upward = !upward;
  }
}

function applyMask(modules, reserved, size) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!reserved[y][x] && (x + y) % 2 === 0) modules[y][x] = !modules[y][x];
    }
  }
}

function drawFormat(modules, reserved, size, mask) {
  const bits = formatBits(mask);
  const set = (x, y, bitIndex) => {
    modules[y][x] = Boolean((bits >>> bitIndex) & 1);
    reserved[y][x] = true;
  };
  for (let i = 0; i <= 5; i++) set(8, i, i);
  set(8, 7, 6);
  set(8, 8, 7);
  set(7, 8, 8);
  for (let i = 9; i < 15; i++) set(14 - i, 8, i);
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, i);
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, i);
  modules[size - 8][8] = true;
}

function formatBits(mask) {
  let data = (1 << 3) | mask;
  let value = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((value >>> i) & 1) value ^= 0x537 << (i - 10);
  }
  return ((data << 10) | value) ^ 0x5412;
}

bindEvents();
qs("#prospectNiche").innerHTML = prospectNiches.map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.label)}</option>`).join("");
loadPortugalMunicipalities();
renderAll();
loadServerState();
