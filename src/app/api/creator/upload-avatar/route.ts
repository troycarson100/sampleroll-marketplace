import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { supabasePublicObjectUrl } from "@/lib/supabase-public-url";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
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
  const path = `avatars/${userId}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from("pack-artwork")
    .upload(path, buf, {
      contentType: type,
      upsert: true,
    });

  if (upErr) {
    console.error("avatar upload:", upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const publicUrl = supabasePublicObjectUrl("pack-artwork", path);
  return NextResponse.json({ url: publicUrl, path });
}
