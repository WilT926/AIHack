-- Append-only integrity telemetry; no student text or prompt content is stored.
create table if not exists public.engine_events (
  id text primary key,
  session_id text not null,
  created_at timestamptz not null default now(),
  rule text not null,
  stage text not null check (stage in ('input', 'output')),
  action text not null check (action in ('ignored', 'dropped', 'trimmed')),
  location text not null,
  reason text not null,
  count integer not null check (count > 0)
);
create index if not exists engine_events_session on public.engine_events(session_id, created_at);
alter table public.engine_events enable row level security;
-- Service-role access only, like the other server-owned tables.
revoke all on public.engine_events from anon, authenticated;
grant select, insert, update, delete on public.engine_events to service_role;
