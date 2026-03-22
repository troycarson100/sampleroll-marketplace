import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPlatformStaff } from "@/lib/platform/access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  DRAFT: "bg-sr-panel text-sr-muted",
  PENDING_REVIEW: "bg-amber-950/80 text-amber-200",
  ACTIVE: "bg-emerald-950/80 text-emerald-200",
  DECLINED: "bg-red-950/60 text-red-200",
  VOID: "bg-sr-panel text-sr-dim",
};

export default async function PlatformContractsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/platform/contracts");
  if (!(await isPlatformStaff(session.user.id, session.user.email))) {
    redirect("/");
  }

  const contracts = await prisma.creatorContract.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      creator: { select: { email: true, name: true } },
      createdBy: { select: { email: true } },
    },
  });

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl text-sr-ink">Contracts</h1>
        <Link
          href="/platform/contracts/new"
          className="inline-flex rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90"
        >
          New contract
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-sr">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-sr bg-sr-card text-xs uppercase text-sr-muted">
              <th className="px-3 py-2">Creator</th>
              <th className="px-3 py-2">Split</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Sent</th>
              <th className="px-3 py-2">By</th>
              <th className="px-3 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sr-muted">
                  No contracts yet.
                </td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.id} className="border-b border-sr/80 hover:bg-sr-panel/40">
                  <td className="px-3 py-2">
                    <div className="font-medium text-sr-ink">
                      {c.creator.email}
                    </div>
                    {c.creator.name ? (
                      <div className="text-xs text-sr-dim">{c.creator.name}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-sr-muted">
                    {c.splitPercentage}% creator
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusStyle[c.status] ?? ""}`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-sr-dim">
                    {c.sentAt
                      ? new Date(c.sentAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-sr-dim">
                    {c.createdBy.email}
                  </td>
                  <td className="px-3 py-2">
                    {c.status === "PENDING_REVIEW" || c.status === "ACTIVE" ? (
                      <Link
                        href={`/creator-contract/${c.acceptanceToken}`}
                        className="text-sr-gold hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
