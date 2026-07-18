import problemsData from "@/data/probability_problems.json";

export type Difficulty = "easy" | "medium" | "hard";

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
  answer: number | string;
  tolerance?: number;
  solution?: string;
  tags?: string[];
};

export const problems = (problemsData.problems as Problem[]) ?? [];

export function getProblem(id: string): Problem | undefined {
  return problems.find((p) => p.id === id);
}
