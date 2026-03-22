import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/service";
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

export async function GET(
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
  if (!contract || !contract.legalObjectPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    !isContractParty(contract, userId, session.user?.email) ||
    (contract.status !== "PENDING_REVIEW" && contract.status !== "ACTIVE")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let service;
  try {
    service = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 500 },
    );
  }

  const { data: signed, error } = await service.storage
    .from("contract-legal")
    .createSignedUrl(contract.legalObjectPath, 120);

  if (error || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Could not create download link" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
