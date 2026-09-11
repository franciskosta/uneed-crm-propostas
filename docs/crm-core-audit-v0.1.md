# UNEED CRM CORE — Auditoria e plano v0.1

## A. Mapa atual

### Persistência

- `crm_state`: um documento JSON por utilizador. Contém `proposals`, `instagramProspects`, `contracts`, catálogo, marca, metas e cópia local de tickets.
- `support_tickets`: tabela própria, sem `user_id`, `company_id`, `contact_id` ou `project_id`.
- `missions`: tabela própria por utilizador, com `target_type` e `target_id`, mas o payload funcional usa `input.lead` no formato derivado de Proposal.
- `email_reminders`: tabela própria ligada apenas por `proposal_id` textual.
- `localStorage`: cópia/cache integral do mesmo estado do CRM.

### Entidades efetivas

- Proposal: acumula identidade da empresa, contacto, origem, etapa comercial, follow-up, serviços, valores, faturação, notas e atividades.
- Instagram Prospect: identidade/contacto, origem implícita, pipeline próprio, sinais digitais, mensagem, mockup e notas.
- Contract: duplica nome, NIF, email, telefone e contacto; é criado a partir de Proposal mas não guarda `proposal_id`.
- Client: não existe como entidade; a vista agrega Proposals por identidade textual.
- Contact: não existe como entidade.
- Opportunity: não existe como entidade; Proposal desempenha simultaneamente esse papel.
- Project: não existe como entidade; apenas `project_url` em Ticket.
- Ticket: identidade textual independente na tabela `support_tickets`.
- Mission: aceita targets genéricos no schema, mas a UI cria targets `lead` cujo ID é, na realidade, o ID de Proposal.
- Activity: existe apenas dentro de cada Proposal.

### Estados atuais

Proposal/Pipeline: `Novo pedido`, `Orçamento enviado`, `Follow-up`, `Aceite`, `Em desenvolvimento`, `Concluído`, `Faturado`, `Perdido`.

Prospeção IG: `Por fazer`, `Mensagem IG enviada`, `Follow up WhatsApp`, `Break up por telefone ou WhatsApp`, `Não deu cliente`, `Pediu demonstração`, `Cliente ativo`.

Contract: `Rascunho`, `Enviado`, `Aceite`, `Recusado`, `Cancelado`.

Ticket: `Novo`, `Em análise`, `A aguardar cliente`, `Em resolução`, `Resolvido`, `Fechado`.

## B. Silos e duplicações

- Company/contacto repetidos em Proposal, Instagram Prospect, Contract e Ticket.
- Duas pipelines sem identidade comum: Proposal e Instagram Prospect.
- Follow-up em `proposal.followupDate`, estados IG e mensagens; não existe registo central.
- Atividades comerciais apenas em Proposal.
- Contrato copia dados da Proposal sem relação persistida.
- Ticket só pode ser associado por comparação textual de nome/email/telefone.
- Missions não conseguem resolver uma Company central.
- `sampleUrl` é atualmente usado como fallback para website no DISCOVER, podendo investigar uma amostra UNEED como se fosse o site da empresa.

## C. Modelo alvo mínimo

- `companies`: identidade única do negócio; cliente é uma relação/estado (`clientSince`), não uma entidade duplicada.
- `contacts`: contactos pertencentes a Company.
- `leads`: entrada comercial, com `source` separada de `channel` e estado unificado.
- `opportunities`: intenção comercial e etapa do pipeline.
- `activities`: timeline central por Company, opcionalmente ligada a Lead/Opportunity/Proposal.
- `proposals`: documento comercial ligado a Company, Contact, Lead e Opportunity.
- `contracts`: ligado a Company, Proposal e Opportunity.
- `support_tickets`: ligado a Company, Contact e Project quando conhecidos.
- `missions`: usa target Company/Lead/Opportunity e guarda referências centrais no payload.
- `projects`: não será inventado nesta fase; fica uma referência opcional até existir um módulo real.

## D. Mapping legacy → core

