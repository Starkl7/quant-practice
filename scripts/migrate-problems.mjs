// One-off backfill: loads src/data/probability_problems.json into the
// Supabase `problems` table (see supabase/migrations/0006_problems_table.sql).
// Not part of the app build — run manually after each curated batch is added
// to the JSON, same authoring workflow as before, just synced to the DB now.
//
// Usage:
//   Add SUPABASE_SERVICE_ROLE_KEY=... to .env.local (gitignored), then:
//   node --env-file=.env.local scripts/migrate-problems.mjs
//
// Needs the service role key (Supabase dashboard → Project Settings → API),
// not the anon key — RLS blocks direct writes to `problems` for everyone else.
// Never commit the service role key.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in the environment."
  );
  process.exit(1);
}

const { problems } = JSON.parse(
  readFileSync(path.join(__dirname, "../src/data/probability_problems.json"), "utf-8")
);

if (!problems?.length) {
  console.error("No problems found in probability_problems.json — nothing to migrate.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const rows = problems.map((p, index) => ({
  id: p.id,
  source: p.source ?? null,
  chapter: p.chapter ?? null,
  difficulty: p.difficulty ?? null,
  category: p.category ?? null,
  title: p.title ?? null,
  question: p.question,
  hint: p.hint ?? null,
  answer_type: p.answer_type,
  tolerance: p.tolerance ?? null,
  tags: p.tags ?? [],
  answer: p.answer,
  solution: p.solution,
  // Chapter/section groups run past 9 problems (e.g. 444-1.1.1..444-1.1.28),
  // so sorting by `id` text would misorder them — this preserves the JSON's
  // curated array order instead.
  sort_order: index,
}));

const { error } = await supabase.from("problems").upsert(rows, { onConflict: "id" });

if (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
}

console.log(`Upserted ${rows.length} problems into Supabase.`);
