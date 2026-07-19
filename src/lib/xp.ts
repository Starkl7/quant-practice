// Single source of truth for how each drill converts an attempt into XP.
// Used at record time (the drill components) and must stay in lockstep with the
// approximate backfill in supabase/migrations/0010_drill_xp_percentile.sql.
//
// Points are earn-only — a bad session earns 0, never negative — and are roughly
// calibrated so no drill out-earns another by more than ~2x per minute, which is
// what keeps the combined Total XP on /profile fair.

import type { Difficulty } from "@/lib/problems";
import type { DrillAttempt } from "@/lib/supabase/attempts";

// Probability: the anchor scheme, awarded once per correct solve.
export const PROBABILITY_XP: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 };

export function probabilityXp(correct: boolean, difficulty: Difficulty | undefined): number {
  return correct ? PROBABILITY_XP[difficulty ?? "easy"] : 0;
}

// Mental Math: each correct answer is worth its digit count (1-digit → 1, 2 → 2, …),
// so harder arithmetic earns more. Wrong answers don't subtract. The digit-weighted
// total is then halved: Mental Math is high-volume, and scaling it down keeps it
// from out-earning the slower, harder drills (esp. Probability) on the leaderboard.
export const MENTAL_MATH_XP_DIVISOR = 2;

export function mentalMathXp(correct: number, digits: number): number {
  return Math.round((Math.max(0, correct) * Math.max(1, digits)) / MENTAL_MATH_XP_DIVISOR);
}

// Sequences: flat per correct — no difficulty tiers, but each pattern is a real
// puzzle, so it's worth more per item than a single arithmetic sum.
export const SEQUENCE_XP_PER_CORRECT = 5;

export function sequencesXp(correct: number): number {
  return Math.max(0, correct) * SEQUENCE_XP_PER_CORRECT;
}

// Market-Making: P&L magnitude differs wildly across scenarios, so points are
// outcome-based — a profitable game earns a scenario-difficulty base, plus a
// tightness bonus (up to +50% of base) for quoting tighter than a reference
// spread. Losses earn nothing. Fermi has no stable numeric spread scale, so it
// gets base only.
export const MARKET_MAKING_BASE: Record<string, number> = { dice: 15, fermi: 20, cards: 25 };
const MARKET_MAKING_REF_SPREAD: Record<string, number> = { cards: 14, dice: 7 };

export function marketMakingXp(pnl: number, scenario: string, avgSpread: number): number {
  if (!(pnl > 0)) return 0;
  const base = MARKET_MAKING_BASE[scenario] ?? 20;
  const ref = MARKET_MAKING_REF_SPREAD[scenario];
  if (!ref || !(avgSpread >= 0)) return base;
  const tightness = Math.min(1, Math.max(0, 1 - avgSpread / ref));
  return Math.round(base * (1 + 0.5 * tightness));
}

// XP stored on each attempt lives in meta.xp (written at record time / backfill).
export function attemptXp(a: DrillAttempt): number {
  const xp = a.meta?.xp;
  return typeof xp === "number" && Number.isFinite(xp) ? xp : 0;
}
