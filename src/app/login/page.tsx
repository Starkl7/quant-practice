"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/practice";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogleSignIn() {
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    // On success, Supabase redirects the browser to Google — no further state change here.
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="term-label term-prompt mb-3 !text-[var(--accent-blue)]">Login.sh</div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Sign in to Quant Practice</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Enter your email and we&apos;ll send a magic link. No password needed.
        </p>
      </div>

      {status === "sent" ? (
        <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-4 text-sm text-[var(--text-secondary)]">
          Check <span className="text-[var(--foreground)]">{email}</span> for a sign-in link.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={status === "sending"}
            className="flex items-center justify-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 36.1 27 37 24 37c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 40.6 16.3 45 24 45z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C39.9 37 44 31 44 24c0-1.4-.1-2.7-.4-3.5z" />
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            or
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)]"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-md bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>

          {status === "error" && (
            <p className="text-sm text-[var(--accent-red)]">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
