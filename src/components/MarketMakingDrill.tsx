"use client";

import { useState } from "react";
import TradingGame from "@/components/TradingGame";
import QuotingSimulator from "@/components/QuotingSimulator";

const MODES = [
  { key: "trading-game", label: "Trading Game" },
  { key: "quoting-simulator", label: "Quoting Simulator" },
] as const;

type ModeKey = (typeof MODES)[number]["key"];

export default function MarketMakingDrill() {
  const [mode, setMode] = useState<ModeKey>("trading-game");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-full border px-4 py-2 font-mono text-xs tracking-wide transition ${
              mode === m.key
                ? "border-[var(--accent-blue)] bg-blue-500/10 text-[var(--accent-blue)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "trading-game" ? <TradingGame /> : <QuotingSimulator />}
    </div>
  );
}
