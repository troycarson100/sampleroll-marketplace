"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * After Stripe Account Link return_url, sync Connect flags from Stripe (webhooks often miss local dev).
 */
export function StripeConnectReturnSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    const flag = searchParams.get("stripe_connect");
    if (!flag || ran.current) return;
    if (flag !== "return" && flag !== "refresh") return;
    ran.current = true;

    void (async () => {
      try {
        await fetch("/api/creator/stripe-connect/sync-status", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        /* non-fatal */
      } finally {
        router.replace("/creator/dashboard");
      }
    })();
  }, [searchParams, router]);

  return null;
}
