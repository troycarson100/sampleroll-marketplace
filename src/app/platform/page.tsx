import { auth } from "@/auth";
import { isPlatformOwner } from "@/lib/platform/access";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlatformHomePage() {
  const session = await auth();
  const owner = isPlatformOwner(session?.user?.email);

  return (
    <main>
      <h1 className="font-display text-3xl text-sr-ink">Platform dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-sr-muted">
        Manage revenue-share contracts with creators. Accepted contracts update
        their <strong className="text-sr-ink">custom split</strong> used for
        Stripe payouts and earnings records (default remains 75% creator /
        25% platform when no custom contract applies).
      </p>
      <ul className="mt-8 list-inside list-disc space-y-2 text-sm text-sr-muted">
        <li>
          <Link href="/platform/contracts/new" className="text-sr-gold hover:underline">
            Create a contract
          </Link>{" "}
          — set creator share %, attach PDF, send for approval.
        </li>
        <li>
          <Link href="/platform/contracts" className="text-sr-gold hover:underline">
            View all contracts
          </Link>
        </li>
        {owner ? (
          <li>
            <Link href="/platform/staff" className="text-sr-gold hover:underline">
              Manage supervisors
            </Link>{" "}
            — users who can create contracts (owners are set via env).
          </li>
        ) : null}
      </ul>
      <p className="mt-8 text-xs text-sr-dim">
        Owner access: <code className="rounded bg-sr-card px-1">PLATFORM_OWNER_EMAILS</code>{" "}
        in <code className="rounded bg-sr-card px-1">.env.local</code> (comma-separated).
      </p>
    </main>
  );
}
