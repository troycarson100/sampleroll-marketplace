export default function CreatorStubPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl italic text-sr-ink">Creator</h1>
      <p className="mt-4 text-sr-muted">
        Profile pages are not live yet. (ID: {params.id})
      </p>
    </main>
  );
}
