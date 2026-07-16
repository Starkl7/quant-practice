import ScoreSparkline from "@/components/ScoreSparkline";
import type { DrillAttempt, Percentile } from "@/lib/supabase/attempts";

const MIN_PERCENTILE_SAMPLE = 5;

export default function DrillStatsCard({
  label,
  attempts,
  percentile,
}: {
  label: string;
  attempts: DrillAttempt[];
  percentile?: Percentile;
}) {
  const scores = attempts.map((a) => a.score);
  const count = attempts.length;

  if (count === 0) {
    return (
      <div className="panel p-5">
        <div className="term-label mb-2">{label}</div>
        <div className="font-mono text-xs text-[var(--text-muted)]">
          No attempts yet — scores land here after your first round.
        </div>
      </div>
    );
  }

  const best = Math.max(...scores);
  const avg = scores.reduce((a, b) => a + b, 0) / count;
  const lastScore = scores[count - 1];
  const delta = count > 1 ? lastScore - scores[count - 2] : null;
  const lastPlayed = new Date(attempts[count - 1].created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const hasPercentile = percentile && percentile.sampleSize >= MIN_PERCENTILE_SAMPLE;

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="term-label">{label}</div>
        <div className="font-mono text-[0.65rem] text-[var(--text-muted)]">Last played {lastPlayed}</div>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Attempts" value={String(count)} />
          <MiniStat label="Best" value={fmtScore(best)} accent />
          <MiniStat label="Avg" value={fmtScore(avg)} />
          <MiniStat
            label="Last"
            value={fmtScore(lastScore)}
            sub={
              delta === null ? undefined : (
                <span className={delta >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}>
                  {delta >= 0 ? "▲" : "▼"} {fmtScore(Math.abs(delta))}
                </span>
              )
            }
          />
        </div>
        <div className="flex flex-col md:w-60">
          <div className="field-label mb-1.5">Trend · {count} attempts</div>
          <div className="well flex-1 p-2">
            <ScoreSparkline scores={scores} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {hasPercentile ? (
          <>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="field-label">Percentile (best score, all users)</span>
              <span className="font-mono text-xs text-[var(--accent-blue)]">
                beats {Math.round(percentile.percentile)}%
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--accent-blue)]"
                style={{ width: `${Math.min(100, Math.max(2, percentile.percentile))}%` }}
              />
            </div>
          </>
        ) : (
          <div className="font-mono text-[0.65rem] text-[var(--text-muted)]">
            Not enough attempts across all users yet for a percentile.
          </div>
        )}
      </div>
    </div>
  );
}

function fmtScore(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="well px-3 py-2.5">
      <div className="field-label mb-1">{label}</div>
      <div
        className={`font-mono text-xl font-medium ${
          accent ? "text-[var(--accent-blue)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
        {sub && <span className="ml-1.5 align-middle font-mono text-[0.65rem]">{sub}</span>}
      </div>
    </div>
  );
}
