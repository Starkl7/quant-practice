-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Widens the drill_attempts.drill check constraint to allow the new
-- "sequences" drill (pattern-recognition mode bolted onto Mental Math).

alter table public.drill_attempts drop constraint drill_attempts_drill_check;

alter table public.drill_attempts add constraint drill_attempts_drill_check
  check (drill in ('mental_math', 'market_making', 'probability', 'sequences'));
