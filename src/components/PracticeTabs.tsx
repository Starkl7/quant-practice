"use client";

import { useState, useSyncExternalStore } from "react";
import MentalMathTrainer from "@/components/MentalMathTrainer";
import TradingGame from "@/components/TradingGame";
import ProbabilityBank from "@/components/ProbabilityBank";
import type { Problem } from "@/lib/problems";

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

// Cross-tab changes fire "storage"; same-tab writes go through select(),
// which re-renders via its own state update.
function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export default function PracticeTabs({ problems }: { problems: Problem[] }) {
  // Hydration-safe restore of the last-used tab: reading localStorage in a
  // useState initializer makes the first client render diverge from the
  // server HTML. useSyncExternalStore renders the server snapshot (null →
  // default tab) during hydration so the HTML matches, then re-renders with
  // the real stored value right after.
  const storedTab = useSyncExternalStore(
    subscribeToStorage,
    () => localStorage.getItem(STORAGE_KEY),
    () => null
  );
  const [selected, setSelected] = useState<TabKey | null>(null);
  const active: TabKey = selected ?? (isTabKey(storedTab) ? storedTab : "mental-math");

  function select(key: TabKey) {
    setSelected(key);
    localStorage.setItem(STORAGE_KEY, key);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => select(t.key)}
            className={`rounded-full border px-4 py-2 font-mono text-xs tracking-wide transition ${
              active === t.key
                ? "border-[var(--accent-blue)] bg-blue-500/10 text-[var(--accent-blue)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
            }`}
          >
            <span className={active === t.key ? "opacity-60" : "opacity-40"}>0{i + 1}</span>
            <span className="mx-1.5 opacity-30">·</span>
            {t.label}
          </button>
        ))}
      </div>

      {active === "mental-math" && <MentalMathTrainer />}
      {active === "market-making" && <TradingGame />}
      {active === "probability" && <ProbabilityBank problems={problems} />}
    </div>
  );
}
