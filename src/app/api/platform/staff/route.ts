import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  isPlatformOwner,
  isPlatformStaff,
  normalizeEmail,
} from "@/lib/platform/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isPlatformStaff(userId, session.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await prisma.platformStaff.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ staff });
}

type PostBody = { email?: string };

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPlatformOwner(session.user?.email)) {
    return NextResponse.json(
      { error: "Only platform owners can add supervisors" },
      { status: 403 },
    );
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "User must register before becoming a supervisor" },
      { status: 404 },
    );
  }

  if (isPlatformOwner(user.email)) {
    return NextResponse.json(
      { error: "Owners are not added via this list" },
      { status: 400 },
    );
  }

  await prisma.platformStaff.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
