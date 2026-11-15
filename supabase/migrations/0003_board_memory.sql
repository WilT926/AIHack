-- The board's memory across attempts, per project (see src/lib/schemas).
alter table public.projects add column if not exists memory jsonb not null default '{"attempts": []}';
