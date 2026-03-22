import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { StripeConnectBanner } from "@/components/creator/stripe-connect-banner";

function centsToUsd(cents: number | null | undefined) {
  const n = cents ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n / 100);
}

export default async function CreatorDashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [
    earnedAgg,
    pendingAgg,
    packsAgg,
    packCount,
    packs,
    profileStripe,
  ] = await Promise.all([
    prisma.creatorEarning.aggregate({
      where: { creatorId: userId },
      _sum: { creatorShareCents: true },
    }),
    prisma.creatorEarning.aggregate({
      where: { creatorId: userId, isPaidOut: false },
      _sum: { creatorShareCents: true },
    }),
    prisma.samplePack.aggregate({
      where: { creatorId: userId },
      _sum: { totalSales: true },
    }),
    prisma.samplePack.count({ where: { creatorId: userId } }),
    prisma.samplePack.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        coverArtUrl: true,
        isPublished: true,
        sampleCount: true,
        totalSales: true,
        priceCents: true,
      },
    }),
    prisma.profileMarketplace.findUnique({
      where: { id: userId },
      select: { stripeConnectChargesEnabled: true },
    }),
  ]);

  const totalEarned = earnedAgg._sum.creatorShareCents ?? 0;
  const pending = pendingAgg._sum.creatorShareCents ?? 0;
  const totalSalesUnits = packsAgg._sum.totalSales ?? 0;

  const statClass =
    "rounded-lg border border-sr bg-sr-card px-4 py-4 text-center sm:text-left";

  return (
    <main className="mx-auto max-w-5xl px-4">
      <StripeConnectBanner
        chargesEnabled={profileStripe?.stripeConnectChargesEnabled ?? false}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl text-sr-ink">Dashboard</h1>
        <Link
          href="/creator/packs/new"
          className={cn(
            "inline-flex items-center justify-center rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg transition-colors hover:opacity-90 self-start sm:self-auto",
          )}
        >
          Create New Pack
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={statClass}>
          <p className="text-xs uppercase tracking-wide text-sr-muted">
            Total earned
          </p>
          <p className="mt-1 text-xl font-semibold text-sr-ink">
            {centsToUsd(totalEarned)}
          </p>
        </div>
        <div className={statClass}>
          <p className="text-xs uppercase tracking-wide text-sr-muted">
            Pending
          </p>
          <p className="mt-1 text-xl font-semibold text-sr-ink">
            {centsToUsd(pending)}
          </p>
        </div>
        <div className={statClass}>
          <p className="text-xs uppercase tracking-wide text-sr-muted">
            Total sales
          </p>
          <p className="mt-1 text-xl font-semibold text-sr-ink">
            {totalSalesUnits}
          </p>
        </div>
        <div className={statClass}>
          <p className="text-xs uppercase tracking-wide text-sr-muted">Packs</p>
          <p className="mt-1 text-xl font-semibold text-sr-ink">{packCount}</p>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-lg border border-sr bg-sr-card">
        <h2 className="border-b border-sr px-4 py-3 text-sm font-medium text-sr-muted">
          Your packs
        </h2>
        {packs.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-sr-muted">
            No packs yet. Create your first pack to start earning.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-sr text-xs uppercase text-sr-muted">
                  <th className="px-4 py-2">Cover</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Samples</th>
                  <th className="px-4 py-2">Sales</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-sr/80 last:border-0 hover:bg-sr-panel/50"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/creator/packs/${p.id}/edit`}
                        className="block h-10 w-10 overflow-hidden rounded bg-sr-bg"
                      >
                        {p.coverArtUrl ? (
                          <Image
                            src={p.coverArtUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center text-[10px] text-sr-dim">
                            —
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/creator/packs/${p.id}/edit`}
                        className="font-medium text-sr-ink hover:text-sr-gold"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          p.isPublished
                            ? "rounded-full bg-emerald-950/80 px-2 py-0.5 text-xs text-emerald-200"
                            : "rounded-full bg-sr-panel px-2 py-0.5 text-xs text-sr-muted"
                        }
                      >
                        {p.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sr-muted">{p.sampleCount}</td>
                    <td className="px-4 py-2 text-sr-muted">{p.totalSales}</td>
                    <td className="px-4 py-2 text-sr-muted">
                      {centsToUsd(p.priceCents)}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/creator/packs/${p.id}/edit`}
                        className="text-sr-gold hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
