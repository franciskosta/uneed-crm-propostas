# UNEED Express Generator - Estado do Projeto

Atualizado em: 2026-05-21

## Memória oficial para desenvolvimento

Antes de continuar qualquer bloco novo, ler:

- `docs/brain/START_HERE.md`
- `docs/brain/CURRENT_STATE.md`
- `docs/brain/DECISIONS.md`
- `docs/brain/NEXT_TASKS.md`

Estes ficheiros passam a ser a fonte de verdade operacional para evitar perda de contexto, decisões contraditórias e lentidão por excesso de conversa acumulada. Se houver conflito entre uma conversa antiga e `docs/brain`, preferir `docs/brain`.

## Objetivo

Criar o Skeduall / UNEED Agenda: um SaaS de marcações e reservas para negócios locais. O produto principal é agenda/reservas, gestão operacional e comunicação; os sites e landing pages passam a ser o motor de aquisição incluído no produto.

Verticais prioritários:

- Salões de cabeleireiro e estética.
- Clínicas e serviços por agenda.
- Restaurantes com reservas de mesas.

## Diretório de trabalho atual

- Desenvolvimento ativo: `/Users/uneed/Documents/UNEED-EXPRESS/generator`
- Backup no Google Drive: `/Users/uneed/Google Drive/My Drive/DESIGN E WEB/UNEED/UNEED-EXPRESS/generator`

Continuar a trabalhar no diretório local ativo e sincronizar para o Google Drive no fim de cada bloco relevante.

## Arquitetura principal

- `ui-server.js`: servidor local, UI, API `/api/generate`, APIs dos módulos, disponibilidade, agenda, painel local e gestão de pedidos.
- `lib/templates.js`: monta o HTML final.
- `lib/writeSite.js`: escreve output, CSS, JS, assets, manifest, páginas auxiliares e painéis operacionais.
- `lib/layouts.js`: inteligência de layouts.
- `lib/copy.js`: copy por nicho.
- `lib/normalize.js`: normalização de nichos.
- `lib/headerConfig.js`: normalização/configuração avançada de header.
- `lib/conversionModules.js`: normalização dos módulos de conversão.
- `lib/bookingConfig.js`: normalização de serviços, profissionais, horários, ausências e regras de marcação.
- `lib/bookingAvailability.js`: cálculo de slots, disponibilidade, conflitos, janela de marcação e alternativas.
- `lib/landingConfig.js`: estilos/receitas de landing pages.
- `templates/header.js`: header configurável.
- `templates/sections.js`: secções, incluindo formulário de marcações.
- `templates/landing.js`: landing pages de conversão.
- `ui/index.html` e `ui/app.js`: UI local do gerador.

## Funcionalidades já trabalhadas

