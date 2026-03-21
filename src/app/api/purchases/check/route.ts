import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packId = searchParams.get("packId")?.trim();
  if (!packId) {
    return NextResponse.json({ error: "packId required" }, { status: 400 });
  }

  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ owned: false, user: null });
    }

    const purchase = await prisma.userPurchase.findUnique({
      where: { userId_packId: { userId, packId } },
      select: { id: true },
    });

    return NextResponse.json({
      owned: !!purchase,
      user: { id: userId, email: session.user?.email ?? null },
    });
  } catch {
    return NextResponse.json({ owned: false, user: null });
  }
}
