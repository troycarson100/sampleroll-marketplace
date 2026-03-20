export function PlaceholderPhase({ label }: { label?: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      {label ? (
        <h1 className="font-display text-2xl text-sr-ink">{label}</h1>
      ) : null}
      <p className={label ? "mt-4 text-sr-muted" : "text-sr-muted"}>
        Phase 0 - Coming Soon
      </p>
    </main>
  );
}
