import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/service";
import { sampleFilesObjectPath } from "@/lib/storage-path";

export async function GET(
  _request: Request,
  { params }: { params: { sampleId: string } },
) {
  const sampleId = params.sampleId;
  if (!sampleId) {
    return NextResponse.json({ error: "Missing sampleId" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sample = await prisma.individualSample.findUnique({
    where: { id: sampleId },
    select: { id: true, packId: true, fileUrl: true },
  });

  if (!sample) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const purchase = await prisma.userPurchase.findUnique({
    where: { userId_packId: { userId, packId: sample.packId } },
    select: { id: true },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const objectPath = sampleFilesObjectPath(sample.fileUrl);

  let service;
  try {
    service = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Download service not configured" },
      { status: 500 },
    );
  }

  const { data: signed, error: signError } = await service.storage
    .from("sample-files")
    .createSignedUrl(objectPath, 60);

  if (signError || !signed?.signedUrl) {
    console.error("createSignedUrl:", signError);
    return NextResponse.json(
      { error: "Could not create download URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: signed.signedUrl });
}
