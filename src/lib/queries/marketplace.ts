import type { SupabaseClient } from "@supabase/supabase-js";
import type { IndividualSample, SamplePack } from "@/lib/types";

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

async function attachCreatorNames(
  supabase: SupabaseClient,
  packs: PackRow[],
): Promise<PackWithCreator[]> {
  const ids = Array.from(new Set(packs.map((p) => p.creator_id)));
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles_marketplace")
    .select("id, creator_display_name")
    .in("id", ids);

  const map = new Map(
    (profiles ?? []).map((r) => [
      r.id,
      (r.creator_display_name as string | null)?.trim() || "Artist",
    ]),
  );

  return packs.map((p) => ({
    ...p,
    creator_display_name: map.get(p.creator_id) ?? "Artist",
  }));
}

function sortByTotalSalesDesc(a: PackRow, b: PackRow) {
  const ta = a.total_sales ?? 0;
  const tb = b.total_sales ?? 0;
  return tb - ta;
}

function sortByCreatedDesc(a: PackRow, b: PackRow) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export type BrowsePageData = {
  topPacks: PackWithCreator[];
  /** Until personalization exists: top sellers excluding “new this week” pack ids when possible; else top sellers. */
  recommendedForYou: PackWithCreator[];
  newThisWeek: PackWithCreator[];
  hasNewInLastWeek: boolean;
  genreFilter: string | null;
  genreFiltered: PackWithCreator[] | null;
};

export async function fetchBrowsePageData(
  supabase: SupabaseClient,
  opts: { genre?: string | null },
): Promise<BrowsePageData> {
  const { data: rows, error } = await supabase
    .from("sample_packs")
    .select(
      "id, title, genre, cover_art_url, price_cents, total_sales, created_at, creator_id, sample_count",
    )
    .eq("is_published", true);

  if (error) {
    console.error("fetchBrowsePageData sample_packs:", error);
  }

  const packs: PackRow[] = (rows ?? []) as PackRow[];
  const withNames = await attachCreatorNames(supabase, packs);

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

  /** Placeholder until personalization: prefer sellers outside “new” row; if none, reuse top sellers. */
  const recommendedForYou: PackWithCreator[] =
    recommendedSource.length > 0
      ? recommendedSource.slice(0, 12)
      : [...withNames].sort(sortByTotalSalesDesc).slice(0, 12);

  const topPacks = [...withNames].sort(sortByTotalSalesDesc).slice(0, 10);

  const genreFilter = opts.genre?.trim() || null;
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
}

export type PackDetailData = {
  pack: SamplePack;
  creatorDisplayName: string;
  samples: IndividualSample[];
  ownsPack: boolean;
};

export async function fetchPackDetailPageData(
  supabase: SupabaseClient,
  packId: string,
  userId: string | null,
): Promise<PackDetailData | null> {
  const { data: pack, error } = await supabase
    .from("sample_packs")
    .select("*")
    .eq("id", packId)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !pack) {
    return null;
  }

  const typed = pack as SamplePack;

  const { data: profile } = await supabase
    .from("profiles_marketplace")
    .select("creator_display_name")
    .eq("id", typed.creator_id)
    .maybeSingle();

  const creatorDisplayName =
    (profile?.creator_display_name as string | null)?.trim() || "Artist";

  const { data: samples } = await supabase
    .from("individual_samples")
    .select("*")
    .eq("pack_id", packId)
    .order("sort_order", { ascending: true });

  let ownsPack = false;
  if (userId) {
    const { data: purchase } = await supabase
      .from("user_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("pack_id", packId)
      .maybeSingle();
    ownsPack = !!purchase;
  }

  return {
    pack: typed,
    creatorDisplayName,
    samples: (samples ?? []) as IndividualSample[],
    ownsPack,
  };
}
