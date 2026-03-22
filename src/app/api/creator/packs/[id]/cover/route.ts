import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { supabasePublicObjectUrl } from "@/lib/supabase-public-url";
import { getPackIfOwner } from "@/lib/creator/assert-pack-owner";
import { prisma } from "@/lib/db";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    return NextResponse.json({ error: "Max 8MB" }, { status: 400 });
  }

  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, or WebP" },
      { status: 400 },
    );
  }

  const ext =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${packId}/cover.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from("pack-artwork")
    .upload(path, buf, {
      contentType: type,
      upsert: true,
    });

  if (upErr) {
    console.error("cover upload:", upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const publicUrl = supabasePublicObjectUrl("pack-artwork", path);

  await prisma.samplePack.update({
    where: { id: packId },
    data: { coverArtUrl: publicUrl },
  });

  return NextResponse.json({ url: publicUrl, path });
}
