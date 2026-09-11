# UNEED OS — Constituição técnica

Versão: Foundation Hardening v0.1.1 · Atualizado em 2026-09-09

Este documento deve ser lido antes de qualquer alteração relacionada com IA ou automação. Uma mudança arquitetural significativa implica atualizar este documento.

## 1. Visão e princípios

O UNEED OS é a evolução incremental do CRM existente, não um CRM paralelo. Francisco define intenção, limites, decisões e relações; o sistema coordena execução controlada. A direção é: **Francisco decide. A Uneed executa.**

1. Intelligence is replaceable. Uneed is permanent.
2. Humans own intent. Agents own execution.
3. Everything repeatable becomes a Skill.
4. Every action creates knowledge.
5. Francisco trabalha em exceções, relações e decisões.

Dados, regras, workflows, Skills, Tools e conhecimento UNEED são ativos permanentes. Providers, modelos, interfaces e frameworks são substituíveis.

## 2. A. Estado atual auditado

O CRM encontra-se em `uneed-crm-propostas/` e é uma aplicação sem framework: HTML/CSS e um ficheiro JavaScript de browser, servidos opcionalmente por Node.js 20. Não existe bundler nem TypeScript. A única dependência runtime é `pg`.

- **Frontend:** `index.html`, `styles.css`, `app.js` e `pricing.js`. DOM imperativo e estado global; não existe store separada nem component library.
- **Backend:** `email-server.js`, servidor HTTP Node nativo. Serve estáticos e expõe autenticação, estado e lembretes por JSON API.
- **Persistência:** o CRM guarda um documento agregado (`brand`, catálogo, metas e `proposals`) em `localStorage`; sincroniza o mesmo documento para ficheiro local, PostgreSQL ou tabela `crm_state` do Supabase.
- **Autenticação:** no backend próprio, password com `scrypt`, sessão aleatória persistida apenas como SHA-256 e cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção. No modo Vercel, Supabase Auth no browser e RLS por `user_id`.
- **Permissões:** isolamento por utilizador; não existem roles nem permissões granulares. A v0.1 mantém este limite e acrescenta isolamento das Missions por owner e allow-list de Tools por Skill.
- **Dados/migrations:** Node cria `users`, `sessions`, `app_state`, `email_reminders` e agora `missions` de forma idempotente. `supabase-schema.sql` é o schema declarativo do modo Supabase. Não existe ferramenta formal de migrations ou versionamento do schema.
- **APIs:** `/api/auth/*`, `/api/state`, `/api/email/reminders` e `/api/missions*`. Os endpoints protegidos usam a sessão Node.
- **Integrações:** PostgreSQL, Supabase (Auth/DB/CDN) e Resend. O QR code é local. Não foram encontrados webhooks, CRM externo, analytics ou filas.
- **Jobs:** a v0.1.1 acrescenta um Mission Runner independente; lembretes de email continuam sem processador automático.
- **Logging/erros:** logs de arranque e fallback no servidor; erros API viram JSON 500. O frontend usa modal e fallbacks. Não há logger estruturado, tracing ou error reporting.
- **Estado/componentes:** helpers e funções `render*` partilhadas dentro do monólito. Não existem componentes encapsulados.

### Funcionalidades e entidades encontradas

`proposal` acumula papéis de lead, contacto, empresa/cliente, oportunidade, proposta e contrato recorrente. Inclui identidade/contactos, origem, pipeline, follow-up, serviços, valores, notas e atividades. Existem dashboard, pipeline Kanban, clientes, histórico comercial, propostas/PDF, catálogo/preços, faturado/pago, metas e avenças. “Contratos ativos” são propostas faturadas com serviços mensais; não existe entidade Contract. Também não existem entidades próprias para tarefas, projetos, documentos, diagnóstico, prospeção, High Ticket, automações ou utilizadores geríveis. Há um produto LEADS AI e projetos irmãos de geração de sites/diagnóstico, mas não integração operacional com este CRM. As novas Skills são a primeira IA integrada no CRM.

## 3. B. O que reutilizar

Mantêm-se a autenticação e sessão, o documento CRM existente, `proposal` como target compatível (apresentado como Lead no UNEED OS), UI/identidade visual, catálogo, atividades comerciais, persistência dual e serviço Resend. As missões associam-se por `target_type` + `target_id`, evitando migrar ou duplicar proposals nesta fase.

