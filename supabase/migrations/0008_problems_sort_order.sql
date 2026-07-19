-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Problem ids share dotted section prefixes with 10+ entries per section, so
-- sorting problems_public by `id` text would put x.1.10 before x.1.2
-- (lexicographic, not numeric). Add an explicit sort_order set from the
-- curated import's array position instead.

alter table public.problems add column if not exists sort_order integer;

create or replace view public.problems_public as
  select id, source, chapter, difficulty, category, title, question, hint,
         answer_type, tolerance, tags, created_at, sort_order
  from public.problems;

grant select on public.problems_public to anon, authenticated;
