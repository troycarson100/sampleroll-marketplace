"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePurchaseStatus } from "@/hooks/usePurchaseStatus";
import { cn } from "@/lib/utils";

type Props = {
  packId: string;
  priceCents: number;
  className?: string;
};

export function BuyPackButton({ packId, priceCents, className }: Props) {
  const router = useRouter();
  const { owned, loading, user } = usePurchaseStatus(packId);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const priceLabel = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(priceCents / 100),
    [priceCents],
  );

  async function startCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/pack-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
        credentials: "include",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "Checkout failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <p className={cn("text-sm text-sr-muted", className)} aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        className={cn(
          "rounded-md bg-sr-card/80 px-4 py-2 text-sm font-medium text-sr-ink ring-1 ring-white/[0.1] transition-colors hover:bg-sr-panel",
          className,
        )}
        onClick={() =>
          router.push(
            `/login?next=${encodeURIComponent(`/sounds/packs/${packId}`)}`,
          )
        }
      >
        Sign in to buy
      </button>
    );
  }

  if (owned) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md bg-emerald-950/80 px-3 py-1.5 text-sm font-medium text-emerald-200 ring-1 ring-emerald-800/80",
          className,
        )}
      >
        Owned ✓
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={checkoutLoading}
      className={cn(
        "rounded-md bg-gradient-to-br from-amber-300 via-sr-gold to-amber-700 px-5 py-2.5 text-sm font-semibold text-[#1a1408] shadow-[0_8px_28px_rgba(228,166,46,0.25)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(228,166,46,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        className,
      )}
      onClick={() => void startCheckout()}
    >
      {checkoutLoading ? "Redirecting…" : `Buy Pack — ${priceLabel}`}
    </button>
  );
}
