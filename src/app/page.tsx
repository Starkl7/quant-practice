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
            Mental math drills, an inventory-aware market-making simulator, and
            probability &amp; stats problems for quant trading interview prep.
            Sign in to track your scores across sessions.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/practice"
              className="rounded-md bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
            >
              Start Practicing →
            </Link>
            <a
              href="https://dhrubojeet-haldar.github.io"
              className="rounded-md border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--text-secondary)]"
            >
              Back to Portfolio
            </a>
          </div>
        </div>
        <HeroDemo />
      </main>
    </div>
  );
}
