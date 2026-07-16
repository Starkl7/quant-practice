import Nav from "@/components/Nav";
import SettingsPanel from "@/components/SettingsPanel";
import DrillStatsCard from "@/components/DrillStatsCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPercentile, type Drill, type DrillAttempt, type Percentile } from "@/lib/supabase/attempts";

const DRILL_LABELS: Record<Drill, string> = {
  mental_math: "Mental Math Trainer",
  market_making: "Market-Making Drill",
  probability: "Probability & Stats",
  sequences: "Sequences & Patterns",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile");

  const { data: attempts } = await supabase
    .from("drill_attempts")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<DrillAttempt[]>();

  const byDrill: Record<Drill, DrillAttempt[]> = {
    mental_math: [],
    market_making: [],
    probability: [],
    sequences: [],
  };
  for (const a of attempts ?? []) {
    byDrill[a.drill]?.push(a);
  }

  const percentiles: Partial<Record<Drill, Percentile>> = {};
  for (const drill of Object.keys(byDrill) as Drill[]) {
    const scores = byDrill[drill].map((a) => a.score);
    if (!scores.length) continue;
    const best = Math.max(...scores);
    const pct = await getPercentile(supabase, drill, best);
    if (pct) percentiles[drill] = pct;
  }

  const joined = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="term-label term-prompt mb-3 !text-[var(--accent-blue)]">Profile.sh</div>
        <h1 className="mb-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">Profile</h1>
        <p className="mb-10 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Account details, drill stats, and settings.
        </p>

        <div className="panel mb-6 p-6">
          <div className="term-label term-prompt mb-5">Account</div>
          <div className="flex flex-wrap gap-8">
            <div>
              <div className="field-label mb-1.5">Email</div>
              <div className="font-mono text-sm text-[var(--foreground)]">{user.email}</div>
            </div>
            <div>
              <div className="field-label mb-1.5">Member Since</div>
              <div className="font-mono text-sm text-[var(--foreground)]">{joined}</div>
            </div>
          </div>
        </div>

        <div className="term-label term-prompt mb-4">Progress</div>
        <div className="mb-6 flex flex-col gap-4">
          {(Object.keys(DRILL_LABELS) as Drill[]).map((drill) => (
            <DrillStatsCard
              key={drill}
              label={DRILL_LABELS[drill]}
              attempts={byDrill[drill]}
              percentile={percentiles[drill]}
            />
          ))}
        </div>

        <SettingsPanel />
      </main>
    </div>
  );
}
