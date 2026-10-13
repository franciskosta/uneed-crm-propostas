# Public Lead Intake v1

Contrato do formulário público dos sites UNEED para o CRM atual em `https://crm.uneed.pt`.

## Endpoint

- `POST https://crm.uneed.pt/api/lead-intake`
- `OPTIONS https://crm.uneed.pt/api/lead-intake` para preflight CORS
- `Content-Type: application/json`
- Tamanho máximo: 32 KiB
- Origins autorizadas: `https://uneed.pt`, `https://360.uneed.pt`, `https://presenca.uneed.pt`

O endpoint não cria kickoff, não inicia pagamentos e não envia mensagens ao visitante. Primeiro guarda o pedido numa tabela própria e durável, depois tenta enviar um aviso interno para `geral@uneed.pt`.

## Request

```json
{
  "schemaVersion": "lead-intake-v1",
  "idempotencyKey": "uuid-gerado-uma-vez-por-tentativa-do-formulario",
  "origin": "uneed.pt",
  "product": "uneed",
  "contact": {
    "name": "Nome obrigatório",
    "email": "email@exemplo.pt",
    "phone": "+351 900 000 000"
  },
  "business": {
    "name": "Negócio opcional",
    "sector": "Área opcional",
    "website": "https://exemplo.pt"
  },
  "message": "Mensagem opcional",
  "configuration": {},
  "consent": {
    "privacy": true,
    "privacyVersion": "2026-10-13"
  },
  "context": {
    "pageUrl": "https://uneed.pt/",
    "referrer": "",
    "utm": {
      "source": "",
      "medium": "",
      "campaign": "",
      "content": "",
      "term": ""
    }
  },
  "antiSpam": {
    "website": "",
    "startedAt": "2026-10-13T12:00:00.000Z"
  }
}
```

Regras comuns:

- `contact.name` é obrigatório.
- É obrigatório pelo menos um de `contact.email` ou `contact.phone`.
- `idempotencyKey` é criado ao abrir/preparar o formulário, conservado durante retries e substituído apenas depois de uma resposta aceite. Repetir a mesma chave com o mesmo conteúdo devolve o mesmo pedido e volta a tentar uma notificação que tenha falhado, sem duplicar envios concorrentes. Reutilizar a chave com conteúdo diferente devolve `409 idempotency_conflict`; uma nova chave conserva um novo pedido, mesmo para o mesmo contacto.
- `antiSpam.website` é o honeypot e tem de ficar vazio. Se vier preenchido, a API não grava nem notifica e devolve `422 anti_spam_triggered`; nunca devolve uma falsa confirmação de receção.
- `consent.privacy` tem de ser `true` e a versão atual é `2026-10-13`.
- A estimativa enviada pelo browser nunca é aceite como preço. O servidor recalcula-a a partir do catálogo.
- O aviso interno e o recibo ao lead têm estados independentes (`admin_notification_status` e `customer_notification_status`). Uma falha não impede o outro envio nem invalida o lead.
- Um estado `sent` significa que o servidor SMTP aceitou o destinatário; a API guarda apenas contagens agregadas de aceites/rejeitados. A entrega final na caixa de correio continua dependente do servidor de destino.
- Um timeout ou erro ambíguo do SMTP fica `unknown` e não é repetido automaticamente, evitando duplicar uma mensagem que possa ter sido aceite antes da falha da ligação.
- O recibo ao lead só é tentado quando existe um email válido. Pedidos antigos ficam `not_applicable` e não recebem mensagens retroativas.

### UNEED / pedido geral

```json
{
  "origin": "uneed.pt",
  "product": "uneed",
  "configuration": {
    "need": "website|requests|team|other"
  }
}
```

### UNEED 360º

Aceite com `origin` igual a `uneed.pt` ou `360.uneed.pt`.

```json
{
  "product": "uneed_360",
  "configuration": {
    "model": "purchase",
    "modules": ["clientes", "propostas", "obras", "agenda", "despesas", "documentos"],
    "clientEstimate": {
      "initial": 1950,
      "monthly": 0,
      "firstYear": 1950
    }
  }
}
```

Catálogo recalculado pelo servidor:

- compra: base `950 €` + `500 €` por módulo; recorrência a orçamentar;
- subscrição: configuração `650 €` + `100 €` por módulo; mensalidade `39 €` + `19 €` por módulo;
- valores sem IVA e sujeitos a definição de âmbito e proposta.

O CTA geral “Falar sobre o meu projeto” também pode enviar `configuration.model` vazio e `modules: []`. Nesse caso o servidor não inventa compra ou subscrição e devolve `priceStatus: "requires_quote"`.

### UNEED Presença

```json
{
  "origin": "presenca.uneed.pt",
  "product": "uneed_presence",
  "configuration": {
    "plan": "start",
    "presenceNeed": "booking",
    "addons": [
      { "key": "email_extra", "quantity": 2 },
      { "key": "idioma_extra", "quantity": 2, "languages": ["EN", "ES"] }
    ],
    "clientEstimate": {
      "initial": 0,
      "monthly": 61,
      "firstYear": 732
    }
  }
}
```

`presenceNeed`: `booking`, `catalogue`, `quote`, `contact` ou `institutional`.

Extras aceites: `remover_branding`, `idioma_extra`, `assistente_guiado`, `assistente_inteligente`, `email_extra`, `backoffice`, `avaliacoes`, `multi_estabelecimento`, `sistema_inscricoes`, `sms_100`, `sms_250`, `sms_500`, `sms_1000`, `cartoes`, `pagina_extra`. O domínio standard já está incluído. O servidor aplica compatibilidades, exclusividades, quantidades e preços do configurador atual. `pagina_extra` fica assinalado como sujeito a orçamento.

## Response aceite

Nova submissão: HTTP `201`. Retry idempotente: HTTP `200`.

```json
{
  "ok": true,
  "accepted": true,
  "duplicate": false,
  "requestId": "uuid",
  "reference": "UNEED-LEAD-261013-ABCDE",
  "notification": "sent",
  "estimate": {
    "currency": "EUR",
    "vatIncluded": false,
    "initial": 650,
    "monthly": 39,
    "firstYear": 1118,
    "priceStatus": "estimated"
  }
}
```

`notification` pode ser `sent`, `pending` ou `failed`. Qualquer destes valores significa que o pedido comercial já ficou guardado. O frontend deve apresentar confirmação com a `reference`; o botão WhatsApp é opcional e manual.

## Erros

```json
{
  "ok": false,
  "error": {
    "code": "validation_failed",
    "message": "Confirme os campos indicados.",
    "fields": ["contact.email_or_phone"]
  }
}
```

- `400`: JSON ou campos inválidos;
- `403`: origin não autorizado;
- `409`: configuração comercial incompatível;
- `413`: payload demasiado grande;
- `415`: `Content-Type` inválido;
- `429`: limite temporário excedido;
- `503`: backend indisponível antes de guardar.

Nunca tratar uma falha de email como falha da submissão já persistida.

## Persistência e CRM

- Os pedidos são guardados em `lead_intake_requests`, nunca escritos diretamente em `crm_state`.
- O CRM autenticado lê apenas os pedidos do seu proprietário via RLS.
- Cada pedido é importado para **PROSPEÇÃO** com `sourceIntakeId`; a reconciliação é idempotente.
- Pedidos diferentes do mesmo contacto mantêm cartões/leads diferentes, podendo partilhar a mesma Company através das regras atuais de identidade.
- O documento completo recebido, a configuração normalizada e a estimativa do servidor permanecem no pedido e no detalhe do cartão.
