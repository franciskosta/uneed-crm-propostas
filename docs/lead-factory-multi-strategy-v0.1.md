# Lead Factory Multi-Strategy Foundation v0.1

## A. Auditoria inicial

A Lead Factory já tinha um único gerador, `leadFactoryBatchId`, CRM Core, DISCOVER, score e Policy comuns. Não existia Campaign separada nem campo de estratégia. A recomendação Presença estava implícita na Lead Intelligence.

## B. Estruturas reutilizadas

Foram preservados gerador, lote, Company, Lead, Mission, Skills, Research Pack, Activity e Kanban. O batch existente funciona como correlação da campanha, sem nova entidade ou base.

## C. Novos campos e configuração

A configuração `acquisition-strategies-v0.1` define `serviceId`, `questEligible`, `assignmentMode`, mínimo, revisão humana, canais, research profile, qualification profile e message policy. Lead Intelligence guarda `strategyId`, `qualificationProfileVersion` e `messagePolicyVersion`.

## D. Estratégias registadas

- `uneed_presence`: ativa, executável, serviço `uneed_presence`, Quest eligible, revisão normal e políticas atuais.
- `high_ticket`: tipo válido, não executável, sem serviço, não elegível para Quest, revisão estrita e policies ainda não configuradas.

## E. Gerador

O mesmo formulário ganhou um seletor discreto. Presença continua selecionada por omissão. High Ticket aparece como “inteligência em configuração” e não pode iniciar lotes.

## F. Missions

Cada Mission recebe `acquisitionStrategy` e `serviceId`; o contexto é propagado aos steps e `strategyId` é persistido no Research Pack.

## G. Migração

Leads antigos só recebem `uneed_presence` quando a origem e autoria confirmam Lead Factory. Leads manuais ou ambíguos ficam com estratégia `null`. Company não é duplicada.

## H. Compatibilidade

Presença, DISCOVER, Lead Intelligence, Kanban e cards antigos continuam a usar os mesmos fluxos e formatos aditivos.

## I. Testes

Cobrem defaults, propagação, Quest eligibility, bloqueio High Ticket, ausência de serviço inventado, score Presença, Mission, Lead e migração conservadora.

## J. Limitações

Não existem ainda métricas por estratégia nem objeto Campaign persistido independente; `leadFactoryBatchId` é o correlator do lote. High Ticket permanece deliberadamente sem inteligência.

## K. Confirmação de âmbito

High Ticket Intelligence, Quest, Autopilot, nova pipeline, nova base, novo gerador, novas Skills e mensagens High Ticket não foram implementados.
