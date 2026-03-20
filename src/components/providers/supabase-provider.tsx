"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const supabase = useMemo(() => {
    if (!url || !key) return null;
    return createBrowserClient(url, key);
  }, [url, key]);

  if (!supabase) {
    return children;
  }

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return client;
}
