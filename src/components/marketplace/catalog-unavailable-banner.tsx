import Link from "next/link";

/** Shown when the app cannot reach Postgres (missing env, wrong URL, or network/SSL). */
export function CatalogUnavailableBanner() {
  return (
    <div
      role="alert"
      className="border-b border-red-500/35 bg-red-950/85 px-4 py-3 text-center text-sm text-red-100"
    >
      <strong className="font-semibold">Catalog unavailable.</strong>{" "}
      Prisma could not query Postgres.{" "}
      <strong className="font-semibold">Local:</strong> put{" "}
      <code className="rounded bg-black/35 px-1 py-0.5">DATABASE_URL</code> in{" "}
      <code className="rounded bg-black/35 px-1 py-0.5">.env.local</code> in
      the project root (Supabase dashboard → <strong className="font-semibold">Connect</strong>{" "}
      button for the URI—not under gear → General), save, then
      restart <code className="rounded bg-black/35 px-1 py-0.5">npm run dev</code>
      . On many Mac / Wi‑Fi networks, <strong className="font-semibold">direct</strong>{" "}
      <code className="rounded bg-black/35 px-1 py-0.5">db.*.supabase.co</code> fails (
      <strong className="font-semibold">P1001</strong>) — use the{" "}
      <strong className="font-semibold">Session pooler</strong> URI from{" "}
      <strong className="font-semibold">Connect</strong> instead (
      <code className="rounded bg-black/35 px-1 py-0.5">*.pooler.supabase.com</code>
      , port <code className="rounded bg-black/35 px-1 py-0.5">5432</code>). Add{" "}
      <code className="rounded bg-black/35 px-1 py-0.5">?sslmode=require</code> if missing.{" "}
      <Link
        href="/help/db"
        className="font-medium text-amber-200 underline underline-offset-2 hover:text-white"
      >
        More help
      </Link>
      {process.env.NODE_ENV === "development" ? (
        <span className="mt-2 block text-xs text-red-200/90">
          Dev: check the terminal running{" "}
          <code className="rounded bg-black/35 px-1 py-0.5">npm run dev</code> for{" "}
          <code className="rounded bg-black/35 px-1 py-0.5">[prisma:…]</code>. Run{" "}
          <code className="rounded bg-black/35 px-1 py-0.5">npm run db:ping</code> — if
          you see <code className="rounded bg-black/35 px-1 py-0.5">P1001</code>, Supabase
          direct DB is often IPv6-only; use the{" "}
          <strong className="font-semibold">Session pooler</strong> URI from dashboard{" "}
          <strong className="font-semibold">Connect</strong>. Also run SQL in{" "}
          <code className="rounded bg-black/35 px-1 py-0.5">
            supabase/migrations/
          </code>
          .
        </span>
      ) : null}
    </div>
  );
}
