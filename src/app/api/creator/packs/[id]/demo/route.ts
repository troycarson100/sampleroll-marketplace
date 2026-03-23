import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPackIfOwner } from "@/lib/creator/assert-pack-owner";
import { createServiceClient } from "@/lib/supabase/service";
import { supabasePublicObjectUrl } from "@/lib/supabase-public-url";
import { samplePreviewsObjectPath } from "@/lib/storage-path";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/aiff",
  "audio/x-aiff",
]);

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".wav")) return "wav";
  if (lower.endsWith(".mp3")) return "mp3";
  if (lower.endsWith(".aiff") || lower.endsWith(".aif")) return "aiff";
  return null;
}

export async function POST(
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

  let service;
  try {
    service = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 500 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Max 25MB" }, { status: 400 });
  }

  const ext = extFromName(file.name);
  if (!ext) {
    return NextResponse.json(
      { error: "Use .wav, .mp3, .aiff, or .aif" },
      { status: 400 },
    );
  }

  const type = (file.type || "").toLowerCase();
  if (type && !ALLOWED.has(type)) {
    return NextResponse.json({ error: "Unsupported audio type" }, { status: 400 });
  }

  const objectPath = `pack-demos/${packId}/demo.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const contentType =
    type && ALLOWED.has(type)
      ? type
      : ext === "mp3"
        ? "audio/mpeg"
        : ext === "wav"
          ? "audio/wav"
          : "audio/aiff";

  const { error: upErr } = await service.storage
    .from("sample-previews")
    .upload(objectPath, buf, {
      contentType,
      upsert: true,
    });

  if (upErr) {
    console.error("pack demo upload:", upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const publicUrl = supabasePublicObjectUrl("sample-previews", objectPath);

  await prisma.samplePack.update({
    where: { id: packId },
    data: { demoPreviewUrl: publicUrl },
  });

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(
  _request: Request,
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

  const row = await prisma.samplePack.findUnique({
    where: { id: packId },
    select: { demoPreviewUrl: true },
  });

  let service;
  try {
    service = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 500 },
    );
  }

  if (row?.demoPreviewUrl) {
    const objectPath = samplePreviewsObjectPath(row.demoPreviewUrl);
    if (objectPath) {
      await service.storage.from("sample-previews").remove([objectPath]);
    }
  }

  await prisma.samplePack.update({
    where: { id: packId },
    data: { demoPreviewUrl: null },
  });

  return NextResponse.json({ ok: true });
}
