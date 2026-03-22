import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  isPlatformOwner,
  isPlatformStaff,
} from "@/lib/platform/access";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/platform");
  }

  if (!(await isPlatformStaff(session.user.id, session.user.email))) {
    redirect("/");
  }

  const owner = isPlatformOwner(session.user.email);

  return (
    <div className="min-h-screen bg-sr-bg text-sr-ink">
      <header className="border-b border-sr bg-sr-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="font-display text-lg text-sr-gold">
            SampleRoll — Platform
          </span>
          <nav className="flex flex-wrap gap-4 text-sm text-sr-muted">
            <Link href="/platform" className="hover:text-sr-ink">
              Overview
            </Link>
            <Link href="/platform/contracts" className="hover:text-sr-ink">
              Contracts
            </Link>
            <Link href="/platform/contracts/new" className="hover:text-sr-ink">
              New contract
            </Link>
            {owner ? (
              <Link href="/platform/staff" className="hover:text-sr-ink">
                Supervisors
              </Link>
            ) : null}
            <Link href="/" className="hover:text-sr-ink">
              Site
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
