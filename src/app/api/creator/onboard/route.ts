import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Body = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  /** @deprecated Optional legacy field; payouts use Stripe Connect */
  paypalEmail?: string | null;
};

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = body.displayName?.trim() ?? "";
  const paypalRaw = body.paypalEmail?.trim();
  const paypalEmail =
    paypalRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalRaw)
      ? paypalRaw
      : null;
  const bio = body.bio?.trim() ?? "";
  const avatarUrl = body.avatarUrl?.trim() || null;

  if (!displayName) {
    return NextResponse.json(
      { error: "Display name is required" },
      { status: 400 },
    );
  }
  if (bio.length > 500) {
    return NextResponse.json({ error: "Bio max 500 characters" }, { status: 400 });
  }

  await prisma.profileMarketplace.upsert({
    where: { id: userId },
    create: {
      id: userId,
      isCreator: true,
      creatorDisplayName: displayName,
      creatorBio: bio || null,
      creatorAvatarUrl: avatarUrl,
      paypalEmail,
    },
    update: {
      isCreator: true,
      creatorDisplayName: displayName,
      creatorBio: bio || null,
      creatorAvatarUrl: avatarUrl,
      ...(paypalEmail !== null ? { paypalEmail } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
