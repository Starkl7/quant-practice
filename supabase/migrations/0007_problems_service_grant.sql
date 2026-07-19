-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Fixes "permission denied for table problems" from scripts/migrate-problems.mjs.
-- Same gotcha as 0001: RLS/BYPASSRLS govern row visibility, not whether a role
-- can touch the table at all — service_role still needs an explicit grant,
-- same as authenticated did in 0001 and 0004.

grant select, insert, update on public.problems to service_role;
