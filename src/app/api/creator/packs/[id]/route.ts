import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPackIfOwner } from "@/lib/creator/assert-pack-owner";
import {
  CREATOR_PACK_GENRES,
  PRICE_MAX_CENTS,
  PRICE_MIN_CENTS,
} from "@/lib/constants";

type PatchBody = {
  title?: string;
  description?: string;
  genre?: string;
  tags?: string[];
  priceCents?: number;
  isPublished?: boolean;
  coverArtUrl?: string | null;
};

const genreSet = new Set<string>(CREATOR_PACK_GENRES);

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

  const existing = await getPackIfOwner(packId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const t = body.title.trim();
    if (t.length === 0 || t.length > 200) {
      return NextResponse.json(
        { error: "Title must be 1–200 characters" },
        { status: 400 },
      );
    }
    data.title = t;
  }

  if (body.description !== undefined) {
    const d = body.description.slice(0, 5000);
    data.description = d;
  }

  if (body.genre !== undefined) {
    const g = body.genre.trim();
    if (
      !genreSet.has(g) &&
      g !== existing.genre
    ) {
      return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
    }
    data.genre = g;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 40) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }
    const tags = body.tags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 40);
    data.tags = tags;
  }

  if (body.priceCents !== undefined) {
    const p = Number(body.priceCents);
    if (
      !Number.isInteger(p) ||
      p < PRICE_MIN_CENTS ||
      p > PRICE_MAX_CENTS
    ) {
      return NextResponse.json(
        {
          error: `Price must be between $${(PRICE_MIN_CENTS / 100).toFixed(2)} and $${(PRICE_MAX_CENTS / 100).toFixed(2)}`,
        },
        { status: 400 },
      );
    }
    data.priceCents = p;
  }

  if (body.isPublished !== undefined) {
    if (typeof body.isPublished !== "boolean") {
      return NextResponse.json({ error: "Invalid isPublished" }, { status: 400 });
    }
    data.isPublished = body.isPublished;
  }

  if (body.coverArtUrl !== undefined) {
    if (body.coverArtUrl !== null && typeof body.coverArtUrl !== "string") {
      return NextResponse.json({ error: "Invalid coverArtUrl" }, { status: 400 });
    }
    data.coverArtUrl = body.coverArtUrl;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.samplePack.update({
    where: { id: packId },
    data,
  });

  return NextResponse.json({
    pack: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      genre: updated.genre,
      tags: updated.tags,
      priceCents: updated.priceCents,
      coverArtUrl: updated.coverArtUrl,
      isPublished: updated.isPublished,
      sampleCount: updated.sampleCount,
      stripePriceId: updated.stripePriceId,
    },
  });
}
