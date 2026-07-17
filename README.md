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
   KaTeX-rendered solutions. Problems are imported in curated batches from prep
   books, each answer verified numerically before import. A per-problem flag button
   lets users report suspect answers/parsing while the bank matures.

Scores and attempts persist per-user (Supabase), and `/profile` shows per-drill
stats including a cross-user percentile.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- Supabase: passwordless magic-link auth + Postgres (attempt history, problem flags)
- KaTeX for math rendering

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **Authentication → URL Configuration** and add
   `http://localhost:3000/auth/callback` (and your production URL's `/auth/callback`
   once deployed) to the redirect allow list.
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
6. Visit `http://localhost:3000`, sign in with your email, and open `/practice`.

The app degrades gracefully without a Supabase project: drills work, but sign-in and
score persistence no-op.

## The probability problem bank

`src/data/probability_problems.json` holds the problems; the schema is documented in
its `_schema` field (`id`, `source`, `chapter`, `difficulty`, `category`, `title`,
`question`, `hint`, `answer_type`, `answer`, `tolerance`, `solution`, `tags` —
questions/hints/solutions support KaTeX `$...$` and `$$...$$`).

Content policy: no fabricated or scraped problems. Entries are imported in curated
batches from freely shared prep material[^1], and every answer is verified
numerically (exact computation or simulation) before it lands here. Solutions are
authored for this repo, not copied. Answer checking is client-side by design — this
is a practice tool, not a competition (see `supabase/queries/problem_bank_review.sql`
for how flags + solve stats are reviewed).

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

Code is [MIT-licensed](LICENSE). The problem-bank data files (`src/data/*.json`)
are provided for use within this app; the problem statements derive from freely
shared prep material credited below, and the solutions/hints, while original to
this repo, are meant to be practiced against here rather than repackaged.

[^1]: Problem statements in the current batches are adapted from Srijit Mukherjee's
    freely shared *444+ Problems in Probability for AI and Quantitative Finance* —
    a curated collection he distributes openly for students (per its acknowledgment,
    the problems are gathered from free online resources). Solutions, hints, and
    answer verification in this repo are original. Thank you, Srijit!