- Geração de sites estáticos.
- Nichos e copy por nicho.
- Layout intelligence.
- Múltiplos headers/heroes/serviços/galerias/testemunhos/contactos.
- Header configurável: overlay/below, sticky/static, CTA on/off, temas, hover, logo centrado, hamburger only e logos claro/escuro.
- Landing pages com estilos de alta conversão, módulos, diagnóstico simples, planos de imagem e sugestões para IA.
- Sistema de imagens preparado para placeholders e geração futura por IA.
- Módulos de conversão, com foco atual em `booking`.
- Formulário de marcação com serviço, profissional, data, hora, consentimento e referência.
- Configuração de serviços, profissionais, duração, horários semanais, ausências, antecedência mínima e janela máxima.
- API de disponibilidade: `/api/booking-availability`.
- API de agenda: `/api/booking-agenda`.
- Registo local de pedidos em `output/_module-leads/booking`.
- Backoffice local geral de pedidos.
- Página gerada `client-admin.html` para o cliente do negócio gerir pedidos do seu próprio site.
- Página gerada `booking-manage.html` para o cliente final consultar/cancelar o seu pedido por referência/token.
- Painel do cliente com KPIs, filtros, ações de confirmar/concluir/cancelar, agenda diária, disponibilidade por serviço e resumo semanal.
- Painel do cliente com visão de equipa/profissionais por dia: vagas livres, ocupação, serviços, próximas vagas e ausências.
- Painel do cliente com ações rápidas de contacto: preparar WhatsApp, email e copiar mensagens de confirmação/alternativa/cancelamento.
- Base SaaS local iniciada: tenants/clientes em `output/_saas/tenants`, associação de sites por cliente e APIs `/api/saas/tenants`.
- Tenants SaaS com produto, vertical, plano, estado, URLs previstas de portal/reserva e tokens locais de acesso.
- Autenticação local provisória por tenant: `POST /api/saas/auth` emite sessão e `GET /api/saas/session` valida sessão.
- API local `/api/booking-config` para ler e atualizar serviços, profissionais, horários, ausências, regras e manifest de marcações por site.
- UI local para carregar a configuração de marcações de um site já gerado, editar nos campos do gerador e gravar novamente no manifest via `/api/booking-config`.
- Editor visual inicial de marcações na UI: serviços e profissionais em cartões editáveis, sincronizados com os campos avançados existentes.
- Editor visual expandido para horários semanais e ausências/bloqueios, também sincronizado com os campos avançados e a API de configuração.
- UX pública de marcação melhorada: cabeçalho com sinais de confiança, cartões de serviço/profissional mais ricos e atalhos de datas válidas calculadas pelas regras.
- UX pública de marcação com estados vazios mais úteis, botões de horário com contexto e confirmação final premium com resumo do pedido e link de gestão.
- Validação operacional de prontidão para demo em `/api/booking-config`, com score, checklist e avisos apresentados na UI local ao carregar/guardar configurações.
- Pack de demo/venda em `/api/demo-pack` e botão "Preparar demo" na UI, reunindo readiness, links, métricas, passos de demonstração, argumentos comerciais e próximas ações.
- Seed de pedido demo em `/api/demo-pack/seed`, acionado pelo botão "Criar pedido demo" no pack de demo, criando um pedido real de teste com slot disponível, referência e link de gestão do cliente final.
- Novo countdown de produção iniciado com auditoria SaaS em `/api/saas/readiness` e botão "Auditar SaaS" na UI, medindo demo local, tenants, sites, pedidos e bloqueadores reais de produção.
- Requisitos de produção centralizados em `lib/productionConfig.js`, com variáveis de ambiente, recomendações por serviço e `.env.production.example` para orientar deploy real.
- Blueprint de base de dados SaaS multi-tenant em `lib/saasSchema.js`, exposto em `/api/saas/schema` e botão "Ver schema SaaS", com tabelas core/auth/site-builder/booking/notifications/billing e SQL inicial copiável.
- Migração inicial Supabase/Postgres em `supabase/migrations/001_initial_saas.sql`, com tabelas, UUID defaults, índices e RLS base por tenant; também disponível em `/api/saas/migration`.
- Exportador local para SaaS em `lib/saasExport.js`, com endpoints `/api/saas/export` e `/api/saas/export.sql`, convertendo tenants, sites, serviços, profissionais e pedidos locais em seed SQL.
- Plano de acessos e permissões em `lib/saasAccess.js`, exposto em `/api/saas/access-plan` e botão "Ver acessos", distinguindo admin UNEED, dono do negócio, gestor/receção, profissional e cliente final.
- Contratos de autenticação de produção definidos em `lib/saasAccess.js` e `docs/saas-access-plan.md`: convites, magic link, sessão autenticada e acesso do cliente final por referência/token.
- Launch Pack SaaS em `lib/saasLaunchPack.js`, `/api/saas/launch-pack` e `/api/saas/launch-pack.md`, reunindo prontidão, schema, migração, export, acessos, bloqueadores e uso comercial.
- Ciclo Staging SaaS iniciado: `lib/stagingConfig.js`, `.env.staging.example`, `/api/saas/staging-plan` e botão "Plano staging" com stack recomendada Supabase/Railway/Vercel/Resend/WhatsApp/Stripe.
- Health check de dados staging em `lib/stagingData.js`, `/api/saas/staging-health` e botão "Health staging", distinguindo fallback local, Supabase/Postgres parcial e staging ready.
- Plano de repository staging em `lib/stagingRepository.js`, `/api/saas/repository-plan` e botão "Repository", mapeando tenants, utilizadores, sites, configurações, marcações e notificações entre ficheiros locais e futuro provider staging.
- Snapshot do repository local em `/api/saas/repository-snapshot` e botão "Snapshot dados", auditando contagens reais, estados de marcações, sites sem tenant e referências órfãs antes da migração para staging.
- Plano de migração staging em `/api/saas/migration-plan` e botão "Plano migração", organizando a passagem por fases: tenants, sites/LPs, configurações, marcações e notificações.
- Fecho do ciclo Staging SaaS em `/api/saas/staging-handoff` e botão "Fecho staging", resumindo o que ficou pronto, o que falta para vender como SaaS e abrindo o countdown seguinte.
- Countdown Provider SaaS real iniciado com `lib/providerReadiness.js`, `/api/saas/provider-readiness` e botão "Provider real", auditando Supabase/Postgres, URLs, email, WhatsApp, Stripe, migração e export local.
- Setup pack do provider real em `/api/saas/provider-setup` e botão "Setup provider", com ordem segura, ficheiros, variáveis e passos para preparar Supabase, URLs, email, WhatsApp e Stripe.
- Preflight do provider real em `/api/saas/provider-preflight` e botão "Preflight provider", validando formatos de env, ficheiros críticos e se é seguro tentar uma ligação ao provider.
- Teste de conexão dry-run em `/api/saas/provider-connection-test` e botão "Teste conexão", preparando validação read-only sem expor segredos nem escrever dados reais.
- Plano de paridade provider/local em `/api/saas/provider-parity` e botão "Paridade provider", definindo targets e contagens a comparar antes de qualquer import real.
- Guard de importação em `/api/saas/provider-import-guard` e botão "Guard import", bloqueando qualquer import enquanto provider, paridade e ordem segura não estiverem validados.
- Fecho do Provider SaaS real em `/api/saas/provider-handoff` e botão "Fecho provider", resumindo readiness, preflight, conexão, paridade, import guard e abrindo o countdown seguinte.
- Countdown Repository real iniciado com `lib/repositoryDrivers.js`, `/api/saas/repository-driver` e botão "Driver repo", resolvendo driver ativo, fallback local e entidades cobertas em modo dry-run.
- Contrato de operações do repository em `/api/saas/repository-operations` e botão "Ops repo", mapeando leituras/escritas por entidade antes de trocar ficheiros locais por provider real.
- Plano de rollout do repository em `/api/saas/repository-rollout` e botão "Rollout repo", ordenando entidades/operações por fases para ligar provider real sem quebrar fallback local.
- Primeiro adapter interno criado em `lib/tenantRepository.js`, com `/api/saas/tenant-repository`, mantendo tenants em ficheiros locais mas já com assinatura única para futura troca local/provider.
- Adapter interno de sites criado em `lib/siteRepository.js`, com `/api/saas/site-repository`, centralizando leitura/listagem de manifests e mantendo output gerado compatível.
- Fecho do Repository real em `/api/saas/repository-handoff` e botão "Fecho repo", validando driver, operações, rollout e adapters `tenants/sites`, e abrindo a fase de Auth real/áreas de cliente.
- Countdown Auth real e áreas de cliente iniciado com `lib/authContracts.js`, `/api/saas/auth-contract` e botão "Contrato auth", definindo roles, sessões e guards antes de trocar autenticação local por login real.
- Repository local de utilizadores por cliente em `lib/tenantUserRepository.js`, com `/api/saas/tenant-user-repository`, `/api/saas/tenant-users` e convite local provisório para equipa.
- Guards de permissões reutilizáveis em `lib/authGuards.js`, com `/api/saas/auth-guards` e botão "Guards auth", validando role, tenant boundary, permissões e recursos próprios em modo diagnóstico.
- Guards aplicados progressivamente aos endpoints de `tenant-users`: pedidos sem sessão continuam em local-dev; pedidos com sessão validam tenant, role e permissões antes de listar/convidar equipa.
- Guards aplicados progressivamente ao `/api/booking-config`: leitura/escrita continuam local-dev sem sessão, mas com sessão validam tenant associado ao site e permissões `settings:read/write`.
- Fecho do ciclo Auth real e áreas de cliente em `/api/saas/auth-handoff` e botão "Fecho auth", consolidando contrato, tenant-users, guards e endpoints protegidos antes da fase de operações de marcação.
- Countdown Operações de marcação e disponibilidade vendável iniciado com `lib/bookingOperations.js`, `/api/booking-operations` e botão "Plano operação", avaliando serviços, equipa, horários, ausências, capacidade, riscos e readiness comercial local.
- Plano operacional de marcações expandido com fila de ação, pressão por serviço/profissional e deteção de pedidos pendentes cujo horário pedido já não está disponível.
- Plano operacional enriquecido com briefing do gestor, mensagens prontas para cliente final e automações candidatas para futuro WhatsApp/email.
- Fecho do ciclo Operações de marcação e disponibilidade vendável em `/api/booking-operations-handoff` e botão "Fecho operação", consolidando disponibilidade, conflitos, equipa, fila de ação, mensagens e automações candidatas.
- Countdown UX premium do cliente final iniciado com melhorias no widget público de marcação: faixa de confiança, badges de escolha, expectativa dinâmica e nota de referência/gestão antes do envio.
- Página pública `booking-manage.html` melhorada com hero de gestão, passos claros, estado em destaque, timeline do pedido e ajuda contextual para o cliente final.
- Fecho do ciclo UX premium do cliente final em `/api/customer-ux-handoff` e botão "Fecho UX", auditando widget público, referência, página de gestão, estado, timeline e ajuda contextual.
- Countdown Painel do negócio realmente comercial iniciado com cockpit no `client-admin.html`: resumo comercial, badges de valor, fila de prioridades, ações rápidas e resumo copiável.
- Painel do negócio com insights comerciais no `client-admin.html`, destacando pendentes, capacidade disponível, ocupação alta, falta de vagas e recuperação de cancelamentos.
- Painel do negócio com relatório comercial copiável no `client-admin.html`, juntando resumo, prioridades, insights e próximo movimento recomendado.
- Fecho do ciclo Painel do negócio realmente comercial com plano de ação diário copiável no `client-admin.html`, transformando métricas em próximos passos claros para o dono do negócio.
- Countdown Backoffice configurável pelo cliente iniciado com configuração operacional visível no `client-admin.html`: serviços, equipa, regras e cópia da configuração atual.
- Backoffice configurável com editor JSON provisório no `client-admin.html`, permitindo carregar e guardar `bookingConfig` através de `/api/booking-config` antes da UI visual final.
- Backoffice configurável com validação de configuração antes de guardar: serviços, durações, equipa, associações, slots e janela de marcação.
- Fecho do ciclo Backoffice configurável pelo cliente com ações rápidas no `client-admin.html` para adicionar serviços e profissionais ao editor, validar e guardar configuração.
- Countdown Notificações reais email/WhatsApp iniciado com `lib/notificationProviders.js`, `/api/notifications/readiness` e `/api/notifications/preview`, criando contrato de providers, readiness e preview dry-run de mensagens/jobs.
- Notificações com fila local em `output/_notifications`, endpoints `/api/notifications/queue` GET/POST, jobs persistidos por canal/estado e resumo por status/canal.
- Fecho do ciclo Notificações reais email/WhatsApp com `/api/notifications/process`, processando fila em modo dry-run/manual, histórico por job e handoff para deploy/staging antes de envio real.
- Countdown Deploy/staging online vendável iniciado com `lib/deployStagingSellable.js` e `/api/saas/deploy-sellable`, cruzando launch pack, staging, provider, notificações e demos para decidir venda assistida vs bloqueios.
- Deploy/staging vendável com `publishPack`: demo principal, URLs esperadas, envs em falta, comandos de validação, QA ponta a ponta e decisão go/no-go para paid pilots.
- Fecho do ciclo Deploy/staging online vendável com `/api/saas/deploy-handoff`, resumindo artefactos prontos, bloqueios, QA, envs e handoff para restaurantes/reservas.
- Countdown Restaurantes/reservas de mesas iniciado com `lib/restaurantReservations.js`, `/api/restaurant-availability` e `/api/restaurant-handoff`, modelando turnos, mesas, lotação, duração de estadia e disponibilidade por número de pessoas.
- Reservas de restaurante evoluídas com `/api/restaurant-operations` e `/api/restaurant-operations-handoff`, criando leitura diária de sala, pressão por tamanho de grupo, conflitos de pendentes, fila de ação e mensagens para alternativa/lista de espera.
- Gerador ligado ao módulo de restaurantes: `writeSite` grava `restaurantConfig` normalizado no manifest, `clientProfile` expõe resumo de mesas/lotação e `/api/client-sites` mostra reservas de restaurante, mesas e lugares.
- Sites/LPs de restaurante passam a gerar `restaurant-admin.html`, uma primeira área visual para o negócio ver lotação, mesas, pressão por tamanho de grupo, fila de ação e mensagens rápidas.
- Ideia registada para fase avançada de restaurantes: `menuCatalog` e pré-encomenda opcional na reserva, permitindo escolher menu/pratos, alergénios e notas antes da visita.
- Rota local segura `/output/...` adicionada para abrir páginas geradas, incluindo `restaurant-admin.html`, diretamente no servidor do gerador.
- Countdown Gerador sites/LPs premium estilo Lovable iniciado com `lib/landingCreative.js`, adicionando direção criativa por estilo, classes visuais, regras de qualidade e mood de imagem ao manifest/image-plan.
- Landing premium ganhou composições estruturais por estilo (`editorial-sparse`, `campaign-stack`, `trust-sequence`, `visual-transformation`, etc.), agrupando e ordenando blocos de forma diferente em vez de apenas trocar cores.
- Landing premium ganhou módulos visuais novos: `editorial-statement`, `metric-strip` e `experience-grid`, usados por estilo para aumentar perceção editorial, prova e qualidade visual.
- Primeira dobra premium melhorada: heroes de landing recebem `hero-premium`, `data-hero-treatment`, `data-hero-composition`, altura full-screen e tratamentos CSS específicos por direção criativa.
- Auditoria local de qualidade das LPs em `lib/landingQuality.js`: cada landing grava `landingQuality` no manifest e no `image-plan.json`, com score, checks, blockers e warnings para hero premium, direção criativa, módulos, conversão, imagens e prompts de IA.
- Countdown Motor de Diversidade Visual Premium iniciado com `lib/visualDirections.js`: sites e LPs passam a receber uma direção visual independente do layout (`boutique-minimal`, `editorial-dark`, `warm-local`, `clean-clinical`, `bold-campaign`, `magazine-grid`, `premium-service`, `sensory-restaurant`), classes anti-clone, assinatura visual e regras de qualidade no manifest.
- Motor anti-clone passou a controlar também a composição dos sites normais: cada direção visual define `siteComposition` e `sectionOrder`, o HTML grava `data-visual-composition` e o manifest grava `visualComposition`, reduzindo a sensação de páginas com a mesma narrativa.
- Auditoria de diversidade visual adicionada em `lib/visualDiversityAudit.js`: cada site/LP grava `visualDiversity` no manifest com score, checks, sinais visuais, ordem de secções e explicação comercial da diferença.
- Relatório de diversidade visual exposto em `/api/visual-diversity` e botão "Auditar diversidade" na UI local, resumindo assinaturas, direções, composições, repetições e explicação comercial por site gerado.
- UI do gerador ganhou seletor de `Direção visual`, permitindo forçar uma direção anti-clone específica em vez de depender sempre do Auto.
- Brief criativo AI por site/LP em `lib/creativeBrief.js`, gravado em `creative-brief.json` e no manifest, juntando direção visual, paleta, tipografia recomendada, logo/fallback, prompts de imagem, slots, blocos e próximos passos para ligar upload/logo/imagens AI.
- `image-plan.json` das landing pages passa a receber um resumo do brief criativo, mantendo o dry-run de imagens e preparando geração OpenAI sem exigir API key no fluxo normal.
- UI local ganhou botão "Brief criativo AI" e endpoint `/api/creative-brief`, permitindo ver/copiar o plano criativo de um site gerado.
- Análise local de logotipo PNG em `lib/logoAnalysis.js`: o gerador extrai paleta dominante, sugere cor primária/secundária, grava a análise no brief criativo e mostra swatches na UI do "Brief criativo AI".
- Harmonia de marca em `lib/colorHarmony.js`: o brief criativo valida contraste, saturação, texto ideal sobre cor, variantes suaves e decisão `autoApply` para usar ou apenas rever a paleta extraída do logotipo.
- Receita de tema adicionada à harmonia de marca: tokens CSS (`--brand-*`) e zonas de aplicação para header, hero, CTA, cards e microinterações, preparando aplicação automática futura sem alterar já o visual por defeito.
- Cada site/LP passa a gravar `brand-theme.json` e `brand-theme.css` opcionais no `output`, além do `brandTheme` no manifest e no `image-plan.json`, permitindo preview/aplicação futura da paleta sem mudar automaticamente o site gerado.
- Cada site/LP passa também a gravar `brand-preview.html`, uma cópia visual opcional que importa `brand-theme.css` e aplica a classe `brand-theme-preview`, permitindo comparar a versão normal com a versão de marca antes de aplicar automaticamente.
- `brand-theme.css` ganhou tratamentos visuais mais fortes para preview: header branded, hero overlay com acento, CTA com sombra, cartões premium, badges/eyebrows, conversion band, estados hover e foco acessível.
- Pack de demo na UI passa a expor links diretos para abrir site, abrir `brand-preview.html` e abrir painel do cliente, além de copiar os caminhos, tornando a comparação visual mais acessível no fluxo comercial.
- Cada site/LP passa a gerar `brand-compare.html`, uma página estática com `index.html` e `brand-preview.html` lado a lado em iframes; o Pack de Demo ganhou o botão "Comparar".
- `brand-compare.html` ganhou contexto comercial visual: swatches da paleta, decisão de aplicação, modo do header e alternador Desktop/Mobile para comparar rapidamente a versão normal e a versão com tema de marca.
- UI do gerador ganhou opção `Tema de marca`: `Gerar preview seguro` mantém `index.html` intacto; `Aplicar ao site final` importa `brand-theme.css` e ativa o tema no próprio `index.html`, mantendo `brand-preview.html` e `brand-compare.html`.
- Resultado da geração na UI passa a mostrar imediatamente links para abrir o site, abrir o preview de marca, comparar versões e localizar `creative-brief.json`/`brand-theme.json`, além de indicar se o tema foi aplicado ao `index.html`.
- Fecho do Motor AI Criativo com `creative-readiness.json`: cada site/LP passa a gravar score, checks, blockers, warnings e resumo comercial sobre direção visual, tema de marca e plano de imagens; a API/UI de geração também mostram este readiness.
- Countdown QA visual e venda assistida iniciado: UI ganhou "Modo comercial rápido" para escolher Site premium, Landing, Site+Marcações, Landing+Marcações ou Restaurante+Reservas e preencher automaticamente opções principais sem remover os controlos avançados.
- Resultado da geração passa também a expor links diretos para `client-admin.html` e `booking-manage.html` quando esses ficheiros existem, aproximando o fluxo de demo comercial: site, marca, comparação, painel e gestão do cliente final.
- Marcações passaram a ter opção de apresentação `integrated`/`modal`/`dedicated` na UI. O modo modal move o formulário local de marcações para dentro de `bookingModal` no site gerado, mantendo o modo integrado compatível.
- Cada site/LP passa a gerar `sales-handoff.html`, uma página de demo comercial com roteiro de apresentação, ações para site/comparação/painel/gestão do cliente final, readiness criativo, alertas e resumo de venda.
- Fecho do countdown QA visual e venda assistida: a UI e a página de demo comercial mostram o workflow idealizado `Prospecção -> Demo site/LP -> Proposta PDF + QR -> Módulo ativo -> Publicar em 1 dia`, e a linguagem passou de "handoff" para "página de demo".
- CRM de propostas separado em `uneed-crm-propostas/`; não interfere com o gerador principal.

