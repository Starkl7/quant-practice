import ScoreSparkline from "@/components/ScoreSparkline";
import type { Drill, DrillAttempt, Percentile } from "@/lib/supabase/attempts";

const MIN_PERCENTILE_SAMPLE = 5;

export default function DrillStatsCard({
  drill,
  label,
  attempts,
  xp,
  percentile,
}: {
  drill: Drill;
  label: string;
  attempts: DrillAttempt[];
  xp: number;
  percentile?: Percentile;
}) {
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

  const lastPlayed = new Date(attempts[count - 1].created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <div className="term-label">{label}</div>
          <span className="font-mono text-xs text-[var(--accent-blue)]">{xp.toLocaleString()} XP</span>
        </div>
        <div className="font-mono text-[0.65rem] text-[var(--text-muted)]">Last played {lastPlayed}</div>
      </div>

      {drill === "probability" ? (
        <AccuracyStats attempts={attempts} percentile={percentile} />
      ) : (
        <SessionStats attempts={attempts} percentile={percentile} />
      )}
    </div>
  );
}

// Session-scored drills (mental_math, sequences, market_making): each attempt is
// a continuous per-session score, so peak / average / last-vs-previous all read
// naturally. The percentile ranks the user's total XP against all users.
function SessionStats({ attempts, percentile }: { attempts: DrillAttempt[]; percentile?: Percentile }) {
  const scores = attempts.map((a) => a.score);
  const count = scores.length;
  const best = Math.max(...scores);
  const avg = scores.reduce((a, b) => a + b, 0) / count;
  const lastScore = scores[count - 1];
  const delta = count > 1 ? lastScore - scores[count - 2] : null;
  const hasPercentile = percentile && percentile.sampleSize >= MIN_PERCENTILE_SAMPLE;

  return (
    <>
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
        <TrendPanel label={`Trend · ${count} attempts`} scores={scores} />
      </div>

      <PercentileBar
        label="XP percentile (all users)"
        percentile={hasPercentile ? percentile : undefined}
        emptyHint="Not enough players yet for an XP percentile."
      />
    </>
  );
}

// Probability is scored 0/1 per problem, so "best" is meaningless (always 1) and
// a last-vs-previous delta is ±1 noise. The meaningful lens is accuracy: how many
// problems answered, how many solved, and the share correct — with the trend line
// showing running accuracy. The percentile ranks total XP across users.
function AccuracyStats({ attempts, percentile }: { attempts: DrillAttempt[]; percentile?: Percentile }) {
  const answered = attempts.length;
  const solved = attempts.reduce((sum, a) => sum + a.score, 0);
  const accuracy = (solved / answered) * 100;

  // Running accuracy after each answer, as a percentage, for the sparkline.
  const trend = attempts.map(
    (_, i) => (attempts.slice(0, i + 1).reduce((sum, a) => sum + a.score, 0) / (i + 1)) * 100
  );

  const hasPercentile = percentile && percentile.sampleSize >= MIN_PERCENTILE_SAMPLE;

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
        <div className="grid flex-1 grid-cols-3 gap-3">
          <MiniStat label="Answered" value={String(answered)} />
          <MiniStat label="Solved" value={String(solved)} />
          <MiniStat label="Accuracy" value={`${Math.round(accuracy)}%`} accent />
        </div>
        <TrendPanel label={`Accuracy trend · ${answered} answered`} scores={trend} />
      </div>

      <PercentileBar
        label="XP percentile (all users)"
        percentile={hasPercentile ? percentile : undefined}
        emptyHint="Not enough players yet for an XP percentile."
      />
    </>
  );
}

function TrendPanel({ label, scores }: { label: string; scores: number[] }) {
  return (
    <div className="flex flex-col md:w-60">
      <div className="field-label mb-1.5">{label}</div>
      <div className="well flex-1 p-2">
        <ScoreSparkline scores={scores} />
      </div>
    </div>
  );
}

function PercentileBar({
  label,
  percentile,
  emptyHint,
}: {
  label: string;
  percentile?: Percentile;
  emptyHint: string;
}) {
  return (
    <div className="mt-4">
      {percentile ? (
        <>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="field-label">{label}</span>
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
        <div className="font-mono text-[0.65rem] text-[var(--text-muted)]">{emptyHint}</div>
      )}
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
