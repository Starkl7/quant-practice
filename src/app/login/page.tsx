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

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="mb-3 font-mono text-xs tracking-widest text-blue-400 uppercase">
          &gt; LOGIN.sh
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">Sign in to Quant Practice</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email and we&apos;ll send a magic link. No password needed.
        </p>
      </div>

      {status === "sent" ? (
        <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-4 text-sm text-slate-300">
          Check <span className="text-slate-100">{email}</span> for a sign-in link.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-md bg-blue-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-blue-400 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