## 4. C. Riscos

1. O documento agregado cria conflitos last-write-wins e torna validação/migrations granulares difíceis.
2. `proposal` representa vários conceitos; separar prematuramente quebraria compatibilidade, mas o acoplamento deve ser eliminado numa fase futura.
3. Existem dois backends efetivos. O deploy Supabase estático não executa o Mission Engine Node; a UI informa esta limitação. Para Missions, usar o serviço Node/Railway ou criar futuramente uma função server-side com o mesmo contrato.
4. O modo local de ficheiro é single-process; produção requer PostgreSQL para claim concorrente seguro. O runner atual usa polling, adequado à carga inicial.
5. Não existe sistema formal de migrations, CSRF token, rate limiting ou RBAC. SameSite reduz, mas não elimina, risco CSRF.
6. O provider local apenas analisa evidência CRM e declara lacunas; não pesquisa a web. O provider externo pode variar em qualidade e custo.
7. O custo OpenAI depende de tarifas configuradas por ambiente; se ficarem a zero, o sistema conserva o teto preventivo por chamada e usage, mas o custo real apresentado será zero até as tarifas serem preenchidas.

## 5. D. Integração proposta e implementada

O domínio está em `uneed-crm-propostas/uneed-os/`, independente do HTTP e UI. O Lead cria uma Mission `qualify_existing_lead` em `queued`; o runner executa três Skills sequenciais através do AI Gateway, persiste checkpoints e para em `waiting_approval`. Aprovar volta a colocar a Mission em fila para retoma; rejeitar conclui sem enviar mensagem.

O Centro de Comando apresenta em execução, aprovações, concluídas e falhas. O detalhe distingue factos CRM, análise/recomendação, mensagem preparada, custo e timeline operacional. Chain-of-thought não é pedido nem armazenado.

## 6. E. Alterações de base de dados

`missions` contém owner, estado, target polimórfico, documento completo versionável e timestamps. No backend Node os campos indexáveis são colunas e o restante fica em `data jsonb`; em ficheiro local integra o array `missions`. No Supabase existem constraints de status/autonomia, índice por owner/status/data e RLS. Events e approval são embebidos no snapshot da Mission nesta versão pequena. Quando houver concorrência, alto volume ou reporting, devem migrar para tabelas append-only `mission_events` e `mission_approvals`, mantendo o contrato do domínio.

Migrations são aditivas e idempotentes. Não alteram nem removem dados CRM. Rollback da aplicação consiste em voltar ao código anterior; a tabela nova pode permanecer sem afetar o CRM.

## 7. F. Estrutura de código e módulos

```text
uneed-crm-propostas/
├── uneed-os/
│   ├── mission-engine.js   # lifecycle, budgets, audit e Francisco Gate
│   ├── skills.js           # registry e versões
│   ├── gateway.js          # seleção capability-first
│   ├── providers.js        # contrato e adapters local/OpenAI
│   └── repository.js       # ficheiro/PostgreSQL
├── email-server.js         # HTTP/auth/composição
├── app.js                  # UI existente + Command Center
└── test/uneed-os.test.js
```

### Regras de dependência

- UI → API → Mission Engine → AI Gateway → Provider.
- Mission Engine → Skill Registry e Repository.
- Código de negócio nunca chama provider diretamente nem escolhe modelos.
- Providers não conhecem CRM, Missions ou UI.
- Skills declaram capacidades e Tools permitidas; não contêm segredos.
- Chaves e mapeamento capacidade/modelo existem apenas em ambiente/composição server-side.
- Dados críticos e decisões ficam no repositório UNEED, nunca na “memória” do modelo.

## 8. AI architecture, model router e providers

O `AIGateway.execute()` recebe task, capacidades, qualidade, budget, contexto, instruções e descrição do output. O router simples usa categorias `FAST`/`SMART` centralizadas. `AIProvider` define `supports`, `execute`, `estimateCost` e `healthCheck`.

Por omissão, `LocalEvidenceProvider` produz resultados determinísticos exclusivamente a partir do CRM, com custo zero e lacunas explícitas. Com `OPENAI_API_KEY`, `OpenAIProvider` pode servir `SMART`; o modelo é configurado por `UNEED_AI_SMART_MODEL`. Adicionar Anthropic/Google/local significa criar outro adapter, sem mudar Skills ou Mission Engine.

