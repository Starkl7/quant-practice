-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Moves the probability problem bank server-side: `answer` and `solution`
-- leave the client bundle/repo entirely. `question`/`hint`/metadata stay
-- public (needed for the indexable /problems SEO pages) via the
-- problems_public view; answer/solution are only ever touched inside the
-- SECURITY DEFINER functions below, which never hand the raw values back
-- except reveal_solution() (explicit user action, no correctness gate — see
-- note there).

create table public.problems (
  id text primary key,
  source text,
  chapter text,
  difficulty text,
  category text,
  title text,
  question text not null,
  hint text,
  answer_type text not null,
  tolerance numeric,
  tags text[],
  answer jsonb not null,
  solution text not null,
  created_at timestamptz not null default now()
);

-- RLS on the base table is belt-and-suspenders; the real boundary is that
-- no grant below lets anon/authenticated select from public.problems
-- directly. All public reads go through problems_public, which omits
-- answer and solution.
alter table public.problems enable row level security;

create policy "no direct client access" on public.problems
  for select using (false);

create view public.problems_public as
  select id, source, chapter, difficulty, category, title, question, hint,
         answer_type, tolerance, tags, created_at
  from public.problems;

grant select on public.problems_public to anon, authenticated;

-- Checks a submitted answer server-side. Returns correctness only — never
-- the stored answer or solution, right or wrong.
create or replace function public.check_answer(p_problem_id text, p_submitted text)
returns table(correct boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  select answer_type, tolerance, answer into p
  from public.problems where id = p_problem_id;

  if not found then
    correct := false;
    return next;
    return;
  end if;

  if p.answer_type = 'numeric' then
    correct := abs(p_submitted::numeric - (p.answer #>> '{}')::numeric) <= coalesce(p.tolerance, 0.01);
  else
    correct := lower(trim(p_submitted)) = lower(p.answer #>> '{}');
  end if;

  return next;
end;
$$;

grant execute on function public.check_answer(text, text) to authenticated;

-- Reveals the worked solution on request. Deliberately NOT gated on having
-- answered correctly — the UI already lets a user reveal the solution after
-- any attempt (right or wrong), same as the current client-side behavior.
-- Also deliberately not gated on "did you call check_answer first" — that's
-- a UX nudge enforced client-side, not a security boundary (see
-- project-answer-security-tier0: no leaderboard yet, so no adversarial
-- value in skipping straight to the solution).
create or replace function public.reveal_solution(p_problem_id text)
returns table(solution text)
language sql
security definer
set search_path = public
as $$
  select solution from public.problems where id = p_problem_id
$$;

grant execute on function public.reveal_solution(text) to authenticated;
