# UNEED Lead Factory — Audit v0.1

## A. O que já existia e deve ser preservado

O botão **Procurar e adicionar**, os filtros de nicho, distrito, município, raio, máximo e score mínimo já formam o único gerador. O backend usa Google Places, pagina por município, aplica `locationBias`, recolhe Place ID, nome, morada, telefone, website, Maps, rating e reviews. Faz inspeção HTTP rápida, deteta Instagram, marcações e WhatsApp/Linktree, evita duplicados e produz score, oportunidade, mensagem e confiança. O frontend insere no Kanban de Prospecção IG, mantém estados, mensagens, follow-up WhatsApp e o mockup premium existente.

## B. O que o gerador faz melhor que o DISCOVER

- Descoberta geográfica e em lote.
- Filtros operacionais e threshold antes de encher o Kanban.
- Google Place ID, rating e número de avaliações.
- Ações rápidas Instagram/WhatsApp e mockup já adequadas à execução humana.

## C. O que o DISCOVER acrescenta

- Research Pack versionado e evidence-first.
- Fontes, URLs, observações, conflitos, unknowns e warnings.
- Inspeção segura de website e separação entre factos e inferências.
- Persistência, custos, limites, traces e execução por Mission.

## D. Duplicações e conflitos encontrados

- Score do endpoint e score `qualify-lead` eram independentes.
- Mensagem do endpoint e `prepare-outreach` eram fontes paralelas.
- Follow-up existia apenas como função de UI.
- Prompt de mockup era implícito no formulário, sem dados estruturados.
- Qualquer URL não-Instagram do Google podia ser tratada como website oficial, incluindo Racius/diretórios.
- O endpoint inseria diretamente no Kanban antes de investigação profunda.

## E. Decisão de integração

Manter Google Places como `find candidates`; usar CRM Core para Company/Lead e deduplicação; centralizar scoring, canais, mensagens, follow-ups, classificação de URLs e prompt de mockup na Policy `lead-intelligence-v0.1`; executar DISCOVER, qualificação e outreach pelas Missions existentes; reconciliar os resultados no mesmo card legado. O array `instagramProspects` permanece como adapter visual do Kanban, não como nova entidade.

## F. Estados e segurança

`not_researched → researching → qualified → ready_for_contact | needs_review`. Readiness não altera o estado comercial. `CONTACTED` continua reservado a contacto humano efetivamente realizado. Nenhuma mensagem é enviada. Não há cron de geração, Autopilot, Quest, SELL ou BUILD.

## G. Custos e concorrência

O batch respeita `maximum`, `minimum_score` e orçamento por Mission. A criação de Missions usa concorrência limitada; o runner continua com claim exclusivo e concorrência 1. Pesquisa OpenAI, páginas, custos estimados/reais e falhas permanecem nos mesmos formatos da Mission/Research Pack.

## H. Rollback

Os campos novos são aditivos no JSON. Remover `lead-intelligence.js` do build e restaurar `generateProspects` devolve o fluxo anterior; Companies, Leads, cards, Research Packs e histórico antigo permanecem intactos.
