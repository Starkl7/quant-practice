import type { SupabaseClient } from "@supabase/supabase-js";

export type Drill = "mental_math" | "market_making" | "probability" | "sequences";

export type DrillAttempt = {
  id: string;
  drill: Drill;
  score: number;
  meta: Record<string, unknown>;
  created_at: string;
};

export async function recordAttempt(
  supabase: SupabaseClient,
  drill: Drill,
  score: number,
  meta: Record<string, unknown> = {}
) {
  const { error } = await supabase.from("drill_attempts").insert({ drill, score, meta });
  if (error) {
    // Stat tracking is non-critical — never block the drill UI on a failed write
    // (e.g. the drill_attempts table hasn't been created yet in Supabase).
    console.warn("recordAttempt failed:", error.message);
  }
}

export async function resetAttempts(supabase: SupabaseClient): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("drill_attempts").delete().eq("user_id", user.id);
  return { error: error?.message ?? null };
}

export type Percentile = { percentile: number; sampleSize: number };

// Cross-user aggregate — RLS only lets a client read its own rows, so this goes
// through a SECURITY DEFINER function instead of a direct select.
// Ranks a user's total XP against the per-user total-XP distribution. Pass a
// drill for that drill's leaderboard, or null for combined XP across all drills
// (see supabase/migrations/0010_drill_xp_percentile.sql).
export async function getXpPercentile(
  supabase: SupabaseClient,
  drill: Drill | null,
  xp: number
): Promise<Percentile | null> {
  const { data, error } = await supabase
    .rpc("drill_xp_percentile", { p_drill: drill, p_xp: xp })
    .returns<{ percentile: number; sample_size: number }[]>()
    .single();
  if (error || !data) {
    console.warn("getXpPercentile failed:", error?.message);
    return null;
  }
  return { percentile: data.percentile, sampleSize: data.sample_size };
}
