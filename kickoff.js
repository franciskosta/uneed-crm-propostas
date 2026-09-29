(function () {
  "use strict";

  const addons = [
    { id: "management-metrics", name: "Métricas de gestão", note: "Indicadores de gestão · 12 €/mês + IVA", help: "Indicadores para acompanhar a gestão do negócio, de acordo com os dados e integrações configurados. É um extra opcional de 12 € por mês, acrescido de IVA quando aplicável.", unitPrice: 12, products: ["presenca", "marcacoes", "leads"] },
    { id: "extra-email", name: "Email profissional extra", note: "15 GB por conta", help: "O plano já inclui uma conta. Adicione uma unidade por cada novo endereço profissional de que precisa, por exemplo geral@, comercial@ ou nome@empresa.pt. Cada conta tem caixa e acesso próprios.", unitPrice: 6, configurable: "quantity", products: ["presenca", "marcacoes", "leads"] },
    { id: "extra-language", name: "Idioma adicional", note: "Uma versão extra da página", help: "Cria uma versão navegável da página no idioma escolhido, com seletor de idioma. O preço é aplicado por cada idioma adicional. A tradução inicial standard está incluída; conteúdos extensos podem ser avaliados à parte.", unitPrice: 5, configurable: "languages", products: ["presenca", "marcacoes", "leads"] },
    { id: "guided-assistant", name: "Assistente Guiado 24h", note: "Respostas por opções preparadas", help: "O visitante escolhe entre botões e percursos definidos antecipadamente. As respostas são fixas e aprovadas por si: é previsível, controlado e indicado para perguntas frequentes e encaminhamento. Não interpreta perguntas escritas livremente.", unitPrice: 12, products: ["presenca", "marcacoes", "leads"] },
    { id: "smart-assistant", name: "Assistente Inteligente 24h", note: "Perguntas livres com IA", help: "O visitante escreve a pergunta com as suas próprias palavras. A IA interpreta-a e responde apenas com base na informação aprovada do negócio. É mais flexível para dúvidas variadas e inclui até 2.000 respostas por mês.", unitPrice: 29, products: ["presenca", "marcacoes", "leads"] },
    { id: "backoffice", name: "Backoffice de conteúdos", note: "Edite conteúdos selecionados", help: "Área reservada onde pode alterar autonomamente conteúdos definidos, como textos, contactos, horários ou imagens. Não inclui mudanças de design, novas páginas ou novas funcionalidades.", unitPrice: 15, products: ["presenca", "leads"] },
    { id: "sms", name: "Pacote SMS", note: "Lembretes e confirmações", help: "Envia confirmações e lembretes de marcação por SMS para reduzir faltas. O valor depende do plafond mensal de mensagens escolhido e é confirmado antes da ativação.", price: "Por volume", products: ["marcacoes"] },
    { id: "multi-location", name: "Multi-estabelecimento", note: "Agenda e equipa por espaço", help: "Permite gerir vários espaços no mesmo sistema, mantendo horários, profissionais, serviços e disponibilidade próprios para cada estabelecimento.", price: "A confirmar", products: ["marcacoes"] },
    { id: "registrations", name: "Sistema de inscrições", note: "Formulário personalizado", help: "Formulário adaptado aos dados que precisa de recolher, com submissões organizadas e notificações por email. Campos, documentos e fluxo são confirmados consigo antes da ativação.", price: "A confirmar", products: ["presenca"] },
    { id: "remove-credit", name: "Remover “by uneed.pt”", note: "Sem referência no rodapé", help: "Retira a assinatura visível “by uneed.pt” do rodapé. A UNEED continua responsável pelo alojamento, manutenção e suporte contratados.", unitPrice: 5, products: ["presenca", "marcacoes", "leads"] },
    { id: "cards", name: "250 cartões por ano", note: "Design e impressão incluídos", help: "Inclui criação ou adaptação do design e impressão de até 250 cartões de visita ou fidelização por ano. Acabamentos especiais e entregas podem ser avaliados à parte.", price: "A confirmar", products: ["presenca", "marcacoes", "leads"] }
  ];

  const languages = [
    { code: "en", short: "EN", name: "Inglês" },
    { code: "es", short: "ES", name: "Espanhol" },
    { code: "fr", short: "FR", name: "Francês" },
    { code: "de", short: "DE", name: "Alemão" }
  ];

  const productCatalog = {
    presenca: {
      objective: "Presença digital profissional", eyebrow: "Ativação UNEED Presença", title: "A sua presença profissional começa aqui.",
      intro: "Confirme o essencial para prepararmos a página do seu negócio. Demora cerca de 4 minutos.",
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
  const nicheKey = String(query.get("nicho") || "").toLowerCase();
  const product = productCatalog[productKey] || null;
  const requestedPlan = String(query.get("plano") || "").toLowerCase();
  const planKey = product && product.plans[requestedPlan] ? requestedPlan : product?.defaultPlan;
  const plan = product ? product.plans[planKey] : { id: "presenca-essencial", name: "UNEED Presença", price: 39, description: "Website personalizado, domínio, alojamento, SSL, 1 email profissional, manutenção e suporte." };
  const niche = nicheCatalog[nicheKey] || null;
  const activeAddons = product ? addons.filter(function (addon) { return addon.products.includes(productKey); }) : addons;

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

  function addonPriceLabel(addon) {
    return Number.isFinite(addon.unitPrice) ? addon.unitPrice + "€ / mês" + (addon.configurable ? " cada" : "") : addon.price;
  }

  function renderAddons() {
    document.getElementById("addonList").innerHTML = activeAddons.map(function (addon) {
      const tooltipId = "tooltip-" + addon.id;
      const heading = '<div class="addon-heading"><label class="addon-main"><input type="checkbox" name="addons" value="' + escapeHtml(addon.id) + '"><span><strong>' + escapeHtml(addon.name) + '</strong><small>' + escapeHtml(addon.note) + '</small></span></label><span class="addon-help"><button type="button" aria-label="Mais informação sobre ' + escapeHtml(addon.name) + '" aria-describedby="' + tooltipId + '">i</button><span class="addon-tooltip" id="' + tooltipId + '" role="tooltip"><strong>' + escapeHtml(addon.name) + '</strong>' + escapeHtml(addon.help) + '</span></span><em>' + escapeHtml(addonPriceLabel(addon)) + '</em></div>';
      if (addon.configurable === "quantity") {
        return '<div class="addon addon-configurable" data-addon="' + escapeHtml(addon.id) + '">' + heading + '<div class="addon-options quantity-option"><span>Quantidade</span><div class="quantity-control"><button type="button" data-quantity="-1" aria-label="Diminuir quantidade">−</button><input type="number" name="extraEmailQuantity" value="1" min="1" max="20" inputmode="numeric" aria-label="Quantidade de emails extra"><button type="button" data-quantity="1" aria-label="Aumentar quantidade">+</button></div><strong data-email-subtotal>6€ / mês</strong></div></div>';
      }
      if (addon.configurable === "languages") {
        const choices = languages.map(function (language) { return '<label class="language-option"><input type="checkbox" name="addonLanguages" value="' + language.code + '"><span><strong>' + language.short + '</strong><small>' + language.name + '</small></span></label>'; }).join("");
        return '<div class="addon addon-configurable" data-addon="' + escapeHtml(addon.id) + '">' + heading + '<div class="addon-options language-options">' + choices + '</div><p class="language-total" data-language-total>Escolha um ou mais idiomas</p></div>';
      }
      return '<div class="addon">' + heading + '</div>';
    }).join("");
  }

  function selectedAddonData() {
    const data = new FormData(form);
    return data.getAll("addons").map(function (id) {
      const addon = activeAddons.find(function (item) { return item.id === id; });
      if (!addon) return null;
      const selectedLanguages = id === "extra-language" ? data.getAll("addonLanguages").filter(function (code) { return languages.some(function (language) { return language.code === code; }); }) : [];
      const quantity = id === "extra-email" ? Math.max(1, Math.min(20, Number(data.get("extraEmailQuantity")) || 1)) : id === "extra-language" ? selectedLanguages.length : 1;
      const subtotal = Number.isFinite(addon.unitPrice) ? addon.unitPrice * quantity : null;
      const languageNames = selectedLanguages.map(function (code) { return languages.find(function (language) { return language.code === code; }).name; });
      return { id: addon.id, name: addon.name, price: Number.isFinite(addon.unitPrice) ? addon.unitPrice + "€ / mês" : addon.price, unitPrice: Number.isFinite(addon.unitPrice) ? addon.unitPrice : null, quantity, languages: selectedLanguages, subtotal, label: addon.name + (id === "extra-email" ? " × " + quantity : languageNames.length ? " — " + languageNames.join(", ") : "") };
    }).filter(Boolean).filter(function (addon) { return addon.id !== "extra-language" || addon.quantity > 0; });
  }

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
      ["Extras", selectedAddonNames().join(", ") || "Nenhum por agora"], ["Negócio", data.businessName || "—"],
      ["Contacto", [data.contactName, data.phone, data.email].filter(Boolean).join(" · ") || "—"],
      ["Domínio", [data.domainStatus, data.domain].filter(Boolean).join(" — ") || "A definir"],
      ["O que quer criar ou alterar", data.siteChanges || "—"],
      ["Primeiro pagamento", data.paymentMethod === "mbway" ? "MB WAY" : "Transferência bancária"],
      ["Valor mensal estimado", data.estimatedMonthlyPrice + "€ + IVA / mês" + (data.priceStatus === "pending_addon_validation" ? " + extras a validar" : "")]
    ];
    document.getElementById("reviewCard").innerHTML = rows.map(function (row) { return '<div class="review-row"><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></div>'; }).join("");
  }

  function updateAddonCount() {
    const selected = selectedAddonData();
    const count = selected.length;
    const knownExtras = selected.reduce(function (total, addon) { return total + (addon.subtotal || 0); }, 0);
    const pending = selected.some(function (addon) { return addon.subtotal === null; });
    const total = plan.price + knownExtras;
    document.getElementById("addonCount").textContent = count + (count === 1 ? " selecionado" : " selecionados");
    document.getElementById("priceSummaryNote").textContent = count ? plan.price + "€ base + " + knownExtras + "€ em extras" + (pending ? " + valores a confirmar" : "") : "Sem extras selecionados";
    document.getElementById("priceSummaryTotal").innerHTML = total + '€' + (pending ? ' + extras' : '') + ' <small>+ IVA / mês</small>';
    const email = selected.find(function (addon) { return addon.id === "extra-email"; });
    const emailSubtotal = form.querySelector("[data-email-subtotal]");
    if (emailSubtotal) emailSubtotal.textContent = (email?.subtotal || 6) + "€ / mês";
    const language = selected.find(function (addon) { return addon.id === "extra-language"; });
    const languageTotal = form.querySelector("[data-language-total]");
    if (languageTotal) languageTotal.textContent = language ? language.quantity + (language.quantity === 1 ? " idioma selecionado" : " idiomas selecionados") + " · " + language.subtotal + "€ / mês" : "Escolha um ou mais idiomas";
  }

  function syncConfigurableAddon(target) {
    const emailCheckbox = form.querySelector('[name="addons"][value="extra-email"]');
    const languageCheckbox = form.querySelector('[name="addons"][value="extra-language"]');
    const languageFields = Array.from(form.querySelectorAll('[name="addonLanguages"]'));
    if (target === emailCheckbox && emailCheckbox.checked) form.elements.extraEmailQuantity.value = Math.max(1, Number(form.elements.extraEmailQuantity.value) || 1);
    if (target === languageCheckbox && languageCheckbox.checked && !languageFields.some(function (field) { return field.checked; }) && languageFields[0]) languageFields[0].checked = true;
    if (target?.name === "addonLanguages" && languageCheckbox) languageCheckbox.checked = languageFields.some(function (field) { return field.checked; });
    if (target?.name === "extraEmailQuantity" && emailCheckbox) emailCheckbox.checked = Number(target.value) > 0;
  }

  function applyProductPreset() {
    if (!product) return;
    document.body.dataset.product = productKey;
    document.title = "Começar com " + plan.name + " — UNEED";
    document.getElementById("introEyebrow").textContent = product.eyebrow;
    document.getElementById("page-title").textContent = product.title;
    document.getElementById("introCopy").textContent = product.intro;
    document.getElementById("planStepTitle").textContent = "O serviço certo, sem escolhas desnecessárias.";
    document.getElementById("planStepCopy").textContent = "Este é o plano preparado para si. Acrescente apenas algum extra que já saiba que precisa.";
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

  applyProductPreset(); renderAddons(); restoreDraft();
  syncConfigurableAddon(form.querySelector('[name="addons"][value="extra-language"]'));
  updateAddonCount();
  form.addEventListener("click", function (event) {
    const control = event.target.closest("[data-quantity]");
    if (!control) return;
    const field = form.elements.extraEmailQuantity;
    field.value = Math.max(1, Math.min(20, (Number(field.value) || 1) + Number(control.dataset.quantity)));
    syncConfigurableAddon(field); updateAddonCount(); saveDraft();
  });
  form.addEventListener("input", function (event) { event.target.removeAttribute("aria-invalid"); errorBox.hidden = true; syncConfigurableAddon(event.target); updateAddonCount(); saveDraft(); });
  form.addEventListener("change", function (event) { syncConfigurableAddon(event.target); updateAddonCount(); saveDraft(); });
  nextButton.addEventListener("click", function () { if (validateStep(currentStep)) setStep(currentStep + 1); });
  backButton.addEventListener("click", function () { setStep(currentStep - 1); });
  indicators.forEach(function (indicator) { indicator.querySelector("button").addEventListener("click", function () { const target = Number(indicator.dataset.stepIndicator); if (target < currentStep && target >= firstStep) setStep(target); }); });
  form.addEventListener("submit", submitForm); loadPaymentAvailability(); setStep(firstStep);
})();
