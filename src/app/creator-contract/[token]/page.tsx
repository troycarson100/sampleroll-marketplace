import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CreatorContractActions } from "@/components/platform/creator-contract-actions";

export const dynamic = "force-dynamic";

function isContractParty(
  contract: { inviteEmailNorm: string; creatorUserId: string },
  userId: string,
  userEmail: string | null | undefined,
): boolean {
  if (contract.creatorUserId === userId) return true;
  const e = userEmail?.trim().toLowerCase() ?? "";
  return e === contract.inviteEmailNorm;
}

export default async function CreatorContractPage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token?.trim();
  if (!token) notFound();

  const contract = await prisma.creatorContract.findUnique({
    where: { acceptanceToken: token },
    include: {
      createdBy: { select: { email: true } },
    },
  });
  if (!contract) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?next=${encodeURIComponent(`/creator-contract/${token}`)}`);
  }

  if (!isContractParty(contract, session.user.id, session.user.email)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sr-ink">
        <h1 className="font-display text-xl text-sr-gold">Wrong account</h1>
        <p className="mt-2 text-sm text-sr-muted">
          Sign in as the invited creator ({contract.inviteEmailNorm}) to view
          this agreement.
        </p>
        <Link href="/" className="mt-6 inline-block text-sr-gold hover:underline">
          Home
        </Link>
      </main>
    );
  }

  const pending = contract.status === "PENDING_REVIEW";
  const active = contract.status === "ACTIVE";
  const declined = contract.status === "DECLINED";

  return (
    <main className="mx-auto max-w-lg px-4 py-12 text-sr-ink">
      <h1 className="font-display text-2xl text-sr-gold">{contract.title}</h1>
      <p className="mt-2 text-sm text-sr-muted">
        From SampleRoll ({contract.createdBy.email})
      </p>

      <div className="mt-6 rounded-lg border border-sr bg-sr-card p-4 text-sm">
        <p>
          <span className="text-sr-muted">Your revenue share: </span>
          <strong className="text-sr-ink">{contract.splitPercentage}%</strong>{" "}
          of each qualifying sale (before Stripe fees).
        </p>
        {contract.notes ? (
          <p className="mt-3 text-sr-muted">{contract.notes}</p>
        ) : null}
      </div>

      {contract.legalObjectPath ? (
        <p className="mt-6">
          <a
            href={`/api/creator-contract/${token}/legal`}
            className="text-sr-gold hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Download legal document (PDF)
          </a>
          {contract.legalFilename ? (
            <span className="ml-2 text-xs text-sr-dim">
              ({contract.legalFilename})
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="mt-8">
        {pending ? (
          <CreatorContractActions token={token} />
        ) : active ? (
          <p className="text-sm text-emerald-200">
            You accepted this agreement on{" "}
            {contract.acceptedAt
              ? new Date(contract.acceptedAt).toLocaleString()
              : "—"}
            . Your profile split has been updated.
          </p>
        ) : declined ? (
          <p className="text-sm text-sr-muted">You declined this agreement.</p>
        ) : (
          <p className="text-sm text-sr-muted">
            This contract is not awaiting action (status: {contract.status}).
          </p>
        )}
      </div>

      <Link href="/" className="mt-10 inline-block text-sm text-sr-gold hover:underline">
        Home
      </Link>
    </main>
  );
}
