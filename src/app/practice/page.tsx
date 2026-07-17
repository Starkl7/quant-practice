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
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="term-label term-prompt mb-6 !text-[var(--accent-blue)]">Quant_Practice.sh</div>
        <PracticeTabs />
      </main>
    </div>
  );
}
