alter table missions add column if not exists worker_id text;
alter table missions add column if not exists type text;
alter table missions add column if not exists objective text;
alter table missions add column if not exists priority text default 'normal';
alter table missions add column if not exists autonomy_level text;
alter table missions add column if not exists claimed_at timestamptz;
alter table missions add column if not exists heartbeat_at timestamptz;
alter table missions add column if not exists attempt integer not null default 0;
alter table missions add column if not exists max_attempts integer not null default 3;
alter table missions add column if not exists next_run_at timestamptz;
alter table missions add column if not exists cancel_requested_at timestamptz;

create index if not exists missions_queue_idx on missions(status, next_run_at, updated_at);
create unique index if not exists missions_one_active_target_idx
  on missions(user_id, type, target_type, target_id)
  where status in ('queued', 'running', 'waiting_approval');
