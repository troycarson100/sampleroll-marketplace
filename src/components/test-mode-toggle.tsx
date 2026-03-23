"use client";

import { useEffect, useState } from "react";
import { parseFetchJson } from "@/lib/parse-fetch-json";

type State = {
  allowed: boolean;
  enabled: boolean;
};

export function TestModeToggle() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/test-mode", { credentials: "include" });
      const parsed = await parseFetchJson<State>(res);
      if (!parsed.ok || !res.ok) return;
      setState(parsed.data);
    })();
  }, []);

  if (!state?.allowed) return null;

  async function onToggle() {
    if (!state) return;
    setBusy(true);
    setError(null);
    try {
      const next = !state.enabled;
      const res = await fetch("/api/test-mode", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const parsed = await parseFetchJson<State & { error?: string }>(res);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      if (!res.ok) {
        setError(parsed.data.error ?? "Could not toggle test mode");
        return;
      }
      setState({ allowed: true, enabled: next });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mr-2 flex items-center gap-2 text-xs">
      <span
        className={state.enabled ? "text-amber-300" : "text-sr-dim"}
        aria-live="polite"
      >
        Test checkout {state.enabled ? "ON" : "OFF"}
      </span>
      <button
        type="button"
        onClick={() => void onToggle()}
        disabled={busy}
        className="rounded-md border border-sr px-2 py-1 text-sr-muted transition-colors hover:bg-sr-card disabled:opacity-60"
      >
        {busy ? "..." : "Toggle"}
      </button>
      {error ? <span className="text-red-300">{error}</span> : null}
    </div>
  );
}
