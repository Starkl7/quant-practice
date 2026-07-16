import type { SupabaseClient } from "@supabase/supabase-js";

export type Drill = "mental_math" | "market_making" | "probability";

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
