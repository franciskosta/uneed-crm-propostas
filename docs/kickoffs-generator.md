# Gerador de kickoffs — fase 1

## Estado da entrega

Implementação local sobre `31f87b2`, a ponta de `origin/main` verificada no início da tarefa. **Sem deploy, migração ou emails reais nesta tarefa.**

O Supabase público de produção foi identificado em `crm.uneed.pt/supabase-config.js`: `kkmjocyhtcbmlmbhispo`. O conector disponível só lista staging e recusou uma consulta read-only a produção. Não usar o staging como substituto. A extração de todas as variáveis Vercel foi bloqueada pela revisão de segurança; não foi criado um ficheiro com segredos de produção.

## Reutilização / alterações

- Catálogo do backend antigo extraído sem mudar preços para `kickoff-catalog.js`; usado por ambos os backends e pelo novo editor.
- `api/kickoff-email.js` mantém SMTP/Nodemailer; apenas exporta também o template visual e escape para reutilização.
- `customer-model.js` fornece os cálculos de IVA/retenção. Não cria faturação nem altera métricas.
- Ficha de cliente abre o gerador com dados da proposta; High Ticket/Outros conserva o guia existente.
- Novo separador Kickoffs, formulário de oferta, pesquisa/filtros, duplicação, pré-visualização interna, copiar link, enviar convite, validações, reenvios e histórico.
- Novo percurso público de seis etapas e acompanhamento com tokens. O formulário `/kickoff` antigo e `kickoff_submissions` permanecem intactos.

## Persistência proposta e aprovação

Ficheiro gerado pelo CLI: `supabase/migrations/20260929015421_kickoff_flows.sql`.

Uma tabela **nova**, `kickoff_flows`, contém proprietário, hash do token, revisão otimista e documento com oferta, respostas, checklist, eventos e registos SMTP. Índices por proprietário/data e hash único. RLS ativo; `anon`/`authenticated` sem privilégios; apenas o backend tem SELECT/INSERT/UPDATE. Sem DELETE, funções privilegiadas, mudança de tabelas antigas ou políticas existentes.

Antes de aplicar: aprovação explícita, ligação ao projeto correto, verificar ausência de tabela homónima e estado atual do schema. Depois: conferir estrutura, privilégios e advisors; executar teste controlado em ambiente não produtivo. O SQL ainda não foi executado nem validado numa base real. Não fazer `db push` indiscriminadamente sobre migrações preexistentes.

## Segurança

Autenticação interna validada no servidor e existência de `crm_state` pertencente ao utilizador; todas as operações internas limitadas ao proprietário. O endpoint público só aceita um token aleatório de 256 bits no header. A projeção pública exclui notas internas, IDs comerciais e dados de envio SMTP.

O token tem hash para pesquisa e cópia cifrada AES-GCM para a ação interna «copiar link». A chave deriva do segredo de backend já configurado. **Rodar esse segredo exige um plano para reemitir os links**; não rotacionar credenciais como parte desta entrega.

Oferta bloqueada após emissão; duplicação produz rascunho com outro ID, sem token, respostas ou validações. Revogação/expiração bloqueiam o acesso. Mudanças de conteúdo após submissão invalidam conteúdo/validação final; um kickoff concluído é só leitura para o cliente.

Controlo otimista de revisão impede lost updates. SMTP tem claim persistente antes de enviar e não repete automaticamente resultados pendentes/desconhecidos; reenvio exige confirmação humana. «Aceite» significa aceite SMTP, não entrega na caixa de correio.

Limites de payload real e throttling de escrita por documento; limitador por IP em memória por instância. Para proteção distribuída contra abuso volumétrico, configurar regras WAF no projeto antes de uma exposição ampla; o limitador em memória não é um limite global entre instâncias. URLs com token não devem ser encaminhados a analytics ou registados pela aplicação. Rever também a retenção dos logs de acesso da plataforma.

## Limites explícitos desta fase

- GoCardless por link e validação manual, sem API/webhooks.
- Conteúdos por links partilhados ou email; **não há upload direto**. Upload privado exige um bucket e políticas adicionais, a aprovar separadamente.
- Planos iniciais Presença/Marcações/Leads. High Ticket mantém a página existente.
- Cada oferta tem uma periodicidade; propostas com linhas em periodicidades diferentes ou serviços não mapeáveis são recusadas na importação, sem omitir linhas.
- Pré-visualização interna mostra a oferta, sem simular preenchimento ou envio. Percurso completo verificado pelo smoke test local.
- A gravação do progresso é automática; a página de acompanhamento reflete os estados ao recarregar, sem realtime.
- Dados recolhidos ficam associados ao kickoff; não sobrescrevem automaticamente a ficha do cliente nem criam faturas.
- A taxa fixa do `/kickoff` legado foi preservada por compatibilidade. O percurso personalizado novo usa IVA/retenção da oferta, incluindo zero. Não encaminhar ofertas personalizadas para o formulário legado.

## Verificação e publicação

Executar `npm ci`, `npm test`, `node --test test/release-surface.test.js`, `npm run build`, `git diff --check`.

Smoke visual: `NODE_PATH=<diretório com playwright> node scripts/smoke-kickoffs-ui.js`. Usa apenas dados fictícios em memória e SMTP simulado; percorre CRM → gerar link → seis etapas → acompanhamento, verifica mobile e erros JavaScript.

Antes do deploy: confirmar novamente `origin/main`, integrar sem perder alterações concorrentes, aplicar/verificar migração aprovada e confirmar variáveis já existentes de Supabase/SMTP. Não extrair nem publicar segredos. Versionar exatamente o deploy. Não publicar menu/API novos sem a tabela operacional.

Após deploy: verificar PROSPEÇÃO, Kanban, lembretes, Clientes, Contratos, Soundzzzcape, `/kickoff`, `/api/kickoff`, novo módulo e rejeição de token inválido. Qualquer submissão/email real requer autorização explícita.

Rollback: reverter apenas este commit de aplicação e publicar a versão anterior validada. Manter `kickoff_flows` e respetivos dados para recuperação; não executar DROP nem apagar histórico. Não desfazer alterações de outras tarefas.
