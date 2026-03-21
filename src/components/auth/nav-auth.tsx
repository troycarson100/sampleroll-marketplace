"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function NavAuth() {
  const router = useRouter();
  const { data: session, status } = useSession();

  async function onSignOut() {
    await signOut({ redirect: false });
    router.refresh();
  }

  if (status === "loading") {
    return (
      <span
        className="h-9 w-20 animate-pulse rounded bg-sr-card"
        aria-hidden
      />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden max-w-[140px] truncate text-sr-muted sm:inline">
          {session.user.email}
        </span>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="rounded-md border border-sr px-3 py-1.5 text-sr-ink transition-colors hover:bg-sr-card"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href="/login"
        className="rounded-md px-3 py-1.5 text-sr-muted transition-colors hover:text-sr-ink"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="rounded-md bg-sr-gold px-3 py-1.5 font-medium text-sr-bg transition-opacity hover:opacity-90"
      >
        Sign up
      </Link>
    </div>
  );
}