| Legacy | Core | Regra inicial |
|---|---|---|
| `proposals[]` | Company + Contact + Lead + Opportunity + Proposal refs | Company por domínio/email/telefone/NIF/Instagram exatos; na dúvida, nova Company e `potentialDuplicateOf` |
| `instagramProspects[]` | Company + Lead + refs legacy | `source=instagram_prospecting`, `channel=instagram`; Contact apenas quando existe pessoa distinta identificável |
| `contracts[]` | Contract refs | Match exato a Proposal quando criado via UI; caso contrário Company por sinais fortes |
| `support_tickets` | Ticket refs | Match conservador por email, telefone, domínio ou nome exato; sem match permanece `company_id=null` |
| Proposal activities | `activities[]` | Cópia idempotente com `legacyRef`, preservando o original |
| `missions` | target central | Novas Missions usam Company ou Lead; Missions antigas mantêm target/payload intactos |

### Equivalência de estados

Proposal → Opportunity:

- `Novo pedido` → `NEW`
- `Orçamento enviado` → `PROPOSAL`
- `Follow-up` → `CONTACTED`
- `Aceite` → `WON`
- `Em desenvolvimento` → `WON`
- `Concluído` → `WON`
- `Faturado` → `WON`
- `Perdido` → `LOST`

Instagram Lead:

- `Por fazer` → `NEW`
- `Mensagem IG enviada` → `CONTACTED`
- `Follow up WhatsApp` → `CONTACTED`
- `Break up por telefone ou WhatsApp` → `CONTACTED`
- `Pediu demonstração` → `ENGAGED`
- `Cliente ativo` → `WON`
- `Não deu cliente` → `LOST`

Os valores legacy continuam guardados para a UI atual.

## E. Plano incremental

1. Introduzir versão de schema e coleções core vazias.
2. Executar migração idempotente em memória antes de cada persistência.
3. Criar Companies por correspondências fortes; nunca fazer merge ambíguo.
4. Criar Contacts, Leads, Opportunities e Activities e adicionar IDs aos registos legacy.
5. Fazer Prospeção IG ler Leads centrais através de adapter, mantendo campos de apresentação legacy.
6. Ligar criação de Contract às referências da Proposal.
7. Adicionar colunas nullable a Tickets e Missions, sem alterar linhas antigas destrutivamente.
8. Alterar DISCOVER para receber `Company + Lead`, com website exclusivamente da Company.
9. Manter leitura de Missions/estado antigos durante toda a transição.

## F. Riscos

- Nomes iguais não provam identidade; nunca são suficientes para merge automático sem localização/outro sinal.
- Dados de Company podem divergir entre módulos; a migração preserva o valor legacy e assinala duplicados potenciais.
- Tickets públicos podem não corresponder a qualquer Company conhecida.
- O JSON `crm_state` não oferece integridade referencial do PostgreSQL; validação/adapters são obrigatórios.
- IDs gerados no browser têm de ser persistidos antes de nova hidratação para garantir idempotência.
- Missions em curso não podem mudar de target durante execução.

## G. Impacto na UI

- Navegação e módulos atuais permanecem.
- Prospecção IG permanece uma vista operacional especializada, mas cada cartão aponta para um Lead central.
- Pipeline principal continua visualmente estável nesta fase e passa a refletir Opportunity através do adapter Proposal.
- Clientes continuam com a apresentação atual; a condição de cliente passa a existir na Company.
- Não são adicionados dashboards nem automações.

## H. Impacto no DISCOVER

- Entrada passa a ser `{ company, lead }`.
- Mission usa `target_type=company` para pesquisa e mantém `lead_id` no contexto.
- `company.website` é a única origem de website conhecido.
- `sampleUrl` permanece exclusivo da Proposal e nunca entra no input do DISCOVER.
- Resultados continuam no mesmo `CompanyResearchPack@1.0.0` e no mesmo formato de evidência/custos/logging.

## I. Rollback

- Nenhuma coleção ou campo legacy é removido.
- As novas coleções e referências são aditivas.
- A UI pode regressar ao commit anterior e continuar a ler `proposals`, `instagramProspects`, `contracts` e Tickets existentes.
- A migration SQL apenas adiciona tabelas/colunas/indexes; rollback operacional consiste em deixar de as utilizar, sem apagar dados.
- Não se fará `DROP`, merge destrutivo nem reescrita irreversível de IDs.

## Decisão

Não existe impedimento crítico. A migração pode avançar de forma aditiva, conservadora e idempotente. O principal limite conhecido é que `crm_state` continua a ser um documento JSON; esta fase cria uma verdade comercial coerente dentro desse documento e referências explícitas nas tabelas externas, sem uma migração arriscada de todos os dados para tabelas normalizadas.
