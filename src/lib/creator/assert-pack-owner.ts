import { prisma } from "@/lib/db";

export async function getPackIfOwner(packId: string, userId: string) {
  return prisma.samplePack.findFirst({
    where: { id: packId, creatorId: userId },
  });
}
