-- Additive bridge from legacy CRM modules to the unified commercial core.
-- No legacy column, row or JSON field is removed.

alter table public.support_tickets add column if not exists company_id uuid;
alter table public.support_tickets add column if not exists contact_id uuid;
alter table public.support_tickets add column if not exists project_id uuid;

alter table public.email_reminders add column if not exists company_id uuid;
alter table public.email_reminders add column if not exists lead_id uuid;
alter table public.email_reminders add column if not exists opportunity_id uuid;

alter table public.missions add column if not exists company_id uuid;
alter table public.missions add column if not exists lead_id uuid;
alter table public.missions add column if not exists opportunity_id uuid;

create index if not exists support_tickets_company_idx on public.support_tickets(company_id, updated_at desc);
create index if not exists missions_company_idx on public.missions(user_id, company_id, updated_at desc);
create index if not exists missions_lead_idx on public.missions(user_id, lead_id, updated_at desc);
