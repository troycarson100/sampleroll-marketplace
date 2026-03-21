"use client";

/**
 * Root layout errors don’t reach `app/error.tsx`. This catches catastrophic
 * failures so users aren’t left with a blank document.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#111110",
          color: "#EDEDEA",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", color: "#E4A62E" }}>
          Something went wrong
        </h1>
        {error.message?.includes(
          "An error occurred in the Server Components render",
        ) ? (
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              opacity: 0.85,
              lineHeight: 1.5,
            }}
          >
            <p>
              Next.js hides the real error in production. Check hosting logs.
              Often: DATABASE_URL, Postgres connectivity, AUTH_SECRET /
              NEXTAUTH_SECRET, or Prisma vs database schema mismatch.
            </p>
            {error.digest ? (
              <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.7 }}>
                Digest: <code>{error.digest}</code>
              </p>
            ) : null}
          </div>
        ) : (
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", opacity: 0.8 }}>
            {error.message || "An unexpected error occurred."}
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            background: "#E4A62E",
            color: "#111110",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <p style={{ marginTop: "2rem", fontSize: "0.75rem", opacity: 0.5 }}>
          If the page is blank after an auth or DB change: stop the dev server,
          run <code>rm -rf .next</code>, then <code>npm run dev</code> once.
          Ensure only one dev server is using the port.
        </p>
      </body>
    </html>
  );
}
