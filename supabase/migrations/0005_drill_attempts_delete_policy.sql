-- Run this once in the Supabase dashboard (SQL Editor) for this project.
-- Lets a user clear their own drill history from the Profile page's
-- "Reset Progress" button. Without this, delete requests are rejected by RLS.

create policy "delete own attempts" on public.drill_attempts
  for delete using (auth.uid() = user_id);

grant delete on public.drill_attempts to authenticated;
