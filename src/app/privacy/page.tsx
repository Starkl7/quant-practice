import Nav from "@/components/Nav";

export const metadata = {
  title: "Privacy Policy | Quant Practice",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="term-label term-prompt mb-3 !text-[var(--accent-blue)]">Privacy.sh</div>
        <h1 className="mb-8 text-4xl font-semibold tracking-tight text-[var(--foreground)]">Privacy Policy</h1>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Quant Practice (&quot;the site&quot;) is a free, non-commercial quant-interview practice
            tool. This page explains what data the site collects and how it&apos;s used. Last
            updated July 2026.
          </p>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--foreground)]">What we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="text-[var(--foreground)]">Sign-in via Google.</span>{" "}
                When you sign in, Google shares your name, email address, and profile picture with
                the site through Supabase Auth. We don&apos;t receive or store your Google password.
              </li>
              <li>
                <span className="text-[var(--foreground)]">Drill activity.</span>{" "}
                If you complete a drill (Mental Math, Market-Making, Probability &amp; Stats), we store your score,
                timestamp, and basic session metadata (e.g. accuracy, average answer time) tied to
                your account, so your progress and stats can be shown back to you on your Profile
                page.
              </li>
              <li>
                <span className="text-[var(--foreground)]">Problem flags.</span>{" "}
                If you flag a probability problem as incorrect or confusing, we store that flag against your
                account so it can be reviewed.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--foreground)]">What we don&apos;t do</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>We don&apos;t use any analytics, advertising, or tracking scripts.</li>
              <li>We don&apos;t sell, rent, or share your data with third parties.</li>
              <li>We don&apos;t email you outside of Google&apos;s own sign-in flow.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--foreground)]">Where data lives</h2>
            <p>
              Account and drill data is stored in a Supabase (Postgres) database. Row-level security
              restricts each account to reading and writing only its own rows.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--foreground)]">Your choices</h2>
            <p>
              You can sign out at any time from the navigation bar. To request deletion of your
              account and associated data, email the address below.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--foreground)]">Contact</h2>
            <p>
              Questions about this policy or your data:{" "}
              <a
                href="mailto:dhrubojeet17@gmail.com"
                className="text-[var(--accent-blue)] underline underline-offset-2"
              >
                dhrubojeet17@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
