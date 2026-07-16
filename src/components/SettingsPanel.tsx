"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPanel() {
  return (
    <div className="panel p-6">
      <div className="term-label term-prompt mb-5">Settings</div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="field-label mb-2">Appearance</div>
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
