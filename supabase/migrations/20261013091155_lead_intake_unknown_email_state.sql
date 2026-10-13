alter table public.lead_intake_requests
  drop constraint if exists lead_intake_requests_admin_notification_status_check,
  add constraint lead_intake_requests_admin_notification_status_check
    check (admin_notification_status in ('pending', 'sending', 'sent', 'failed', 'unknown')),
  drop constraint if exists lead_intake_requests_customer_notification_status_check,
  add constraint lead_intake_requests_customer_notification_status_check
    check (customer_notification_status in ('pending', 'sending', 'sent', 'failed', 'unknown', 'not_applicable'));

comment on column public.lead_intake_requests.admin_notification_status is
  'Internal email state. unknown is an ambiguous provider outcome and is never retried automatically.';
comment on column public.lead_intake_requests.customer_notification_status is
  'Lead receipt state. unknown is an ambiguous provider outcome and is never retried automatically.';
