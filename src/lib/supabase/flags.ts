import type { SupabaseClient } from "@supabase/supabase-js";

// Records a "this problem's answer/parsing looks wrong" flag. One flag per
// user per problem (unique constraint) — a duplicate insert is treated as
// success so the button stays idempotent.
export async function flagProblem(supabase: SupabaseClient, problemId: string) {
  const { error } = await supabase.from("problem_flags").insert({ problem_id: problemId });
  if (error && error.code !== "23505") {
    // Non-critical, same policy as recordAttempt — never block the UI on it.
    console.warn("flagProblem failed:", error.message);
  }
}
