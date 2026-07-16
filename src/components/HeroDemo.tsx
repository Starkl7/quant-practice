"use client";

import { useRef, useState } from "react";

type Question = { text: string; answer: number };

// Fixed first question so server and client render identically; randomness
// only kicks in from the first answer (inside event handlers).
const FIRST_QUESTION: Question = { text: "17 × 12", answer: 204 };

function gen(): Question {
  const kind = Math.floor(Math.random() * 3);
  const r = (max: number, min = 2) => min + Math.floor(Math.random() * (max - min + 1));
  if (kind === 0) {
    const a = r(99, 11);
    const b = r(99, 11);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (kind === 1) {
    let a = r(99, 11);
    let b = r(99, 11);
    if (b > a) [a, b] = [b, a];
    return { text: `${a} − ${b}`, answer: a - b };
  }
  const a = r(12);
  const b = r(19);
  return { text: `${a} × ${b}`, answer: a * b };
}

// Instantly-playable warm-up widget for the landing hero.
export default function HeroDemo() {
  const [question, setQuestion] = useState<Question>(FIRST_QUESTION);
  const [input, setInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function advance(nextStreak: number) {
    setStreak(nextStreak);
    setBest((b) => Math.max(b, nextStreak));
    setQuestion(gen());
    setInput("");
    setTimeout(() => setFlash(null), 250);
  }

  function onChange(value: string) {
    setInput(value);
    const val = parseFloat(value);
    if (!isNaN(val) && Math.abs(val - question.answer) < 0.01) {
      setFlash("correct");
      advance(streak + 1);
    }
  }

  function onEnter() {
    const val = parseFloat(input);
    if (isNaN(val)) return;
    if (Math.abs(val - question.answer) < 0.01) {
      setFlash("correct");
      advance(streak + 1);
    } else {
      setFlash("wrong");
      advance(0);
    }
  }

  return (
    <div className="panel-live overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-red)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-amber)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-green)] opacity-70" />
        <span className="ml-2 font-mono text-[0.65rem] text-[var(--text-muted)]">
          quant_practice — warm-up
        </span>
      </div>

      <div className="p-6 text-center">
        <div className="mb-1 flex items-center justify-between">
          <span className="field-label">Streak</span>
          <span className="font-mono text-xs text-[var(--text-muted)]">best {best}</span>
        </div>
        <div className="mb-5 text-left font-mono text-2xl font-medium text-[var(--accent-green)]">
          {streak}
        </div>

        <div className="term-label term-prompt cursor-blink mb-4 text-left">Solve</div>
        <div className="mb-5 font-mono text-4xl tracking-tight text-[var(--foreground)]">
          {question.text}
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={input}
          autoComplete="off"
          placeholder="?"
          aria-label="Your answer"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          className={`w-40 rounded-md border-2 bg-[var(--background)] px-4 py-2.5 text-center font-mono text-lg text-[var(--foreground)] outline-none transition-colors ${
            flash === "correct"
              ? "border-[var(--accent-green)]"
              : flash === "wrong"
              ? "border-[var(--accent-red)]"
              : "border-[var(--border-strong)] focus:border-[var(--accent-blue)]"
          }`}
        />
        <div className="mt-4 font-mono text-[0.65rem] text-[var(--text-muted)]">
          auto-advances when correct · <kbd>Enter</kbd> to check
        </div>
      </div>
    </div>
  );
}
