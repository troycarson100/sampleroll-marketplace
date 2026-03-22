import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPlatformStaff, normalizeEmail } from "@/lib/platform/access";

export const dynamic = "force-dynamic";

type Body = {
  creatorEmail?: string;
  splitPercentage?: number;
  title?: string;
  notes?: string;
};

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isPlatformStaff(userId, session.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const list = await prisma.creatorContract.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      creator: { select: { email: true, name: true } },
      createdBy: { select: { email: true } },
    },
  });

  return NextResponse.json({ contracts: list });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isPlatformStaff(userId, session.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const creatorEmail = normalizeEmail(body.creatorEmail ?? "");
  const split = Number(body.splitPercentage);
  if (!creatorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creatorEmail)) {
    return NextResponse.json({ error: "Valid creator email required" }, { status: 400 });
  }
  if (!Number.isInteger(split) || split < 0 || split > 100) {
    return NextResponse.json(
      { error: "splitPercentage must be 0–100 (creator share)" },
      { status: 400 },
    );
  }

  const creator = await prisma.user.findFirst({
    where: { email: { equals: creatorEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (!creator) {
    return NextResponse.json(
      { error: "No user with that email. They must register first." },
      { status: 404 },
    );
  }

  const token = randomBytes(32).toString("hex");

  const contract = await prisma.creatorContract.create({
    data: {
      creatorUserId: creator.id,
      inviteEmailNorm: creatorEmail,
      splitPercentage: split,
      title: (body.title?.trim() || "Revenue share agreement").slice(0, 200),
      notes: (body.notes?.trim() ?? "").slice(0, 5000),
      acceptanceToken: token,
      createdByUserId: userId,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ contract });
}
