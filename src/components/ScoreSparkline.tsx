"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export default function ScoreSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return <div className="h-10 text-center font-mono text-[0.65rem] text-[var(--text-muted)]">Play more to see a trend</div>;
  }

  return (
    <div className="h-10">
      <Line
        data={{
          labels: scores.map((_, i) => i),
          datasets: [
            {
              data: scores,
              borderColor: "#4a9eff",
              borderWidth: 1.3,
              pointRadius: 0,
              tension: 0.2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        }}
      />
    </div>
  );
}
