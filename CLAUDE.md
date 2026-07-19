# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit # typecheck (no separate typecheck script)
```

There is no test suite/runner configured in this repo.

## What this is

A standalone quant-interview-prep app (spun out of a portfolio site), with three drills behind Supabase auth at `/practice`:

1. **Mental Math Trainer** (`src/components/MentalMathTrainer.tsx`) — timed arithmetic drills. Client-only, no backend dependency.
2. **Market-Making Game** (`src/components/TradingGame.tsx`) — the "make me a market" card game used in actual trading interviews (Jane Street, Optiver, etc.): a hidden total is built from dealt cards, you see a partial hand, and across several rounds you quote a two-sided bid/ask on the sum as more cards are revealed and a counterparty trades against you when it's profitable for them. Client-only.
3. **Probability & Stats** (`src/components/ProbabilityBank.tsx`) — reads problems from the Supabase `problems` table via `src/lib/problems.ts`.

All three are tabbed together via `src/components/PracticeTabs.tsx` and rendered from `src/app/practice/page.tsx`.

### Probability problem bank

Problem content lives only in the Supabase `problems` table — it is never committed to this repo. **Do not fabricate problems.** New batches are authored by the owner in a local gitignored staging file (`problems.local.json`, same shape as the table: `id`, `source`, `chapter`, `difficulty`, `category`, `title`, `question`, `hint`, `answer_type`, `answer`, `tolerance`, `solution`, `tags`): each question is rewritten in the owner's own wording, solved, and numerically verified, then upserted with `scripts/migrate-problems.mjs`.

Problems carrying a tag listed in the `restricted_tags` table are only visible to users granted that tag in `problem_tag_access` (see `supabase/migrations/0009_restricted_tags.sql`); grants are managed by inserting rows in the Supabase dashboard, no admin UI. Anonymous traffic (SEO pages, sitemap) never sees restricted problems, and the `check_answer`/`reveal_solution` RPCs enforce the same gate. (All problem text is the owner's own wording before it ever reaches the database; the restricted-tag system exists to scope certain problems to a chosen group of users.)

## Auth architecture (Supabase, Google OAuth)

- `src/lib/supabase/client.ts` / `server.ts` — browser and server (cookie-based) Supabase clients.
- `src/lib/supabase/middleware.ts` — `updateSession()`, the session-refresh helper invoked from the proxy.
- `src/proxy.ts` — Next 16's replacement for `middleware.ts`. Redirects unauthenticated requests to `/practice` → `/login?next=/practice`. The exported function must be named `proxy`, not `middleware`, or the build fails (see `@AGENTS.md` note on Next 16 breaking changes above).
- `src/app/login/page.tsx` — "Sign in with Google" button, calls `supabase.auth.signInWithOAuth`.
- `src/app/auth/callback/route.ts` — exchanges the OAuth `code` for a session, redirects to `next` (default `/practice`).
- `src/app/auth/signout/route.ts` — POST route; signs out and redirects home.
- `src/app/practice/page.tsx` — server component; also redirects to `/login` if there's no user (belt-and-suspenders alongside the proxy check).

No passwords anywhere in this app — auth is Google OAuth only. (Magic-link email auth was removed 2026-07: Gmail rejects third-party SMTP sends whose From: domain isn't DMARC-aligned, and there's no custom domain to align with. GitHub OAuth is planned as a second provider.)

## Local setup

Requires a Supabase project and `.env.local` (gitignored) with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Without real values, `getUser()` silently no-ops (build/dev still work, sign-in doesn't). Supabase dashboard → Authentication → URL Configuration must allow-list `http://localhost:3000/auth/callback` (and the prod equivalent once deployed). Full setup steps in [README.md](README.md).

## Stack notes

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- No persistence layer yet — auth works but drill scores/attempts aren't saved (no DB table exists for it).
