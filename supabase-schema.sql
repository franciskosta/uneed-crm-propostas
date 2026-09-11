create table if not exists public.crm_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_id text,
  due_date date,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'prepared',
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  client_name text not null,
  company_name text,
  email text not null,
  phone text,
  project_url text,
  category text not null default 'Suporte geral',
  priority text not null default 'Normal',
  status text not null default 'Novo',
  subject text not null,
  message text not null,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  objective text not null,
  status text not null check (status in ('draft','queued','running','waiting_approval','completed','failed','cancelled')),
  priority text not null default 'normal',
  target_type text not null,
  target_id text not null,
  autonomy_level text not null check (autonomy_level in ('OBSERVE','SUGGEST','PREPARE','EXECUTE','AUTONOMOUS')),
  data jsonb not null,
  worker_id text,
  claimed_at timestamptz,
  heartbeat_at timestamptz,
  attempt integer not null default 0,
  max_attempts integer not null default 3,
  next_run_at timestamptz,
  cancel_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.missions add column if not exists worker_id text;
alter table public.missions add column if not exists claimed_at timestamptz;
alter table public.missions add column if not exists heartbeat_at timestamptz;
alter table public.missions add column if not exists attempt integer not null default 0;
alter table public.missions add column if not exists max_attempts integer not null default 3;
alter table public.missions add column if not exists next_run_at timestamptz;
alter table public.missions add column if not exists cancel_requested_at timestamptz;

create index if not exists missions_user_status_idx on public.missions(user_id, status, updated_at desc);
create index if not exists missions_queue_idx on public.missions(status, next_run_at, updated_at);
create unique index if not exists missions_one_active_target_idx on public.missions(user_id, type, target_type, target_id) where status in ('queued','running','waiting_approval');

alter table public.crm_state enable row level security;
alter table public.email_reminders enable row level security;
alter table public.support_tickets enable row level security;
alter table public.missions enable row level security;

drop policy if exists "crm_state_select_own" on public.crm_state;
drop policy if exists "crm_state_insert_own" on public.crm_state;
drop policy if exists "crm_state_update_own" on public.crm_state;
drop policy if exists "email_reminders_select_own" on public.email_reminders;
drop policy if exists "email_reminders_insert_own" on public.email_reminders;
drop policy if exists "email_reminders_update_own" on public.email_reminders;
drop policy if exists "support_tickets_public_insert" on public.support_tickets;
drop policy if exists "support_tickets_admin_select" on public.support_tickets;
drop policy if exists "support_tickets_admin_update" on public.support_tickets;
drop policy if exists "missions_select_own" on public.missions;
drop policy if exists "missions_insert_own" on public.missions;
drop policy if exists "missions_update_own" on public.missions;

create policy "crm_state_select_own"
on public.crm_state for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "crm_state_insert_own"
on public.crm_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "crm_state_update_own"
on public.crm_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "email_reminders_select_own"
on public.email_reminders for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "email_reminders_insert_own"
on public.email_reminders for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "email_reminders_update_own"
on public.email_reminders for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "support_tickets_public_insert"
on public.support_tickets for insert
to anon, authenticated
with check (
  status = 'Novo'
  and priority in ('Baixa', 'Normal', 'Alta', 'Urgente')
  and length(client_name) between 2 and 160
  and length(email) between 5 and 240
  and length(subject) between 3 and 240
  and length(message) between 5 and 6000
);

create policy "support_tickets_admin_select"
on public.support_tickets for select
to authenticated
using (true);

create policy "support_tickets_admin_update"
on public.support_tickets for update
to authenticated
using (true)
with check (true);

create policy "missions_select_own"
on public.missions for select
to authenticated
using ((select auth.uid()) = user_id);

-- Mission mutations are backend-only. The service role bypasses RLS;
-- authenticated browser clients can only read their own Missions.

create or replace function public.claim_next_uneed_mission(p_worker_id text, p_now timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.missions;
begin
  select * into claimed
  from public.missions
  where status = 'queued' and (next_run_at is null or next_run_at <= p_now)
  order by updated_at asc
  for update skip locked
  limit 1;
  if claimed.id is null then return null; end if;
  update public.missions
  set status = 'running', worker_id = p_worker_id, claimed_at = p_now,
      heartbeat_at = p_now, attempt = attempt + 1, updated_at = p_now,
      data = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(data,
        '{status}', '"running"'), '{workerId}', to_jsonb(p_worker_id)),
        '{claimedAt}', to_jsonb(p_now::text)), '{heartbeatAt}', to_jsonb(p_now::text)),
        '{attempt}', to_jsonb(attempt + 1))
  where id = claimed.id
  returning data into claimed.data;
  return claimed.data;
end;
$$;

revoke all on function public.claim_next_uneed_mission(text, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_next_uneed_mission(text, timestamptz) to service_role;
