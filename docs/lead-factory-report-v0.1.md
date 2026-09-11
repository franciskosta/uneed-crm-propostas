# UNEED Lead Factory — Relatório de integração v0.1

## A. Resumo executivo

O gerador existente de leads qualificados foi preservado e convertido na entrada operacional da Lead Factory. Google Places continua a encontrar candidatos; CRM Core cria/resolve Company e Lead; DISCOVER investiga; a Policy `lead-intelligence-v0.1` qualifica e prepara abordagem; o Kanban existente continua a ser a superfície de trabalho humano.

## B. Auditoria

A auditoria funcional, duplicações e decisão de reutilização estão registadas em `docs/lead-factory-audit-v0.1.md`.

## C. Arquitetura aplicada

`UI → prospect/search → Company/Lead → Mission → DISCOVER → qualify-lead → prepare-outreach → Francisco Gate → Kanban`.

Não foi criado CRM, pipeline ou gerador paralelo. `instagramProspects` permanece um adapter visual compatível com o Kanban atual.

## D. Descoberta de candidatos

Foram mantidos nicho, distrito, município, raio, máximo e score mínimo. Google Places continua a fornecer Place ID, nome, endereço, telefone, Maps, rating, reviews e URL candidata. O limite do lote é aplicado antes da criação das Missions.

## E. Deduplicação e modelo comercial

A deduplicação reutiliza Place ID, domínio oficial, Instagram, telefone e nome+município. Cada candidato aceite é migrado de forma aditiva para Company e Lead, preservando os registos legados.

## F. Websites e fontes externas

URLs são classificadas antes de entrarem no CRM. Redes sociais, Linktree/Beacons, Fresha, Google e diretórios como Racius/eInforma/Portugalio são evidências externas, nunca website oficial. DISCOVER mantém fontes, URLs, conflitos, unknowns e warnings.

## G. Investigação automática

Cada lead do lote cria uma Mission `qualify_existing_lead` em modo `PREPARE`. A Mission executa pesquisa, qualificação e preparação em checkpoints independentes, permitindo mostrar progresso e respeitar o limite do worker serverless.

## H. Score único

O score comercial e o respetivo breakdown são calculados apenas pela Policy versionada `lead-intelligence-v0.1`. A Skill `qualify-lead` referencia a mesma configuração; deixou de existir um score concorrente no endpoint do gerador.

## I. Estratégia comercial

Para cada lead ficam preparados: motivo da oportunidade, serviço recomendado do catálogo, canal principal/fallback, mensagem inicial, dois follow-ups, atraso recomendado e prompt contextual para mockup. Nenhuma mensagem é enviada automaticamente.

## J. Readiness e estados

Readiness usa `researching`, `qualified`, `ready_for_contact` e `needs_review`, sem substituir o estado comercial. `CONTACTED` só muda após ação humana real. Leads abaixo do mínimo permanecem para revisão e não são apresentados como prontos.

## K. Histórico e conhecimento

Cada reconciliação acrescenta um snapshot a `researchHistory`, com versão, timestamps, missão, Research Pack, inteligência, custos e avisos. Company, Lead e Activity recebem referências compatíveis, sem apagar informação anterior.

## L. Perceção de evolução

Os cards mostram readiness, score/confiança, oportunidade, solução e canais. O modal da Mission mostra estado, percentagem, etapa atual e timeline. O botão de investigação abre a Mission ativa quando existe, evitando criar uma duplicada.

## M. Custos, limites e segurança

Mantêm-se budgets, número máximo de passos, tentativas, timeout, claim exclusivo, logging e formato de custos. A OpenAI Web Search continua atrás de `WebSearchProvider`. O adapter Brave permanece disponível. Francisco Gate continua obrigatório antes de qualquer ação externa.

## N. Testes

Há testes para classificação de URLs, score versionado, canal, mensagens, follow-ups, mockup, diretórios, checkpoints da Lead Factory e o cenário manual `Cabeleireiros / Aveiro / máximo 5 / score mínimo 70`. A suite completa tem 43 testes.

## O. Fora de âmbito

Não foram adicionados Autopilot, envio automático, Quest, SELL, BUILD ou funcionalidades v0.2. A criação de um objeto Mission-pai para representar todo o lote fica como melhoria futura; na v0.1 o lote é correlacionado por `leadFactoryBatchId` e cada lead tem a sua própria Mission auditável.

## P. Rollback e operação

As alterações de dados são aditivas em JSON e não exigem migração destrutiva. Um rollback de código não elimina Companies, Leads, cards, Missions ou histórico existentes. O teste real em produção deve ser iniciado em **Prospeção IG → Gerador de leads qualificados**, usando o cenário definido; os cards devem evoluir de `researching` para `ready_for_contact` ou `needs_review`.
