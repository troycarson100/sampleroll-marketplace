import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PackEditor } from "@/components/creator/pack-editor/pack-editor";
import type {
  PackEditorPack,
  PackEditorSample,
} from "@/components/creator/pack-editor/types";

export const dynamic = "force-dynamic";

export default async function EditPackPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect(`/login?next=/creator/packs/${params.id}/edit`);
  }

  const pack = await prisma.samplePack.findFirst({
    where: { id: params.id, creatorId: userId },
    include: {
      samples: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!pack) {
    notFound();
  }

  const initialPack: PackEditorPack = {
    id: pack.id,
    title: pack.title,
    description: pack.description,
    genre: pack.genre,
    tags: pack.tags,
    priceCents: pack.priceCents,
    coverArtUrl: pack.coverArtUrl,
    isPublished: pack.isPublished,
    sampleCount: pack.sampleCount,
    stripePriceId: pack.stripePriceId,
  };

  const initialSamples: PackEditorSample[] = pack.samples.map((s) => ({
    id: s.id,
    filename: s.filename,
    originalFilename: s.originalFilename,
    fileUrl: s.fileUrl,
    previewUrl: s.previewUrl,
    durationSeconds: s.durationSeconds,
    bpm: s.bpm,
    musicalKey: s.musicalKey,
    instrumentTags: s.instrumentTags,
    sortOrder: s.sortOrder,
  }));

  return (
    <PackEditor initialPack={initialPack} initialSamples={initialSamples} />
  );
}
