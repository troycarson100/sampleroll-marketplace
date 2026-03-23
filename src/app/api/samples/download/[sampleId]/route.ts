import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getAuthorizedSampleForDownload } from "@/lib/sample-download-access";
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
