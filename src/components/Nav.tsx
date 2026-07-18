import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0 font-mono text-lg font-semibold text-[var(--accent-blue)]">
          QP_
        </Link>
        <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-6">
          <a
            href="https://github.com/Starkl7/quant-practice"
            target="_blank"
            rel="noopener noreferrer"
            title="If this helped your prep, a star helps others find it"
            className="hidden items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] sm:flex"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            Star ★
          </a>
          <a
            href="https://starkl7.github.io"
            className="hidden text-[var(--text-secondary)] transition hover:text-[var(--foreground)] md:inline"
          >
            Portfolio ↗
          </a>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {user ? (
            <>
              <Link href="/practice" className="hidden text-[var(--text-secondary)] transition hover:text-[var(--foreground)] sm:inline">
                Practice
              </Link>
              <Link href="/profile" className="hidden text-[var(--text-secondary)] transition hover:text-[var(--foreground)] sm:inline">
                Profile
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="shrink-0 rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="shrink-0 rounded-md border border-[var(--accent-blue)] px-3 py-1.5 font-mono text-xs text-[var(--accent-blue)] transition hover:bg-[var(--accent-blue)] hover:text-[var(--background)]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
