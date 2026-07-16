"use client";

import { useState } from "react";
import problemsData from "@/data/probability_problems.json";

type Problem = {
  id: string;
  source?: string;
  chapter?: string;
  difficulty?: string;
  category?: string;
  question: string;
  answer_type: "numeric" | "text";
  answer: number | string;
  tolerance?: number;
  solution?: string;
  tags?: string[];
};

const problems = (problemsData.problems as Problem[]) ?? [];

export default function ProbabilityBank() {
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (!problems.length) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-5 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">Problem</div>
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] p-6 text-center font-mono text-xs leading-loose text-[var(--text-muted)]">
          <p>No problems loaded yet.</p>
          <p>
            Add entries to <code>src/data/probability_problems.json</code> (schema documented in the
            file&apos;s <code>_schema</code> field) to populate this drill.
          </p>
        </div>
      </div>
    );
  }

  const p = problems[idx];

  function check() {
    let ok: boolean;
    if (p.answer_type === "numeric") {
      const num = parseFloat(value);
      const tol = p.tolerance ?? 0.01;
      ok = !isNaN(num) && Math.abs(num - (p.answer as number)) <= tol;
    } else {
      ok = value.trim().toLowerCase() === String(p.answer).toLowerCase();
    }
    setResult(ok ? "correct" : "wrong");
  }

  function next() {
    setIdx((i) => (i + 1) % problems.length);
    setValue("");
    setResult(null);
    setRevealed(false);
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
      <div className="mb-5 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">Problem</div>

      <div className="mb-4 flex flex-wrap gap-2">
        {p.difficulty && <Tag>{p.difficulty}</Tag>}
        {p.category && <Tag>{p.category}</Tag>}
        {p.source && <Tag>{p.source}</Tag>}
      </div>

      <div className="mb-5 text-[15px] leading-relaxed text-[var(--foreground)]">{p.question}</div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your answer"
          autoComplete="off"
          className="w-56 rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2 font-mono text-sm text-[var(--foreground)]"
        />
        <button onClick={check} className="rounded-md bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90">
          Check
        </button>
        <button onClick={() => setRevealed(true)} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--text-secondary)]">
          Reveal Solution
        </button>
        <button onClick={next} className="px-2 py-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--foreground)]">
          Next →
        </button>
      </div>

      {result && (
        <div className={`mb-3.5 font-mono text-xs tracking-wide ${result === "correct" ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
          {result === "correct" ? "Correct." : "Not quite — try again or reveal the solution."}
        </div>
      )}

      {revealed && p.solution && (
        <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          {p.solution}
        </div>
      )}
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
