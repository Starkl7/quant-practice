# Quant Practice

Mental math drills, an inventory-aware market-making simulator, and probability/stats
problems for quant trading interview prep. Spun out from the
[portfolio site](https://dhrubojeet-haldar.github.io) so it can grow independently
(saved scores, a real problem bank, leaderboards, etc.) behind auth.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase Auth (passwordless magic-link email) for sign-in
- Chart.js for the market-making P&L chart

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **Authentication → URL Configuration** and add
   `http://localhost:3000/auth/callback` (and your production URL's `/auth/callback`
   once deployed) to the redirect allow list.
3. Copy `.env.local.example` to `.env.local` and fill in the values from
   **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. Install dependencies and run the dev server:
   ```
   npm install
   npm run dev
   ```
5. Visit `http://localhost:3000`, sign in with your email, and open `/practice`.

## Populating the probability problem bank

`src/data/probability_problems.json` ships as an empty schema skeleton — no
fabricated problems. Add real entries (from your prep books) following the
`_schema` field documented at the top of that file:

```json
{
  "id": "unique-id",
  "source": "Book Title",
  "chapter": "Ch. 3 — Combinatorics",
  "difficulty": "medium",
  "category": "combinatorics",
  "question": "Question text",
  "answer_type": "numeric",
  "answer": 0,
  "tolerance": 0.01,
  "solution": "Worked solution.",
  "tags": ["combinatorics"]
}
```

## Deploying

Deploy to [Vercel](https://vercel.com) (connect this repo), and set the same three
env vars in the Vercel project settings. Update the Supabase redirect allow list with
your production `/auth/callback` URL, and set `NEXT_PUBLIC_SITE_URL` to your
production domain.

## Roadmap ideas

- Persist scores per-user in a Supabase `attempts` table (schema not yet created).
- Render KaTeX in the probability problem view (the portfolio site used KaTeX via
  CDN; this app doesn't wire it up yet).
- Leaderboard across drills.