## Estado comercial realista

Ainda não está pronto como SaaS vendável em escala. Está num MVP local/protótipo operacional forte, agora orientado para Skeduall/UNEED Agenda:

- Bom para demos internas e testes controlados.
- Ainda falta autenticação real por cliente.
- Ainda falta persistência/BD multi-tenant em produção.
- Ainda falta notificações reais por email/WhatsApp.
- Ainda falta painel de disponibilidade editável pelo cliente.
- Ainda falta UX mais premium para booking completo.

## Countdown macro do produto

Esta é a lista estratégica principal. Os countdowns técnicos intermédios vivem dentro destes blocos, sem substituir a visão macro.

1. Operações de marcação e disponibilidade vendável: concluído como MVP local forte.
2. UX premium do cliente final: concluído como primeira versão premium.
3. Painel do negócio realmente comercial: concluído como primeira versão comercial.
4. Notificações reais email/WhatsApp: concluído como ciclo dry-run operacional.
5. Deploy/staging online vendável: concluído como plano de execução staging/piloto.
6. Restaurantes/reservas de mesas: concluído como MVP base.
7. Gerador de sites/LPs mais premium, estilo Lovable: concluído como primeira camada premium com estilos, composições, módulos visuais, hero premium e auditoria de qualidade.
8. Motor de Diversidade Visual Premium: concluído como primeira camada anti-clone e AI-ready.
9. Motor AI Criativo: imagens, logo, paleta e direção visual: concluído como camada AI-ready inicial.
10. QA visual e venda assistida ponta a ponta: concluído como camada de clareza comercial/local.

## Countdown técnico atual

Countdown Staging SaaS: concluído.

Countdown Provider SaaS real: concluído.

Countdown Repository real: concluído.

Countdown Auth real e áreas de cliente: concluído.

Countdown Operações de marcação e disponibilidade vendável: concluído.

Countdown UX premium do cliente final: concluído.

Countdown Painel do negócio realmente comercial: concluído.

Countdown Backoffice configurável pelo cliente: concluído como sub-bloco provisório.

Countdown Notificações reais email/WhatsApp: concluído como ciclo dry-run operacional.

Countdown Deploy/staging online vendável: concluído como plano de execução staging/piloto.

Countdown Restaurantes/reservas de mesas: concluído como MVP base.

Countdown Gerador de sites/LPs premium estilo Lovable: concluído como primeira camada premium.

Próximo countdown recomendado: QA visual e venda assistida ponta a ponta: estimativa 60 passos.

Countdown Motor de Diversidade Visual Premium: concluído.

Countdown Motor AI Criativo: imagens, logo, paleta e direção visual: concluído.

Countdown QA visual e venda assistida ponta a ponta: concluído.

Countdown Gerador friendly user + edição/branding avançado: concluído como primeira camada friendly. Tem modo Essencial/Avançado, guia rápido em 5 passos, cartões de decisão, checklist pronto para demo, ações de geração claras, resumo comercial pós-geração, ficha rápida da demo e menos ruído operacional no modo Essencial.

Faltam neste countdown: 0 passos.

Countdown Builder Pilates UX / AI-first: concluído como primeira passagem. O fluxo principal fica em Cliente -> Tipologia -> Marca -> Prompt -> Módulo -> Criar, o botão nobre passa a ser "Criar site com AI", demo local/dry-run/sandboxes ficam em opções técnicas, projetos existentes aparecem como mosaico no palco grande e o upload de logo em data URL passa a ser respeitado na geração local.

Faltam neste countdown: 0 passos.

Countdown Entrega vendável assistida: iniciado. Foi criado `lib/deliveryPack.js` e `/api/delivery-pack`, dando a cada projeto um pack de entrega com checklist de site, manifest, branding, brief criativo, módulo operacional, painéis, gestão do cliente final, página comercial e plano de publicação. O botão "Publicar" no Builder passa a mostrar este pack em vez de apenas indicar que fica para depois.

Pack de entrega ganhou versão Markdown descarregável em `/api/delivery-pack.md?site_id=...`, com veredito, checklist técnico, bloqueadores, links locais, ficheiros, plano de publicação e QA antes de entregar ao cliente.

Pack de entrega ganhou checklist de ativação persistente por projeto em `output/{site}/delivery-activation.json`, endpoint `/api/delivery-activation` e controlos no Builder para marcar/guardar passos como domínio, branding, formulários, marcações, notificações, QA e entrega final.

Pack de entrega ganhou `delivery-publish-manifest.json`, gerado pelo `/api/delivery-pack`, classificando ficheiros do projeto entre `public-site`, `operational`, `server-form`, `internal` e `review`, com totais, warnings e link direto no Builder para reduzir risco na publicação.

Pack de entrega ganhou ZIP de publicação em `/api/delivery-zip?site_id=...`, gerado sem dependências externas por `lib/deliveryZip.js`, incluindo apenas ficheiros publicáveis e `UNEED-PUBLISH-MANIFEST.json`. O Builder mostra o botão "ZIP entrega".

Pack de entrega ganhou ficha de publicação persistente em `output/{site}/delivery-settings.json`, endpoint `/api/delivery-settings` e campos no Builder para domínio, URL pública, alojamento e email profissional. Estes dados também entram no Markdown e no pack de entrega.

Pack de entrega ganhou estado Go Live (`delivery-go-live@1`), cruzando dados de publicação, checklist de ativação, ficheiros publicáveis, bloqueadores técnicos e validação operacional. O Builder mostra o estado, score e próxima ação antes de publicar.

Go Live ganhou fase operacional e roteiro por etapas: preparar publicação, preparar ficheiros, validar em produção, validar módulo operacional e entregar ao cliente. Isto transforma o pack num plano de execução mais claro antes de pôr um cliente online.

Pack de entrega ganhou `clientHandoff`, com resumo comercial, mensagem de entrega, links para cliente, links internos e pendentes. O Builder passa a mostrar esse handoff para separar o que é apresentável ao cliente do que continua interno.

Pack de entrega ganhou `deliveryDecision`, uma decisão comercial curta com estado, etiqueta, promessa segura, próxima ação e flags para saber se pode ser mostrado em prospeção, publicado como final ou faturado como setup assistido.

Faltam neste countdown: 0 passos.

Countdown Entrega vendável assistida: concluído como primeira camada operacional. O gerador já consegue produzir um pack que separa demo assistida, publicação, ZIP, manifest, checklist, Go Live, handoff e decisão comercial.

Este número é simbólico para dar visibilidade ao progresso. Pode ser revisto se o escopo crescer.

## Próximos focos prováveis

1. Criar projeto Supabase staging e aplicar a migração inicial.
2. Ligar API a Supabase com fallback local.
3. Implementar convites/magic link em staging.
4. Migrar tenants/sites/bookings locais para staging.
5. Ligar email transacional em modo teste.
6. Publicar API/portal staging.
7. Validar demo online ponta a ponta.
8. Depois avançar para WhatsApp, pagamentos e restaurantes.
9. Fechar entrega vendável assistida: publicação simples, QA ponta a ponta, notificações reais mínimas e checklist de ativação por cliente.
10. Depois: edição pós-AI com prompt por secção, guardar versões e menos ruído técnico no Builder.
9. Simplificar o gerador em fluxos guiados sem perder controlo avançado.
10. Melhorar upload/branding/logos e edição visual assistida.

## Próximo countdown recomendado

Branding assistido e assets do cliente: estimativa 70 passos.

Objetivo: upload/configuração de logos, leitura de paleta, preview de marca mais controlável, aplicação segura ao site final e preparação para imagens AI por cliente.

Countdown Branding assistido e assets do cliente: concluído. Já tem campos de logo principal/claro por caminho local, payload/API preparados, cópia segura para assets/logo.png e assets/logo-light.png mantendo fallback para logos da raiz, validação visual dos logos no gerador, recomendações de uso de marca, resumo pós-geração da origem do branding/paleta, swatches, ação para copiar cores sugeridas para o formulário, escolha segura entre preview/aplicar tema e checklist visual para validar logos, cores e aplicação antes de gerar a demo.

Faltam neste countdown: 0 passos.

## Próximo countdown recomendado

