import Link from "next/link";
import { isDatabaseConfigured } from "@/lib/database-env";

/** Shown in development when `DATABASE_URL` is missing so pages don’t 500 / white-screen. */
export function DevDatabaseNotice() {
  if (process.env.NODE_ENV === "production" || isDatabaseConfigured()) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/40 bg-amber-950/90 px-4 py-3 text-center text-sm text-amber-100">
      <p>
        <strong className="font-semibold">Dev:</strong>{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">DATABASE_URL</code> is
        not loaded (empty or missing). Next only reads env from the{" "}
        <strong className="font-semibold">project root</strong> (same folder as{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">package.json</code>).
      </p>
      <p className="mt-2 text-amber-100/90">
        Add to <code className="rounded bg-black/30 px-1 py-0.5">.env.local</code>{" "}
        or <code className="rounded bg-black/30 px-1 py-0.5">.env</code>:{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">
          DATABASE_URL=&quot;postgresql://…&quot;
        </code>{" "}
        — no spaces around <code className="rounded bg-black/30 px-1">=</code>.
        Get the URI from Supabase <strong className="font-semibold">Connect</strong>{" "}
        (<Link href="/help/db" className="font-medium text-amber-200 underline">
          help
        </Link>
        ). Then <strong className="font-semibold">stop and restart</strong>{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">npm run dev</code>.
      </p>
      <p className="mt-2 text-xs text-amber-200/80">
        If the screen was blank before:{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">
          npm run dev:clean
        </code>{" "}
        or{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">
          rm -rf .next &amp;&amp; npm run dev
        </code>
        .
      </p>
    </div>
  );
}
