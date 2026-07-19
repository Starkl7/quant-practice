# Quant Practice

Mental math drills, an inventory-aware market-making simulator, and a probability/stats
problem bank for quant trading interview prep. Spun out from the
[portfolio site](https://dhrubojeet-haldar.github.io) so it can grow independently
behind auth.

## The drills

1. **Mental Math Trainer** — timed arithmetic drills (configurable operations, digit
   sizes, round length) plus a sequences/pattern-recognition mode.
2. **Market-Making Game** — the "make me a market" game from real trading interviews
   (Jane Street, Optiver, ...) in three flavors: card game, dice game, and Fermi
   estimates. You quote a two-sided bid/ask on a hidden total across rounds while
   information is revealed, against a counterparty that trades when it's profitable.
3. **Probability & Stats** — a LeetCode-style problem bank: browse by index/title/
   difficulty (★–★★★), filter by category, submit answers (decimals, fractions like
   `6/91`, or expressions like `(4/9)^4` all accepted), with optional hints and full
   KaTeX-rendered solutions. Problems are authored in curated batches — each
   question written in original wording, solved, and verified numerically before
   import. A per-problem flag button lets users report suspect answers/parsing
   while the bank matures.

Scores and attempts persist per-user (Supabase), and `/profile` shows per-drill
stats including a cross-user percentile.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- Supabase: Google OAuth sign-in + Postgres (attempt history, problem flags)
- KaTeX for math rendering

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **Authentication → URL Configuration** and add
   `http://localhost:3000/auth/callback` (and your production URL's `/auth/callback`
   once deployed) to the redirect allow list. Then under **Authentication →
   Providers**, enable **Google** (create an OAuth client in Google Cloud Console
   and paste the client ID/secret — Supabase shows the exact redirect URI to use).
3. Run each file in `supabase/migrations/` (in order) in the dashboard's
   **SQL Editor** — they create the `drill_attempts` table, the percentile RPC, and
   the `problem_flags` table.
4. Copy `.env.local.example` to `.env.local` and fill in the values from
   **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
5. Install dependencies and run the dev server:
   ```
   npm install
   npm run dev
   ```
6. Visit `http://localhost:3000`, sign in with Google, and open `/practice`.

The app degrades gracefully without a Supabase project: drills work, but sign-in and
score persistence no-op.

## The probability problem bank

Problem content lives in the Supabase `problems` table, not in this repo (fields:
`id`, `source`, `chapter`, `difficulty`, `category`, `title`, `question`, `hint`,
`answer_type`, `answer`, `tolerance`, `solution`, `tags` — questions/hints/solutions
support KaTeX `$...$` and `$$...$$`). Batches are authored locally in a gitignored
staging file and upserted with `scripts/migrate-problems.mjs`.

Content policy: no fabricated problems, and no problem text reproduced verbatim
from any source. Every question is written in original wording, and every answer
is verified numerically (exact computation or simulation) before it's upserted. Solutions and hints are original. Answers and
solutions never leave the server — checking goes through the `check_answer` /
`reveal_solution` RPCs (see `supabase/queries/problem_bank_review.sql` for how
flags + solve stats are reviewed).

## Deploying

Deploy to [Vercel](https://vercel.com) (connect this repo) and set the same three
env vars in the Vercel project settings. Update the Supabase redirect allow list
with your production `/auth/callback` URL, and set `NEXT_PUBLIC_SITE_URL` to your
production domain.

## Roadmap ideas

- More problem-bank batches (conditional probability, expectation games).
- Leaderboard across drills — requires moving answer checking server-side first.
- Spaced-repetition resurfacing of missed problems.

## License

Code is [MIT-licensed](LICENSE). Problem-bank content (questions, solutions, hints)
is not part of this repository — it lives in the app's database and is meant to be
practiced against in the app rather than repackaged. `src/data/fermi_questions.json`
contains factual reference values with verification noted inline.