Imagens AI e biblioteca visual por cliente: estimativa 80 passos.

Objetivo: integrar melhor a preparação para imagens por nicho/cliente, evitar repetição visual, criar plano de assets por página, ligar prompts comerciais ao contexto do negócio e deixar a base pronta para usar API de geração de imagens quando a chave estiver configurada.

Countdown Imagens AI e biblioteca visual por cliente: concluído. Já existe o contrato `image-plan@2`, com biblioteca visual por cliente, regras anti-repetição, política segura dry-run, contexto de marca/cliente e planos de imagem também para sites normais, não apenas landing pages. As LPs continuam com slots de hero/antes/depois/oferta/prova, mas agora ficam dentro do mesmo contrato visual preparado para geração AI futura. O resultado pós-geração no gerador mostra agora a biblioteca visual, slots selecionáveis, caminho do `image-plan.json` e ações de validação/geração também para sites normais. O plano inclui auditoria `image-plan-audit@1`, com score, checks e avisos sobre repetição de destinos, hero reutilizada, variedade de papéis/racios e profundidade dos prompts. Também inclui handoff visual `image-handoff@1`, com resumo, passos operacionais e prompt pack exportável por slot para usar antes/depois da integração OpenAI. Cada site/LP gerado cria `image-handoff.html`, uma página legível com auditoria, passos e prompts por imagem. O dry-run/relatório `image-plan.generated.json` inclui planVersion, audit, handoff, slots selecionados e próximos passos. O contrato visual inclui `providerConfig` com provider, modelo, qualidade, formato, variáveis de ambiente e estado da API key. O plano inclui ainda `image-readiness@1`, com status simples para saber se está pronto para preview, geração real ou revisão.

Faltam neste countdown: 0 passos.

## Próximo countdown recomendado

Gerador friendly user e UX comercial: estimativa 70 passos.

Objetivo: reduzir a sensação de cockpit, transformar o gerador em fluxo guiado por objetivo comercial, mostrar previews/atalhos certos, esconder complexidade técnica e tornar o processo “prospectar -> gerar demo -> validar -> vender” muito mais claro.

Countdown Gerador friendly user e UX comercial: concluído. Já tem barra "Fluxo comercial" no topo do modo essencial, com progresso vivo por cliente, oferta, marca, módulo e demo. Esta camada deixa o caminho comercial mais visível sem remover controlos avançados. As decisões rápidas mostram também uma recomendação comercial viva, com oferta, cliente ideal, CTA e argumento de venda para reduzir abstração antes de gerar a demo. A barra passou também a mostrar a próxima ação recomendada, com botão para saltar diretamente para a secção certa. O modo essencial ganhou ainda um "Resumo da demo" vivo antes do checklist, com cliente, oferta, nicho, módulo, CTA, visual e cores. Depois do feedback visual, o Builder foi reorientado para preview-first real: a área direita deixou de mostrar um painel comercial abstrato e passou a mostrar uma maquete de site viva com header, hero, CTA, visual e cards, alimentada por nome, nicho, modelo, módulo, copy e cores. A sidebar azul passou a abrir apenas um painel de comando de cada vez, evitando o scroll infinito e escondendo a complexidade técnica. Foram também adicionados inputs de upload local de logo para preview e extração simples de paleta por imagem, preparando a experiência de branding assistido. Fecho do countdown: o topo redundante da área principal foi escondido para a direita ficar dedicada à pré-visualização, a sidebar ganhou atalho direto para "Modelos feitos" e cada painel passou a ter navegação progressiva "Voltar/Seguinte", deixando a experiência mais sequencial e menos cockpit.

Faltam neste countdown: 0 passos.

Próximo countdown recomendado: Preview real e edição visual pós-geração: estimativa 60 passos. Objetivo: aproximar a maquete viva do site final, carregar automaticamente o iframe real sempre que possível, preparar edição visual por blocos e reduzir a distância entre "o que vejo" e "o que sai no output".

Countdown Preview real e edição visual pós-geração: iniciado. Primeiro bloco concluído: depois de gerar uma demo, o iframe do Builder passou a preferir o site/LP real (`siteUrl`) em vez da página comercial de handoff, mantendo `brandPreviewUrl` e `salesHandoffUrl` como fallback. A área de preview ganhou também a ação "Ver maquete", permitindo voltar à pré-visualização viva sem perder o fluxo. Segundo bloco concluído: o painel "Finalizar" passou a mostrar botões de alternância de preview quando a demo é gerada, permitindo trocar diretamente entre Site real, Preview de marca, Página comercial, Comparar marca e Painel negócio sem procurar os links no resultado técnico.

Countdown Preview real e edição visual pós-geração: 20/60 feitos.
Faltam neste countdown: 40 passos.

Nova direção estratégica aprovada: Lovable vertical UNEED para negócios locais. O gerador deixa de depender apenas de combinações manuais de secções e passa a evoluir para um orquestrador AI: AI cria a montra visual/copy/imagens, UNEED controla operação, marcações, reservas, dados, validações, painéis e deploy/export.

Countdown AI Prompt Engine UNEED: concluído. Primeiro bloco concluído: criado `lib/aiBriefBuilder.js`, gerando o contrato `ai-brief-builder@1` com estratégia `lovable-vertical-controlled`, princípio "AI creates the storefront. UNEED controls the operation.", guardrails por módulo e prompt mestre estruturado. Cada site/LP gerado passa a criar `ai-brief.json` e `ai-master-prompt.md`, e o manifest guarda `aiBrief`. O servidor também devolve resumo do AI brief e caminhos para os ficheiros. Teste dedicado `test-ai-brief-builder.js` garante que marcações/restaurantes ficam controlados pela UNEED e que a AI recebe apenas permissão para montra visual e slot de integração. Segundo bloco concluído: o resumo pós-geração da UI passou a mostrar uma caixa "Prompt AI UNEED preparado", com estratégia, módulo controlado pela UNEED, número de guardrails e ações para abrir/copiar o prompt mestre/AI brief. Terceiro bloco concluído: criado endpoint `/api/ai-brief/preview` para preparar o prompt AI antes de gerar a demo, usando as escolhas atuais da sidebar sem escrever ficheiros. O Builder ganhou o botão "Preparar prompt AI", resumo lateral do módulo/guardrails e ação para copiar o prompt mestre antes da geração. Quarto bloco concluído: criada a camada `lib/aiPromptProfiles.js` com perfis criativos reutilizáveis (`auto`, `premium-local`, `boutique-editorial`, `clinical-trust`, `sensory-restaurant`, `campaign-direct`). O AI brief passou a incluir `aiProfile`, regras visuais/conversão por perfil e uma `QUALITY BAR` explícita no prompt mestre. A sidebar ganhou seletor "Direção AI" e os fluxos comerciais/receitas de arranque passam a escolher perfis adequados ao nicho/módulo. Quinto bloco concluído: o AI brief passou a gerar também `aiGenerationRequest` com contrato `ai-generation-request@1`, modo recomendado, formato esperado, ficheiros esperados (`index.html`, `styles.css`, `script.js`, `image-plan.json`, `integration-notes.md`), schema lógico, mount points UNEED e regras de importação. Cada output passa a escrever `ai-generation-request.json`, o servidor devolve links para esse pedido e a UI mostra/abre/copia o pedido AI preparado. Sexto bloco concluído: criado `lib/aiResponseValidator.js` com contrato `ai-response-validation@1`, capaz de validar respostas AI antes de importar: ficheiros obrigatórios, referências CSS/JS, mount points UNEED, ausência de lógica operacional falsa, plano de imagens válido e JS progressivo pequeno. O servidor ganhou o endpoint `/api/ai-response/validate` para validar uma resposta AI contra o pedido estruturado antes de escrever qualquer ficheiro final. Sétimo bloco concluído: criado `lib/aiImportSandbox.js` com contrato `ai-import-sandbox@1`, preparando respostas AI validadas numa pasta isolada em `output/_ai-imports/{site}/{importId}`. O endpoint `/api/ai-import/sandbox` valida primeiro, bloqueia respostas inválidas e só depois escreve ficheiros sandbox + `ai-import-report.json`, deixando uma pré-visualização segura sem tocar no site final. Oitavo bloco concluído: criado `lib/aiPipelineHandoff.js` com contrato `ai-pipeline-handoff@1`, reunindo estado do pipeline, readiness para configurar/chamar OpenAI, contratos ativos, fluxo seguro e próximas ações. O servidor ganhou `/api/ai-pipeline/handoff`, permitindo saber se a ponte AI está pronta, se falta `OPENAI_API_KEY` ou se falta alguma fundação.

Countdown AI Prompt Engine UNEED: 80/80 feitos.
Countdown concluído.

Próximos countdowns recomendados:
- Integração OpenAI real e importação assistida: 60 passos.
- UX Builder simplificada e preview-first premium: 80 passos.
- Promoção sandbox -> site final com revisão visual: 50 passos.
- Sistema de marcações vendável, operação e notificações reais: 80 passos.

Countdown Integração OpenAI real e importação assistida: iniciado. Primeiro bloco concluído: criado `lib/openaiGenerationAdapter.js` com contrato `openai-generation-adapter@1`, readiness por `OPENAI_API_KEY`, modelo configurável por `OPENAI_SITE_MODEL`, payload estruturado para Responses API, schema JSON esperado para site estático, parser de resposta OpenAI, modo `dryRun` por defeito e bloqueio seguro quando não há chave. O servidor ganhou `/api/ai-generate/openai/readiness` e `POST /api/ai-generate/openai`, que prepara payload sem gastar créditos em dry-run e, quando a geração real for autorizada, valida resposta e pode preparar sandbox. Teste dedicado `test-openai-generation-adapter.js` cobre readiness, payload, dry-run, bloqueio sem chave, parser e chamada mock com autorização. Segundo bloco concluído: o painel Finalizar do Builder ganhou o botão "Testar OpenAI", que prepara primeiro o AI brief com as escolhas atuais e depois chama `/api/ai-generate/openai` em `dry_run`, mostrando modelo, readiness da API, ficheiros esperados, mount points e estado da `OPENAI_API_KEY`, sem gastar créditos. Terceiro bloco concluído: adicionado botão "Gerar com OpenAI" com travão explícito. A UI faz sempre dry-run primeiro, bloqueia se faltar `OPENAI_API_KEY`, pede confirmação browser antes de gastar créditos e só então envia `dry_run:false`, `confirm_real_generation:true` e `prepare_sandbox:true`. O servidor também rejeita qualquer chamada real sem `confirm_real_generation=true`, devolvendo `confirmation-required`. Quarto bloco concluído: quando a geração real OpenAI devolve sandbox, o servidor passa a devolver também `sandbox.previewUrl` e `sandbox.reportUrl`; a UI mostra ações para abrir preview/relatório e carrega automaticamente o preview AI no iframe do Builder, marcando o projeto como "Sandbox AI pronta". Isto fecha o ciclo resposta AI -> validação -> sandbox -> preview visual, ainda sem promover para site final. Quinto bloco concluído: `lib/aiImportSandbox.js` passou a listar sandboxes existentes por site/limite. O servidor ganhou `/api/ai-imports` e o Builder ganhou "Ver sandboxes AI", mostrando versões preparadas, score, data, estado de validação e botão para carregar qualquer sandbox anterior no iframe com links de preview/relatório. Sexto bloco concluído: `/api/ai-imports` passou a devolver também `items` como alias compatível de `imports`, reduzindo ambiguidades entre testes, integrações futuras e UI.

