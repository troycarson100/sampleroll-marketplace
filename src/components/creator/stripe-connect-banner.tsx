"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseFetchJson } from "@/lib/parse-fetch-json";

const PLATFORM_CONNECT_PROFILE =
  "https://dashboard.stripe.com/settings/connect/platform-profile";

type Props = {
  /** From Stripe `charges_enabled` — when true, onboarding is complete enough to receive Connect payouts */
  chargesEnabled: boolean;
};

export function StripeConnectBanner({ chargesEnabled }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
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
      const parsed = await parseFetchJson<{ url?: string; error?: string }>(res);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      const data = parsed.data;
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

  async function refreshStatus() {
    setSyncBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/creator/stripe-connect/sync-status", {
        method: "POST",
        credentials: "include",
      });
      const parsed = await parseFetchJson<{
        ok?: boolean;
        error?: string;
        chargesEnabled?: boolean;
      }>(res);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      const data = parsed.data;
      if (!res.ok) {
        setError(data.error ?? "Could not refresh status");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSyncBusy(false);
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
      <p className="mt-2 text-xs text-amber-200/80">
        If Stripe shows{" "}
        <strong className="font-medium text-amber-100">
          responsibilities for connected accounts
        </strong>
        , the{" "}
        <strong className="font-medium text-amber-100">
          platform owner
        </strong>{" "}
        (the Stripe account that holds your{" "}
        <code className="rounded bg-black/30 px-1">STRIPE_SECRET_KEY</code>)
        must complete{" "}
        <a
          href={PLATFORM_CONNECT_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sr-gold underline underline-offset-2 hover:text-amber-200"
        >
          Connect platform profile
        </a>
        . Then use <strong className="text-amber-100">Continue with Stripe</strong>{" "}
        again as the creator.
      </p>
      <p className="mt-2 text-xs text-amber-200/80">
        Finished in Stripe but this banner won&apos;t go away? Webhooks often skip
        local dev — click <strong className="text-amber-100">Refresh status</strong>.
      </p>
      {error ? (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void goToStripe()}
          disabled={busy || syncBusy}
          className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Opening Stripe…" : "Continue with Stripe"}
        </button>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          disabled={busy || syncBusy}
          className="rounded-md border border-amber-700/80 bg-amber-950/50 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
        >
          {syncBusy ? "Refreshing…" : "Refresh status"}
        </button>
      </div>
    </div>
  );
}
