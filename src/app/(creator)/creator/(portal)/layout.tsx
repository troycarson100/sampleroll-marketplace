import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function CreatorPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?next=/creator/dashboard");
  }

  const profile = await prisma.profileMarketplace.findUnique({
    where: { id: userId },
    select: { isCreator: true },
  });

  if (!profile?.isCreator) {
    redirect("/creator/onboard");
  }

  return <>{children}</>;
}
