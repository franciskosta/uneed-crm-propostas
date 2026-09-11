# UNEED Lead Intelligence — Calibration v0.1

## A. Bugs corrigidos

- Outputs estruturados deixam de ser convertidos implicitamente para string; objetos de gaps, oportunidades, evidência e recomendações passam por formatação segura.
- O catálogo editável deixou de alimentar livremente a recomendação da Lead Factory.
- Score, readiness, serviço e mensagem passam a ser reconciliados em conjunto.

## B. Scoring

Mantém-se o score único `lead-intelligence-v0.1`, explicável e versionado. Um negócio confirmado, contactável e com falha observada de CTA/marcação recebe peso comercial coerente. `ready_for_contact` exige simultaneamente threshold, identidade, canal, oportunidade, `service_id` e mensagem.

## C. Service matching

Negócios locais visuais ou dependentes de pedidos/marcações usam primeiro `uneed_presence`. Não há fallback para nomes livres. Sem fit confirmado, o resultado fica para revisão.

## D. Catálogo oficial

`uneed_presence` é a source of truth desta calibração: Uneed Presença, desde 39€ + IVA/mês, mensal, sem fidelização, com página profissional, domínio, email, alojamento, suporte e pedidos de marcação integrados. Landing: https://presenca.uneed.pt/.

## E. Copy

A mensagem identifica Francisco e a Uneed, usa uma observação suportada, apresenta Uneed Presença com condições oficiais e termina com proposta de simulação sem compromisso. Follow-ups são curtos, coerentes e nunca enviados automaticamente.

## F. UI

O modal mostra primeiro: Porque contactar, Principal oportunidade, Solução UNEED, Estratégia, Mensagem e Canais. Evidência e informação técnica surgem depois. Confiança passa a ter nível e razões.

## G. Testes

Foram acrescentados testes para catálogo oficial, ausência de nomes inventados, separação gaps/oportunidades/unknowns, comunicação digital, coerência de score/copy e regressão de `[object Object]`.

## H. Antes/depois

Antes: `40/100`, problema renderizado como `[object Object]`, solução `LEADS START` e argumento técnico. Depois: score alinhado com sinais, principal lacuna comercial em linguagem simples, Uneed Presença por `service_id`, preço/condições oficiais e ângulo de contacto fundamentado.

## I. Limitações

A avaliação de branding, copy e experiência mobile só pode ser conclusiva quando as páginas fornecem evidência suficiente; caso contrário permanece `unknown`. A calibração não cria Autopilot, envios automáticos, Skills, providers, SELL ou Quest.
