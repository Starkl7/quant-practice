-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Powers the XP percentile bars and the combined Total XP headline on /profile.
--
-- Each attempt stores the points it earned in meta.xp (written at record time by
-- the drill components; see src/lib/xp.ts for the scheme). This function ranks a
-- user's *total* XP against the per-user total-XP distribution. Pass a specific
-- drill for that drill's leaderboard, or NULL to rank combined XP across all
-- drills. Like the other percentile RPCs it is SECURITY DEFINER and only ever
-- returns two derived numbers, never other users' raw rows.

create or replace function public.drill_xp_percentile(p_drill text, p_xp numeric)
returns table(percentile numeric, sample_size bigint)
language sql
security definer
set search_path = public
as $$
  with per_user as (
    select coalesce(sum((meta->>'xp')::numeric), 0) as xp
    from drill_attempts
    where p_drill is null or drill = p_drill
    group by user_id
  )
  select
    coalesce(100.0 * count(*) filter (where xp <= p_xp) / nullif(count(*), 0), 0) as percentile,
    count(*) as sample_size
  from per_user
$$;

grant execute on function public.drill_xp_percentile(text, numeric) to authenticated;

-- The 0010 draft that shipped an accuracy-based percentile was superseded by XP
-- before deploy; drop it if it happens to exist so it can't linger unused.
drop function if exists public.probability_accuracy_percentile(numeric, integer);

-- ---------------------------------------------------------------------------
-- Approximate backfill: existing rows predate meta.xp. Fill each with best-effort
-- points so historical attempts still count toward totals. These use the same
-- scheme as src/lib/xp.ts, degraded where old rows lack the needed context:
--   probability   — old rows have no stored difficulty, so a correct solve = 10 (easy tier)
--   mental_math   — old rows have no stored digit count, so digit weight = 1, then halved (round(correct / 2))
--   sequences     — correct answers × 5 (matches the live scheme exactly)
--   market_making — profitable game = scenario base only (no historical tightness bonus)
-- Only rows without an xp key are touched, so this is safe to re-run.

update public.drill_attempts
set meta = jsonb_set(meta, '{xp}',
  to_jsonb(case when score >= 1 then 10 else 0 end))
where drill = 'probability' and not (meta ? 'xp');

update public.drill_attempts
set meta = jsonb_set(meta, '{xp}',
  to_jsonb(round(greatest(0, coalesce((meta->>'correct')::numeric, 0)) / 2)))
where drill = 'mental_math' and not (meta ? 'xp');

update public.drill_attempts
set meta = jsonb_set(meta, '{xp}',
  to_jsonb(greatest(0, coalesce((meta->>'correct')::numeric, 0)) * 5))
where drill = 'sequences' and not (meta ? 'xp');

update public.drill_attempts
set meta = jsonb_set(meta, '{xp}',
  to_jsonb(case when score > 0 then
    case meta->>'scenario'
      when 'dice' then 15
      when 'cards' then 25
      when 'fermi' then 20
      else 20
    end
  else 0 end))
where drill = 'market_making' and not (meta ? 'xp');
