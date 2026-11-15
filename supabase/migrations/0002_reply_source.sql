-- Where the AI replies came from: "claude", or "sample" when generated
-- without an API key (screens label these as sample replies).
alter table public.reviews add column if not exists reply_source text not null default 'claude'
  check (reply_source in ('claude', 'sample'));
alter table public.pitch_sessions add column if not exists reply_source text not null default 'claude'
  check (reply_source in ('claude', 'sample'));
