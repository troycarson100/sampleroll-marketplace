import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPlatformOwner } from "@/lib/platform/access";
import { StaffManagement } from "@/components/platform/staff-management";

export const dynamic = "force-dynamic";

export default async function PlatformStaffPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/platform/staff");
  if (!isPlatformOwner(session.user.email)) {
    redirect("/platform");
  }

  const staff = await prisma.platformStaff.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <h1 className="font-display text-3xl text-sr-ink">Supervisors</h1>
      <p className="mt-2 text-sm text-sr-muted">
        Owners are defined in{" "}
        <code className="rounded bg-sr-card px-1">PLATFORM_OWNER_EMAILS</code>,
        not in this list.
      </p>
      <div className="mt-8">
        <StaffManagement initialStaff={staff} />
      </div>
    </main>
  );
}
