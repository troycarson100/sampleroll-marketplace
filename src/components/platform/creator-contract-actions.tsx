"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreatorContractActions({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/creator-contract/${token}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    if (!window.confirm("Decline this agreement?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/creator-contract/${token}/decline`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {msg ? <p className="text-sm text-red-400">{msg}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void accept()}
          className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg disabled:opacity-50"
        >
          {busy ? "…" : "Accept agreement"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decline()}
          className="rounded-md border border-sr px-4 py-2 text-sm text-sr-ink disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
