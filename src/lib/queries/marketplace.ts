import type { PrismaClient } from "@prisma/client";
import type { IndividualSample, SamplePack } from "@/lib/types";
import { logPrismaCatalogError } from "@/lib/prisma-dev-log";

export type PackWithCreator = Pick<
  SamplePack,
  | "id"
  | "title"
  | "genre"
  | "cover_art_url"
  | "price_cents"
  | "total_sales"
  | "created_at"
  | "creator_id"
  | "sample_count"
> & {
  creator_display_name: string;
};

type PackRow = Pick<
  SamplePack,
  | "id"
  | "title"
  | "genre"
  | "cover_art_url"
  | "price_cents"
  | "total_sales"
  | "created_at"
  | "creator_id"
  | "sample_count"
>;

function toIso(d: Date): string {
  return d.toISOString();
}

function packToRow(p: {
  id: string;
  title: string;
  genre: string;
  coverArtUrl: string | null;
  priceCents: number;
  totalSales: number;
  createdAt: Date;
  creatorId: string;
  sampleCount: number;
}): PackRow {
  return {
    id: p.id,
    title: p.title,
    genre: p.genre,
    cover_art_url: p.coverArtUrl,
    price_cents: p.priceCents,
    total_sales: p.totalSales,
    created_at: toIso(p.createdAt),
    creator_id: p.creatorId,
    sample_count: p.sampleCount,
  };
}

async function attachCreatorNames(
  prisma: PrismaClient,
  packs: PackRow[],
): Promise<PackWithCreator[]> {
  const ids = Array.from(new Set(packs.map((p) => p.creator_id)));
  if (ids.length === 0) return [];

  const profiles = await prisma.profileMarketplace.findMany({
    where: { id: { in: ids } },
    select: { id: true, creatorDisplayName: true },
  });

  const map = new Map(
    profiles.map((r) => [
      r.id,
      r.creatorDisplayName?.trim() || "Artist",
    ]),
  );

  return packs.map((p) => ({
    ...p,
    creator_display_name: map.get(p.creator_id) ?? "Artist",
  }));
}

function sortByTotalSalesDesc(a: PackRow, b: PackRow) {
  return (b.total_sales ?? 0) - (a.total_sales ?? 0);
}

function sortByCreatedDesc(a: PackRow, b: PackRow) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export type BrowsePageData = {
  topPacks: PackWithCreator[];
  recommendedForYou: PackWithCreator[];
  newThisWeek: PackWithCreator[];
  hasNewInLastWeek: boolean;
  genreFilter: string | null;
  genreFiltered: PackWithCreator[] | null;
  /** True when DB URL missing or queries failed (avoid crashing RSC in production). */
  catalogUnavailable?: boolean;
};

const emptyBrowse = (genreFilter: string | null): BrowsePageData => ({
  topPacks: [],
  recommendedForYou: [],
  newThisWeek: [],
  hasNewInLastWeek: false,
  genreFilter,
  genreFiltered: genreFilter ? [] : null,
});

