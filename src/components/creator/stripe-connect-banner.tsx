"use client";

import { useState } from "react";

type Props = {
  /** From Stripe `charges_enabled` — when true, onboarding is complete enough to receive Connect payouts */
  chargesEnabled: boolean;
};

export function StripeConnectBanner({ chargesEnabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (chargesEnabled) return null;

  async function goToStripe() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/creator/stripe-connect/account-link", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start Stripe onboarding");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-8 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
      <p className="font-medium text-amber-50">Finish Stripe payout setup</p>
      <p className="mt-1 text-amber-100/90">
        Connect a Stripe Express account so payouts can go to your bank. Required
        before you can receive automated transfers from sales (once enabled in
        checkout).
      </p>
      {error ? (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={() => void goToStripe()}
        disabled={busy}
        className="mt-3 rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Opening Stripe…" : "Continue with Stripe"}
      </button>
    </div>
  );
}
