"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPanel() {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
      <div className="mb-5 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">
        Settings
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
            Appearance
          </div>
          <ThemeToggle />
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
