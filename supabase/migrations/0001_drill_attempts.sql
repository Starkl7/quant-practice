-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Tracks per-drill attempt history so /profile can show stats.

create table public.drill_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  drill text not null check (drill in ('mental_math', 'market_making', 'probability')),
  score numeric not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.drill_attempts enable row level security;

create policy "select own attempts" on public.drill_attempts
  for select using (auth.uid() = user_id);

create policy "insert own attempts" on public.drill_attempts
  for insert with check (auth.uid() = user_id);

create index drill_attempts_user_drill_idx on public.drill_attempts (user_id, drill, created_at desc);