Countdown Integração OpenAI real e importação assistida: 60/60 feitos.
Faltam neste countdown: 0 passos.

Nova direção aprovada: criar uma camada Builder UNEED por cima do motor atual, inspirada na linha gráfica do CRM UNEED, com sidebar de comandos à esquerda, preview vivo à direita, projetos novos/existentes, tipologias de site, etapas progressivas, biblioteca por nicho e módulos ativáveis como peças Lego.

Countdown Nova UX Builder UNEED: concluído como fundação. A primeira shell visual já existe sem remover o gerador antigo: sidebar escura UNEED, botões Novo projeto e Ver projetos existentes, seleção de Landing page / Site one-scroll / Site multi-page, lista de etapas, área principal clara, painel de preview à direita e comutador desktop/mobile. Depois de gerar uma demo, o preview carrega automaticamente o site/página de demo no iframe. A sidebar passou a mostrar um cartão vivo do projeto atual com cliente, tipologia, nicho, módulo e estado. O painel de preview vazio deixou de ser genérico e mostra agora um resumo vivo antes da geração, com nicho, módulo, visual, CTA, cores e tipo de site. A navegação lateral ganhou etapa ativa e "Ver projetos existentes" abre um painel próprio com seletor de projetos baseado nos sites já gerados, preparando a edição/continuação de clientes sem expor logo o backoffice técnico. O topo interno do painel deixou de parecer o gerador antigo e passou a ter cabeçalho Builder com título vivo, subtítulo comercial, progresso e grelha de etapas Cliente/Marca/Header/Hero/Contacto/Módulo/Preview/Export. A grelha de etapas passou a ser clicável, com botão "Ir para etapa" que salta para a próxima configuração em falta. O Builder passou a abrir em modo preview-first: a área principal mostra só a pré-visualização e o bloco antigo fica escondido atrás do modo "Editar", mantendo compatibilidade enquanto os comandos são migrados para a sidebar. A sidebar ganhou o primeiro comando real de projeto: cartão Cliente com nome, cidade e nicho, sincronizado com os campos internos existentes e com o payload do motor. A sidebar ganhou também o bloco Oferta, com Site premium, Landing page, Site + marcações e Restaurante, ligado aos fluxos comerciais existentes. A sidebar ganhou o bloco Marca, com cores principal/secundária, color pickers e caminhos para logo principal/logo claro, sincronizados com branding interno. A sidebar ganhou o bloco Módulo, com Sem módulo, Marcações e Reservas, ligado aos fluxos existentes de booking/restaurante. A sidebar ganhou também comandos reais de Header e Hero: presets rápidos, posição/sticky/CTA, altura e imagem do hero, todos sincronizados com os campos internos antigos. O fecho do countdown trouxe Contacto e Finalizar para a sidebar, com telefone/email/WhatsApp, guardar projeto, gerar demo e estado lateral do preview.

Countdown Nova UX Builder UNEED: 120/120 feitos.
Faltam neste countdown Builder: 0 passos.

Countdown Editor visual premium e biblioteca de arranque: concluído. Objetivo: tornar o Builder mais friendly user, organizar comandos por etapas progressivas, melhorar bibliotecas por nicho, preview/edição, diversidade visual e preparação para edição de textos/secções sem expor a complexidade técnica. Primeiro bloco concluído: a sidebar ganhou uma biblioteca de arranque com receitas "Salão premium", "Clínica agenda", "Restaurante" e "LP campanha", aplicando automaticamente oferta, nicho, módulo, direção visual, header, hero e preset de marcações quando faz sentido. Segundo bloco concluído: a biblioteca ganhou uma ficha viva de receita, com descrição e tags, para explicar o que cada arranque prepara antes de gerar a demo. Terceiro bloco concluído: a receita selecionada passou a ficar guardada no estado do Builder e aparece no cartão do projeto e no preview vivo, mantendo a intenção inicial visível durante os ajustes. Quarto bloco concluído: a biblioteca ganhou filtros por intenção ("Todos", "Marcações", "Restaurantes" e "Leads"), preparando crescimento para muitos exemplos por nicho sem sobrecarregar a sidebar. Quinto bloco concluído: a biblioteca passou a mostrar uma contagem/estado dinâmico por filtro, tornando claro quantas receitas estão disponíveis em cada intenção. Sexto bloco concluído: cada receita passou a ter metadados de nicho, e o estado da biblioteca indica quantas receitas visíveis estão alinhadas com o nicho atual. Sétimo bloco concluído: receitas alinhadas com o nicho atual passaram a receber destaque visual de recomendação, sem bloquear escolhas livres. Fecho do countdown: o preview vivo passou a mostrar a estratégia/descrição da receita escolhida, ou uma estratégia livre quando ainda não há receita.

Countdown Editor visual premium e biblioteca de arranque: 80/80 feitos.
Faltam neste countdown: 0 passos.

Próximo countdown recomendado: Edição visual de textos e secções: 80 passos. Objetivo: permitir editar copy base, blocos e ordem de secções de forma progressiva no Builder, preparando drag/drop e personalização fina sem expor o formulário técnico.

Countdown Edição visual de textos e secções: concluído. A sidebar ganhou o cartão "Secções", com controlo visual inicial para layout de Serviços, layout Sobre e contexto/copy da página, todos sincronizados com os campos internos existentes. A grelha de progresso do Builder passou a tratar "Secções" como etapa própria. O cartão "Secções" ganhou presets rápidos de estrutura ("Confiança", "Conversão" e "Editorial"), aplicando combinações coerentes de Serviços, Sobre e Contacto sem expor controlos técnicos. Os presets de secções ganharam uma ficha de preview/explicação com descrição e tags, para mostrar a intenção narrativa de cada estrutura antes de aplicar. O Builder ganhou campos de headline e subheadline sugeridas, que alimentam o contexto/copy (`landingPrompt`) e ficam preparados para integração futura no rendering real sem quebrar templates. Headline e subheadline sugeridas passaram a aparecer também no preview vivo do Builder, permitindo validar a direção textual antes de gerar. Headline e subheadline passaram também a seguir no payload como `copyHeadline` e `copySubheadline`, criando um contrato explícito para uso direto pelo motor. O hero gerado passou a usar diretamente `copyHeadline` e `copySubheadline`, com escape de HTML, para que o texto editado no Builder apareça no site/LP final. Fecho do countdown: `copyHeadline` e `copySubheadline` passam também pelo `ui-server.js`, pelo CLI `generate.js`/`lib/args.js` e ficam guardados no `manifest.json`, garantindo continuidade entre UI, geração, output e edição futura.

Countdown Edição visual de textos e secções: 80/80 feitos.
Faltam neste countdown: 0 passos.

Countdown Builder ultra simples e preview real do site: iniciado. Primeiro bloco concluído: a área direita deixou de parecer um painel de gestão e passou a funcionar como viewport limpa de preview, com a moldura a ocupar praticamente toda a altura útil. O título/status redundante da pré-visualização foi escondido visualmente, o seletor Desktop/Mobile ficou compacto e flutuante, e o botão "Ver maquete" só aparece quando já existe um site/sandbox real carregado. O resumo redundante de projeto na sidebar mantém os dados para o sistema, mas deixa de ocupar espaço visual.

Segundo bloco concluído: a escolha da tipologia de página passou para dentro do passo "Oferta", deixando de depender de uma secção separada na sidebar. As listas longas "Tipologia" e "Etapas" foram escondidas para reduzir scroll e ruído visual. A sidebar ganhou um indicador curto de progresso com o próximo passo essencial, mantendo orientação sem transformar a interface numa lista infinita.

Terceiro bloco concluído: o painel "Modelos feitos" passou a comportar-se mais como biblioteca comercial de arranque. Cada receita ganhou metadados de leitura rápida: ideal para, oferta sugerida, direção visual e módulo. O preview da receita mostra agora essa ficha antes de aplicar, ajudando a escolher base por nicho sem linguagem técnica. O botão "Modelos feitos" também atualiza a orientação do fluxo para guiar a escolha.

Quarto bloco concluído: a etapa "Marca" foi reorganizada para começar pelo upload do logo, com estado de leitura da marca e paleta visual em swatches. A extração de cores do logo continua local, mas agora comunica o que está a acontecer e mostra as cores principal/secundária antes dos ajustes manuais. Isto aproxima o fluxo da experiência pretendida: carregar logo -> gerar direção de marca -> afinar.

Quinto bloco concluído: a etapa "Header" ganhou uma ficha explicativa para cada preset, separando escolha visual de afinação técnica. O preview vivo do Builder passou também a refletir melhor os presets principais: overlay sobre hero, logo ao centro e minimal/sem CTA. Isto torna a decisão do primeiro impacto mais visual antes de gerar o site real.

Sexto bloco concluído: a etapa "Hero" passou a explicar cada direção criativa de primeira dobra, deixando de parecer apenas seleção técnica de `hero-a/b/c/d`. O preview vivo reage agora aos estilos Direto, Editorial, Premium e Claro, alterando composição, ambiente e hierarquia visual antes de gerar o site real.

Sétimo bloco concluído: a etapa "Secções" foi reorientada para narrativa da página. Os presets Confiança, Conversão e Editorial ganharam fichas com intenção por bloco, e o preview vivo passa a mostrar esses blocos como narrativa visível. Quando não há contexto/copy escrito, a escolha da narrativa também preenche uma orientação inicial para o `landingPrompt`.

Oitavo bloco concluído: o painel "Finalizar" foi simplificado e hierarquizado. "Gerar demo local" passou a ser a ação principal, enquanto prompt AI, teste OpenAI, geração real OpenAI, sandboxes e preparação de entrega ganharam descrições claras. Ao abrir o painel final, o Builder agora recomenda o próximo passo conforme já exista preview carregado ou não. Countdown fechado.

Countdown Builder ultra simples e preview real do site: 80/80 feitos.
Faltam neste countdown: 0 passos.

Próximo countdown recomendado: Promoção sandbox AI -> site final com revisão visual: 50 passos. Objetivo: transformar uma sandbox AI validada em site final de cliente, com etapa de revisão, preservação de módulos UNEED e export seguro.

