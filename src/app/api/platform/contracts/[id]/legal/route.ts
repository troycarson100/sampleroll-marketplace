import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/service";
import { isPlatformStaff } from "@/lib/platform/access";

export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf"]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isPlatformStaff(userId, session.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const contract = await prisma.creatorContract.findUnique({
    where: { id },
  });
  if (!contract || contract.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Contract not found or not editable" },
      { status: 404 },
    );
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
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Max 15MB" }, { status: 400 });
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "PDF only" }, { status: 400 });
  }

  const path = `${id}/legal.pdf`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from("contract-legal")
    .upload(path, buf, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (upErr) {
    console.error("contract legal upload:", upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const updated = await prisma.creatorContract.update({
    where: { id },
    data: {
      legalObjectPath: path,
      legalFilename: file.name.replace(/[/\\]/g, "").slice(0, 200) || "agreement.pdf",
    },
  });

  return NextResponse.json({
    contract: {
      id: updated.id,
      legalObjectPath: updated.legalObjectPath,
      legalFilename: updated.legalFilename,
    },
  });
}
