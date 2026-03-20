"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-sr-ink">
      <h1 className="font-display text-2xl text-sr-gold">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-sr-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg"
      >
        Try again
      </button>
      <p className="mt-8 text-xs text-sr-dim">
        If the app is blank after an update, stop the dev server, run{" "}
        <code className="rounded bg-sr-card px-1 py-0.5">rm -rf .next</code>,
        then <code className="rounded bg-sr-card px-1 py-0.5">npm run dev</code>{" "}
        once (avoid multiple dev servers on the same port).
      </p>
    </div>
  );
}
