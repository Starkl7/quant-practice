import Nav from "@/components/Nav";
import SettingsPanel from "@/components/SettingsPanel";
import DrillStatsCard from "@/components/DrillStatsCard";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getXpPercentile,
  type Drill,
  type DrillAttempt,
  type Percentile,
} from "@/lib/supabase/attempts";
import { attemptXp } from "@/lib/xp";

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

  // XP per drill (sum of points earned across that drill's attempts), and the
  // combined total — the single "level" number for the whole account.
  const drillXp: Record<Drill, number> = {
    mental_math: 0,
    market_making: 0,
    probability: 0,
    sequences: 0,
  };
  for (const drill of Object.keys(byDrill) as Drill[]) {
    drillXp[drill] = byDrill[drill].reduce((sum, a) => sum + attemptXp(a), 0);
  }
  const combinedXp = Object.values(drillXp).reduce((a, b) => a + b, 0);

  // Rank each drill's total XP (and the combined total) against all users.
  const percentiles: Partial<Record<Drill, Percentile>> = {};
  for (const drill of Object.keys(byDrill) as Drill[]) {
    if (!byDrill[drill].length) continue;
    const pct = await getXpPercentile(supabase, drill, drillXp[drill]);
    if (pct) percentiles[drill] = pct;
  }
  const combinedPercentile = attempts?.length
    ? await getXpPercentile(supabase, null, combinedXp)
    : null;

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
          <div className="flex flex-wrap items-center gap-8">
            <Avatar user={user} size={48} />
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

        <div className="panel mb-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="field-label mb-1.5">Total XP</div>
              <div className="font-mono text-4xl font-semibold tracking-tight text-[var(--accent-blue)]">
                {combinedXp.toLocaleString()}
              </div>
            </div>
            {combinedPercentile && combinedPercentile.sampleSize >= 5 ? (
              <div className="text-right">
                <div className="field-label mb-1.5">Rank, all users</div>
                <div className="font-mono text-sm text-[var(--foreground)]">
                  beats <span className="text-[var(--accent-blue)]">{Math.round(combinedPercentile.percentile)}%</span>
                </div>
              </div>
            ) : (
              <div className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                XP is earned across all four drills.
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          {(Object.keys(DRILL_LABELS) as Drill[]).map((drill) => (
            <DrillStatsCard
              key={drill}
              drill={drill}
              label={DRILL_LABELS[drill]}
              attempts={byDrill[drill]}
              xp={drillXp[drill]}
              percentile={percentiles[drill]}
            />
          ))}
        </div>

        <SettingsPanel />
      </main>
    </div>
  );
}
