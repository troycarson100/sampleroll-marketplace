import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

export async function POST(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = params.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const contract = await prisma.creatorContract.findUnique({
    where: { acceptanceToken: token },
  });
  if (!contract || contract.status !== "PENDING_REVIEW") {
    return NextResponse.json(
      { error: "Contract not found or not awaiting your response" },
      { status: 404 },
    );
  }

  if (!isContractParty(contract, userId, session.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.creatorContract.updateMany({
      where: {
        creatorUserId: contract.creatorUserId,
        status: "ACTIVE",
        id: { not: contract.id },
      },
      data: { status: "VOID" },
    });

    await tx.creatorContract.update({
      where: { id: contract.id },
      data: {
        status: "ACTIVE",
        acceptedAt: new Date(),
      },
    });

    await tx.profileMarketplace.upsert({
      where: { id: contract.creatorUserId },
      create: {
        id: contract.creatorUserId,
        isCreator: false,
        customSplitPercentage: contract.splitPercentage,
      },
      update: {
        customSplitPercentage: contract.splitPercentage,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
