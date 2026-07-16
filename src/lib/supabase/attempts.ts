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

export type Percentile = { percentile: number; sampleSize: number };

// Cross-user aggregate — RLS only lets a client read its own rows, so this goes
// through the drill_percentile() SECURITY DEFINER function (see
// supabase/migrations/0003_percentile_rpc.sql) instead of a direct select.
export async function getPercentile(
  supabase: SupabaseClient,
  drill: Drill,
  score: number
): Promise<Percentile | null> {
  const { data, error } = await supabase
    .rpc("drill_percentile", { p_drill: drill, p_score: score })
    .returns<{ percentile: number; sample_size: number }[]>()
    .single();
  if (error || !data) {
    console.warn("getPercentile failed:", error?.message);
    return null;
  }
  return { percentile: data.percentile, sampleSize: data.sample_size };
}
