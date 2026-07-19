-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- The problem bank has chapter.section groups with 10+ problems (e.g.
-- 444-1.1.1 .. 444-1.1.28), so sorting problems_public by `id` text would put
-- 444-1.1.10 before 444-1.1.2 (lexicographic, not numeric). Add an explicit
-- sort_order set from the curated JSON's array position instead.

alter table public.problems add column if not exists sort_order integer;

create or replace view public.problems_public as
  select id, source, chapter, difficulty, category, title, question, hint,
         answer_type, tolerance, tags, created_at, sort_order
  from public.problems;

grant select on public.problems_public to anon, authenticated;
