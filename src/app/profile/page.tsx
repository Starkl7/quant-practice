import Nav from "@/components/Nav";
import SettingsPanel from "@/components/SettingsPanel";
import ScoreSparkline from "@/components/ScoreSparkline";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Drill, DrillAttempt } from "@/lib/supabase/attempts";

const DRILL_LABELS: Record<Drill, string> = {
  mental_math: "Mental Math Trainer",
  market_making: "Market-Making Drill",
  probability: "Probability & Stats",
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
  };
  for (const a of attempts ?? []) {
    byDrill[a.drill]?.push(a);
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
        <div className="mb-3 font-mono text-xs tracking-widest text-[var(--accent-blue)] uppercase">
          &gt; PROFILE.sh
        </div>
        <h1 className="mb-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">Profile</h1>
        <p className="mb-10 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Account details, drill stats, and settings.
        </p>

        <div className="mb-6 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <div className="mb-5 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">Account</div>
          <div className="flex flex-wrap gap-8">
            <div>
              <div className="mb-1.5 font-mono text-[0.6rem] tracking-wider text-[var(--text-muted)] uppercase">Email</div>
              <div className="font-mono text-sm text-[var(--foreground)]">{user.email}</div>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[0.6rem] tracking-wider text-[var(--text-muted)] uppercase">Member Since</div>
              <div className="font-mono text-sm text-[var(--foreground)]">{joined}</div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {(Object.keys(DRILL_LABELS) as Drill[]).map((drill) => (
            <DrillStatsCard key={drill} label={DRILL_LABELS[drill]} attempts={byDrill[drill]} />
          ))}
        </div>

        <SettingsPanel />
      </main>
    </div>
  );
}

function DrillStatsCard({ label, attempts }: { label: string; attempts: DrillAttempt[] }) {
  const scores = attempts.map((a) => a.score);
  const count = attempts.length;
  const best = count ? Math.max(...scores) : null;
  const avg = count ? scores.reduce((a, b) => a + b, 0) / count : null;
  const last = count ? attempts[attempts.length - 1].created_at : null;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <div className="mb-4 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">{label}</div>
      {count === 0 ? (
        <div className="font-mono text-xs text-[var(--text-muted)]">No attempts yet.</div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <MiniStat label="Attempts" value={count} />
            <MiniStat label="Best" value={best!.toFixed(2)} />
            <MiniStat label="Avg" value={avg!.toFixed(2)} />
          </div>
          <ScoreSparkline scores={scores} />
          <div className="mt-2 font-mono text-[0.65rem] text-[var(--text-muted)]">
            Last played {new Date(last!).toLocaleDateString()}
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5">
      <div className="mb-1 font-mono text-[0.55rem] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
      <div className="font-mono text-sm font-medium text-[var(--foreground)]">{value}</div>
    </div>
  );
}
