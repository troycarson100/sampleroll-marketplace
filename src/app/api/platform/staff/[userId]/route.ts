import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPlatformOwner } from "@/lib/platform/access";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { userId: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPlatformOwner(session.user?.email)) {
    return NextResponse.json(
      { error: "Only platform owners can remove supervisors" },
      { status: 403 },
    );
  }

  const targetId = params.userId?.trim();
  if (!targetId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  await prisma.platformStaff.deleteMany({ where: { userId: targetId } });
  return NextResponse.json({ ok: true });
}
