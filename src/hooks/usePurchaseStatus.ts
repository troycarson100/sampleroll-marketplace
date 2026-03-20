"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function usePurchaseStatus(packId: string | undefined) {
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!packId) {
      setOwned(false);
      setUser(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const {
        data: { user: current },
      } = await supabase.auth.getUser();

      if (!current) {
        if (!cancelled) {
          setUser(null);
          setOwned(false);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setUser(current);

      const { data } = await supabase
        .from("user_purchases")
        .select("id")
        .eq("user_id", current.id)
        .eq("pack_id", packId)
        .maybeSingle();

      if (!cancelled) {
        setOwned(!!data);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packId]);

  return { owned, loading, user };
}
