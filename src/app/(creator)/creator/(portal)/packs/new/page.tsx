import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Each visit creates a new draft pack and sends the creator to the editor.
 * Avoid refreshing this URL if you do not want duplicate drafts.
 */
export default async function NewPackPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?next=/creator/packs/new");
  }

  const pack = await prisma.samplePack.create({
    data: {
      creatorId: userId,
      title: "Untitled Pack",
      description: "",
      genre: "Other",
      tags: [],
      priceCents: 499,
      isPublished: false,
    },
  });

  redirect(`/creator/packs/${pack.id}/edit`);
}
