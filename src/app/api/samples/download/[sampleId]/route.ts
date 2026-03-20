import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sample, error: sampleError } = await supabase
    .from("individual_samples")
    .select("id, pack_id, file_url")
    .eq("id", sampleId)
    .maybeSingle();

  if (sampleError) {
    return NextResponse.json({ error: "Failed to load sample" }, { status: 500 });
  }
  if (!sample) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: purchase } = await supabase
    .from("user_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("pack_id", sample.pack_id)
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const objectPath = sampleFilesObjectPath(sample.file_url);

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
    return NextResponse.json({ error: "Could not create download URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
