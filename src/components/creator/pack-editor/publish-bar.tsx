"use client";

import { useState } from "react";
import type { PackEditorPack } from "./types";

type Props = {
  pack: PackEditorPack;
  onPackUpdate: (p: Partial<PackEditorPack>) => void;
};

export function PublishBar({ pack, onPackUpdate }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function publish() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/create-pack-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        pack?: { isPublished: boolean; stripePriceId: string | null };
      };
      if (!res.ok) {
        setMessage(data.error ?? "Publish failed");
        return;
      }
      if (data.pack) {
        onPackUpdate({
          isPublished: data.pack.isPublished,
          stripePriceId: data.pack.stripePriceId,
        });
      }
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/creator/packs/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false }),
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string; pack?: PackEditorPack };
      if (!res.ok) {
        setMessage(data.error ?? "Could not unpublish");
        return;
      }
      if (data.pack) {
        onPackUpdate({ isPublished: data.pack.isPublished });
      }
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-40 border-b border-sr bg-sr-bg/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-sr-bg/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              pack.isPublished
                ? "rounded-full bg-emerald-950/80 px-2.5 py-1 text-xs font-medium text-emerald-200"
                : "rounded-full bg-sr-panel px-2.5 py-1 text-xs font-medium text-sr-muted"
            }
          >
            {pack.isPublished ? "Published" : "Draft"}
          </span>
          {pack.stripePriceId ? (
            <span className="text-xs text-sr-dim">Stripe price linked</span>
          ) : (
            <span className="text-xs text-sr-dim">No Stripe price yet</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pack.isPublished ? (
            <button
              type="button"
              onClick={() => void unpublish()}
              disabled={busy}
              className="rounded-md border border-sr px-3 py-2 text-sm text-sr-ink hover:bg-sr-panel disabled:opacity-50"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void publish()}
              disabled={busy}
              className="rounded-md bg-sr-gold px-3 py-2 text-sm font-medium text-sr-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>
      </div>
      {message ? (
        <p className="mx-auto mt-2 max-w-5xl text-sm text-red-400">{message}</p>
      ) : null}
    </div>
  );
}
