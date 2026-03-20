"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function NavAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!cancelled) {
        setUser(u ?? null);
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    setUser(null);
    router.refresh();
  }

  if (!ready) {
    return (
      <span className="h-9 w-20 animate-pulse rounded bg-sr-card" aria-hidden />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden max-w-[140px] truncate text-sr-muted sm:inline">
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
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