Countdown Builder Pilates UX: iniciado. Primeiro bloco concluído: a etapa inicial deixou de mostrar escolhas repetidas de "tipo de página" e "produto comercial". O Builder principal passa a pedir apenas Tipologia (`Landing page`, `Site one-scroll`, `Site multi-page`) e Estilo de site (`Premium`, `Clássico humano`, `Técnico/confiança`, `Boutique`, `Sensorial`, `Conversão direta`). O produto comercial continua a existir internamente para compatibilidade, mas é inferido automaticamente por nicho, tipologia e módulo. A UI mostra uma nota curta com o produto inferido, sem obrigar a nova decisão.

Segundo bloco concluído: o caminho principal do Builder foi encurtado para Cliente -> Tipologia/Estilo -> Marca -> Prompt editável -> Módulo -> Criar. Header, hero, contacto e modelos continuam no sistema, mas deixam de ser passos obrigatórios no "Seguinte". A antiga etapa Secções passou a chamar-se "Prompt editável", com o prompt grande antes das afinações opcionais.

Terceiro bloco concluído: o Builder passou a gerar automaticamente um prompt editável a partir de nome, cidade, nicho, tipologia, estilo, produto inferido, narrativa e módulo. O prompt só é atualizado enquanto ainda for automático; se o utilizador escrever manualmente, o Builder respeita e deixa de o substituir. A escolha de narrativa também passa a alimentar esse prompt automático quando ele ainda não foi editado à mão.

Quarto bloco concluído: depois de gerar uma demo, o Builder passa a mostrar uma camada simples com 6 ações principais: Guardar, Editar, Projetos, Novo, Exportar e Publicar. A mesma lógica aparece também no resultado técnico quando visível. As ações já encaminham para edição do prompt, projetos existentes, novo projeto, export local e estado de publicação futura, mantendo os links técnicos preservados por baixo.

Quinto bloco concluído: o logo UNEED da sidebar foi centrado e reduzido para 150px. A área "Projetos existentes" ganhou um primeiro mosaico de cartões alimentado pelos manifests gerados, com nome, slug, nicho, tipo e módulo. O seletor antigo continua como fallback, mas a experiência começa a aproximar-se da biblioteca visual de projetos.

Sexto bloco concluído: corrigido o bug em que logos carregados por upload eram ignorados ao gerar demo local. O `writeSite` passa a aceitar `data:image/...` e grava o logo em `assets/logo.png`/`assets/logo-light.png`, evitando fallback para o logo UNEED. O painel Finalizar foi também simplificado: as ações AI ficam recolhidas em "Opções AI", reduzindo ruído visual no fluxo principal.

Countdown Builder Pilates UX: 60/80 feitos.
Faltam neste countdown: 20 passos.

## Comandos de teste principais

```bash
node -c lib/writeSite.js
node test-booking-config-ui.js
node test-booking-api.js
node test-booking-availability.js
node test-saas-tenants.js
node test-landing.js
node test-landing-styles.js
node test-ui-presets.js
node test-headers.js
```

## Servidor local

```bash
node ui-server.js
```

URL:

```text
http://localhost:3333/
```

## Cuidados

- Não reverter alterações não solicitadas.
- Manter compatibilidade com sites já gerados sempre que possível.
- Trabalhar em fases pequenas.
- No fim de blocos relevantes, copiar/sincronizar o projeto para o Google Drive.
- Antes de grandes alterações, validar com os testes principais.

## Countdown Builder AI-first mais simples e vendável

Iniciado depois de concluir a entrega vendável assistida. Primeiro bloco concluído: em modo Essencial, o Builder passa a mostrar apenas o fluxo principal de criação, escondendo Header/Hero como afinação avançada e removendo Opções técnicas/OpenAI dry-run/demo local do caminho normal. O contador lateral foi alinhado para 6 passos essenciais e o texto do fluxo passa a apontar para criação AI.

Segundo bloco concluído: telefone, email e WhatsApp passaram para o primeiro painel Cliente, e o painel Contacto fica escondido no modo Essencial. O passo Cliente agora só fica OK quando existe nome, nicho e pelo menos um contacto, reduzindo passos soltos sem perder informação comercial.

Terceiro bloco concluído: "Modelos feitos" foi fundido com "Tipologia e estilo". O painel essencial passa a ter base opcional, tipo de site e estilo no mesmo lugar; o painel antigo de modelos fica apenas como atalho avançado, evitando decisões duplicadas.

Quarto bloco concluído: o painel "Tipologia, estilo e base" passou a funcionar como mini-wizard em modo Essencial, mostrando uma etapa de cada vez: Base -> Tipo -> Estilo. Escolher uma base avança para Tipo; escolher o tipo avança para Estilo; escolher o estilo leva para Marca. Isto reduz o painel comprido e evita a sensação de cockpit.

Quinto bloco concluído: o painel Marca foi simplificado no modo Essencial. Mantém upload de logo, paleta e cores principais; caminhos técnicos de logo, logo claro e direção AI ficam no modo Avançado. Foi adicionado "Continuar para módulos" para manter o fluxo linear.

Sexto bloco concluído: o painel Finalizar ganhou um resumo curto de prontidão antes da ação principal, com Cliente, Marca, Módulo e Criar. O texto foi simplificado para reforçar "Criar site com AI" como caminho normal, deixando ferramentas técnicas para Avançado.

Faltam neste countdown: 0 passos.

Countdown Builder AI-first mais simples e vendável: concluído como segunda passagem UX. O modo Essencial ficou mais linear: Cliente/contacto -> Base/Tipo/Estilo -> Marca -> Módulo -> Prompt -> Criar com AI, com Header/Hero/Contacto técnico/dry-run/demo local escondidos em Avançado.

## Countdown Builder clean UX / novo projeto

Iniciado para aproximar o gerador da visão "Novo projeto -> do zero ou inspirado -> criar -> editar/exportar". Primeiro bloco concluído: o topo da sidebar ganhou um botão principal "+ Novo projeto", um botão secundário "Projetos existentes" e um painel inicial com "Criar do zero" e "Inspirar em existente". O fluxo "Criar do zero" abre o arranque limpo; "Inspirar em existente" abre a lista/mosaico de projetos para editar ou usar como referência.

Segundo bloco concluído: o estado inicial do Builder foi corrigido para não mostrar progresso nem painel Cliente antes de escolher uma ação. Projetos existentes abrem o mosaico no lado direito com botão "Editar"; "Inspirar em existente" abre o mesmo mosaico com botão "Utilizar" e prepara um novo projeto com cliente vazio e prompt reforçado para usar a estrutura do modelo escolhido.

Faltam neste countdown: 40 passos.

## Builder clean UX - segmentação inicial
- Separei o primeiro passo do fluxo: Nicho passou a ser o arranque real de Criar do zero.
- Cliente/contacto deixou de aparecer antes da tipologia e da marca.
- O progresso do fluxo deixou de contar opções técnicas automáticas como decisões do utilizador.
- Faltam neste countdown: 30 passos.

## Builder clean UX - tipologia e mood separados
- Tipologia ficou reduzida ao formato: Landing page, site one-scroll ou site multi-page.
- Mood passou para um passo próprio antes de Marca, evitando opções misturadas.
- O seletor técnico duplicado de tipologia ficou escondido no modo essencial.
- Teste no browser confirmou: Nicho 0/8, Tipologia 1/8, Mood 2/8, Marca 3/8.
- Faltam neste countdown: 20 passos.

## Builder clean UX - idiomas no fluxo
- Adicionei a etapa Idiomas entre Cliente/contacto e Módulo.
- O Builder agora permite escolher Português, PT+EN ou PT+EN+ES.
- A escolha de idiomas entra no prompt AI para orientar conteúdo, seletor e adaptação por mercado.
- Teste no browser confirmou: depois de Cliente/contacto abre Idiomas; escolher PT+EN leva para Módulo e progresso fica 6/9.
- Faltam neste countdown: 10 passos.

## Builder clean UX - tipologia limpa
- Blindagem da etapa Tipologia: só mostra Landing page, Site one-scroll e Site multi-page.
- Escondi definitivamente o bloco Modelo base opcional, filtros e produto inferido dentro desta etapa.
- Teste no browser confirmou que Tipologia já não mostra modelos nem opções duplicadas.
- Faltam neste countdown: 0 passos.

## Countdown Editor AI-first e prompt final editável
- Iniciado novo countdown para transformar o final do Builder num fluxo AI-first claro.
- Adicionei Prompt final diretamente no painel Finalizar, editável antes de criar com AI.
- O prompt final sincroniza com landingPrompt e é usado antes do pedido OpenAI.
- O botão Editar prompt agora foca o prompt final em vez de mandar para outro painel.
- Teste no browser confirmou prompt preenchido, visível no final e editável.
- Faltam neste countdown: 40 passos.

## Editor AI-first - afinação opcional simples
- Simplifiquei o painel antes do final: agora é Afinação opcional, com um único campo Pedido especial no modo essencial.
- Escondi presets de narrativa, prompt técnico e selects de secções no modo essencial.
- O Pedido especial entra automaticamente no prompt final AI.
- Teste no browser confirmou: painel mostra só Pedido especial, prompt técnico fica escondido e o pedido aparece no Prompt final.
- Faltam neste countdown: 30 passos.

## Editor AI-first - ações do prompt final
- Adicionei ações diretas no painel Finalizar: Atualizar com escolhas e Copiar prompt.
- Atualizar com escolhas recompõe o prompt a partir do fluxo atual e mantém o prompt editável.
- Copiar prompt ficou mais robusto, com fallback quando a API do clipboard não está disponível.
- Teste no browser confirmou prompt restaurado com cliente e pedido especial; fallback de cópia ajustado depois do teste.
- Faltam neste countdown: 20 passos.

## Editor AI-first - resumo final legível
- Troquei o resumo final de OK genérico para valores reais: nicho, tipo, mood, cliente, marca, idiomas, módulo, extra e tamanho do prompt.
- Campos em falta passam a ter estado visual próprio no resumo final.
- Teste no browser confirmou resumo com cliente, Landing page, PT+EN, Marcações e pedido especial.
- Faltam neste countdown: 10 passos.

## Editor AI-first - readiness do botão AI
- O botão principal do final agora muda conforme o estado do fluxo.
- Se faltar algo, mostra Completar antes de criar e indica o próximo bloqueio.
- Se estiver tudo essencial pronto, mostra Criar site com AI e usa o prompt final.
- Clique bloqueado leva para o passo em falta, em vez de tentar gerar.
- Teste no browser confirmou estado bloqueado por Cliente e estado pronto com botão Criar site com AI.
- Faltam neste countdown: 0 passos.

