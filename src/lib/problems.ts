import { createPublicClient } from "@/lib/supabase/public";

export type Difficulty = "easy" | "medium" | "hard";

// Public-safe shape only — no answer or solution field exists here. Those
// only ever come back through the check_answer / reveal_solution RPCs (see
// supabase/migrations/0006_problems_table.sql), never through a direct
// select, so there's nothing to accidentally leak by passing a Problem
// around the client.
export type Problem = {
  id: string;
  source?: string;
  chapter?: string;
  difficulty?: Difficulty;
  category?: string;
  title?: string;
  question: string;
  hint?: string;
  answer_type: "numeric" | "text";
  tolerance?: number;
  tags?: string[];
};

const COLUMNS =
  "id, source, chapter, difficulty, category, title, question, hint, answer_type, tolerance, tags";

export async function getProblems(): Promise<Problem[]> {
  const { data, error } = await createPublicClient()
    .from("problems_public")
    .select(COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("getProblems failed:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Problem[];
}

export async function getProblem(id: string): Promise<Problem | undefined> {
  const { data, error } = await createPublicClient()
    .from("problems_public")
    .select(COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return undefined;
  return data as unknown as Problem;
}
