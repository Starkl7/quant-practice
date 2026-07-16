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
3. **Probability & Stats** (`src/components/ProbabilityBank.tsx`) — reads problems from `src/data/probability_problems.json`.

All three are tabbed together via `src/components/PracticeTabs.tsx` and rendered from `src/app/practice/page.tsx`.

### Probability problem bank

`src/data/probability_problems.json` is an intentionally empty schema skeleton — **do not fabricate problems**. Real entries come from the owner's prep books and follow the `_schema` field documented at the top of that file (fields: `id`, `source`, `chapter`, `difficulty`, `category`, `question`, `answer_type`, `answer`, `tolerance`, `solution`, `tags`). The rendering/answer-checking engine is fully built against this schema; only content is missing.

## Auth architecture (Supabase, passwordless magic-link)

- `src/lib/supabase/client.ts` / `server.ts` — browser and server (cookie-based) Supabase clients.
- `src/lib/supabase/middleware.ts` — `updateSession()`, the session-refresh helper invoked from the proxy.
- `src/proxy.ts` — Next 16's replacement for `middleware.ts`. Redirects unauthenticated requests to `/practice` → `/login?next=/practice`. The exported function must be named `proxy`, not `middleware`, or the build fails (see `@AGENTS.md` note on Next 16 breaking changes above).
- `src/app/login/page.tsx` — email input, calls `supabase.auth.signInWithOtp`.
- `src/app/auth/callback/route.ts` — exchanges the magic-link `code` for a session, redirects to `next` (default `/practice`).
- `src/app/auth/signout/route.ts` — POST route; signs out and redirects home.
- `src/app/practice/page.tsx` — server component; also redirects to `/login` if there's no user (belt-and-suspenders alongside the proxy check).

No passwords anywhere in this app — auth is magic-link only.

## Local setup

Requires a Supabase project and `.env.local` (gitignored) with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Without real values, `getUser()` silently no-ops (build/dev still work, sign-in doesn't). Supabase dashboard → Authentication → URL Configuration must allow-list `http://localhost:3000/auth/callback` (and the prod equivalent once deployed). Full setup steps in [README.md](README.md).

## Stack notes

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- No persistence layer yet — auth works but drill scores/attempts aren't saved (no DB table exists for it).
