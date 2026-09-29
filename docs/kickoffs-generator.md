# Gerador de kickoffs — fase 1

## Estado da entrega

Implementação sobre `31f87b2`, a ponta de `origin/main` verificada no início da tarefa. Em 29/09, o utilizador autorizou a tabela e pediu uploads seguros. A tabela e o bucket privado foram aplicados pelo SQL Editor da sessão autorizada, após verificação read-only; sem alterar clientes/submissões existentes nem enviar emails reais.

O Supabase de produção é `kkmjocyhtcbmlmbhispo`. O conector só lista staging, mas a sessão autorizada no navegador Codex dá acesso ao projeto correto. Não usar staging como substituto. Não foi extraído qualquer ficheiro com segredos de produção.

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

Aplicadas pelo SQL Editor as migrações `20260929015421_kickoff_flows.sql` e `20260929022549_kickoff_private_images.sql`, numa transação. Verificação SQL confirmou tabela com RLS ativo, anon/authenticated sem SELECT, service_role com INSERT e zero kickoffs criados. Bucket `kickoff-images` privado, 10 MB e MIME restritos. Não reaplicar estes scripts nem fazer `db push` indiscriminadamente: o SQL Editor não regista automaticamente histórico no CLI.

Advisor: zero erros; dois avisos preexistentes sobre `support_tickets` permissivo e leaked-password protection desligada. Não foram alterados por estarem fora do âmbito. Ausência de políticas na tabela nova é intencional: acesso exclusivo pelo backend.

## Segurança

Autenticação interna validada no servidor e existência de `crm_state` pertencente ao utilizador; todas as operações internas limitadas ao proprietário. O endpoint público só aceita um token aleatório de 256 bits no header. A projeção pública exclui notas internas, IDs comerciais e dados de envio SMTP.

O token tem hash para pesquisa e cópia cifrada AES-GCM para a ação interna «copiar link». A chave deriva do segredo de backend já configurado. **Rodar esse segredo exige um plano para reemitir os links**; não rotacionar credenciais como parte desta entrega.

Oferta bloqueada após emissão; duplicação produz rascunho com outro ID, sem token, respostas ou validações. Revogação/expiração bloqueiam o acesso. Mudanças de conteúdo após submissão invalidam conteúdo/validação final; um kickoff concluído é só leitura para o cliente.

Controlo otimista de revisão impede lost updates. SMTP tem claim persistente antes de enviar e não repete automaticamente resultados pendentes/desconhecidos; reenvio exige confirmação humana. «Aceite» significa aceite SMTP, não entrega na caixa de correio.

Limites de payload real e throttling de escrita por documento; limitador por IP em memória por instância. Para proteção distribuída contra abuso volumétrico, configurar regras WAF no projeto antes de uma exposição ampla; o limitador em memória não é um limite global entre instâncias. URLs com token não devem ser encaminhados a analytics ou registados pela aplicação. Rever também a retenção dos logs de acesso da plataforma.

## Limites explícitos desta fase

- GoCardless por link e validação manual, sem API/webhooks.
- Upload direto de JPG/PNG/WebP, até 10 MB e 40 megapíxeis, estáticos. Máximo 20 reservas por kickoff, orçamento conservador de 100 MB incluindo quarentena/cópia validada; ficheiros maiores/outros formatos por links. Não converte HEIC nem redimensiona/comprime os originais.
- Planos iniciais Presença/Marcações/Leads. High Ticket mantém a página existente.
- Cada oferta tem uma periodicidade; propostas com linhas em periodicidades diferentes ou serviços não mapeáveis são recusadas na importação, sem omitir linhas.
- Pré-visualização interna mostra a oferta, sem simular preenchimento ou envio. Percurso completo verificado pelo smoke test local.
- A gravação do progresso é automática; a página de acompanhamento reflete os estados ao recarregar, sem realtime.
- Dados recolhidos ficam associados ao kickoff; não sobrescrevem automaticamente a ficha do cliente nem criam faturas.
- A taxa fixa do `/kickoff` legado foi preservada por compatibilidade. O percurso personalizado novo usa IVA/retenção da oferta, incluindo zero. Não encaminhar ofertas personalizadas para o formulário legado.

## Verificação e publicação

Uploads: reserva autenticada pelo token, URL de upload assinado sem overwrite (validade Supabase: 2 horas), armazenamento privado de quarentena, verificação de assinatura/tipo e descodificação completa via sharp, cópia imutável dos bytes originais e só depois disponibilidade para download. Downloads como anexo, assinados por 60 segundos. Uma URL de download já emitida permanece válida até esse prazo mesmo após revogação do kickoff. Nenhuma imagem é publicada no website automaticamente.

Uploads incompletos/rejeitados contam para a quota para impedir abuso; não há limpeza automática destrutiva. A quarentena conserva a cópia de entrada, contabilizada no orçamento. Monitorizar o espaço total do plano Free. Se necessário, preparar limpeza com confirmação humana, sem apagar originais aceites. Os metadados do original (incluindo EXIF) também são preservados: rever antes de publicar. Validação de imagem não é um antivírus.

Testes locais: suite 125 testes passou após adição de uploads; formulário testado no navegador com PNG sintético de 1200 × 800, transporte e backend em memória, confirmando «original guardado». Nenhuma imagem de teste foi enviada para Supabase de produção.

Executar `npm ci`, `npm test`, `node --test test/release-surface.test.js`, `npm run build`, `git diff --check`.

Smoke visual: `NODE_PATH=<diretório com playwright> node scripts/smoke-kickoffs-ui.js`. Usa apenas dados fictícios em memória e SMTP simulado; percorre CRM → gerar link → seis etapas → acompanhamento, verifica mobile e erros JavaScript.

Antes do deploy: confirmar novamente `origin/main`, integrar sem perder alterações concorrentes, aplicar/verificar migração aprovada e confirmar variáveis já existentes de Supabase/SMTP. Não extrair nem publicar segredos. Versionar exatamente o deploy. Não publicar menu/API novos sem a tabela operacional.

Após deploy: verificar PROSPEÇÃO, Kanban, lembretes, Clientes, Contratos, Soundzzzcape, `/kickoff`, `/api/kickoff`, novo módulo e rejeição de token inválido. Qualquer submissão/email real requer autorização explícita.

Rollback: reverter apenas este commit de aplicação e publicar a versão anterior validada. Manter `kickoff_flows` e respetivos dados para recuperação; não executar DROP nem apagar histórico. Não desfazer alterações de outras tarefas.
