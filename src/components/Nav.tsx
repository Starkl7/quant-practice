import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-mono text-lg font-semibold text-[var(--accent-blue)]">
          QP_
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a
            href="https://dhrubojeet-haldar.github.io"
            className="text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
          >
            Portfolio ↗
          </a>
          {user ? (
            <>
              <Link href="/practice" className="text-[var(--text-secondary)] transition hover:text-[var(--foreground)]">
                Practice
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-[var(--accent-blue)] px-3 py-1.5 font-mono text-xs text-[var(--accent-blue)] transition hover:bg-[var(--accent-blue)] hover:text-[var(--background)]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
