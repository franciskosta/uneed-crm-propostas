-- ADDITIVE ONLY. Requires explicit approval before production execution.
begin;
create table public.kickoff_flows (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete restrict,
  token_hash text unique check (token_hash is null or token_hash ~ '^[0-9a-f]{64}$'),
  revision integer not null default 1 check (revision > 0),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 524288),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kickoff_flows_owner_created_idx on public.kickoff_flows(owner_id, created_at desc);
alter table public.kickoff_flows enable row level security;
revoke all on public.kickoff_flows from public, anon, authenticated;
grant select, insert, update on public.kickoff_flows to service_role;
comment on table public.kickoff_flows is 'Backend-only personalized kickoffs. Owner-scoped authenticated API and token-scoped public projection. Legacy kickoff_submissions unchanged.';
commit;
