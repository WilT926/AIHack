-- Panel: tables matching src/lib/schemas, plus a private bucket for uploads.
-- Column names are snake_case versions of the shape fields; nested parts of a
-- shape (brief, report, paragraphs...) are jsonb and validated in code.
-- Every table has RLS on and no policies: only the server, using the secret
-- key, can read or write. Nothing is reachable with the publishable key.

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  university text not null default '',
  course text not null default '',
  level text not null default 'PGT' check (level in ('UG', 'PGT', 'PGR')),
  avatar text not null default 'avatar-001'
);

create table if not exists public.assessors (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  field text not null default '',
  role text not null default '',
  personality text not null default '',
  harshness int not null default 3 check (harshness between 1 and 5),
  focus_areas text[] not null default '{}',
  avatar text not null default 'avatar-001',
  portrait text,
  idle_clip text,
  talking_clip text,
  voice_id text,
  is_preset boolean not null default false,
  based_on text references public.assessors (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessor_notes (
  id text primary key default gen_random_uuid()::text,
  assessor_id text not null references public.assessors (id) on delete cascade,
  text text not null,
  source text not null default 'other' check (source in ('lecture', 'handbook', 'other')),
  created_at timestamptz not null default now()
);
create index if not exists assessor_notes_assessor_idx on public.assessor_notes (assessor_id);

create table if not exists public.boards (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  assessor_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id text primary key check (id in ('masters-report', 'lab-report', 'pitch')),
  title text not null,
  description text not null default '',
  brief jsonb not null,
  mark_scheme_text text not null default '',
  board_id text references public.boards (id) on delete set null
);

create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  template text not null references public.templates (id),
  brief jsonb not null,
  deadline timestamptz,
  mark_scheme_text text not null default '',
  weak_spots text[] not null default '{}',
  board_id text references public.boards (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  title text not null,
  paragraphs jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists documents_project_idx on public.documents (project_id);

create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  document_id text not null references public.documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'ready' check (status in ('ready', 'running', 'done', 'failed')),
  assessor_results jsonb not null default '[]',
  deliberation jsonb,
  report jsonb
);
create index if not exists reviews_project_idx on public.reviews (project_id);

create table if not exists public.pitch_sessions (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  status text not null default 'ready' check (status in ('ready', 'listening', 'conferring', 'questions', 'done')),
  transcript text not null default '',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  settings jsonb not null default '{"questionCount": 3, "mode": "spoken"}',
  questions jsonb not null default '[]',
  report jsonb
);
create index if not exists pitch_sessions_project_idx on public.pitch_sessions (project_id);

create table if not exists public.call_logs (
  id text primary key default gen_random_uuid()::text,
  kind text not null,
  model text not null,
  started_at timestamptz not null default now(),
  duration_ms int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  ok boolean not null,
  error text
);

-- RLS on, no policies; server-only access through the secret key.
do $$
declare t text;
begin
  foreach t in array array['profiles','assessors','assessor_notes','boards','templates','projects',
                           'documents','reviews','pitch_sessions','call_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

-- Private bucket for uploaded documents and mark schemes (20 MB each).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 20971520, array['application/pdf', 'text/plain'])
on conflict (id) do nothing;