## Correção UX Builder - Finalizar e afinação estrutural
- Corrigi o painel Finalizar para ficar contido na faixa azul, com inputs, botões, resumo e prompt sem extravasar a coluna.
- Troquei o efeito translúcido do card final por um fundo azul sólido para evitar sensação de layer por cima.
- Acrescentei opções estruturais na Afinação opcional: header, hero, serviços, galeria, contacto e footer.
- Em projetos multi-page, a Afinação opcional mostra checkboxes para transformar serviços, galeria, sobre e contacto em páginas individuais.
- As escolhas estruturais e páginas individuais entram no prompt final AI.
- Teste no browser confirmou opções visíveis no multi-page, prompt final com estrutura escolhida e páginas individuais, e painel Finalizar visualmente contido.

## Correção UX Builder - afinação única e menu mobile
- Consolidei a zona de Afinação opcional para evitar duplicação visual no fluxo principal.
- Header e hero deixaram de aparecer como "Afinação opcional" separada e passaram a ter detalhes específicos no modo avançado.
- Adicionei tipo de menu mobile à estrutura do site.
- A seleção de páginas individuais continua em checkboxes e aceita várias secções ao mesmo tempo, incluindo testemunhos.
- O prompt final passa a incluir menu mobile e múltiplas páginas individuais selecionadas.
- Teste no browser confirmou menu mobile no prompt e várias páginas individuais em simultâneo.

## Correção UX Builder - remover cauda antiga da afinação
- Removi do painel Afinação opcional a zona antiga de narrativa, prompt final editável, serviços, sobre, headline e subheadline.
- O painel de afinação fica agora focado em estrutura do site, páginas individuais e pedido especial.
- O prompt editável fica apenas no passo Finalizar.
- Teste no browser confirmou que a afinação já não mostra Narrativa da página, Prompt final editável nem Headline sugerida.

## Correção UX Builder - opções semânticas para AI
- Substituí labels técnicos como Hero C/Header C por nomes semânticos que a AI entende melhor.
- Cada setor afinável passou a ter 10 opções de direção visual ou estrutural: header, menu mobile, hero, serviços, galeria, contacto e footer.
- Mantive os valores internos aproximados para preservar compatibilidade com o gerador local.
- O prompt final lê agora o label escolhido no Builder, não a nomenclatura interna.
- Teste no browser confirmou que o prompt já não inclui Hero C/Header C e inclui opções como "Full-bleed cinematic hero with premium image direction".

## Correção UX Builder - UI portuguesa e prompt AI rico
- Traduzi as opções estruturais visíveis para português.
- Mantive uma descrição AI por trás em data-ai-label, para o prompt continuar a receber linguagem mais forte e precisa.
- O Builder mostra opções como "Hero cinematográfico full-bleed" e envia "Full-bleed cinematic hero with premium image direction" para o prompt.
- Teste no browser confirmou UI em português e prompt com descrições AI, sem vazar o label português quando existe data-ai-label.

## Correção UX Builder - bloqueio de dados obrigatórios
- O painel Cliente e contacto já não deixa avançar se faltar nome, cidade ou pelo menos um contacto.
- Quando bloqueia, mostra mensagem clara, marca os campos em falta e foca o primeiro campo necessário.
- Ao preencher os dados, o botão Seguinte volta a permitir avançar normalmente.
- Teste no browser confirmou bloqueio sem dados e avanço depois de preencher nome, cidade e telefone.

## Builder AI-first - primeiras inspirações reais
- Adicionei a primeira biblioteca de inspirações validadas com URLs reais: Forma Barbershop, Stylishz, Opalya, Clipster Cuts, Glamora, Belysh e Radiant Style.
- O painel Mood ganhou "Inspiração criativa" com modo automático sem repetir, seleção manual e URL extra opcional.
- O prompt final passa a incluir a inspiração como direção criativa, mas com instrução explícita para não copiar layout/textos.
- A inspiração selecionada entra também no payload enviado à geração.
- Quando se gera uma demo local ou uma sandbox OpenAI real, a inspiração usada fica registada em localStorage para apoiar o modo sem repetição.

## Builder AI-first - mini-backoffice de inspirações
- Criei `data/inspirations.json` como biblioteca local editável de inspirações.
- Adicionei endpoints locais `GET /api/inspirations` e `POST /api/inspirations`.
- O painel Mood ganhou um botão "Biblioteca de inspirações" com formulário para adicionar URL, nome, categoria e mood.
- O seletor de inspiração passa a carregar a biblioteca local pelo servidor, mantendo fallback interno para compatibilidade.
- Validei `node --check ui/app.js`, `node --check ui-server.js`, listagem API com 7 inspirações e abertura do painel no browser.

## Builder AI-first - biblioteca de inspirações mais prática
- Acrescentei filtro por categoria e pesquisa por nome/mood/tag no painel de inspirações.
- Cada inspiração listada ganhou botão "Usar", que ativa a referência no seletor e atualiza o prompt.
- O formulário passou a guardar tipo de inspiração: site completo, landing page, hero, header ou secção.
- Adicionei campo de nota para a AI; quando preenchido, também alimenta a direção criativa da inspiração.
- Validei `node --check ui/app.js`, `node --check ui-server.js` e filtro API por categoria.

## Builder AI-first - editar e apagar inspirações
- Adicionei endpoints locais para atualizar e apagar inspirações por ID.
- Cada item da biblioteca ganhou ações: Usar, Editar e Apagar.
- Editar carrega os dados para o formulário e muda o botão para "Guardar alterações".
- Apagar pede confirmação e remove a inspiração do JSON local.
- Validei criação temporária, edição, remoção e confirmei que `data/inspirations.json` voltou às 7 inspirações reais.

## Builder AI-first - contrato de geração OpenAI reforçado
- A inspiração criativa escolhida entra agora também no brief preview do servidor e no resumo final do Builder.
- O payload enviado à OpenAI passou a declarar ficheiros obrigatórios, mount points UNEED, regras anti-cópia e critérios de validação antes de importar.
- O validador de resposta AI passou a bloquear caminhos inseguros, blocos Markdown, HTML incompleto, falta de CTA e lógica operacional falsa.
- O CSS gerado passa a ser avaliado também por sinais mínimos de responsividade.
- Validei `node --check` em UI/servidor/libs e os testes `test-ai-brief-builder.js`, `test-openai-generation-adapter.js`, `test-ai-response-validator.js`.

## Builder AI-first - promoção de sandbox AI para projeto
- Criei a promoção segura de sandbox AI validada para projeto real em `output/{site}`.
- Se já existir um projeto com o mesmo slug, o sistema cria backup em `output/_backups/{site}` antes de escrever.
- A promoção escreve/atualiza `manifest.json` com origem `openai-ai-import`, importId, validação e ficheiros promovidos.
- A UI passou a mostrar "Guardar como projeto" em sandboxes AI validadas e no resultado de geração OpenAI.
- Validei `node --check` em `lib/aiImportSandbox.js`, `ui-server.js`, `ui/app.js` e os testes `test-ai-import-sandbox.js`, `test-ai-response-validator.js`, `test-openai-generation-adapter.js`, `test-ai-brief-builder.js`.

## Builder AI-first - fluxo principal mais comercial
- Simplifiquei o painel Finalizar para privilegiar o caminho real: Criar site com AI, Versões AI guardadas, Ver/editar prompt e Preparar entrega.
- As ferramentas técnicas ficaram dobradas em "Ferramentas avançadas": briefing técnico, teste de ligação OpenAI e fallback de demo local.
- A geração AI mostra agora um fluxo visual por etapas: briefing, ligação, confirmação de créditos, geração, validação, sandbox e guardar projeto.
- A confirmação de geração real explica que a chamada usa créditos e que o resultado vai primeiro para sandbox, sem escrever por cima do projeto final.
- Validei `node --check` em UI/servidor/import sandbox e os testes `test-ai-import-sandbox.js`, `test-openai-generation-adapter.js`, `test-ai-response-validator.js`, `test-ai-brief-builder.js`.

## Builder AI-first - estimativa controlada antes de gastar créditos
- Adicionei estimativa operacional de consumo para pedidos OpenAI: nível baixo/médio/alto, tokens aproximados, ficheiros esperados e mount points.
- O dry-run e a geração real devolvem agora `estimate`, sem depender de preços fixos da OpenAI.
- O painel técnico mostra a estimativa e a confirmação antes da chamada real inclui modelo, consumo aproximado e ficheiros a criar.
- A estimativa é assumidamente operacional, não faturação exata; o custo real depende do modelo e da tabela atual da OpenAI.
- Validei `node --check` em UI/servidor/adapter e os testes `test-openai-generation-adapter.js`, `test-ai-import-sandbox.js`, `test-ai-response-validator.js`.

## Builder AI-first - estado OpenAI e env local
- O servidor passa a carregar `.env.local` e `.env` automaticamente no arranque, sem precisar de pacote externo.
- O painel Finalizar ganhou um cartão de estado OpenAI: pronta, modelo ativo ou chave em falta.
- Quando falta configuração, a UI indica criar `.env.local` ou `.env` na raiz do gerador e reiniciar o servidor.
- O endpoint `/api/ai-generate/openai/readiness` continua sem expor segredos; devolve apenas estado, modelo, campos em falta e instruções.
- Validei `node --check` em UI/servidor/adapter e os testes `test-openai-generation-adapter.js`, `test-ai-import-sandbox.js`, `test-ai-response-validator.js`, `test-ai-brief-builder.js`.

## Builder AI-first - base de revisão por prompt
- Criei `lib/aiRevisionRequest.js` para preparar pedidos de alteração AI sobre projetos existentes.
- O pedido de revisão lê `index.html`, `styles.css`, `script.js`, `image-plan.json` e `manifest.json`, resume o estado atual e injeta a instrução do utilizador.
- A revisão preserva mount points oficiais UNEED e mantém a regra de não inventar lógica de marcações, reservas, pagamentos ou notificações.
- Adicionei endpoint `POST /api/ai-revision/preview` para preparar a revisão sem gastar créditos.
- O painel Finalizar ganhou campo "Alteração a pedir à AI" com botão para preparar a revisão e ver o prompt técnico.
- Validei `node --check` em UI/servidor/revision e os testes `test-ai-revision-request.js`, `test-openai-generation-adapter.js`, `test-ai-import-sandbox.js`, `test-ai-response-validator.js`, `test-ai-brief-builder.js`.

## Builder AI-first - revisão AI real em sandbox
- Liguei o pedido de revisão ao fluxo real de geração OpenAI, mantendo confirmação antes de gastar créditos.
- A revisão agora pode gerar uma nova versão em sandbox AI, validar ficheiros e abrir preview antes de guardar por cima do projeto.
- Se não existir `OPENAI_API_KEY`, o Builder mostra o dry-run técnico e bloqueia a chamada real com segurança.
- Corrigi a leitura de `manifest.json` no pedido de revisão para não perder mount points quando o manifesto é maior.
- Validei o endpoint `/api/ai-revision/preview` com um site com módulo de marcações e confirmei que preserva `UNEED_BOOKING_MODULE`.