Outputs de provider têm de ser objetos JSON; texto livre no boundary é rejeitado. Schemas formais por Skill e validação JSON Schema são a próxima melhoria necessária antes de permitir actions `EXECUTE`.

## 9. Mission Engine

Estados principais: `draft → queued → running → waiting_approval → queued → running → completed`. `queued` pode ser cancelado; `running` pode voltar a `queued` por retry limitado ou terminar em `failed/cancelled`; `failed` admite retry manual. Uma Mission é genérica, tem target polimórfico, steps, estratégia, input/result, confiança, custos, timestamps, erro e metadata.

Proteções v0.1.1: owner obrigatório, claim/heartbeat, max attempts/cost/steps, teto estimado por chamada, timeouts separados, state machine, validação por Skill, cancelamento cooperativo, falha segura e audit. Retry automático existe apenas para categorias temporárias e é limitado; stale recovery falha fechado.

## 10. Skill Engine e Tool layer

Skills são definições imutáveis/versionadas com inputs lógicos, capacidades, allow-list de Tools e instruções. Mantêm-se `research-company@1.0.0`, `qualify-lead@1.0.0` e `prepare-outreach@1.0.0`. O Tool Executor valida allow-list e exige idempotency key para side effects; nenhuma Tool externa está registada nesta fase.

## 11. Memória, auditoria, observabilidade e aprendizagem

Structured Memory continua no CRM/PostgreSQL. Semantic Knowledge não é implementado. Cada Mission guarda eventos operacionais (ação, Skill/version, provider/model, custo, erros, decisão e timestamps), nunca chain-of-thought. Os snapshots permitem contar estado, duração, calls, Skills, confiança e custos. Campos futuros de outcome (`human_rating`, sucesso, conversão, receita, failure reason) devem ser dados explícitos e alimentar evals, nunca auto-modificação direta.

## 12. Segurança e Francisco Gate

Least privilege, isolamento por owner, segredos server-side e aprovação obrigatória são invariantes. `PREPARE` é o máximo usado no fluxo inicial. Mensagem, publicação, deploy, eliminação, pagamentos, contratos e preço requerem policy/approval futura. O Gate mostra ação, razão, impacto e resultado esperado. A aprovação v0.1 não envia: apenas deixa uma decisão auditável para execução humana.

## 13. Versionamento e evolução

Skills usam SemVer e Missions registam a versão executada. Alterações incompatíveis criam nova versão; uma versão em produção não é reescrita retroativamente. Prompts/instruções, schemas, policies e routes devem ser versionáveis. O futuro LAB compara versões/modelos sobre dados históricos e só promove alterações após teste, avaliação e aprovação humana.

Roadmap:

- **Foundation v0.1:** Mission/Skill Engine, Gateway, audit, Command Center e Qualify Existing Lead.
- **v0.2 SELL:** diagnóstico → solução → proposta.
- **v0.3 PROJECT START:** venda → projeto → briefing → tarefas.
- **v0.4 BUILD:** coding agents/Codex como Tool controlada.
- **v0.5 OPERATE:** monitorização e acompanhamento de clientes.

## 14. G. Plano incremental

1. Introduzir módulos de domínio e testes sem tocar no estado CRM.
2. Adicionar persistência/API autenticada de Missions.
3. Ligar Command Center e AI Actions ao Lead existente.
4. Operar inicialmente com provider local; ativar provider externo apenas por configuração.
5. Medir falhas/qualidade e formalizar schemas antes de novas Tools.
6. Extrair events/steps para tabelas append-only quando volume, concorrência de edição ou reporting justificarem.

## 15. H. Compatibilidade

Todas as alterações são aditivas. O estado/proposals, autenticação, PDF, pipeline e emails mantêm contratos existentes. Sem configuração AI, o provider local funciona; sem backend Mission, o CRM continua operacional e mostra erro localizado. Nenhuma migration destrutiva, refactor massivo ou envio automático foi introduzido.

## 16. I. Decisões arquiteturais

- **Target polimórfico em vez de FK para proposal:** preserva o documento atual e suporta futuros clientes/projetos.
- **Módulos CommonJS sem framework:** acompanha Node e a stack, evitando infraestrutura sem uso imediato.
- **Queue PostgreSQL na v0.1.1:** separa request e execução sem introduzir Redis; `SKIP LOCKED` oferece claim concorrente seguro.
- **Provider local como fallback:** garante experiência funcional e honesta sem chave/custo, mas não finge pesquisa web.
- **Snapshot JSON + colunas indexáveis:** equilibra extensibilidade com queries operacionais; event store normalizado fica adiado.
- **Gate sempre antes de contacto:** cumpre PREPARE; aprovação não equivale ainda a execução externa.

