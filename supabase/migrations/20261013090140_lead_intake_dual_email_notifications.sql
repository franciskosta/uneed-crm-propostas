alter table public.lead_intake_requests
  add column if not exists admin_notification_status text not null default 'pending'
    check (admin_notification_status in ('pending', 'sending', 'sent', 'failed')),
  add column if not exists admin_notification_detail jsonb not null default '{}'::jsonb,
  add column if not exists customer_notification_status text not null default 'not_applicable'
    check (customer_notification_status in ('pending', 'sending', 'sent', 'failed', 'not_applicable')),
  add column if not exists customer_notification_detail jsonb not null default '{}'::jsonb;

-- Preserve the existing internal-notification result. Existing leads deliberately
-- remain not_applicable for customer email so this deployment never sends receipts
-- retroactively. New requests set customer_notification_status explicitly.
update public.lead_intake_requests
set admin_notification_status = notification_status,
    admin_notification_detail = notification_detail;

comment on column public.lead_intake_requests.admin_notification_status is
  'Independent delivery state for the internal UNEED notification.';
comment on column public.lead_intake_requests.customer_notification_status is
  'Independent delivery state for the lead receipt. Existing rows are not sent retroactively.';
