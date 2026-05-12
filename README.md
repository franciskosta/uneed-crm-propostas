# UNEED Propostas CRM

Gerador local de propostas e mini CRM comercial para a UNEED.

## Como abrir

Opção recomendada no Mac:

1. Fazer duplo clique em `abrir-uneed-crm.command`.
2. Abrir ou atualizar `http://127.0.0.1:8090`.

Opção simples:

1. Abrir `index.html` no browser.
2. Criar ou editar uma proposta.
3. Carregar em `Gerar PDF` e escolher `Guardar como PDF`.

Opção com servidor local:

```bash
npm start
```

Depois abrir:

```text
http://127.0.0.1:8090
```

## O que já inclui

- Login seguro com sessão `HttpOnly`.
- Preparação para Railway + PostgreSQL.
- Entrada manual de pedidos.
- Catálogo de serviços editável.
- Tabela comercial limpa a partir de `precos.html`.
- Produtos principais: UNEED START, LEADS START, LEADS FLOW, LEADS AI, BOOKINGS START, BOOKINGS PRO e BOOKINGS PREMIUM.
- Modalidades de pronto pagamento e avença/mensalidade conforme definido na tabela.
- Propostas com separação entre valor pontual/setup, mensalidade e valor anual.
- Campo de NIF na proposta.
- Geração de orçamento com template A4.
- QR code automático para o link da amostra.
- QR code local/offline, sem depender de serviços externos.
- Pipeline CRM por estados.
- Follow-ups e próximas ações.
- Backend local leve para registar lembretes de email.
- Destaque visual de follow-ups em atraso.
- Valores propostos, pagos e faturados.
- Meta mensal com progresso gamificado.
- Tab de avenças ativas com receita mensal recorrente, meta própria, ranking e contratos ativos.
- Exportação/importação de backup em JSON.

## Emails automáticos

Sem configuração, o botão `Email` prepara o email, regista o lembrete quando o backend local estiver ativo e abre o cliente de email do computador.

Para envio automático online, inicia o servidor com:

```bash
RESEND_API_KEY="a_tua_chave" EMAIL_FROM="UNEED <hello@uneed.pt>" npm start
```

O backend guarda lembretes em `.local/email-reminders.json`. Para produção, esta parte deve passar para uma base de dados e um provider de email configurado.

## Colocar online com Supabase + Vercel

Este é o caminho recomendado para começar online com baixo custo:

- Domínio: `crm.uneed.pt`
- Frontend: Vercel
- Login/base de dados: Supabase Auth + PostgreSQL
- Estado do CRM: tabela `crm_state`
- Lembretes preparados: tabela `email_reminders`

Passos:

1. Criar projeto no Supabase.
2. Em Supabase SQL Editor, executar `supabase-schema.sql`.
3. Em Authentication > Users, criar o utilizador `geral@uneed.pt` com password forte.
4. Copiar `Project URL` e `anon public key`.
5. Criar projeto na Vercel ligado ao repositório.
6. Configurar variáveis na Vercel:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

7. Confirmar build:

```bash
npm run build
```

8. Na Vercel, adicionar domínio `crm.uneed.pt`.
9. No DNS de `uneed.pt`, criar o registo indicado pela Vercel.

O ficheiro `supabase-config.js` fica vazio localmente por segurança. No deploy, `build-vercel.js` cria a configuração a partir das variáveis da Vercel.

## Colocar online na Railway

Configuração escolhida:

- Domínio: `crm.uneed.pt`
- Email de envio: `UNEED <geral@uneed.pt>`
- Base de dados: PostgreSQL na Railway

Passos:

1. Criar um projeto na Railway.
2. Adicionar um serviço PostgreSQL.
3. Adicionar este projeto como serviço Node.js.
4. Configurar as variáveis:

```bash
NODE_ENV=production
ADMIN_EMAIL=geral@uneed.pt
ADMIN_PASSWORD=uma-password-muito-forte
DATABASE_URL=valor-gerado-pela-railway
RESEND_API_KEY=chave-da-resend
EMAIL_FROM=UNEED <geral@uneed.pt>
```

5. No Resend, validar o domínio `uneed.pt` e configurar os registos DNS SPF/DKIM pedidos.
6. Na Railway, adicionar o domínio customizado `crm.uneed.pt`.
7. No DNS do domínio, criar o CNAME indicado pela Railway para `crm.uneed.pt`.

Nota: o login inicial é criado automaticamente com `ADMIN_EMAIL` e `ADMIN_PASSWORD` no primeiro arranque.

## Nota sobre dados

Localmente, sem PostgreSQL, os dados do servidor ficam em `.local/server-data.json` e também há cópia no `localStorage` do browser. Em produção com `DATABASE_URL`, os dados ficam no PostgreSQL.