## 17. J. Fora do âmbito v0.1 / não fazer

Não criar CRM paralelo; separar já Lead/Client/Opportunity; prospeção em massa; envio automático; agentes financeiros; faturação/pagamentos; deploy autónomo; Ads; suporte/voz; hierarquia multi-agent; marketplace; SaaS externo; embeddings/memória sem caso concreto; dashboards decorativos; prompts monolíticos; modelos hardcoded no negócio; tokens/chaves no browser; chain-of-thought; refactor geral; v0.2+.

## 18. Checklist para futuros agentes/Codex

Antes de implementar IA ou automação: ler este documento; identificar o módulo; procurar Skill, Tool, entidade e serviço reutilizáveis; evitar duplicação; preservar abstração do provider; aplicar least privilege/approval; criar logs e testes relevantes; atualizar esta constituição se a arquitetura mudar.

## 19. Runtime de produção v0.1.1 (decisão vigente)

A execução síncrona descrita nas secções históricas da v0.1 foi substituída. A topologia suportada é **Vercel frontend → Railway API + Railway Worker → Supabase Auth/PostgreSQL**. A API apenas valida e persiste `queued`; um runner independente faz claim PostgreSQL atómico com `FOR UPDATE SKIP LOCKED`. O modo local usa o mesmo runner embebido, com persistência em ficheiro e concorrência 1.

Cada Mission guarda steps/checkpoints, versões das Skills, worker/claim/heartbeat, attempts limitados, tokens e custos separados em estimated/actual/unknown. A state machine central impede transições arbitrárias. Approval liberta o worker; aprovação persiste, volta a `queued` e retoma no approval step sem repetir Skills. Stale workers falham de forma fechada com `STALE_WORKER`, exigindo retry manual, porque evitar side effects duplicados tem prioridade sobre disponibilidade automática.

Erros de providers são normalizados para `AI_TIMEOUT`, `AI_RATE_LIMIT`, `AI_UNAVAILABLE`, `AI_BAD_RESPONSE`, `AI_AUTH_ERROR` e `AI_BUDGET_EXCEEDED`. Routes `FAST`, `SMART` e `DEEP`, modelos e tarifas são configuração server-side. Fallback só ocorre para falhas retryable e quando ativado pelo caller.

O frontend autentica-se na API Railway com um token Supabase verificado pelo próprio Supabase Auth; IDs enviados pelo browser nunca determinam ownership. RLS de Missions é read-only para `authenticated`; mutações, custos, status e audit passam exclusivamente pelo backend. Events permanecem append-only por contrato e inacessíveis para mutação direta pelo browser, embora ainda estejam no snapshot JSON da Mission.

Detalhes operacionais: [runtime](docs/uneed-os/runtime.md) e [deployment](docs/uneed-os/deployment.md).

## 20. DISCOVER v0.1

DISCOVER é a primeira camada funcional externa e reutiliza integralmente Mission Engine, runner, checkpoints, Gateway, providers, Tool Executor, audit, budgets e Gate. `research-company@1.1.0` recebe dados mínimos de CRM e coordena `read_crm`, `search_web`, `inspect_website`, `fetch_public_page` e `discover_social_profiles`. HTTP/search nunca vivem dentro da Skill.

Search usa a interface `WebSearchProvider`; Brave é o primeiro adapter configurável. Fetch público resolve/valida DNS, fixa o IP público na conexão, revalida redirects e impõe protocolos, timeout, tamanho, depth/pages e cache. Outputs convergem em `CompanyResearchPack@1.0.0`, que separa facts, observations, inferences, recommendations, unknowns, conflicts e evidence com freshness.

`qualify-lead@1.1.0` consome o pack e usa breakdown versionado; `prepare-outreach@1.1.0` usa policy de copy separada e evidence IDs. As versões 1.0.0 permanecem disponíveis para histórico. A action externa continua inexistente: o approval step apenas regista revisão humana.

Contrato, limites, SSRF e avaliação manual: [discover.md](docs/uneed-os/discover.md).
