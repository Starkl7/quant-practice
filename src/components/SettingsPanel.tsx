"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { resetAttempts } from "@/lib/supabase/attempts";

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

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="field-label mb-2">Data</div>
        <ResetProgressButton />
      </div>
    </div>
  );
}

function ResetProgressButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setResetting(true);
    setError(null);
    const { error } = await resetAttempts(createClient());
    setResetting(false);
    if (error) {
      setError(error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  return (
    <div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-[var(--accent-red)]">
            Clear all drill history? This can&apos;t be undone.
          </span>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="rounded-md border border-[var(--accent-red)] px-3 py-1.5 font-mono text-xs text-[var(--accent-red)] transition hover:bg-[var(--accent-red)] hover:text-[var(--background)] disabled:opacity-50"
          >
            {resetting ? "Resetting…" : "Confirm"}
          </button>
          <button
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={resetting}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
        >
          Reset Progress
        </button>
      )}
      {error && (
        <div className="mt-2 font-mono text-xs text-[var(--accent-red)]">Reset failed: {error}</div>
      )}
    </div>
  );
}
