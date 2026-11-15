-- When the student last opened each table on the floor, so the side panel can
-- say what is new since then (see Project.viewedAt in src/lib/schemas).
alter table public.projects add column if not exists viewed_at timestamptz;
