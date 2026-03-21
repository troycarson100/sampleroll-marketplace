import Link from "next/link";

export const metadata = {
  title: "Database connection help | SampleRoll",
};

export default function DatabaseHelpPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-sr-ink">
      <h1 className="font-display text-2xl text-sr-gold">
        Catalog / database connection
      </h1>
      <p className="mt-4 text-sm text-sr-muted">
        If the browse page shows &quot;Catalog unavailable&quot;, the app could
        not open a connection or run Prisma queries against your Supabase
        Postgres.
      </p>

      <h2 className="mt-10 font-display text-lg text-sr-gold">
        Where is the URI? (not under Settings → General)
      </h2>
      <p className="mt-3 text-sm text-sr-muted">
        The <strong className="text-sr-ink">gear / Project Settings</strong> menu
        (General, Compute and Disk, …) usually does{" "}
        <strong className="text-sr-ink">not</strong> show a &quot;Database&quot;
        line or your Postgres connection string.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-sr-muted">
        <li>
          <strong className="text-sr-ink">Connect</strong> — on your{" "}
          <strong className="text-sr-ink">project</strong> dashboard (home), click
          the <strong className="text-sr-ink">Connect</strong> button at the top.
          Copy the <strong className="text-sr-ink">direct</strong> or{" "}
          <strong className="text-sr-ink">session pooler</strong> URI from there.{" "}
          <a
            href="https://supabase.com/docs/guides/database/connecting-to-postgres"
            className="text-sr-gold underline underline-offset-2 hover:text-white"
          >
            Supabase: Connect to Postgres
          </a>
        </li>
        <li>
          <strong className="text-sr-ink">Database</strong> — in the{" "}
          <strong className="text-sr-ink">main left sidebar</strong> (with Table
          Editor, SQL Editor), open <strong className="text-sr-ink">Database</strong>{" "}
          and check <strong className="text-sr-ink">Settings</strong> / connection
          details if your layout shows them there.
        </li>
      </ul>

      <h2 className="mt-10 font-display text-lg text-sr-gold">
        Local development (your machine)
      </h2>
      <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
        Run <code className="text-sr-ink">npm run db:ping</code> from the project
        root. If you see Prisma <strong className="text-sr-ink">P1001</strong>{" "}
        (&quot;Can&apos;t reach database server&quot; on{" "}
        <code className="text-sr-ink">db.*.supabase.co</code>), your network is
        likely <strong className="text-sr-ink">IPv4-only</strong> — Supabase
        direct DB is often <strong className="text-sr-ink">IPv6-only</strong>. You
        must use the <strong className="text-sr-ink">Session pooler</strong> URI
        from <strong className="text-sr-ink">Connect</strong> (host like{" "}
        <code className="text-sr-ink">aws-*-*.pooler.supabase.com</code>, user{" "}
        <code className="text-sr-ink">postgres.YOUR_PROJECT_REF</code>), not the
        direct host.
      </p>
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-sr-muted">
        <li>
          In the project root, create or edit{" "}
          <code className="text-sr-ink">.env.local</code> (same folder as{" "}
          <code className="text-sr-ink">package.json</code>). It is gitignored.
        </li>
        <li>
          Add a line:{" "}
          <code className="break-all text-sr-ink">
            DATABASE_URL=&quot;postgresql://...&quot;
          </code>{" "}
          with no spaces around <code className="text-sr-ink">=</code> unless
          your tooling requires otherwise.
        </li>
        <li>
          Paste the URI from the <strong className="text-sr-ink">Connect</strong>{" "}
          panel. For <code className="text-sr-ink">next dev</code> on a typical
          Mac or home Wi‑Fi: if <code className="text-sr-ink">db:ping</code> fails
          with <strong className="text-sr-ink">P1001</strong>, switch to{" "}
          <strong className="text-sr-ink">Session pooler</strong> (port{" "}
          <code className="text-sr-ink">5432</code> on{" "}
          <code className="text-sr-ink">*.pooler.supabase.com</code>). Direct (
          <code className="text-sr-ink">db.*.supabase.co:5432</code>) only works
          when your machine can reach IPv6.
        </li>
        <li>
          If the connection fails, append{" "}
          <code className="text-sr-ink">?sslmode=require</code> to the URL (or{" "}
          <code className="text-sr-ink">&amp;sslmode=require</code> if the URL
          already has <code className="text-sr-ink">?</code>).
        </li>
        <li>
          URL-encode special characters in the password (e.g.{" "}
          <code className="text-sr-ink">@</code> →{" "}
          <code className="text-sr-ink">%40</code>).
        </li>
        <li>
          Stop the dev server and run{" "}
          <code className="text-sr-ink">npm run dev</code> again so Next.js
          reloads env vars.
        </li>
        <li>
          Apply marketplace SQL to this database (see{" "}
          <code className="text-sr-ink">supabase/migrations/</code>) so tables
          like <code className="text-sr-ink">sample_packs</code> exist.
        </li>
      </ol>

      <h2 className="mt-10 font-display text-lg text-sr-gold">
        Supabase: pooler vs direct
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-sr-muted">
        <li>
          <strong className="text-sr-ink">Local / VPS / Docker</strong> — direct{" "}
          <code className="text-sr-ink">5432</code> URI is typical.
        </li>
        <li>
          <strong className="text-sr-ink">Serverless</strong> (e.g. Vercel
          functions) — often use the{" "}
          <strong className="text-sr-ink">transaction pooler</strong> (port{" "}
          <code className="text-sr-ink">6543</code>) and add{" "}
          <code className="text-sr-ink">
            ?pgbouncer=true&amp;connection_limit=1
          </code>{" "}
          for Prisma.
        </li>
      </ul>

      <h2 className="mt-10 font-display text-lg text-sr-gold">Quick test</h2>
      <p className="mt-3 text-sm text-sr-muted">
        From the project directory (with the same{" "}
        <code className="text-sr-ink">DATABASE_URL</code> in the environment):
      </p>
      <pre className="mt-2 overflow-x-auto rounded-md bg-sr-card p-3 text-xs text-sr-ink">
        npx prisma db execute --stdin &lt;&lt;&lt; &quot;SELECT 1&quot;
      </pre>
      <p className="mt-2 text-sm text-sr-muted">
        If that errors, fix the connection string before expecting the app to
        load packs.
      </p>

      <p className="mt-8 text-sm">
        <Link href="/sounds" className="text-sr-gold hover:underline">
          ← Back to Sounds
        </Link>
      </p>
    </main>
  );
}
