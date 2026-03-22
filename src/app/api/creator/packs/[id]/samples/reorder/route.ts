import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPackIfOwner } from "@/lib/creator/assert-pack-owner";

type Body = { orderedIds?: string[] };

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packId = params.id?.trim();
  if (!packId) {
    return NextResponse.json({ error: "Missing pack id" }, { status: 400 });
  }

  const pack = await getPackIfOwner(packId, userId);
  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderedIds = body.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  }

  const ids = orderedIds.map((id) => String(id).trim()).filter(Boolean);
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    return NextResponse.json({ error: "Duplicate ids" }, { status: 400 });
  }

  const existing = await prisma.individualSample.findMany({
    where: { packId },
    select: { id: true },
  });
  const existingSet = new Set(existing.map((e) => e.id));

  if (ids.length !== existingSet.size) {
    return NextResponse.json(
      { error: "orderedIds must list every sample in the pack" },
      { status: 400 },
    );
  }

  for (const id of ids) {
    if (!existingSet.has(id)) {
      return NextResponse.json(
        { error: "Unknown sample id in list" },
        { status: 400 },
      );
    }
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.individualSample.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
