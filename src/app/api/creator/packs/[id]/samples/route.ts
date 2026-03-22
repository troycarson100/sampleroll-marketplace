import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPackIfOwner } from "@/lib/creator/assert-pack-owner";
import { createServiceClient } from "@/lib/supabase/service";
import { supabasePublicObjectUrl } from "@/lib/supabase-public-url";
import { MAX_SAMPLE_FILE_SIZE } from "@/lib/constants";

const CREATOR_SAMPLE_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/aiff",
  "audio/x-aiff",
]);

function extFromFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".wav")) return "wav";
  if (name.endsWith(".mp3")) return "mp3";
  if (name.endsWith(".aiff") || name.endsWith(".aif")) return "aiff";
  return null;
}

function validateAudio(file: File): string | null {
  if (file.size > MAX_SAMPLE_FILE_SIZE) {
    return "Each file must be 50MB or less";
  }
  const type = (file.type || "").toLowerCase();
  if (type && !CREATOR_SAMPLE_TYPES.has(type)) {
    return "Allowed formats: WAV, AIFF, MP3";
  }
  if (!extFromFile(file)) {
    return "Use .wav, .mp3, .aiff, or .aif extension";
  }
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
  const rawFiles = form.getAll("files");
  const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  let durations: (number | null)[] = [];
  const durationsField = form.get("durations");
  if (typeof durationsField === "string" && durationsField.trim()) {
    try {
      const parsed = JSON.parse(durationsField) as unknown;
      if (Array.isArray(parsed)) {
        durations = parsed.map((v) =>
          typeof v === "number" && Number.isFinite(v) ? v : null,
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid durations JSON" }, { status: 400 });
    }
  }

  for (const file of files) {
    const err = validateAudio(file);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
  }

  const maxRow = await prisma.individualSample.aggregate({
    where: { packId },
    _max: { sortOrder: true },
  });
  let nextOrder = (maxRow._max.sortOrder ?? -1) + 1;

  type Created = {
    id: string;
    filename: string;
    originalFilename: string;
    fileUrl: string;
    previewUrl: string;
    durationSeconds: number | null;
    sortOrder: number;
  };

  const created: Created[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const ext = extFromFile(file)!;
    const sampleId = randomUUID();
    const masterPath = `${packId}/${sampleId}.${ext}`;
    const previewPath = `${packId}/${sampleId}_preview.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const contentType =
      file.type && CREATOR_SAMPLE_TYPES.has(file.type)
        ? file.type
        : ext === "mp3"
          ? "audio/mpeg"
          : ext === "wav"
            ? "audio/wav"
            : "audio/aiff";

    const { error: mErr } = await service.storage
      .from("sample-files")
      .upload(masterPath, buf, {
        contentType,
        upsert: false,
      });

    if (mErr) {
      console.error("sample master upload:", mErr);
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    const { error: pErr } = await service.storage
      .from("sample-previews")
      .upload(previewPath, buf, {
        contentType,
        upsert: false,
      });

    if (pErr) {
      console.error("sample preview upload:", pErr);
      await service.storage.from("sample-files").remove([masterPath]);
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const baseName =
      file.name.replace(/[/\\]/g, "").slice(0, 200) || `sample.${ext}`;
    const durationSeconds = durations[i] ?? null;

    created.push({
      id: sampleId,
      filename: baseName,
      originalFilename: baseName,
      fileUrl: masterPath,
      previewUrl: supabasePublicObjectUrl("sample-previews", previewPath),
      durationSeconds,
      sortOrder: nextOrder++,
    });
  }

  await prisma.$transaction(async (tx) => {
    for (const c of created) {
      await tx.individualSample.create({
        data: {
          id: c.id,
          packId,
          filename: c.filename,
          originalFilename: c.originalFilename,
          fileUrl: c.fileUrl,
          previewUrl: c.previewUrl,
          durationSeconds: c.durationSeconds,
          sortOrder: c.sortOrder,
        },
      });
    }
    await tx.samplePack.update({
      where: { id: packId },
      data: { sampleCount: { increment: created.length } },
    });
  });

  return NextResponse.json({
    samples: created.map((c) => ({
      id: c.id,
      filename: c.filename,
      originalFilename: c.originalFilename,
      fileUrl: c.fileUrl,
      previewUrl: c.previewUrl,
      durationSeconds: c.durationSeconds,
      bpm: null,
      musicalKey: null,
      instrumentTags: [] as string[],
      sortOrder: c.sortOrder,
    })),
  });
}
