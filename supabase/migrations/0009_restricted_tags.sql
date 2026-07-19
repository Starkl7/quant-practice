-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Per-user gating of tagged problems: a problem carrying a tag listed in
-- restricted_tags is invisible (list pages, SSR, sitemap, RPCs) unless the
-- signed-in user has a matching grant in problem_tag_access. Anonymous
-- traffic never sees restricted problems, so they also never leak into the
-- SEO pages or sitemap (those read through the anon client).
--
-- Managing access (no admin UI — owner runs SQL in the dashboard):
--   insert into public.restricted_tags values ('some-tag');
--   insert into public.problem_tag_access (user_id, tag)
--     values ('<auth.users uuid>', 'some-tag');

create table public.restricted_tags (
  tag text primary key
);

create table public.problem_tag_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  tag text not null references public.restricted_tags (tag) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, tag)
);

-- No client-facing policies: both tables are only read inside the
-- security definer helper below. RLS blocks any direct client access.
alter table public.restricted_tags enable row level security;
alter table public.problem_tag_access enable row level security;

-- True when none of p_tags is restricted, or the current user holds a grant
-- for every restricted tag present. auth.uid() is null for anon traffic, so
-- any restricted tag hides the problem there.
create or replace function public.can_view_tags(p_tags text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.restricted_tags rt
    where rt.tag = any (coalesce(p_tags, '{}'))
      and not exists (
        select 1
        from public.problem_tag_access a
        where a.user_id = auth.uid()
          and a.tag = rt.tag
      )
  );
$$;

-- Only the view and the RPCs below (owner-executed) need this; keep clients
-- from probing which tags are restricted via a direct RPC call.
revoke execute on function public.can_view_tags(text[]) from public, anon, authenticated;

-- Filter the public view through the helper. security_barrier keeps user
-- predicates from being pushed below the access filter.
create or replace view public.problems_public
with (security_barrier = true) as
  select id, source, chapter, difficulty, category, title, question, hint,
         answer_type, tolerance, tags, created_at, sort_order
  from public.problems
  where public.can_view_tags(tags);

grant select on public.problems_public to anon, authenticated;

-- Re-declare check_answer with the access gate: a restricted problem the
-- caller can't view behaves exactly like a nonexistent one.
create or replace function public.check_answer(p_problem_id text, p_submitted text)
returns table(correct boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  select answer_type, tolerance, answer, tags into p
  from public.problems where id = p_problem_id;

  if not found or not public.can_view_tags(p.tags) then
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

-- Same gate for reveal_solution: zero rows when the caller can't view the
-- problem (client already warn-and-degrades on empty responses).
create or replace function public.reveal_solution(p_problem_id text)
returns table(solution text)
language sql
security definer
set search_path = public
as $$
  select solution from public.problems
  where id = p_problem_id and public.can_view_tags(tags)
$$;
