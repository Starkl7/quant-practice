import Link from "next/link";
import Nav from "@/components/Nav";
import HeroDemo from "@/components/HeroDemo";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <div className="term-label term-prompt mb-3 !text-[var(--accent-blue)]">
            Quant_Practice.sh
          </div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Quant Practice
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Quant Practice is a free practice tool for quantitative trading job
            interviews. It offers three interactive drills — mental math,
            market-making games, and probability &amp; stats problems — drawn
            from published quant interview prep material. Sign in with Google
            to track your scores across sessions.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/practice"
              className="rounded-md bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
            >
              Start Practicing →
            </Link>
            <a
              href="https://starkl7.github.io"
              className="rounded-md border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--text-secondary)]"
            >
              Back to Portfolio
            </a>
          </div>
        </div>
        <HeroDemo />
      </main>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="term-label term-prompt mb-5 !text-[var(--accent-blue)]">What you&apos;ll practice</div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel p-5">
            <div className="mb-2 font-mono text-xs text-[var(--accent-blue)]">01 · Mental Math</div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Timed arithmetic drills — addition, multiplication, percentages, squares —
              for the speed round of a trading interview.
            </p>
          </div>
          <div className="panel p-5">
            <div className="mb-2 font-mono text-xs text-[var(--accent-blue)]">02 · Market-Making</div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              A two-sided quoting game modeled on the &quot;make me a market&quot; exercise
              used by firms like Jane Street and Optiver.
            </p>
          </div>
          <div className="panel p-5">
            <div className="mb-2 font-mono text-xs text-[var(--accent-blue)]">03 · Probability &amp; Stats</div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Worked probability and statistics problems drawn from real quant interview
              prep material, with step-by-step solutions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
