import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import MathText from "@/components/MathText";
import ProblemSolver from "@/components/ProblemSolver";
import { getProblems, getProblem } from "@/lib/problems";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export async function generateStaticParams() {
  const problems = await getProblems();
  return problems.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const problem = await getProblem(id);
  if (!problem) return {};

  const title = `${problem.title ?? problem.id} | Quant Practice`;
  const description = problem.question.replace(/\$/g, "").slice(0, 155);

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

const STAR_TONES: Record<string, string> = {
  easy: "text-[var(--accent-green)]",
  medium: "text-[var(--accent-amber)]",
  hard: "text-[var(--accent-red)]",
};
const STAR_COUNTS: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problems = await getProblems();
  const idx = problems.findIndex((p) => p.id === id);
  if (idx === -1) notFound();
  const problem = problems[idx];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const difficulty = problem.difficulty ?? "easy";
  const prev = idx > 0 ? problems[idx - 1] : undefined;
  const next = idx < problems.length - 1 ? problems[idx + 1] : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link
          href="/problems"
          className="mb-6 inline-block font-mono text-xs text-[var(--text-secondary)] transition hover:text-[var(--accent-blue)]"
        >
          ← All problems
        </Link>

        <div className="panel-live p-6">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              <span className="mr-2 font-mono text-sm font-normal text-[var(--text-muted)]">
                {String(idx + 1).padStart(2, "0")}.
              </span>
              {problem.title ?? problem.id}
            </h1>
            <span
              className={`shrink-0 font-mono text-xs tracking-tight ${STAR_TONES[difficulty]}`}
              title={difficulty}
            >
              {"★".repeat(STAR_COUNTS[difficulty])}
              <span className="opacity-25">{"★".repeat(3 - STAR_COUNTS[difficulty])}</span>
            </span>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {problem.category && <Tag>{problem.category}</Tag>}
            {problem.chapter && <Tag>{problem.chapter}</Tag>}
            {problem.source && <Tag>{problem.source}</Tag>}
          </div>

          <MathText
            text={problem.question}
            className="mb-6 text-[15px] leading-relaxed text-[var(--foreground)]"
          />

          <div className="mb-6">
            <ProblemSolver
              problem={problem}
              signedIn={!!user}
              hint={
                problem.hint && (
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="term-label mb-2">Hint</div>
                    <MathText
                      text={problem.hint}
                      className="text-sm leading-relaxed text-[var(--text-secondary)]"
                    />
                  </div>
                )
              }
            />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 font-mono text-xs text-[var(--text-secondary)]">
            {prev ? (
              <Link href={`/problems/${prev.id}`} className="transition hover:text-[var(--accent-blue)]">
                ← {prev.title ?? prev.id}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/problems/${next.id}`} className="transition hover:text-[var(--accent-blue)]">
                {next.title ?? next.id} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-[var(--text-secondary)]">
          Want timed drills, mental math, and a market-making game too?{" "}
          <Link href="/practice" className="text-[var(--accent-blue)] hover:underline">
            Try the full practice suite →
          </Link>
        </p>
      </main>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-[var(--border)] bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-[0.65rem] tracking-wide text-[var(--text-secondary)] uppercase">
      {children}
    </span>
  );
}
