"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { recordAttempt } from "@/lib/supabase/attempts";
import { parseAnswer } from "@/lib/parseAnswer";
import type { Problem } from "@/lib/problems";

export default function ProblemSolver({
  problem: p,
  signedIn,
  hint,
}: {
  problem: Problem;
  signedIn: boolean;
  hint?: React.ReactNode;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | "invalid" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [checking, setChecking] = useState(false);

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
    if (ok) setShowHint(true);
    recordAttempt(supabase, "probability", ok ? 1 : 0, {
      problemId: p.id,
      category: p.category,
    });
  }

  return (
    <div>
      {signedIn ? (
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
        </div>
      ) : (
        <div className="well mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in to submit an answer and track it toward your stats.
          </p>
          <Link
            href={`/login?next=/problems/${encodeURIComponent(p.id)}`}
            className="shrink-0 rounded-md bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      )}

      {result && (
        <div
          className={`mb-4 font-mono text-xs tracking-wide ${
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
              : "Not quite — try again, or reveal the hint."}
        </div>
      )}

      {hint && (
        <div>
          {!showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--text-secondary)]"
            >
              Show Hint
            </button>
          )}
          <div className={showHint ? "" : "hidden"}>{hint}</div>
        </div>
      )}
    </div>
  );
}
