# Alertas de contacto

Cinco dias úteis após a data de 1º contacto: follow-up. Cinco dias úteis após follow-up: break-up. Segunda a sexta, feriados incluídos, calendário Europe/Lisbon. A data inicial não conta. Datas antigas são aceites. O alerta só se aplica à etapa ativa e termina quando o contacto seguinte está registado ou o lead sai dessa etapa.

O browser atualiza flags a cada minuto e verifica emails depois de sincronizar alterações no Supabase. Vercel executa GET /api/contact-alerts diariamente às 08:00 UTC, mesmo com o CRM fechado. POST exige sessão Supabase e processa apenas o utilizador autenticado. GET exige CRON_SECRET.

Variáveis Vercel Production: RESEND_API_KEY, EMAIL_FROM (remetente validado), CRON_SECRET (segredo aleatório), e credenciais Supabase já usadas pelo backend. Sem configuração o endpoint retorna erro explícito e a interface informa que email está indisponível.

Destinatário fixo: geral@uneed.pt. Emails contêm apenas o tipo de ação e ligação ao CRM, sem dados pessoais do lead. Recibos são guardados em email_reminders, com UUID determinístico por utilizador/lead/etapa/data. Pedido ao provider usa a mesma chave de idempotência. Envios incertos com mais de 23h ficam para revisão, evitando repetir após expiração da deduplicação do provider. Limite de 25 tentativas por execução; restantes são retomadas na verificação seguinte.

Ativação: configurar variáveis, publicar, verificar cron autenticado, registar contacto de teste com data passada e confirmar a receção do aviso e a ausência de duplicação ao guardar novamente. Não assinalar o email como validado sem confirmar aceitação do provider.
