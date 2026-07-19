import { createClient } from "@supabase/supabase-js";

// Anon-key client for public reads (problems_public). Used anywhere that
// doesn't have a request/cookie scope — generateStaticParams, sitemap.ts,
// and build-time metadata generation can't use the cookie-based client in
// ./server.ts, and don't need to: problem listings are public data, not
// user-specific.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
