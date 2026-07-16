import Nav from "@/components/Nav";
import PracticeTabs from "@/components/PracticeTabs";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/practice");

  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="term-label term-prompt mb-3 !text-[var(--accent-blue)]">Quant_Practice.sh</div>
        <h1 className="mb-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">Quant Practice</h1>
        <p className="mb-10 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Drills for the mental math, market-making intuition, and probability reasoning that show up
          in quant interviews and on the desk.
        </p>
        <PracticeTabs />
      </main>
    </div>
  );
}
