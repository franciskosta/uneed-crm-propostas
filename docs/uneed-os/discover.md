# UNEED DISCOVER v0.1

## Objetivo

DISCOVER dá ao UNEED OS acesso controlado a informação empresarial pública. Não faz prospeção em massa, login, bypass, scraping de redes sociais ou contacto automático.

## Fluxo e Tools

`research-company@1.1.0` executa um plano limitado através do Tool Executor:

1. `read_crm`: allow-list de nome, website, localização, contacto profissional, Instagram, origem, observações e nomes de serviços. Exclui NIF, IBAN, pagamentos e valores.
2. `search_web`: pesquisa normalizada através de `WebSearchProvider`. O provider ativo é OpenAI Web Search através da Responses API; o adapter Brave Search permanece no código como alternativa.
3. `inspect_website`: sinais factuais leves da homepage.
4. `fetch_public_page`: páginas diretamente relevantes, depth 1.
5. `discover_social_profiles`: apenas links públicos encontrados em website, pesquisa ou CRM.

Falhas isoladas de páginas geram `warnings`/resultado parcial. Falha temporária do search provider continua a usar a política de retry da Mission. Nenhuma Tool tem side effects.

## Research Pack

`CompanyResearchPack@1.0.0` contém identidade e dados conhecidos, resumo, serviços observados, presença digital, sinais do website, `facts`, `observations`, `inferences`, `opportunities`, `evidence`, `unknowns`, `conflicts`, `warnings`, confidence qualitativa, freshness e `researchedAt`.

Evidence contém ID, tipo, URL/título, `observedAt`, facto, excerto curto opcional, confidence e metadata. Facts/observations referenciam evidence IDs. URLs são normalizados e evidence duplicada por fonte+facto é removida. Conflitos ficam sem resolução automática, removem o valor de `knownData` e reduzem confidence.

Confidence é `low`, `medium` ou `high`, baseada apenas na quantidade/qualidade de evidence e penalizada por conflitos. Não pretende representar precisão científica.

## Segurança e responsible fetching

Só HTTP/HTTPS sem credenciais na URL. A validação bloqueia localhost, nomes internos, metadata host, ranges privados/reservados IPv4/IPv6 e endereços DNS privados. O endereço público resolvido é fixado na conexão para reduzir DNS rebinding. Cada redirect é novamente validado; há limites de redirects, bytes e timeout.

O fetch usa `UNEED-Discover/0.1 (+https://uneed.pt)`, não executa JavaScript, não contorna proteções e remove scripts, styles, SVG, navegação/footer e boilerplate antes de extrair conteúdo. Não existe crawler: apenas homepage e até duas páginas relevantes por omissão.

## Limites, cache e custos

Defaults: 2 pesquisas permitidas pelo contrato (o plano atual usa no máximo 1), 3 páginas, depth 1, 8 s por search/fetch, 750 KB por página, 3 redirects e cache de 15 minutos. A mesma URL não é obtida duas vezes dentro do TTL.

Search reserva um teto antes da chamada (`OPENAI_WEB_SEARCH_MAX_QUERY_COST`, 0,05 por omissão). Se ultrapassar o budget, não chama o provider. Custo conhecido e desconhecido permanecem distintos. A Mission agrega `toolEstimatedCost`, `toolCost`, AI cost, calls e tokens. Configure `OPENAI_WEB_SEARCH_COST_PER_QUERY`, `UNEED_AI_INPUT_COST_PER_MILLION` e `UNEED_AI_OUTPUT_COST_PER_MILLION` com as tarifas atuais; se alguma estiver em branco, o custo real fica `unknown`, mas o teto continua a proteger o budget.

## Skills v1.1

- `research-company@1.1.0`: Research Pack evidence-first; v1.0.0 permanece histórica.
- `qualify-lead@1.1.0`: recebe o pack e produz breakdown configurado (`digitalGap 30`, `businessFit 30`, `reachable 20`, `likelyNeed 20`). É heurístico, explicável e destinado a Evals.
- `prepare-outreach@1.1.0`: recebe pack/qualification e segue `uneed-outreach@1.0.0`; usa factos/observações referenciados e nunca envia.

Models são selecionados por capacidades e routes FAST/SMART/DEEP. Nenhuma Skill contém nome de provider/model.

## Teste manual com 5–10 Leads

1. Confirme `OPENAI_API_KEY` no worker; opcionalmente configure o modelo e as tarifas de pesquisa/tokens.
2. Abra um Lead real e confirme nome, website/localização quando conhecidos.
3. Clique **Investigar empresa** para avaliar só o Research Pack, ou **Executar análise completa** para chegar ao Francisco Gate.
4. Pode fechar/reabrir o browser; consulte Centro de Comando.
5. Para cada Lead registe: o que já sabia; novos factos corretos; fontes válidas; falsos positivos; unknowns corretos/em falta; conflitos; recomendação; qualidade da mensagem; rating 1–5.
6. Não use os primeiros testes para contactar automaticamente. Corrija dados CRM incorretos e execute nova Mission; o histórico anterior é preservado.

Smoke externo opcional: `OPENAI_API_KEY=... npm run smoke:discover -- "Empresa" "https://empresa.pt"`. Nunca corre na suite automática.

## Limitações

Extração HTML é deliberadamente leve e não renderiza sites dependentes de JavaScript. Não consulta Google Business, Maps ou APIs sociais. Ausência observada significa apenas “não encontrada nas páginas analisadas”. Search cache é em memória por processo; Research Packs são snapshots persistentes. Robots.txt não é interpretado automaticamente, embora o fetch seja mínimo e identificável.
