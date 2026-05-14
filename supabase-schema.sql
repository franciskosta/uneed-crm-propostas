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

alter table public.crm_state enable row level security;
alter table public.email_reminders enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists "crm_state_select_own" on public.crm_state;
drop policy if exists "crm_state_insert_own" on public.crm_state;
drop policy if exists "crm_state_update_own" on public.crm_state;
drop policy if exists "email_reminders_select_own" on public.email_reminders;
drop policy if exists "email_reminders_insert_own" on public.email_reminders;
drop policy if exists "email_reminders_update_own" on public.email_reminders;
drop policy if exists "support_tickets_public_insert" on public.support_tickets;
drop policy if exists "support_tickets_admin_select" on public.support_tickets;
drop policy if exists "support_tickets_admin_update" on public.support_tickets;

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
