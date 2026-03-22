import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CreatorOnboardForm } from "@/components/creator/onboard/creator-onboard-form";

export default async function CreatorOnboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/creator/onboard");
  }

  const profile = await prisma.profileMarketplace.findUnique({
    where: { id: session.user.id },
    select: { isCreator: true },
  });

  if (profile?.isCreator) {
    redirect("/creator/dashboard");
  }

  return (
    <main className="mx-auto max-w-2xl px-4">
      <CreatorOnboardForm />
    </main>
  );
}
