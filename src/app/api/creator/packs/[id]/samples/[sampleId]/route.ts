import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPackIfOwner } from "@/lib/creator/assert-pack-owner";
import { createServiceClient } from "@/lib/supabase/service";
import {
  sampleFilesObjectPath,
  samplePreviewsObjectPath,
} from "@/lib/storage-path";

type PatchBody = {
  filename?: string;
  bpm?: number | null;
  musicalKey?: string | null;
  instrumentTags?: string[];
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; sampleId: string } },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packId = params.id?.trim();
  const sampleId = params.sampleId?.trim();
  if (!packId || !sampleId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const pack = await getPackIfOwner(packId, userId);
  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sample = await prisma.individualSample.findFirst({
    where: { id: sampleId, packId },
  });
  if (!sample) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.filename !== undefined) {
    const f = body.filename.trim().slice(0, 200);
    if (!f) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }
    data.filename = f;
  }

  if (body.bpm !== undefined) {
    if (body.bpm === null) {
      data.bpm = null;
    } else {
      const b = Number(body.bpm);
      if (!Number.isInteger(b) || b < 0 || b > 999) {
        return NextResponse.json({ error: "Invalid BPM" }, { status: 400 });
      }
      data.bpm = b;
    }
  }

  if (body.musicalKey !== undefined) {
    if (body.musicalKey === null || body.musicalKey === "") {
      data.musicalKey = null;
    } else {
      data.musicalKey = String(body.musicalKey).trim().slice(0, 32);
    }
  }

  if (body.instrumentTags !== undefined) {
    if (!Array.isArray(body.instrumentTags) || body.instrumentTags.length > 30) {
      return NextResponse.json({ error: "Invalid instrument tags" }, { status: 400 });
    }
    data.instrumentTags = body.instrumentTags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.individualSample.update({
    where: { id: sampleId },
    data,
  });

  return NextResponse.json({
    sample: {
      id: updated.id,
      filename: updated.filename,
      originalFilename: updated.originalFilename,
      fileUrl: updated.fileUrl,
      previewUrl: updated.previewUrl,
      durationSeconds: updated.durationSeconds,
      bpm: updated.bpm,
      musicalKey: updated.musicalKey,
      instrumentTags: updated.instrumentTags,
      sortOrder: updated.sortOrder,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; sampleId: string } },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packId = params.id?.trim();
  const sampleId = params.sampleId?.trim();
  if (!packId || !sampleId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const pack = await getPackIfOwner(packId, userId);
  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sample = await prisma.individualSample.findFirst({
    where: { id: sampleId, packId },
  });
  if (!sample) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
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

  const masterPath = sampleFilesObjectPath(sample.fileUrl);
  const toRemove: string[] = [masterPath];
  if (sample.previewUrl) {
    try {
      toRemove.push(samplePreviewsObjectPath(sample.previewUrl));
    } catch {
      /* ignore */
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.individualSample.delete({ where: { id: sampleId } });
    await tx.samplePack.update({
      where: { id: packId },
      data: { sampleCount: { decrement: 1 } },
    });
  });

  const { error: mErr } = await service.storage
    .from("sample-files")
    .remove([masterPath]);
  if (mErr) {
    console.error("sample-files remove:", mErr);
  }
  if (sample.previewUrl) {
    const previewPath = samplePreviewsObjectPath(sample.previewUrl);
    const { error: pErr } = await service.storage
      .from("sample-previews")
      .remove([previewPath]);
    if (pErr) {
      console.error("sample-previews remove:", pErr);
    }
  }

  return NextResponse.json({ ok: true });
}
