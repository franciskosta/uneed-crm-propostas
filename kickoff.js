(function () {
  "use strict";

  const productCatalog = {
    presenca: {
      objective: "Presença digital profissional", eyebrow: "Ativação UNEED Presença", title: "A sua presença profissional começa aqui.",
      intro: "Confirme o essencial para prepararmos a página do seu negócio. Pode guardar e continuar mais tarde neste dispositivo.",
      contentTitle: "Conte-nos o que deve aparecer na sua página.", contentCopy: "Partilhe o que já tiver. A UNEED ajuda a organizar o resto.",
      plans: { essencial: { id: "presenca-essencial", name: "UNEED Presença", price: 39, description: "Website personalizado, domínio, alojamento, SSL, 1 email profissional, manutenção e suporte." } }, defaultPlan: "essencial"
    },
    marcacoes: {
      objective: "Marcações online", eyebrow: "Ativação UNEED Marcações", title: "Vamos organizar as suas marcações online.",
      intro: "Serviços, equipa e horários num processo simples, preparado para o seu negócio.",
      contentTitle: "Como funcionam as suas marcações?", contentCopy: "Indique serviços, durações e disponibilidade. Pode completar o que faltar mais tarde.",
      plans: {
        start: { id: "bookings-start-monthly", name: "BOOKINGS START", price: 59, description: "Sistema de marcações, website, domínio, alojamento, email profissional e confirmações automáticas." },
        pro: { id: "bookings-pro-monthly", name: "BOOKINGS PRO", price: 99, description: "Múltiplos colaboradores, landing page, integração WhatsApp e gestão avançada." },
        premium: { id: "bookings-premium-monthly", name: "BOOKINGS PREMIUM", price: 149, description: "Pagamentos online, automações, IA, analytics e integrações especiais." }
      }, defaultPlan: "start"
    },
    leads: {
      objective: "Captação de leads", eyebrow: "Ativação UNEED Leads", title: "Vamos preparar o seu sistema de captação.",
      intro: "Defina a oferta, o público e o destino dos contactos. Nós tratamos da parte técnica.",
      contentTitle: "O que precisa de saber antes de receber um contacto?", contentCopy: "Partilhe a oferta e as perguntas essenciais para qualificarmos cada oportunidade.",
      plans: {
        start: { id: "leads-start-monthly", name: "LEADS START", price: 49, description: "Landing page de conversão, WhatsApp, domínio, alojamento, email profissional e suporte." },
        flow: { id: "leads-flow-monthly", name: "LEADS FLOW", price: 99, description: "Diagnóstico interativo, pré-qualificação e passagem contextualizada para WhatsApp." },
        ai: { id: "leads-ai-monthly", name: "LEADS AI", price: 199, description: "Qualificação e resposta automática com IA no WhatsApp." }
      }, defaultPlan: "start"
    }
  };

  const nicheCatalog = {
    cabeleireiro: { business: "Ex.: Studio Aurora", servicesLabel: "Serviços, duração e preço", services: "Ex.: Corte senhora — 45 min — 25€", teamLabel: "Profissionais e serviços atribuídos", team: "Ex.: Ana — corte e coloração" },
    clinica: { business: "Ex.: Clínica Aurora", servicesLabel: "Especialidades ou tratamentos", services: "Ex.: Consulta inicial — 60 min", teamLabel: "Profissionais e especialidades", team: "Ex.: Dra. Ana — Fisioterapia" },
    restaurante: { business: "Ex.: Restaurante Aurora", servicesLabel: "Menus, serviços ou tipo de reserva", services: "Ex.: Almoço executivo · reservas de grupo", teamLabel: "Responsáveis ou espaços", team: "Ex.: Sala principal — 40 lugares" },
    estetica: { business: "Ex.: Espaço Aurora", servicesLabel: "Tratamentos, duração e preço", services: "Ex.: Limpeza de pele — 60 min — 40€", teamLabel: "Profissionais e tratamentos", team: "Ex.: Joana — rosto e corpo" }
  };

  const query = new URLSearchParams(location.search);
  const productKey = String(query.get("produto") || "").toLowerCase();
  let nicheKey = UNEED_KICKOFF_INTAKE.nicheKey(query.get("nicho"));
  const product = productCatalog[productKey] || null;
  const requestedPlan = String(query.get("plano") || "").toLowerCase();
  const planKey = product && product.plans[requestedPlan] ? requestedPlan : product?.defaultPlan;
  const plan = product ? product.plans[planKey] : { id: "presenca-essencial", name: "UNEED Presença", price: 39, description: "Website personalizado, domínio, alojamento, SSL, 1 email profissional, manutenção e suporte." };
  const niche = nicheCatalog[nicheKey] || null;

  const form = document.getElementById("kickoffForm");
  const panels = Array.from(document.querySelectorAll("[data-step]"));
  const indicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
  const nextButton = document.getElementById("nextButton");
  const backButton = document.getElementById("backButton");
  const submitButton = document.getElementById("submitButton");
  const errorBox = document.getElementById("formError");
  const storageKey = "uneed-kickoff-draft-v2:" + (productKey || "geral") + ":" + (planKey || "base") + ":" + (nicheKey || "geral");
  const firstStep = product ? 2 : 1;
  let currentStep = firstStep;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; });
  }

  function selectedAddonData() { return []; }

  function formDataObject() {
    const data = new FormData(form);
    const selectedAddons = selectedAddonData();
    const knownExtras = selectedAddons.reduce(function (total, addon) { return total + (addon.subtotal || 0); }, 0);
    const hasPendingPrices = selectedAddons.some(function (addon) { return addon.subtotal === null; });
    return {
      objective: product?.objective || data.get("objective") || "",
      addons: selectedAddons,
      businessName: String(data.get("businessName") || "").trim(), contactName: String(data.get("contactName") || "").trim(),
      phone: String(data.get("phone") || "").trim(), email: String(data.get("email") || "").trim(), taxId: String(data.get("taxId") || "").trim(),
      billingAddress: String(data.get("billingAddress") || "").trim(), currentUrl: String(data.get("currentUrl") || "").trim(),
      domainStatus: data.get("domainStatus") || "", domain: String(data.get("domain") || "").trim(), services: String(data.get("services") || "").trim(),
      hours: String(data.get("hours") || "").trim(), team: String(data.get("team") || "").trim(), siteChanges: String(data.get("siteChanges") || "").trim(),
      referenceUrls: String(data.get("referenceUrls") || "").trim(), notes: String(data.get("notes") || "").trim(), paymentMethod: String(data.get("paymentMethod") || ""),
      consent: data.get("consent") === "on", website: String(data.get("website") || ""), source: query.get("source") || "direct",
      product: productKey || "presenca", niche: nicheKey, configuredFlow: Boolean(product), plan: plan.id, planName: plan.name, baseMonthlyPrice: plan.price, estimatedMonthlyPrice: plan.price + knownExtras, currency: "EUR",
      priceStatus: hasPendingPrices ? "pending_addon_validation" : selectedAddons.length ? "estimated_total" : "base_confirmed", pageUrl: location.href
    };
  }

  function saveDraft() {
    const values = {};
    new FormData(form).forEach(function (value, key) {
      if (key === "website" || key === "consent") return;
      if (key === "addons" || key === "addonLanguages") { values[key] = values[key] || []; values[key].push(value); } else values[key] = value;
    });
    try { localStorage.setItem(storageKey, JSON.stringify(values)); } catch (_) {}
  }

  function restoreDraft() {
    let values;
    try { values = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch (_) { values = null; }
    if (!values) return;
    Object.keys(values).forEach(function (key) {
      form.querySelectorAll('[name="' + CSS.escape(key) + '"]').forEach(function (field) {
        if (field.type === "radio") field.checked = field.value === values[key];
        else if (field.type === "checkbox") field.checked = Array.isArray(values[key]) && values[key].includes(field.value);
        else field.value = values[key];
      });
    });
  }

  function selectedAddonNames() { return formDataObject().addons.map(function (addon) { return addon.label; }); }

  function renderReview() {
    const data = formDataObject();
    const rows = [
      ["Objetivo", data.objective || "—"], ["Plano", plan.name + " — " + plan.price + "€ + IVA / mês"],
      ...(nicheKey ? [["Área de negócio", nicheKey.charAt(0).toUpperCase() + nicheKey.slice(1)]] : []),
      ["Negócio", data.businessName || "—"],
      ["Contacto", [data.contactName, data.phone, data.email].filter(Boolean).join(" · ") || "—"],
      ["Domínio", [data.domainStatus, data.domain].filter(Boolean).join(" — ") || "A definir"],
      ["O que quer criar ou alterar", data.siteChanges || "—"],
      ["Primeiro pagamento", data.paymentMethod === "mbway" ? "MB WAY" : "Transferência bancária"],
      ["Valor mensal estimado", data.estimatedMonthlyPrice + "€ + IVA / mês" + (data.priceStatus === "pending_addon_validation" ? " + extras a validar" : "")]
    ];
    document.getElementById("reviewCard").innerHTML = rows.map(function (row) { return '<div class="review-row"><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></div>'; }).join("");
  }

  function applyProductPreset() {
    if (!product) return;
    document.body.dataset.product = productKey;
    document.title = "Começar com " + plan.name + " — UNEED";
    document.getElementById("introEyebrow").textContent = product.eyebrow;
    document.getElementById("page-title").textContent = product.title;
    document.getElementById("introCopy").textContent = product.intro;
    document.getElementById("planStepTitle").textContent = "Vamos preparar o seu projeto.";
    document.getElementById("planStepCopy").textContent = "Um resumo do serviço. Agora vamos reunir a informação para preparar o seu negócio online.";
    document.getElementById("planBadge").textContent = "Plano selecionado";
    document.getElementById("planName").textContent = plan.name;
    document.getElementById("planDescription").textContent = plan.description;
    document.getElementById("planPrice").textContent = plan.price + "€";
    document.getElementById("contentStepTitle").textContent = product.contentTitle;
    document.getElementById("contentStepCopy").textContent = product.contentCopy;
    document.querySelector('[data-step="1"]').hidden = true;
    document.querySelector('[data-step-indicator="1"]').hidden = true;
    [2, 3, 4, 5].forEach(function (step, index) {
      const indicator = document.querySelector('[data-step-indicator="' + step + '"]');
      indicator.querySelector("button > span").textContent = String(index + 1);
      document.querySelector('[data-step="' + step + '"] .step-kicker').textContent = "Passo " + (index + 1) + " de 4";
    });
    if (niche) {
      document.querySelector('[name="businessName"]').placeholder = niche.business;
      document.getElementById("servicesLabel").textContent = niche.servicesLabel;
      document.querySelector('[name="services"]').placeholder = niche.services;
      document.getElementById("teamLabel").textContent = niche.teamLabel;
      document.querySelector('[name="team"]').placeholder = niche.team;
    }
  }

  function setStep(step) {
    currentStep = Math.max(firstStep, Math.min(5, step));
    panels.forEach(function (panel) { panel.classList.toggle("is-active", Number(panel.dataset.step) === currentStep); });
    indicators.forEach(function (indicator) {
      const number = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("is-active", number === currentStep); indicator.classList.toggle("is-complete", number < currentStep);
      indicator.querySelector("button").disabled = number > currentStep;
    });
    const percent = product ? (currentStep - 1) * 25 : currentStep * 20;
    document.getElementById("progressPercent").textContent = percent; document.getElementById("progressBar").style.width = percent + "%";
    backButton.hidden = currentStep === firstStep; nextButton.hidden = currentStep === 5; submitButton.hidden = currentStep !== 5; errorBox.hidden = true;
    if (currentStep === 5) renderReview();
    const workspaceTop = document.querySelector(".workspace").getBoundingClientRect().top + window.scrollY - 16;
    if (window.scrollY > workspaceTop) window.scrollTo({ top: workspaceTop, behavior: "smooth" });
  }

  function validateStep(step) {
    const panel = panels.find(function (item) { return Number(item.dataset.step) === step; });
    const required = Array.from(panel.querySelectorAll("[required]")); let firstInvalid = null;
    required.forEach(function (field) {
      let valid = field.checkValidity(); if (field.type === "radio") valid = Boolean(panel.querySelector('[name="' + field.name + '"]:checked'));
      field.setAttribute("aria-invalid", String(!valid)); if (!valid && !firstInvalid) firstInvalid = field;
    });
    const taxId = panel.querySelector('[name="taxId"]');
    if (taxId && taxId.value && !/^[0-9]{9}$/.test(taxId.value)) { taxId.setAttribute("aria-invalid", "true"); firstInvalid = firstInvalid || taxId; }
    if (firstInvalid) { errorBox.textContent = step === 1 ? "Escolha uma opção para continuar." : "Confirme os campos assinalados antes de continuar."; errorBox.hidden = false; firstInvalid.focus(); return false; }
    return true;
  }

  async function submitForm(event) {
    event.preventDefault(); if (!validateStep(5)) return;
    submitButton.disabled = true; submitButton.firstChild.textContent = "A enviar… "; errorBox.hidden = true;
    try {
      const response = await fetch("/api/kickoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formDataObject()) });
      const result = await response.json().catch(function () { return {}; }); if (!response.ok) throw new Error(result.error || "Não foi possível enviar o pedido.");
      try { localStorage.removeItem(storageKey); } catch (_) {}
      document.getElementById("successReference").textContent = result.reference || "UNEED";
      if (result.payment) {
        document.getElementById("paymentInstructions").hidden = false;
        document.getElementById("paymentAmount").textContent = result.payment.totalWithVatFormatted;
        document.getElementById("paymentVat").textContent = result.payment.subtotalFormatted + " + IVA à taxa legal em vigor";
        if (result.payment.method === "bank_transfer") {
          document.getElementById("bankPaymentDetails").hidden = false;
          document.getElementById("paymentAccountName").textContent = result.payment.accountName;
          document.getElementById("paymentIban").textContent = result.payment.iban;
        } else {
          document.getElementById("mbwayPaymentDetails").hidden = false;
          document.getElementById("paymentMbway").textContent = result.payment.mbway;
        }
      }
      document.getElementById("emailConfirmation").textContent = result.customerEmailSent
        ? "Enviámos para o seu email o resumo da aquisição e estes dados de pagamento."
        : "O pedido ficou registado. A confirmação por email será enviada pela equipa UNEED.";
      document.getElementById("successScreen").hidden = false; document.body.style.overflow = "hidden";
    } catch (error) {
      errorBox.textContent = error.message === "payment_method_unavailable" ? "Este método de pagamento ainda não está disponível. Escolha transferência bancária ou contacte a UNEED." : error.message === "price_requires_validation" ? "Selecionou extras com preço a confirmar. Retire esses extras para avançar já ou contacte a UNEED para receber o valor final." : "Não conseguimos enviar agora. As respostas ficaram guardadas. Tente novamente ou escreva para geral@uneed.pt.";
      errorBox.hidden = false; submitButton.disabled = false; submitButton.firstChild.textContent = "Enviar pedido ";
    }
  }

  async function loadPaymentAvailability() {
    try {
      const response = await fetch("/api/kickoff");
      const result = await response.json();
      const mbwayInput = form.querySelector('[name="paymentMethod"][value="mbway"]');
      const available = Boolean(response.ok && result.paymentMethods?.mbway);
      mbwayInput.disabled = !available;
      document.getElementById("mbwayChoice").classList.toggle("is-unavailable", !available);
      document.getElementById("mbwayAvailability").textContent = available ? "Recebe o número e a referência após confirmar." : "Indisponível por agora — escolha transferência.";
    } catch (_) {
      document.getElementById("mbwayAvailability").textContent = "Indisponível por agora — escolha transferência.";
    }
  }

  applyProductPreset(); restoreDraft();
  const sectorSelect=form.elements.niche;
  sectorSelect.innerHTML=Object.entries(UNEED_KICKOFF_INTAKE.niches).map(([id,n])=>'<option value="'+id+'">'+escapeHtml(n.name)+'</option>').join('');
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||"null");if(saved?.niche&&UNEED_KICKOFF_INTAKE.niches[saved.niche])nicheKey=saved.niche;}catch(_){}
  sectorSelect.value=nicheKey;
  function sectorFields(){nicheKey=sectorSelect.value;const n=UNEED_KICKOFF_INTAKE.niches[nicheKey];document.getElementById("servicesLabel").textContent=n.services;document.getElementById("teamLabel").textContent=n.team;document.getElementById("sectorHint").textContent=n.sector+' '+n.hint;}
  sectorFields();sectorSelect.addEventListener('change',sectorFields);
  form.addEventListener("input",function(event){event.target.removeAttribute("aria-invalid");errorBox.hidden=true;saveDraft();});
  form.addEventListener("change",saveDraft);
  document.getElementById("saveLater").onclick=function(){saveDraft();document.getElementById("actionReassurance").textContent="Guardado neste dispositivo. Pode regressar a este link.";};
  nextButton.addEventListener("click", function () { if (validateStep(currentStep)) setStep(currentStep + 1); });
  backButton.addEventListener("click", function () { setStep(currentStep - 1); });
  indicators.forEach(function (indicator) { indicator.querySelector("button").addEventListener("click", function () { const target = Number(indicator.dataset.stepIndicator); if (target < currentStep && target >= firstStep) setStep(target); }); });
  form.addEventListener("submit", submitForm); loadPaymentAvailability(); setStep(firstStep);
})();
