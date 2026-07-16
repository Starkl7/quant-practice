# Handover — Quant Practice

Status as of the session that created this repo. This project is **separate from
the portfolio site** (`~/Desktop/Projects/Website`) — treat it as its own codebase
going forward; don't assume context carries over automatically between the two.

## What this is

Three quant-interview drills, spun out of the portfolio's `quant-practice.html`
into a standalone app so it could get real auth and keep growing as its own thing:

1. **Mental Math Trainer** (`src/components/MentalMathTrainer.tsx`) — timed
   arithmetic drills, configurable ops/digit-size/round-length. Fully working,
   no backend dependency.
2. **Market-Making Game** (`src/components/TradingGame.tsx`) — the "make me a
   market" card game used in trading interviews (Jane Street, Optiver, etc.):
   a hidden total is built from a deck of cards, you see a partial hand, and
   across several rounds you quote a two-sided bid/ask on the sum while more
   cards are revealed. Fully working, no backend dependency, purely
   client-side.
3. **Probability & Stats** (`src/components/ProbabilityBank.tsx`) — reads from
   `src/data/probability_problems.json`. **That file is an intentionally empty
   schema skeleton** — no fabricated problems. The engine (question render,
   numeric/text answer checking, reveal-solution, next) is fully built and
   tested against the schema; it just has nothing to show yet.

All three live behind `/practice`, tabbed via `src/components/PracticeTabs.tsx`.

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4
- Supabase Auth — passwordless magic-link email (no passwords in this app)
- Chart.js / react-chartjs-2 for the market-making chart

## Auth architecture

- `src/lib/supabase/{client,server,middleware}.ts` — browser client, server
  client (cookie-based), and the session-refresh helper used by the proxy.
- `src/proxy.ts` — Next 16 renamed `middleware.ts` → `proxy.ts` (exported
  function must be named `proxy`, not `middleware`, or the build fails with
  "Proxy is missing expected function export name"). Redirects unauthenticated
  requests to `/practice` → `/login?next=/practice`.
- `src/app/login/page.tsx` — email input, calls `supabase.auth.signInWithOtp`.
- `src/app/auth/callback/route.ts` — exchanges the magic-link `code` for a
  session, then redirects to `next` (defaults to `/practice`).
- `src/app/auth/signout/route.ts` — POST route, signs out, redirects home.
- `src/app/practice/page.tsx` — server component, redirects to `/login` if no
  user (belt-and-suspenders alongside the proxy check).

## Current state / what's NOT done yet

- **No real Supabase project connected.** `.env.local` (gitignored) has
  placeholder values (`https://placeholder.supabase.co` etc.) — just enough for
  `npm run dev` / `npm run build` to not crash while `getUser()` silently
  no-ops. To actually sign in:
  1. Create a project at supabase.com.
  2. Authentication → URL Configuration → add
     `http://localhost:3000/auth/callback` (and your prod URL's version later)
     to the redirect allow-list.
  3. Copy real values from Project Settings → API into `.env.local`
     (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Not deployed.** No Vercel project yet. Once deployed, set the same env vars
  there, add the prod `/auth/callback` URL to Supabase's redirect allow-list,
  and set `NEXT_PUBLIC_SITE_URL` to the prod domain.
- **Portfolio site's nav link is a placeholder.** `~/Desktop/Projects/Website/index.html`
  has `<a href="#" id="quant-practice-link">Quant Practice ↗</a>` — needs the
  real deployed URL once this app is live.
- **No persistence yet.** Auth works (once Supabase is configured) but scores/
  attempts aren't saved anywhere — there's no database table for it. Next step
  if you want persistence: a Supabase `attempts` table (user_id, drill, score,
  created_at) + a couple of API routes.
- **Probability problem bank is empty.** Owner said they have prep books to
  pull real problems from; schema is documented inline in
  `src/data/probability_problems.json`'s `_schema` field. Don't invent
  placeholder problems — leave it empty until real ones are supplied.
- **Git**: repo was `git init`'d by `create-next-app` with one commit
  ("Initial commit from Create Next App"). Everything built in this session
  (`src/lib`, `src/app/auth`, `src/app/login`, `src/app/practice`,
  `src/components`, `src/data`, `src/proxy.ts`, `.claude/`) is **uncommitted**.
  Nothing has been pushed to a remote — no GitHub repo exists for this project
  yet.

## Verified working (this session)

- `npx tsc --noEmit` — clean
- `npm run lint` — clean
- `npm run build` — clean (no warnings, including after the middleware→proxy
  rename)
- Manual browser testing of all three drill UIs (via a temporary debug route,
  since `/practice` requires real auth — that route was deleted afterward)
- Auth guard confirmed: visiting `/practice` unauthenticated correctly redirects
  to `/login`

## Local dev

```
npm install       # if node_modules isn't already present
npm run dev        # http://localhost:3000
```

There's also a `.claude/launch.json` entry named `quant-practice` in the
**portfolio** repo (`~/Desktop/Projects/Website/.claude/launch.json`) that runs
`npm --prefix ~/Desktop/Projects/quant-practice run dev` — that was a
convenience for previewing this app from within the portfolio session's
Browser pane tooling, not something this repo depends on.

## Suggested next steps, roughly in order

1. Create the Supabase project, wire up real env vars, confirm magic-link
   sign-in works end-to-end locally.
2. Commit the current work (`git add`, first real commit beyond the
   create-next-app scaffold), create a GitHub repo, push.
3. Deploy to Vercel, wire prod env vars + Supabase redirect URL.
4. Send the deployed URL back so the portfolio nav link can point at it.
5. Populate the probability problem bank from real source material.
6. If desired: a Supabase table + API routes for saved scores/attempts.
