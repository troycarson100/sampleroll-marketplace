import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Body = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  /** @deprecated Optional legacy field; payouts use Stripe Connect */
  paypalEmail?: string | null;
};

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "Bio max 500 characters" },
        { status: 400 },
      );
    }

    try {
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
    } catch (e) {
      console.error("[api/creator/onboard] prisma upsert:", e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2003") {
          return NextResponse.json(
            {
              error:
                "Your user record is missing in the database (cannot create profile). Sign out, register again, or contact support.",
            },
            { status: 409 },
          );
        }
        // Table/column missing vs Prisma schema (migrations not applied)
        if (e.code === "P2021" || e.code === "P2022") {
          return NextResponse.json(
            {
              error:
                "Database schema is out of date. Run SQL migrations in supabase/migrations/ (see docs/DATABASE_URL.md), starting with 20260321140000 and 20260322120000_stripe_connect_profiles.sql.",
            },
            { status: 500 },
          );
        }
      }

      const isDev = process.env.NODE_ENV === "development";
      const technical =
        isDev && e instanceof Error ? ` ${e.message}` : "";
      return NextResponse.json(
        {
          error: `Could not save profile.${technical}`.trim(),
          ...(isDev && e instanceof Prisma.PrismaClientKnownRequestError
            ? { prismaCode: e.code }
            : {}),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/creator/onboard] unexpected:", e);
    return NextResponse.json(
      { error: "Unexpected server error while saving profile." },
      { status: 500 },
    );
  }
}
