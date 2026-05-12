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

alter table public.crm_state enable row level security;
alter table public.email_reminders enable row level security;

drop policy if exists "crm_state_select_own" on public.crm_state;
drop policy if exists "crm_state_insert_own" on public.crm_state;
drop policy if exists "crm_state_update_own" on public.crm_state;
drop policy if exists "email_reminders_select_own" on public.email_reminders;
drop policy if exists "email_reminders_insert_own" on public.email_reminders;
drop policy if exists "email_reminders_update_own" on public.email_reminders;

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
