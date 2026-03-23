import { prisma } from "@/lib/db";

export type SampleDownloadRow = {
  id: string;
  packId: string;
  fileUrl: string;
  originalFilename: string;
};

/**
 * Full-pack purchase unlocks all samples in the pack.
 * (Per-sample entitlements can be added here later.)
 */
export async function getAuthorizedSampleForDownload(
  sampleId: string,
  userId: string | null,
): Promise<
  | { status: "unauthorized" }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "ok"; sample: SampleDownloadRow }
> {
  if (!userId) return { status: "unauthorized" };

  const sample = await prisma.individualSample.findUnique({
    where: { id: sampleId },
    select: {
      id: true,
      packId: true,
      fileUrl: true,
      originalFilename: true,
    },
  });

  if (!sample) return { status: "not_found" };

  const purchase = await prisma.userPurchase.findUnique({
    where: { userId_packId: { userId, packId: sample.packId } },
    select: { id: true },
  });

  if (!purchase) return { status: "forbidden" };

  return {
    status: "ok",
    sample: {
      id: sample.id,
      packId: sample.packId,
      fileUrl: sample.fileUrl,
      originalFilename: sample.originalFilename,
    },
  };
}