## Builder AI-first - finalizar mais simples
- Simplifiquei o painel Finalizar para mostrar primeiro uma ação principal: criar site com AI.
- O prompt final e o pedido de alteração AI deixaram de estar sempre visíveis; agora abrem só quando clicas em "Editar prompt" ou "Pedir alteração".
- Mantive as ferramentas avançadas dobradas, para não misturar o caminho comercial com opções técnicas.
- O resumo final passou a chips compactos, ocupando menos largura na barra azul.
- Validei sintaxe de `ui/app.js`, `ui-server.js`, `lib/aiRevisionRequest.js`, testes AI principais e carregamento HTTP do novo HTML.

## Builder AI-first - fluxo inicial mais curto
- O estado inicial do Builder passa a esconder também a lista de etapas; antes de começar aparecem só "Novo projeto" e "Projetos existentes".
- O contador principal passou de 9 para 7 passos essenciais: Nicho, Tipologia, Mood, Marca, Cliente, Módulo e Criar.
- Idiomas e prompt continuam disponíveis, mas deixam de travar a criação porque PT-PT e prompt automático já existem por defeito.
- A lista lateral de etapas foi reduzida ao percurso principal; header, hero, footer, menu mobile e outros detalhes ficam agrupados em Afinação.
- Ao escolher um módulo, o Builder avança automaticamente para Afinação, mantendo o fluxo mais fluido.

## Builder AI-first - afinação por grupos
- O painel Afinação deixou de ser uma lista longa única e passou a usar grupos dobráveis.
- "Estrutura visual" concentra header, menu mobile, hero, serviços, galeria, contacto e footer.
- "Páginas individuais" só aparece em projetos multi-page e permite selecionar várias secções como páginas próprias.
- "Pedido especial" fica separado para diagnósticos, calculadoras, secções extra ou instruções específicas para a AI.
- O HTML servido em `localhost:3333` foi validado por HTTP e os testes AI principais continuam OK.

## Builder AI-first - mosaico de projetos mais claro
- O mosaico de projetos existentes ganhou cabeçalho com contagem e indicação do modo atual: editar projeto ou criar similar.
- Cada projeto mostra agora duas ações: ação principal ("Editar" ou "Utilizar") e "Ver site".
- "Ver site" abre o site no preview sem alterar o modo de edição nem usar o projeto como referência.
- O limite visível do mosaico subiu de 12 para 24 projetos, mantendo a grelha limpa.
- Validei sintaxe de UI/servidor, HTML servido e endpoint `/api/client-sites`.

## Builder AI-first - gestão de projetos no mosaico
- Adicionei ação "Apagar" em cada projeto do mosaico.
- O apagar é seguro: move a pasta do projeto para `output/_deleted/{site}-{timestamp}` em vez de destruir imediatamente.
- Substituí o bloco "80 editar projeto" por um filtro "Mostrar 12 / 24 / 48 / Todos".
- O seletor desktop/mobile saiu da sobreposição sobre o site e passou para uma barra própria acima do preview.
- Os botões desktop/mobile passaram a ícones com `aria-label` e `title`, reduzindo colisões visuais.

## Builder AI-first - criação do zero menos confusa
- No modo Essencial, escondi blocos herdados que repetiam decisões da barra lateral: fluxo comercial grande, guia rápido antigo, decisões rápidas, checklist demo e formulário duplicado de cliente.
- Os campos internos continuam no HTML para manter compatibilidade com a geração e sincronização existente.
- A barra azul passa a ser a principal superfície de comando para o fluxo: nicho, tipologia, mood, marca, cliente, módulo, afinação e criar.
- Mantive o seletor Essencial/Avançado visível para poderes voltar ao modo mais completo quando precisares.
- Validei sintaxe de UI/servidor e HTML servido em `localhost:3333`.

## Builder AI-first - navegação do fluxo alinhada
- Removi Idiomas da sequência automática dos botões Voltar/Seguinte no fluxo essencial.
- A ordem interna passa a seguir o caminho curto: Nicho, Tipologia, Mood, Marca, Cliente, Módulo, Afinação e Criar.
- Os botões de navegação internos passaram a dizer o destino: "Seguinte: Módulo", "Seguinte: Afinação", etc.
- Painéis que já não pertencem ao fluxo principal deixam de receber botões automáticos de navegação.
- Validei `ui/app.js`, teste AI principal e ficheiro `app.js` servido pelo localhost.

## Builder AI-first - idiomas simples no essencial
- Recoloquei a escolha de idiomas no modo Essencial dentro do painel Cliente.
- As opções são compactas: PT, PT + EN e PT + EN + ES.
- Idiomas continuam sem contar como passo obrigatório, mas passam a enriquecer o prompt AI diretamente.
- O painel antigo de Idiomas ficou reservado para modo Avançado.
- Removi o salto automático para Módulo quando se escolhe idioma, para não interromper o preenchimento do cliente.

## Builder AI-first - marca mais clara
- A etapa Marca ganhou preview visual do logo carregado, em vez de ficar apenas como caminho/campo técnico.
- Adicionei ação rápida "Paleta UNEED" para aplicar a base cromática da marca quando não há logo ou quando se quer um arranque seguro.
- Adicionei ação "Limpar logo", que remove logos do fluxo e devolve o preview ao nome escrito.
- Mantive os campos técnicos de logo principal/claro no modo Avançado, preservando compatibilidade com sites já gerados.
- Validei sintaxe de `ui/app.js`, `ui-server.js` e resposta HTTP do servidor local.

## Builder AI-first - finalizar mais comercial
- O painel Finalizar passou a ter uma hierarquia mais clara: ação principal "Criar site com AI", depois "Editar prompt" e "Pedir alteração".
- Acrescentei uma linha curta de ações pós-criação: Projetos, Novo e Entrega, para aproximar o fluxo do uso real depois de gerar.
- O resumo final foi reduzido aos pontos que mais importam antes de criar: cliente, tipo, mood, marca, módulo e prompt.
- A mensagem do botão principal passou a explicar que a AI gera em sandbox, valida e mostra no preview.
- Validei sintaxe de `ui/app.js`, `ui-server.js` e resposta HTTP do servidor local.

## Builder AI-first - projetos existentes mais práticos
- O mosaico de projetos existentes ganhou pesquisa por projeto, nicho, tipo ou módulo.
- Cada cartão passa a mostrar as ações essenciais em simultâneo: Editar, Usar como base, Ver site e Apagar.
- O modo "usar como base" deixa de depender de trocar mentalmente o estado do mosaico; o botão está sempre visível.
- A contagem mostra projetos filtrados versus total, mantendo a escolha 12/24/48/Todos.
- Validei sintaxe de `ui/app.js`, `ui-server.js` e resposta HTTP do servidor local.

## Builder AI-first - editar projeto existente
- O botão Editar passou a abrir o projeto real no preview e a carregar o `manifest.json` do site gerado.
- O Builder tenta hidratar campos essenciais a partir do manifesto: nome, cidade, nicho, contacto, WhatsApp, cores, footer, direção visual, tipo de site e módulo.
- Quando o manifesto não está disponível, o Builder usa os metadados já conhecidos no mosaico como fallback seguro.
- Ao abrir um projeto, os links de preview passam a incluir site real, preview de marca, comparação, página comercial e painel do negócio quando existirem.
- Validei sintaxe de `ui/app.js` e acesso HTTP à UI e a um manifesto gerado.

## Builder AI-first - usar projeto como base
- O botão "Usar como base" passou a criar um novo projeto limpo, sem nome, cidade, contactos, WhatsApp ou logos do cliente antigo.
- Quando possível, lê o `manifest.json` do projeto usado como referência e herda apenas estrutura, nicho, tipo, módulo, direção visual, footer e escolhas de secções.
- O preview passa a abrir o site usado como modelo base, para orientar a criação do novo projeto.
- O prompt gerado explica à AI que deve extrair princípios de composição e conversão, sem copiar identidade, textos, fotos ou dados do cliente original.
- Validei sintaxe de `ui/app.js`, `ui-server.js` e resposta HTTP do servidor local.

## Builder AI-first - cliente mais leve
- A etapa Cliente passou a exigir apenas o nome do negócio para avançar.
- Cidade e contactos ficam recomendados, mas deixam de bloquear o fluxo de criação.
- O contacto foi recolhido num bloco "Contacto para o site", para reduzir ruído quando estás só a criar uma primeira versão.
- A validação ficou mais clara: se faltar nome, mostra erro direto; se faltar cidade/contacto, aparece apenas uma dica de qualidade.
- Validei sintaxe de `ui/app.js`, `ui-server.js`, resposta HTTP local e teste AI principal.

## Builder AI-first - estados claros na pré-visualização
- A área de preview passou a indicar explicitamente se está a mostrar "Maquete estrutural", "Site real" ou "Projetos".
- O estado inicial explica que a maquete ainda não é o site final, apenas uma orientação antes de criar com AI.
- Quando um site/LP real é carregado em iframe, o badge muda para "Site real" e a mensagem passa a orientar validação desktop/mobile e alterações por prompt.
- Quando a biblioteca de projetos está aberta, o badge muda para "Projetos" e explica as ações Editar/Usar como base.
- Validei sintaxe de `ui/app.js`, `ui-server.js` e resposta HTTP local.

## Builder AI-first - OpenAI mais operacional
- As sandboxes AI passam a carregar no mesmo fluxo de preview usado pelos sites reais, mudando o estado para "Site real".
- A função `loadBuilderPreviewFrame` foi formalizada para evitar chamadas soltas e garantir comportamento consistente no preview.
- Quando falta `OPENAI_API_KEY`, o Builder mostra instruções claras: criar `.env.local`, adicionar a chave/modelo e reiniciar o servidor.
- A mesma ajuda aparece tanto na criação AI inicial como nas revisões AI por prompt.
- Validei sintaxe de `ui/app.js`, `ui-server.js`, endpoint `/api/ai-generate/openai/readiness`, UI local e teste AI principal.

## Builder AI-first - feedback durante geração OpenAI
- Corrigi o schema enviado para a OpenAI: `imagePlan.items.required` passa a incluir todos os campos definidos, incluindo `negativePrompt`.
- Acrescentei loading visual no fluxo AI, explicando que a chamada acontece por API interna e por isso a barra do browser não mostra carregamento.
- O botão "Criar site com AI" fica desativado enquanto a geração está em curso, evitando cliques duplicados.
- Reiniciei o servidor local para carregar a correção do schema.
- Validei sintaxe, readiness OpenAI com `gpt-5.4`, resposta HTTP local e teste AI principal.
