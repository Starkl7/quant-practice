// Pure-SVG sparkline — no charting library. Line color follows the trend
// (last score vs first), P&L-style.
export default function ScoreSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return (
      <div className="flex h-full min-h-14 items-center justify-center font-mono text-[0.65rem] text-[var(--text-muted)]">
        Play more to see a trend
      </div>
    );
  }

  const w = 240;
  const h = 56;
  const pad = 4;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores.map((s, i) => {
    const x = pad + (i * (w - 2 * pad)) / (scores.length - 1);
    const y = h - pad - ((s - min) / range) * (h - 2 * pad);
    return [x, y] as const;
  });
  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h - pad} ${polyline} ${w - pad},${h - pad}`;
  const [lastX, lastY] = points[points.length - 1];

  const up = scores[scores.length - 1] >= scores[0];
  const stroke = up ? "var(--accent-green)" : "var(--accent-red)";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-full min-h-14 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Score trend over ${scores.length} attempts, ${up ? "up" : "down"} overall`}
    >
      <polygon points={area} fill={stroke} opacity="0.08" />
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={stroke} />
    </svg>
  );
}
