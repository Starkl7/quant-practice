-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Powers the "scored better than X% of attempts" line on /profile.
--
-- RLS on drill_attempts only lets a user read their own rows, and there is no
-- service-role key configured anywhere in this app, so a normal client query
-- can't compute a cross-user percentile. This SECURITY DEFINER function is the
-- sanctioned exception: it runs with the table owner's privileges internally,
-- but the function signature only ever returns one derived number — it never
-- hands back other users' raw rows.

create or replace function public.drill_percentile(p_drill text, p_score numeric)
returns table(percentile numeric, sample_size bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(100.0 * count(*) filter (where score <= p_score) / nullif(count(*), 0), 0) as percentile,
    count(*) as sample_size
  from drill_attempts
  where drill = p_drill
$$;

grant execute on function public.drill_percentile(text, numeric) to authenticated;
