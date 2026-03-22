import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_CREATOR_SPLIT } from "@/lib/constants";

const PAGE_SIZE = 20;

function centsToUsd(cents: number | null | undefined) {
  const n = cents ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n / 100);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

type Props = {
  searchParams: { page?: string };
};

export default async function CreatorEarningsPage({ searchParams }: Props) {
  const session = await auth();
  const userId = session!.user!.id;
  const pageRaw = searchParams.page;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  const [
    profile,
    totalEarnedAgg,
    paidOutAgg,
    pendingAgg,
    totalRows,
  ] = await Promise.all([
    prisma.profileMarketplace.findUnique({
      where: { id: userId },
      select: {
        paypalEmail: true,
        customSplitPercentage: true,
        stripeConnectChargesEnabled: true,
        stripeConnectAccountId: true,
      },
    }),
    prisma.creatorEarning.aggregate({
      where: { creatorId: userId },
      _sum: { creatorShareCents: true },
    }),
    prisma.creatorEarning.aggregate({
      where: { creatorId: userId, isPaidOut: true },
      _sum: { creatorShareCents: true },
    }),
    prisma.creatorEarning.aggregate({
      where: { creatorId: userId, isPaidOut: false },
      _sum: { creatorShareCents: true },
    }),
    prisma.creatorEarning.count({ where: { creatorId: userId } }),
  ]);

  const totalEarned = totalEarnedAgg._sum.creatorShareCents ?? 0;
  const paidOut = paidOutAgg._sum.creatorShareCents ?? 0;
  const pending = pendingAgg._sum.creatorShareCents ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const skip = (effectivePage - 1) * PAGE_SIZE;

  const rows = await prisma.creatorEarning.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    include: {
      pack: { select: { title: true } },
    },
  });

  const splitDisplay =
    profile?.customSplitPercentage ?? DEFAULT_CREATOR_SPLIT;

  return (
    <main className="mx-auto max-w-5xl px-4">
      <h1 className="font-display text-3xl text-sr-ink">Earnings</h1>
      <p className="mt-2 text-sm text-sr-muted">
        Your revenue share:{" "}
        <span className="text-sr-ink">{splitDisplay}%</span>
        {profile?.customSplitPercentage != null ? " (custom)" : ""}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-sr bg-sr-card px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-sr-muted">
            Total earned
          </p>
          <p className="mt-1 text-xl font-semibold text-sr-ink">
            {centsToUsd(totalEarned)}
          </p>
        </div>
        <div className="rounded-lg border border-sr bg-sr-card px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-sr-muted">
            Paid out
          </p>
          <p className="mt-1 text-xl font-semibold text-sr-ink">
            {centsToUsd(paidOut)}
          </p>
        </div>
        <div className="rounded-lg border border-sr bg-sr-card px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-sr-muted">
            Pending
          </p>
          <p className="mt-1 text-xl font-semibold text-sr-ink">
            {centsToUsd(pending)}
          </p>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-lg border border-sr bg-sr-card">
        <h2 className="border-b border-sr px-4 py-3 text-sm font-medium text-sr-muted">
          Earnings history
        </h2>
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-sr-muted">
            No earnings yet. Sales will appear here after purchases complete.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-sr text-xs uppercase text-sr-muted">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Pack</th>
                  <th className="px-4 py-2">Sale</th>
                  <th className="px-4 py-2">Your share</th>
                  <th className="px-4 py-2">Split</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-sr/80 last:border-0 hover:bg-sr-panel/50"
                  >
                    <td className="px-4 py-2 text-sr-muted">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-4 py-2 font-medium text-sr-ink">
                      {e.pack.title}
                    </td>
                    <td className="px-4 py-2 text-sr-muted">
                      {centsToUsd(e.saleAmountCents)}
                    </td>
                    <td className="px-4 py-2 text-sr-ink">
                      {centsToUsd(e.creatorShareCents)}
                    </td>
                    <td className="px-4 py-2 text-sr-muted">
                      {e.splitPercentage}%
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          e.isPaidOut
                            ? "rounded-full bg-emerald-950/80 px-2 py-0.5 text-xs text-emerald-200"
                            : "rounded-full bg-amber-950/80 px-2 py-0.5 text-xs text-amber-200"
                        }
                      >
                        {e.isPaidOut ? "Paid out" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sr px-4 py-3 text-sm text-sr-muted">
            <span>
              Page {effectivePage} of {totalPages}
            </span>
            <div className="flex gap-2">
              {effectivePage > 1 ? (
                <Link
                  href={`/creator/earnings?page=${effectivePage - 1}`}
                  className="rounded border border-sr px-3 py-1 text-sr-ink hover:bg-sr-panel"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded border border-sr/50 px-3 py-1 opacity-40">
                  Previous
                </span>
              )}
              {effectivePage < totalPages ? (
                <Link
                  href={`/creator/earnings?page=${effectivePage + 1}`}
                  className="rounded border border-sr px-3 py-1 text-sr-ink hover:bg-sr-panel"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded border border-sr/50 px-3 py-1 opacity-40">
                  Next
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-sr bg-sr-card px-4 py-4 text-sm text-sr-muted">
        <p className="font-medium text-sr-ink">Payouts</p>
        <p className="mt-2">
          Your default revenue share is{" "}
          <span className="text-sr-ink">{splitDisplay}%</span> (custom split may
          apply per pack where set).
        </p>
        <p className="mt-2">
          Stripe Connect:{" "}
          <span className="text-sr-ink">
            {profile?.stripeConnectChargesEnabled
              ? "Onboarding complete — payouts enabled for transfers"
              : profile?.stripeConnectAccountId
                ? "Action required — finish or refresh onboarding from the dashboard"
                : "Not connected yet — use the dashboard banner to open Stripe"}
          </span>
        </p>
        {profile?.paypalEmail ? (
          <p className="mt-2 text-xs text-sr-dim">
            Legacy PayPal on file: {profile.paypalEmail}
          </p>
        ) : null}
        <p className="mt-3 text-xs">
          Questions? Email{" "}
          <a
            href="mailto:support@sampleroll.com"
            className="text-sr-gold hover:underline"
          >
            support@sampleroll.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
