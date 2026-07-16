"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordAttempt } from "@/lib/supabase/attempts";
import { generateSequence } from "@/lib/sequences";

type Mode = "arithmetic" | "sequences";
type Op = "add" | "sub" | "mul" | "div" | "pct" | "sq";

const OPS: { key: Op; label: string }[] = [
  { key: "add", label: "+ Add" },
  { key: "sub", label: "− Sub" },
  { key: "mul", label: "× Mul" },
  { key: "div", label: "÷ Div" },
  { key: "pct", label: "% Percent" },
  { key: "sq", label: "x² Square" },
];

function randInt(digits: number) {
  const max = Math.pow(10, digits) - 1;
  const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(ops: Op[], digits: number) {
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, text: string, answer: number;

  switch (op) {
    case "add":
      a = randInt(digits);
      b = randInt(digits);
      text = `${a} + ${b}`;
      answer = a + b;
      break;
    case "sub":
      a = randInt(digits);
      b = randInt(digits);
      if (b > a) [a, b] = [b, a];
      text = `${a} − ${b}`;
      answer = a - b;
      break;
    case "mul":
      a = randInt(Math.max(1, digits - 1));
      b = randInt(Math.max(1, digits - 1));
      text = `${a} × ${b}`;
      answer = a * b;
      break;
    case "div":
      b = randInt(Math.max(1, digits - 1));
      answer = randInt(Math.max(1, digits - 1));
      a = b * answer;
      text = `${a} ÷ ${b}`;
      break;
    case "pct": {
      const pct = [5, 10, 15, 20, 25, 50][Math.floor(Math.random() * 6)];
      a = randInt(digits) * 10;
      text = `${pct}% of ${a}`;
      answer = Math.round((pct / 100) * a * 100) / 100;
      break;
    }
    case "sq":
      a = randInt(Math.min(digits, 2));
      text = `${a}²`;
      answer = a * a;
      break;
  }

  return { text, answer };
}

export default function MentalMathTrainer() {
  const [mode, setMode] = useState<Mode>("arithmetic");
  const [enabledOps, setEnabledOps] = useState<Record<Op, boolean>>({
    add: true,
    sub: true,
    mul: true,
    div: false,
    pct: false,
    sq: false,
  });
  const [digits, setDigits] = useState(2);
  const [duration, setDuration] = useState(60);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [question, setQuestion] = useState<{ text: string; answer: number } | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);

  const questionStart = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!finished) return;
    const total = correct + wrong;
    if (!total) return;
    const avgTime = answerTimes.length
      ? answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length
      : null;
    recordAttempt(createClient(), mode === "sequences" ? "sequences" : "mental_math", correct - wrong, {
      correct,
      wrong,
      avgTime,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  function activeOps(): Op[] {
    return (Object.keys(enabledOps) as Op[]).filter((k) => enabledOps[k]);
  }

  function nextQuestion() {
    if (mode === "sequences") {
      setQuestion(generateSequence());
    } else {
      const ops = activeOps();
      if (!ops.length) return;
      setQuestion(generateQuestion(ops, digits));
    }
    setInput("");
    setFeedback(null);
    questionStart.current = performance.now();
    inputRef.current?.focus();
  }

  function start() {
    setTimeLeft(duration);
    setCorrect(0);
    setWrong(0);
    setAnswerTimes([]);
    setFinished(false);
    setRunning(true);
    nextQuestion();
  }

  function checkAnswer(value: string) {
    if (!running || !question) return;
    const val = parseFloat(value);
    if (isNaN(val)) return;
    if (Math.abs(val - question.answer) >= 0.01) return; // wait for a complete/correct match before auto-advance

    const elapsed = (performance.now() - questionStart.current) / 1000;
    setAnswerTimes((t) => [...t, elapsed]);
    setCorrect((c) => c + 1);
    setFeedback("correct");
    setTimeout(nextQuestion, 200);
  }

  function submitCurrent() {
    if (!running || !question) return;
    const val = parseFloat(input);
    if (isNaN(val)) return;
    const elapsed = (performance.now() - questionStart.current) / 1000;
    setAnswerTimes((t) => [...t, elapsed]);
    if (Math.abs(val - question.answer) < 0.01) {
      setCorrect((c) => c + 1);
      setFeedback("correct");
    } else {
      setWrong((w) => w + 1);
      setFeedback("wrong");
    }
    setTimeout(nextQuestion, 200);
  }

  const total = correct + wrong;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const avgTime = answerTimes.length
    ? (answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length).toFixed(2)
    : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className={`panel p-6 transition-opacity duration-300 ${running ? "opacity-45" : ""}`}>
        <div className="term-label term-prompt mb-5">Configure</div>
        <div className="mb-5 flex flex-wrap gap-2">
          {(["arithmetic", "sequences"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-4 py-2 font-mono text-xs tracking-wide transition ${
                mode === m
                  ? "border-[var(--accent-blue)] bg-blue-500/10 text-[var(--accent-blue)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
              }`}
            >
              {m === "arithmetic" ? "Arithmetic" : "Sequences & Patterns"}
            </button>
          ))}
        </div>
        <div className="mb-5 flex flex-wrap items-start gap-8">
          {mode === "arithmetic" && (
            <>
              <div>
                <div className="field-label mb-2">Operations</div>
                <div className="flex flex-wrap gap-4">
                  {OPS.map((o) => (
                    <label key={o.key} className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={enabledOps[o.key]}
                        onChange={(e) => setEnabledOps((s) => ({ ...s, [o.key]: e.target.checked }))}
                        className="accent-[var(--accent-blue)]"
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label mb-2">Digit Size</div>
                <select
                  value={digits}
                  onChange={(e) => setDigits(parseInt(e.target.value, 10))}
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)]"
                >
                  <option value={1}>1-digit</option>
                  <option value={2}>2-digit</option>
                  <option value={3}>3-digit</option>
                </select>
              </div>
            </>
          )}
          <div>
            <div className="field-label mb-2">Round Length</div>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)]"
            >
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>120s</option>
            </select>
          </div>
        </div>
        <button
          onClick={start}
          disabled={mode === "arithmetic" && !activeOps().length}
          className="rounded-md bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-40"
        >
          {running || finished ? "Restart Drill" : "Start Drill"}
        </button>
      </div>

      <div className="panel-live p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`term-label term-prompt ${running ? "cursor-blink" : ""}`}>Session</div>
          {running && (
            <div className="font-mono text-[0.65rem] text-[var(--text-muted)]">
              auto-advances when correct · <kbd>Enter</kbd> submits
            </div>
          )}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Time Left"
            value={running || finished ? `${timeLeft}s` : "—"}
            className={running && timeLeft <= 10 ? "text-[var(--accent-amber)]" : ""}
          />
          <Stat label="Correct" value={correct} className="text-[var(--accent-green)]" />
          <Stat label="Wrong" value={wrong} className="text-[var(--accent-red)]" />
          <Stat label="Avg Time / Q" value={avgTime === "—" ? "—" : `${avgTime}s`} />
        </div>

        <div className="mb-5 h-1 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full origin-left transition-transform duration-1000 ease-linear"
            style={{
              transform: `scaleX(${running || finished ? timeLeft / duration : 1})`,
              background:
                running && timeLeft <= 10 ? "var(--accent-amber)" : "var(--accent-blue)",
            }}
          />
        </div>

        <div className="well p-10 text-center">
          {!running && !finished && (
            <p className="text-sm text-[var(--text-secondary)]">
              Set your options above and hit <strong>Start Drill</strong>.
            </p>
          )}
          {running && question && (
            <div>
              <div className="mb-6 font-mono text-4xl tracking-tight text-[var(--foreground)] sm:text-5xl">
                {question.text}
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={input}
                autoComplete="off"
                placeholder="?"
                onChange={(e) => {
                  setInput(e.target.value);
                  checkAnswer(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitCurrent()}
                className={`w-56 rounded-md border-2 bg-[var(--bg-secondary)] px-4 py-3 text-center font-mono text-xl text-[var(--foreground)] outline-none transition-colors ${
                  feedback === "correct"
                    ? "border-[var(--accent-green)]"
                    : feedback === "wrong"
                    ? "border-[var(--accent-red)]"
                    : "border-[var(--border-strong)] focus:border-[var(--accent-blue)]"
                }`}
              />
            </div>
          )}
          {finished && (
            <div>
              <div className="mb-3 font-mono text-4xl font-medium text-[var(--foreground)]">
                <span className="text-[var(--accent-green)]">{correct}</span>
                <span className="text-[var(--text-muted)]"> / {total}</span>
                <span className="text-[var(--text-secondary)]"> · {accuracy}%</span>
              </div>
              <div className="font-mono text-sm text-[var(--text-secondary)]">
                Avg {avgTime}s per question. Hit Start Drill to try again.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="well px-4 py-3.5">
      <div className="field-label mb-1.5">{label}</div>
      <div className={`font-mono text-2xl font-medium text-[var(--foreground)] ${className ?? ""}`}>{value}</div>
    </div>
  );
}
