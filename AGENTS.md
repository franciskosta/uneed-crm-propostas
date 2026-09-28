# Regras obrigatórias do CRM UNEED

Estas instruções aplicam-se a qualquer agente, tarefa ou intervenção neste repositório.

## Identidade e fonte de verdade

- Repositório oficial: `franciskosta/uneed-crm-propostas`
- Branch de produção: `main`
- Projeto Vercel: `uneed-crm`
- Equipa Vercel: `uneeds-projects-c61cf2c9`
- Domínio de produção: `crm.uneed.pt`
- O kickoff faz parte do CRM existente. Nunca pode substituir a aplicação por uma versão reduzida, um pacote isolado ou uma cópia antiga.
- O commit `8f4921e` integrou a correção que preserva o kickoff/SMTP juntamente com o CRM completo, mas não deve ser assumido como o commit mais recente. Confirmar sempre a ponta atual de `origin/main`.

## Antes de qualquer alteração ou deploy

1. Confirmar explicitamente o repositório, a branch, o projeto Vercel, a equipa e o domínio indicados acima.
2. Obter a versão mais recente de `origin/main`, preservando todas as alterações locais. Nunca publicar a partir de uma pasta temporária desatualizada, cópia antiga, exportação parcial ou pacote isolado do kickoff.
3. Comparar a versão de trabalho com `origin/main` e verificar alterações recentes de outras tarefas antes de editar.
4. Quando a tarefa disser respeito ao kickoff, limitar o diff ao kickoff e aos testes/documentação diretamente necessários. Preservar todos os restantes módulos, APIs, configurações, variáveis de ambiente e agendamentos.
5. Se existirem divergências, alterações locais sobrepostas ou conflitos que não possam ser resolvidos com segurança, parar e explicar o bloqueio antes de publicar.
6. Não alterar dados, tabelas, permissões ou credenciais para resolver um problema de publicação da interface.

## Verificações obrigatórias antes do deploy

- Executar a suite de testes completa e o build.
- Executar especificamente `test/release-surface.test.js`. Nunca remover, ignorar ou enfraquecer as suas verificações.
- Confirmar que o build inclui Prospeção IG, Kanban, lembretes, Centro de Comando, restantes módulos do CRM e kickoff.
- Rever o diff final e confirmar que não existem remoções ou alterações não relacionadas.
- Guardar as alterações no repositório antes de publicar, garantindo que a versão a publicar corresponde exatamente ao código versionado.
- Não fazer deploy se o checkout usado para construir não estiver associado ao repositório e commit confirmados.

## Verificações obrigatórias depois do deploy

- Verificar diretamente em `https://crm.uneed.pt` que **Prospeção IG** continua disponível no menu.
- Confirmar que os ficheiros e recursos dos lembretes são servidos corretamente.
- Verificar `https://crm.uneed.pt/kickoff` e a disponibilidade de `https://crm.uneed.pt/api/kickoff`.
- Não enviar emails reais nem criar submissões de teste em produção sem autorização explícita do utilizador.
- Não declarar sucesso apenas porque a Vercel terminou o build. O sucesso exige a verificação funcional da superfície de produção acima.

## Proteção contra regressões de publicação

- O deploy deve partir sempre do checkout oficial atualizado e nunca de diretórios temporários usados para contornar a atribuição Git.
- Se a Vercel bloquear um deploy por identidade Git, corrigir a configuração/identidade no fluxo oficial; não publicar uma cópia alternativa do projeto.
- Qualquer alteração ao fluxo de deployment deve preservar os módulos existentes e as verificações de release do repositório.
