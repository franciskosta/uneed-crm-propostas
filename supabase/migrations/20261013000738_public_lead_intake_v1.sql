create table if not exists public.lead_intake_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  origin text not null check (origin in ('uneed.pt', '360.uneed.pt', 'presenca.uneed.pt')),
  product text not null check (product in ('uneed', 'uneed_360', 'uneed_presence')),
  idempotency_key text not null check (length(idempotency_key) between 16 and 128),
  reference text not null unique,
  payload jsonb not null,
  estimate jsonb not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'archived')),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sending', 'sent', 'failed')),
  notification_detail jsonb not null default '{}'::jsonb,
  ip_hash text not null check (length(ip_hash) = 64),
  contact_hash text not null check (length(contact_hash) = 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (origin, idempotency_key)
);

create index if not exists lead_intake_owner_created_idx
  on public.lead_intake_requests(owner_id, created_at desc);
create index if not exists lead_intake_ip_created_idx
  on public.lead_intake_requests(ip_hash, created_at desc);
create index if not exists lead_intake_contact_created_idx
  on public.lead_intake_requests(contact_hash, created_at desc);

alter table public.lead_intake_requests enable row level security;

revoke all on table public.lead_intake_requests from public, anon, authenticated;
grant select on table public.lead_intake_requests to authenticated;
grant select, insert, update on table public.lead_intake_requests to service_role;

drop policy if exists "lead_intake_select_own" on public.lead_intake_requests;
create policy "lead_intake_select_own"
on public.lead_intake_requests
for select
to authenticated
using ((select auth.uid()) = owner_id);

comment on table public.lead_intake_requests is
  'Durable public website lead inbox. Public sites use the CRM server endpoint; direct anon access is forbidden.';
