import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getProblems } from "@/lib/problems";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Probability & Stats Problems | Quant Practice",
  description:
    "170+ worked probability and statistics problems for quant trading interview prep, with full step-by-step solutions.",
};

const STAR_TONES: Record<string, string> = {
  easy: "text-[var(--accent-green)]",
  medium: "text-[var(--accent-amber)]",
  hard: "text-[var(--accent-red)]",
};
const STAR_COUNTS: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

export default async function ProblemsIndexPage() {
  const problems = await getProblems();
  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="term-label term-prompt mb-3 !text-[var(--accent-blue)]">Problems.sh</div>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Probability &amp; Stats Problems
        </h1>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          {problems.length} worked problems drawn from published quant interview prep material,
          each with a full step-by-step solution. Sign in to submit answers and track your
          progress.
        </p>

        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-md border border-[var(--border)]">
          {problems.map((p, idx) => {
            const difficulty = p.difficulty ?? "easy";
            return (
              <li key={p.id}>
                <Link
                  href={`/problems/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-tertiary)]"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-[var(--text-muted)]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">
                    {p.title ?? p.id}
                  </span>
                  {p.category && (
                    <span className="hidden shrink-0 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-[var(--text-secondary)] uppercase sm:inline">
                      {p.category}
                    </span>
                  )}
                  <span
                    className={`shrink-0 font-mono text-xs tracking-tight ${STAR_TONES[difficulty]}`}
                    title={difficulty}
                  >
                    {"★".repeat(STAR_COUNTS[difficulty])}
                    <span className="opacity-25">{"★".repeat(3 - STAR_COUNTS[difficulty])}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