export async function fetchBrowsePageData(
  prisma: PrismaClient,
  opts: { genre?: string | null },
): Promise<BrowsePageData> {
  const genreFilter = opts.genre?.trim() || null;

  if (!process.env.DATABASE_URL?.trim()) {
    if (process.env.NODE_ENV === "production") {
      return { ...emptyBrowse(genreFilter), catalogUnavailable: true };
    }
    return emptyBrowse(genreFilter);
  }

  try {
    const rows = await prisma.samplePack.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        genre: true,
        coverArtUrl: true,
        priceCents: true,
        totalSales: true,
        createdAt: true,
        creatorId: true,
        sampleCount: true,
      },
    });

    const packs: PackRow[] = rows.map(packToRow);
    const withNames = await attachCreatorNames(prisma, packs);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const inLastWeek = withNames.filter(
      (p) => new Date(p.created_at).getTime() >= weekAgo,
    );
    const sortedNew = [...inLastWeek].sort(sortByCreatedDesc);
    const hasNewInLastWeek = sortedNew.length > 0;

    const newThisWeek: PackWithCreator[] = hasNewInLastWeek
      ? sortedNew.slice(0, 12)
      : [...withNames].sort(sortByCreatedDesc).slice(0, 12);

    const newIds = new Set(newThisWeek.map((p) => p.id));

    const recommendedSource = [...withNames]
      .filter((p) => !newIds.has(p.id))
      .sort(sortByTotalSalesDesc);

    const recommendedForYou: PackWithCreator[] =
      recommendedSource.length > 0
        ? recommendedSource.slice(0, 12)
        : [...withNames].sort(sortByTotalSalesDesc).slice(0, 12);

    const topPacks = [...withNames].sort(sortByTotalSalesDesc).slice(0, 10);

    let genreFiltered: PackWithCreator[] | null = null;
    if (genreFilter) {
      const g = genreFilter.toLowerCase();
      genreFiltered = withNames.filter((p) => p.genre.toLowerCase() === g);
    }

    return {
      topPacks,
      recommendedForYou,
      newThisWeek,
      hasNewInLastWeek,
      genreFilter,
      genreFiltered,
    };
  } catch (err) {
    logPrismaCatalogError("fetchBrowsePageData", err);
    return { ...emptyBrowse(genreFilter), catalogUnavailable: true };
  }
}

export type PackDetailData = {
  pack: SamplePack;
  creatorDisplayName: string;
  samples: IndividualSample[];
  ownsPack: boolean;
};

export type PackDetailFetchResult =
  | { ok: true; data: PackDetailData }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "unavailable" };

export async function fetchPackDetailPageData(
  prisma: PrismaClient,
  packId: string,
  userId: string | null,
): Promise<PackDetailFetchResult> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { ok: false, kind: "unavailable" };
  }

  try {
    const row = await prisma.samplePack.findFirst({
      where: { id: packId, isPublished: true },
    });

    if (!row) {
      return { ok: false, kind: "not_found" };
    }

    const pack: SamplePack = {
      id: row.id,
      creator_id: row.creatorId,
      title: row.title,
      description: row.description,
      genre: row.genre,
      tags: row.tags,
      cover_art_url: row.coverArtUrl,
      price_cents: row.priceCents,
      stripe_price_id: row.stripePriceId,
      sample_count: row.sampleCount,
      total_sales: row.totalSales,
      is_published: row.isPublished,
      created_at: toIso(row.createdAt),
      updated_at: toIso(row.updatedAt),
    };

    const profile = await prisma.profileMarketplace.findUnique({
      where: { id: row.creatorId },
      select: { creatorDisplayName: true },
    });

    const creatorDisplayName =
      profile?.creatorDisplayName?.trim() || "Artist";

    const sampleRows = await prisma.individualSample.findMany({
      where: { packId: row.id },
      orderBy: { sortOrder: "asc" },
    });

    const samples: IndividualSample[] = sampleRows.map((s) => ({
      id: s.id,
      pack_id: s.packId,
      filename: s.filename,
      original_filename: s.originalFilename,
      file_url: s.fileUrl,
      preview_url: s.previewUrl,
      duration_seconds: s.durationSeconds,
      bpm: s.bpm,
      musical_key: s.musicalKey,
      instrument_tags: s.instrumentTags,
      genre_tags: s.genreTags,
      sort_order: s.sortOrder,
      created_at: toIso(s.createdAt),
    }));

    let ownsPack = false;
    if (userId) {
      const purchase = await prisma.userPurchase.findUnique({
        where: {
          userId_packId: { userId, packId: row.id },
        },
        select: { id: true },
      });
      ownsPack = !!purchase;
    }

    return {
      ok: true,
      data: {
        pack,
        creatorDisplayName,
        samples,
        ownsPack,
      },
    };
  } catch (err) {
    logPrismaCatalogError("fetchPackDetailPageData", err);
    return { ok: false, kind: "unavailable" };
  }
}
