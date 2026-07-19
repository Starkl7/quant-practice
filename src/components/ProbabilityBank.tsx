"use client";

import { useEffect, useState } from "react";
import MathText from "@/components/MathText";
import { createClient } from "@/lib/supabase/client";
import { recordAttempt } from "@/lib/supabase/attempts";
import { probabilityXp } from "@/lib/xp";
import { flagProblem } from "@/lib/supabase/flags";
import { parseAnswer } from "@/lib/parseAnswer";
import type { Difficulty, Problem } from "@/lib/problems";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const STARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const SOLVED_KEY = "quant-practice:probability-solved";
const FLAGGED_KEY = "quant-practice:probability-flagged";

function loadIdSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export default function ProbabilityBank({ problems }: { problems: Problem[] }) {
  const CATEGORIES = Array.from(new Set(problems.map((p) => p.category).filter(Boolean))) as string[];
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(() => loadIdSet(SOLVED_KEY));
  const [flagged, setFlagged] = useState<Set<string>>(() => loadIdSet(FLAGGED_KEY));

  const filtered = problems.filter(
    (p) =>
      (categoryFilter === "all" || p.category === categoryFilter) &&
      (difficultyFilter === "all" || p.difficulty === difficultyFilter)
  );

  function markSolved(id: string) {
    setSolved((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      localStorage.setItem(SOLVED_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function markFlagged(id: string) {
    setFlagged((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      localStorage.setItem(FLAGGED_KEY, JSON.stringify([...next]));
      return next;
    });
    flagProblem(createClient(), id);
  }

  if (!problems.length) {
    return (
      <div className="panel-live p-6">
        <div className="term-label term-prompt mb-5">Problem Bank</div>
        <div className="well flex min-h-40 flex-col items-center justify-center gap-1.5 p-6 text-center">
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            The problem bank is empty right now.
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
            Problems are added in curated batches from real interview prep material — the Mental
            Math and Market-Making drills are live in the meantime.
          </p>
        </div>
      </div>
    );
  }

  const open = openId ? problems.find((p) => p.id === openId) : undefined;
  if (open) {
    const idx = problems.indexOf(open);
    return (
      <ProblemView
        key={open.id}
        problem={open}
        index={idx}
        solved={solved.has(open.id)}
        flagged={flagged.has(open.id)}
        onSolved={() => markSolved(open.id)}
        onFlagged={() => markFlagged(open.id)}
        onBack={() => setOpenId(null)}
        onPrev={idx > 0 ? () => setOpenId(problems[idx - 1].id) : undefined}
        onNext={idx < problems.length - 1 ? () => setOpenId(problems[idx + 1].id) : undefined}
      />
    );
  }

  return (
    <div className="panel-live p-6">
      <div className="term-label term-prompt mb-5">Problem Bank</div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--foreground)]"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--foreground)]"
        >
          <option value="all">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-[0.65rem] tracking-wide text-[var(--text-muted)]">
          {solved.size}/{problems.length} solved
        </span>
      </div>

      {!filtered.length ? (
        <div className="well flex min-h-32 flex-col items-center justify-center gap-2 p-6 text-center font-mono text-xs leading-loose text-[var(--text-muted)]">
          <p>No problems match these filters.</p>
          <button
            onClick={() => {
              setCategoryFilter("all");
              setDifficultyFilter("all");
            }}
            className="text-[var(--accent-blue)] underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-md border border-[var(--border)]">
          {filtered.map((p) => {
            const idx = problems.indexOf(p);
            return (
              <li key={p.id}>
                <button
                  onClick={() => setOpenId(p.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-tertiary)]"
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
                  <Stars difficulty={p.difficulty ?? "easy"} />
                  <span
                    className={`w-4 shrink-0 text-center font-mono text-xs ${
                      solved.has(p.id) ? "text-[var(--accent-green)]" : "text-[var(--text-muted)] opacity-40"
                    }`}
                    title={solved.has(p.id) ? "Solved" : "Unsolved"}
                  >
                    {solved.has(p.id) ? "✓" : "·"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProblemView({
  problem: p,
  index,
  solved,
  flagged,
  onSolved,
  onFlagged,
  onBack,
  onPrev,
  onNext,
}: {
  problem: Problem;
  index: number;
  solved: boolean;
  flagged: boolean;
  onSolved: () => void;
  onFlagged: () => void;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | "invalid" | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);

  // Problems can be long — snap back to the top when opening one.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Live preview of how a non-trivial numeric entry (fraction, expression, %)
  // will be read, so "6/91" visibly becomes 0.065934 before submitting.
  const interpreted =
    p.answer_type === "numeric" && /[/^()%]|pi|(?:^|[\d.])e/i.test(value)
      ? parseAnswer(value)?.toPrecision(6) ?? null
      : null;

  async function revealSolution() {
    if (solution || solutionLoading) return;
    setSolutionLoading(true);
    const { data, error } = await createClient()
      .rpc("reveal_solution", { p_problem_id: p.id })
      .returns<{ solution: string }[]>()
      .single();
    setSolutionLoading(false);
    if (error || !data) {
      console.warn("reveal_solution failed:", error?.message);
      return;
    }
    setSolution(data.solution);
  }

  async function submit() {
    if (!value.trim() || checking) return;
    let submitted: string;
    if (p.answer_type === "numeric") {
      const num = parseAnswer(value);
      if (num === null) {
        setResult("invalid");
        return;
      }
      submitted = String(num);
    } else {
      submitted = value.trim();
    }

    setChecking(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .rpc("check_answer", { p_problem_id: p.id, p_submitted: submitted })
      .returns<{ correct: boolean }[]>()
      .single();
    setChecking(false);
    if (error || !data) {
      console.warn("check_answer failed:", error?.message);
      return;
    }

    const ok = data.correct;
    setResult(ok ? "correct" : "wrong");
    setAttempted(true);
    if (ok) {
      onSolved();
      revealSolution();
    }
    recordAttempt(supabase, "probability", ok ? 1 : 0, {
      problemId: p.id,
      category: p.category,
      difficulty: p.difficulty ?? "easy",
      xp: probabilityXp(ok, p.difficulty),
    });
  }

  return (
    <div className="panel-live p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="font-mono text-xs text-[var(--text-secondary)] transition hover:text-[var(--accent-blue)]"
        >
          ← All problems
        </button>
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
          <FlagButton flagged={flagged} onFlag={onFlagged} />
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="px-1.5 transition enabled:hover:text-[var(--accent-blue)] disabled:opacity-30"
          >
            ← Prev
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            className="px-1.5 transition enabled:hover:text-[var(--accent-blue)] disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          <span className="mr-2 font-mono text-sm font-normal text-[var(--text-muted)]">
            {String(index + 1).padStart(2, "0")}.
          </span>
          {p.title ?? p.id}
        </h3>
        <Stars difficulty={p.difficulty ?? "easy"} />
        {solved && (
          <span className="font-mono text-xs text-[var(--accent-green)]" title="Solved">
            ✓ solved
          </span>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {p.category && <Tag>{p.category}</Tag>}
        {p.chapter && <Tag>{p.chapter}</Tag>}
        {p.source && <Tag>{p.source}</Tag>}
      </div>

      <MathText
        text={p.question}
        className="mb-6 text-[15px] leading-relaxed text-[var(--foreground)]"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={p.answer_type === "numeric" ? "e.g. 0.066 or 6/91" : "Your answer"}
          autoComplete="off"
          className="w-56 rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2 font-mono text-sm text-[var(--foreground)]"
        />
        <button
          onClick={submit}
          disabled={checking}
          className="rounded-md bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Submit"}
        </button>
        {p.hint && !showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--text-secondary)]"
          >
            Show Hint
          </button>
        )}
        {attempted && !solution && (
          <button
            onClick={revealSolution}
            disabled={solutionLoading}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--text-secondary)] disabled:opacity-60"
          >
            {solutionLoading ? "Loading…" : "Show Solution"}
          </button>
        )}
      </div>

      {interpreted !== null && (
        <div className="mb-3.5 font-mono text-xs text-[var(--text-muted)]">
          interpreted as {interpreted}
        </div>
      )}

      {result && (
        <div
          className={`mb-3.5 font-mono text-xs tracking-wide ${
            result === "correct"
              ? "text-[var(--accent-green)]"
              : result === "invalid"
                ? "text-[var(--accent-amber)]"
                : "text-[var(--accent-red)]"
          }`}
        >
          {result === "correct"
            ? "Correct."
            : result === "invalid"
              ? "Couldn't read that as a number — try a decimal (0.066), a fraction (6/91), or an expression ((4/9)^4)."
              : "Not quite — try again, or reveal the solution."}
        </div>
      )}

      {showHint && p.hint && (
        <div className="mb-3.5 rounded-md border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="term-label mb-2">Hint</div>
          <MathText
            text={p.hint}
            className="text-sm leading-relaxed text-[var(--text-secondary)]"
          />
        </div>
      )}

      {solution && (
        <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="term-label mb-2">Solution</div>
          <MathText text={solution} className="text-sm leading-relaxed text-[var(--text-secondary)]" />
        </div>
      )}
    </div>
  );
}

function FlagButton({ flagged, onFlag }: { flagged: boolean; onFlag: () => void }) {
  return (
    <div className="group relative">
      <button
        onClick={onFlag}
        disabled={flagged}
        aria-label={flagged ? "Problem flagged for review" : "Flag this problem for review"}
        className={`rounded border px-2 py-1 transition ${
          flagged
            ? "border-[color-mix(in_srgb,var(--accent-amber)_40%,transparent)] text-[var(--accent-amber)]"
            : "border-[var(--border)] hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)]"
        }`}
      >
        ⚑ {flagged ? "Flagged" : "Flag"}
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-10 mt-2 w-72 rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] p-3 text-left text-[0.7rem] leading-relaxed text-[var(--text-secondary)] opacity-0 shadow-lg transition group-hover:opacity-100"
      >
        {flagged
          ? "You've flagged this problem — it's queued for review. Thanks!"
          : "This site is still in a developmental stage, so answers might not always be correctly parsed. If you feel your answer was not correctly parsed or the solution is wrong, flag this problem."}
      </div>
    </div>
  );
}

const STAR_TONES: Record<Difficulty, string> = {
  easy: "text-[var(--accent-green)]",
  medium: "text-[var(--accent-amber)]",
  hard: "text-[var(--accent-red)]",
};

function Stars({ difficulty }: { difficulty: Difficulty }) {
  const n = STARS[difficulty];
  return (
    <span
      className={`shrink-0 font-mono text-xs tracking-tight ${STAR_TONES[difficulty]}`}
      title={difficulty}
      aria-label={`Difficulty: ${difficulty}`}
    >
      {"★".repeat(n)}
      <span className="opacity-25">{"★".repeat(3 - n)}</span>
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-[var(--border)] bg-[var(--bg-tertiary)] px-2 py-0.5 font-mono text-[0.65rem] tracking-wide text-[var(--text-secondary)] uppercase">
      {children}
    </span>
  );
}
