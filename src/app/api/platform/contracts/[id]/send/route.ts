import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPlatformStaff } from "@/lib/platform/access";
import { sendContractInviteEmail } from "@/lib/email/contract-invite";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isPlatformStaff(userId, session.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const contract = await prisma.creatorContract.findUnique({
    where: { id },
    include: { creator: { select: { email: true } } },
  });
  if (!contract || contract.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Contract not found or already sent" },
      { status: 404 },
    );
  }
  if (!contract.legalObjectPath) {
    return NextResponse.json(
      { error: "Upload a legal PDF before sending" },
      { status: 400 },
    );
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "http://localhost:3001";
  const acceptUrl = `${base}/creator-contract/${contract.acceptanceToken}`;

  const updated = await prisma.creatorContract.update({
    where: { id },
    data: {
      status: "PENDING_REVIEW",
      sentAt: new Date(),
    },
  });

  const inviteTo = contract.creator.email;
  const emailResult = await sendContractInviteEmail({
    to: inviteTo,
    acceptUrl,
    title: contract.title,
  });

  return NextResponse.json({
    contract: updated,
    email: {
      attempted: true,
      sent: emailResult.sent,
      error: emailResult.error,
      acceptUrl,
      hint: emailResult.sent
        ? undefined
        : "Set RESEND_API_KEY and RESEND_FROM_EMAIL to email automatically, or copy acceptUrl to the creator.",
    },
  });
}
