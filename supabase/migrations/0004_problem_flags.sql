-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Crowd-sourced QA for the probability problem bank: users can flag a problem
-- whose answer parsing/solution they believe is wrong. Combined with the
-- correct-solve counts already in drill_attempts (meta->>'problemId'), a
-- problem with many solves and ~zero flags can be considered verified.

create table public.problem_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  problem_id text not null,
  created_at timestamptz not null default now(),
  -- one flag per user per problem; re-flagging is a no-op
  unique (user_id, problem_id)
);

alter table public.problem_flags enable row level security;

create policy "select own flags" on public.problem_flags
  for select using (auth.uid() = user_id);

create policy "insert own flags" on public.problem_flags
  for insert with check (auth.uid() = user_id);

create index problem_flags_problem_idx on public.problem_flags (problem_id);

-- Base table privileges (see note in 0001 — RLS alone is not enough).
grant select, insert on public.problem_flags to authenticated;
