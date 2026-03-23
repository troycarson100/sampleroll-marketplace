import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getAuthorizedSampleForDownload } from "@/lib/sample-download-access";
import { sampleFilesObjectPath } from "@/lib/storage-path";

function sanitizeFilename(name: string): string {
  const trimmed = name.trim() || "sample.wav";
  return trimmed.replace(/[^\w.\- ()[\]]+/g, "_");
}

export async function GET(
  _request: Request,
  { params }: { params: { sampleId: string } },
) {
  const sampleId = params.sampleId;
  if (!sampleId) {
    return NextResponse.json({ error: "Missing sampleId" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const authz = await getAuthorizedSampleForDownload(sampleId, userId);
  if (authz.status === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (authz.status === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (authz.status === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sample } = authz;
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

  const { data: blob, error: downloadError } = await service.storage
    .from("sample-files")
    .download(objectPath);

  if (downloadError || !blob) {
    console.error("storage.download:", downloadError);
    return NextResponse.json(
      { error: "Could not download file" },
      { status: 500 },
    );
  }

  const arrayBuffer = await blob.arrayBuffer();
  const filename = sanitizeFilename(sample.originalFilename);

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
