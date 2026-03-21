"use client";

import { useEffect, useState } from "react";

type CheckUser = { id: string; email: string | null } | null;

export function usePurchaseStatus(packId: string | undefined) {
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CheckUser>(null);

  useEffect(() => {
    if (!packId) {
      setOwned(false);
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          `/api/purchases/check?packId=${encodeURIComponent(packId)}`,
          { credentials: "include" },
        );
        const data = (await res.json()) as {
          owned?: boolean;
          user?: { id: string; email: string | null } | null;
        };
        if (!cancelled) {
          setOwned(Boolean(data.owned));
          setUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setOwned(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packId]);

  return { owned, loading, user };
}
