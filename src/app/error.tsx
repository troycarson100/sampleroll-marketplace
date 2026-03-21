"use client";

import { useEffect } from "react";

function isProductionOmittedMessage(message: string | undefined): boolean {
  return Boolean(
    message?.includes("An error occurred in the Server Components render"),
  );
}

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

  const genericProd = isProductionOmittedMessage(error.message);

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-sr-ink">
      <h1 className="font-display text-2xl text-sr-gold">
        Something went wrong
      </h1>
      {genericProd ? (
        <div className="mt-3 space-y-3 text-sm text-sr-muted">
          <p>
            The server hit an error while rendering this page. In production,
            Next.js hides the underlying message.
          </p>
          <p>
            Common causes: missing or invalid{" "}
            <code className="rounded bg-sr-card px-1 py-0.5">DATABASE_URL</code>
            , Postgres unreachable from the host, missing{" "}
            <code className="rounded bg-sr-card px-1 py-0.5">
              AUTH_SECRET
            </code>{" "}
            /{" "}
            <code className="rounded bg-sr-card px-1 py-0.5">
              NEXTAUTH_SECRET
            </code>
            , or a Prisma schema/database mismatch. Check your hosting logs.
          </p>
          {error.digest ? (
            <p className="text-xs text-sr-dim">
              Reference digest:{" "}
              <code className="rounded bg-sr-card px-1 py-0.5">
                {error.digest}
              </code>
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-sr-muted">
          {error.message || "An unexpected error occurred."}
        </p>
      )}
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
