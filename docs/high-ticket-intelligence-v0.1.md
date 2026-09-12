# UNEED High Ticket Intelligence v0.1

## A. Auditoria

A Lead Factory, o Kanban, Companies, Leads, Missions, Skills, DISCOVER, Francisco Gate e histórico continuam únicos. A fundação já propagava `acquisitionStrategy`; faltavam o perfil de investigação, a qualificação e a abordagem High Ticket.

## B. Research profile

`high-ticket-deep-v0.1` usa até três pesquisas e seis páginas por omissão, incluindo produtos, catálogo, equipa, carreiras, notícias, downloads, portais, áreas de cliente e localizações. Os limites são configuráveis por `MAX_HIGH_TICKET_SEARCHES`, `MAX_HIGH_TICKET_PAGES`, `MAX_HIGH_TICKET_DEPTH` e `MAX_HIGH_TICKET_COST`.

## C. High Ticket Fit

O score `high_ticket_v1` é independente do score Presença. Expõe complexidade operacional, gap digital, potencial económico, fit de negócio, potencial de transformação, contactabilidade e qualidade da evidência. Mede potencial de valor, não probabilidade de compra.

## D. Hypotheses

As hipóteses são criadas apenas quando existe evidence ID associado. Cada uma guarda categoria, rationale, impacto potencial sem valores financeiros e confidence. Problemas internos nunca são apresentados como confirmados.

## E. Diagnostic questions

O pack inclui perguntas sobre pedidos, duplicação entre equipas, acompanhamento de clientes, trabalho manual, reporting e integrações.

## F. Decision maker logic

São aceites apenas sinais profissionais públicos encontrados nas fontes. Nome pode permanecer `null`; decisor desconhecido não bloqueia o Lead.

## G. Outreach policy

A mensagem é curta, profissional, personalizada com uma hipótese apoiada por evidência e convida para o Diagnóstico Digital. Não menciona IA, High Ticket, preço, solução fechada ou promessa. Sem evidência específica, não há mensagem pronta.

## H. UI

High Ticket está selecionável no gerador atual. Os rótulos passam a Setor, Região e High Ticket Fit mínimo; os cards mantêm o badge HIGH TICKET, mostram fit/oportunidade e não oferecem mockup. A Mission separa sinais confirmados, hipóteses e perguntas.

## I. Costs

Custos de pesquisa, IA e tools continuam no formato existente da Mission e do histórico. O perfil tem teto próprio conservador de €0,50 por omissão; custo real permanece `unknown` quando pricing não está configurado.

## J. Tests

Os testes cobrem desbloqueio, propagação, score separado, evidence obrigatória, hipóteses, CTA, ausência de serviço/proposta, Quest bloqueado, revisão estrita, personalização, investigação insuficiente, rejeição, budget e compatibilidade legada.

## K. Test protocol

No gerador existente, selecionar High Ticket e executar três lotes pequenos: uma empresa industrial/distribuidora complexa, uma PME ambígua e um micro negócio simples. Comparar High Ticket Fit, hipóteses, evidence, mensagem e decisão; nenhuma mensagem deve ser enviada sem Francisco Gate.

## L. Limitations

A pesquisa pública não conhece os processos internos nem faturação. Deteção de decisores é conservadora e pode devolver desconhecido. PDFs binários não são extraídos nesta versão; apenas links e páginas públicas suportadas entram na análise.

## M. Technical debt

Os filtros Setor/Região continuam suportados pela fonte Google Places e não estimam dimensão empresarial. A calibração futura deve usar feedback manual real, sem reescrever scores históricos.

## N. Fora de âmbito confirmado

Quest continua inelegível para High Ticket. Autopilot, SELL, BUILD, proposta, orçamento, contrato, nova pipeline, novo gerador e automação do Diagnóstico não foram implementados.
