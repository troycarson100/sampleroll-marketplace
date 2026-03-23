import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LibraryPackCard } from "@/components/library/library-pack-card";
import { LibraryPlayerQueue } from "@/components/library/library-player-queue";

type Params = {
  genre?: string;
  q?: string;
};

function asSingle(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?next=/library");
  }

  const genre = asSingle(searchParams.genre)?.trim() ?? "";
  const query = asSingle(searchParams.q)?.trim() ?? "";

  const purchases = await prisma.userPurchase.findMany({
    where: {
      userId,
      pack: {
        ...(genre ? { genre } : {}),
        ...(query
          ? {
              title: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      },
    },
    include: {
      pack: {
        select: {
          id: true,
          title: true,
          coverArtUrl: true,
          demoPreviewUrl: true,
          genre: true,
          sampleCount: true,
          creator: {
            select: {
              profileMarketplace: {
                select: { creatorDisplayName: true },
              },
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allPurchasedGenres = await prisma.userPurchase.findMany({
    where: { userId },
    select: { pack: { select: { genre: true } } },
    orderBy: { pack: { genre: "asc" } },
  });
  const genres = Array.from(new Set(allPurchasedGenres.map((p) => p.pack.genre)));

  const libraryQueue = purchases
    .filter((purchase) => !!purchase.pack.demoPreviewUrl)
    .map((purchase) => ({
      id: `library-pack-demo-${purchase.pack.id}`,
      previewUrl: purchase.pack.demoPreviewUrl!,
      label: `${purchase.pack.title} — Demo`,
      source: "pack_demo" as const,
      packId: purchase.pack.id,
      coverUrl: purchase.pack.coverArtUrl,
      subtitle: `${purchase.pack.creator.profileMarketplace?.creatorDisplayName ?? purchase.pack.creator.name ?? purchase.pack.creator.email} · ${purchase.pack.genre}`,
      bpm: null,
      key: null,
    }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <LibraryPlayerQueue tracks={libraryQueue} />
      <div className="mb-8">
        <h1 className="font-display text-4xl text-sr-ink">Your Library</h1>
        <p className="mt-2 text-sm text-sr-muted">
          All packs you own. Open any pack to access unlocked downloads.
        </p>
      </div>

      <form className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-sr-muted">
          Genre
          <select
            name="genre"
            defaultValue={genre}
            className="mt-1 block w-full rounded-md border border-sr bg-sr-card px-3 py-2 text-sm text-sr-ink"
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-sr-muted">
          Search pack title
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search title..."
            className="mt-1 block w-full rounded-md border border-sr bg-sr-card px-3 py-2 text-sm text-sr-ink placeholder:text-sr-dim"
          />
        </label>
        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-sr-gold px-4 py-2 text-sm font-medium text-sr-bg hover:opacity-90"
          >
            Apply
          </button>
          <Link
            href="/library"
            className="rounded-md border border-sr px-4 py-2 text-sm text-sr-muted hover:bg-sr-panel"
          >
            Clear
          </Link>
        </div>
      </form>

      {purchases.length === 0 ? (
        <div className="rounded-lg border border-sr bg-sr-card p-6 text-center">
          <p className="text-sr-muted">
            Your library is empty. Browse the marketplace to find your first sounds.
          </p>
          <Link
            href="/sounds"
            className="mt-3 inline-block text-sm font-medium text-sr-gold hover:underline"
          >
            Go to marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {purchases.map((purchase) => (
            <LibraryPackCard
              key={purchase.id}
              packId={purchase.pack.id}
              title={purchase.pack.title}
              genre={purchase.pack.genre}
              sampleCount={purchase.pack.sampleCount}
              creatorDisplayName={
                purchase.pack.creator.profileMarketplace?.creatorDisplayName ??
                purchase.pack.creator.name ??
                purchase.pack.creator.email
              }
              coverArtUrl={purchase.pack.coverArtUrl}
              demoPreviewUrl={purchase.pack.demoPreviewUrl}
              purchasedAtLabel={purchase.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
