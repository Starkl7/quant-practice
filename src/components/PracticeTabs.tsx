"use client";

import { useEffect, useState } from "react";
import MentalMathTrainer from "@/components/MentalMathTrainer";
import TradingGame from "@/components/TradingGame";
import ProbabilityBank from "@/components/ProbabilityBank";

const TABS = [
  { key: "mental-math", label: "Mental Math Trainer" },
  { key: "market-making", label: "Market-Making Game" },
  { key: "probability", label: "Probability & Stats" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STORAGE_KEY = "quant-practice:last-tab";

function isTabKey(v: string | null): v is TabKey {
  return TABS.some((t) => t.key === v);
}

export default function PracticeTabs() {
  const [active, setActive] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "mental-math";
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTabKey(stored) ? stored : "mental-math";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, active);
  }, [active]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`rounded-full border px-4 py-2 font-mono text-xs tracking-wide transition ${
              active === t.key
                ? "border-[var(--accent-blue)] bg-blue-500/10 text-[var(--accent-blue)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "mental-math" && <MentalMathTrainer />}
      {active === "market-making" && <TradingGame />}
      {active === "probability" && <ProbabilityBank />}
    </div>
  );
}
