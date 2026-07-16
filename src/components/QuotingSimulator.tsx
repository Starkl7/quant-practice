"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { createClient } from "@/lib/supabase/client";
import { recordAttempt } from "@/lib/supabase/attempts";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function randn() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

type Result = {
  pnl: number;
  score: number;
  inventory: number;
  fills: number;
  mids: number[];
  pnls: number[];
  log: { t: number; side: "BUY" | "SELL"; price: number }[];
};

function runSim(halfSpread: number, gamma: number, sigma: number): Result {
  const ticks = 100;
  let mid = 100;
  let inventory = 0;
  let cash = 0;
  let fills = 0;
  const mids: number[] = [];
  const pnls: number[] = [];
  const log: Result["log"] = [];

  for (let t = 0; t < ticks; t++) {
    mid += randn() * sigma;
    const skew = -inventory * gamma;
    const bid = mid - halfSpread + skew;
    const ask = mid + halfSpread + skew;

    const bidDist = Math.max(mid - bid, 0.001);
    const askDist = Math.max(ask - mid, 0.001);
    const pBid = Math.exp(-bidDist / halfSpread) * 0.5;
    const pAsk = Math.exp(-askDist / halfSpread) * 0.5;

    if (Math.random() < pBid) {
      inventory += 1;
      cash -= bid;
      fills++;
      log.push({ t, side: "BUY", price: bid });
    }
    if (Math.random() < pAsk) {
      inventory -= 1;
      cash += ask;
      fills++;
      log.push({ t, side: "SELL", price: ask });
    }

    mids.push(mid);
    pnls.push(cash + inventory * mid);
  }

  const pnl = pnls[pnls.length - 1];
  const riskPenalty = 0.5 * gamma * inventory * inventory * 10;

  return { pnl, score: pnl - riskPenalty, inventory, fills, mids, pnls, log: log.reverse() };
}

export default function QuotingSimulator() {
  const [halfSpread, setHalfSpread] = useState(0.15);
  const [gamma, setGamma] = useState(0.02);
  const [sigma, setSigma] = useState(0.05);
  const [result, setResult] = useState<Result | null>(null);

  function run() {
    const r = runSim(halfSpread, gamma, sigma);
    setResult(r);
    recordAttempt(createClient(), "market_making", r.score, {
      mode: "quoting_simulator",
      pnl: r.pnl,
      inventory: r.inventory,
      fills: r.fills,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-4 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">
          Avellaneda–Stoikov Style Quoting Drill
        </div>
        <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          A synthetic mid-price random-walks over 100 ticks. You set a base half-spread and an
          inventory-skew coefficient; quotes re-center around the mid each tick, skewed against your
          current inventory. Simulated flow fills your bid or ask with probability decreasing in
          distance from mid. Goal: maximize P&amp;L net of an inventory-risk penalty. This is a
          practice simulator, not a real backtest.
        </p>
        <div className="mb-5 flex flex-wrap gap-6">
          <Field label="Base Half-Spread (USD)" value={halfSpread} step={0.01} onChange={setHalfSpread} />
          <Field label="Inventory Skew (γ)" value={gamma} step={0.005} onChange={setGamma} />
          <Field label="Mid Volatility (σ / tick)" value={sigma} step={0.01} onChange={setSigma} />
        </div>
        <button
          onClick={run}
          className="rounded-md bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
        >
          Run Simulation
        </button>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-5 grid grid-cols-4 gap-4">
          <Stat label="P&L" value={result ? fmtSigned(result.pnl) : "—"} tone={result ? (result.pnl >= 0 ? "pos" : "neg") : undefined} />
          <Stat label="Risk-Adj Score" value={result ? fmtSigned(result.score) : "—"} tone={result ? (result.score >= 0 ? "pos" : "neg") : undefined} />
          <Stat label="Ending Inventory" value={result ? result.inventory : "—"} />
          <Stat label="Fills" value={result ? result.fills : "—"} />
        </div>

        <div className="mb-5 h-64 rounded-md border border-[var(--border)] bg-[var(--background)] p-4">
          {result ? (
            <Line
              data={{
                labels: result.mids.map((_, i) => i),
                datasets: [
                  {
                    label: "Mid",
                    data: result.mids,
                    borderColor: "#4a9eff",
                    borderWidth: 1.3,
                    pointRadius: 0,
                    tension: 0.15,
                    yAxisID: "y",
                  },
                  {
                    label: "P&L",
                    data: result.pnls,
                    borderColor: "#2ecc71",
                    borderWidth: 1.3,
                    pointRadius: 0,
                    tension: 0.15,
                    yAxisID: "y1",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                  legend: { labels: { color: "#8fa1b8", font: { family: "IBM Plex Mono", size: 10 } } },
                },
                scales: {
                  x: { ticks: { color: "#5c6b80", font: { size: 9 }, maxTicksLimit: 8 }, grid: { display: false } },
                  y: { position: "left", ticks: { color: "#8fa1b8", font: { size: 10 } }, grid: { color: "#24304566" } },
                  y1: { position: "right", ticks: { color: "#8fa1b8", font: { size: 10 } }, grid: { display: false } },
                },
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-xs text-[var(--text-muted)]">
              Set your parameters above and run the simulation.
            </div>
          )}
        </div>

        <div className="mb-2 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">Fill Log</div>
        <div className="max-h-36 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs leading-relaxed">
          {result && result.log.length ? (
            result.log.map((f, i) => (
              <div key={i} className={f.side === "BUY" ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}>
                t{f.t}  {f.side.padEnd(4)} 1 @ {f.price.toFixed(2)}
              </div>
            ))
          ) : (
            <span className="text-[var(--text-secondary)]">No fills this run.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtSigned(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

function Field({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-32 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)]"
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
      <div className="mb-1.5 font-mono text-[0.6rem] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
      <div
        className={`font-mono text-lg font-medium ${
          tone === "pos" ? "text-[var(--accent-green)]" : tone === "neg" ? "text-[var(--accent-red)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
