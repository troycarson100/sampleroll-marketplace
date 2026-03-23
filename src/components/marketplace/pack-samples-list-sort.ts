import type { IndividualSample } from "@/lib/types";

export type PackSamplesSortKey =
  | "az"
  | "filenameDesc"
  | "newest"
  | "durationAsc"
  | "durationDesc"
  | "keyAsc"
  | "keyDesc"
  | "bpmAsc"
  | "bpmDesc";

function cmpBpm(
  a: IndividualSample,
  b: IndividualSample,
  dir: "asc" | "desc",
) {
  const ab = a.bpm;
  const bb = b.bpm;
  if (ab == null && bb == null) return a.sort_order - b.sort_order;
  if (ab == null) return 1;
  if (bb == null) return -1;
  const primary = dir === "asc" ? ab - bb : bb - ab;
  if (primary !== 0) return primary;
  return a.sort_order - b.sort_order;
}

function cmpDuration(
  a: IndividualSample,
  b: IndividualSample,
  dir: "asc" | "desc",
  resolve?: (s: IndividualSample) => number | null,
) {
  const get = resolve ?? ((s: IndividualSample) => s.duration_seconds);
  const da = get(a);
  const db = get(b);
  if (da == null && db == null) return a.sort_order - b.sort_order;
  if (da == null) return 1;
  if (db == null) return -1;
  const primary = dir === "asc" ? da - db : db - da;
  if (primary !== 0) return primary;
  return a.sort_order - b.sort_order;
}

function cmpKey(
  a: IndividualSample,
  b: IndividualSample,
  dir: "asc" | "desc",
) {
  const ka = a.musical_key ?? "";
  const kb = b.musical_key ?? "";
  const c = ka.localeCompare(kb, undefined, { sensitivity: "base" });
  const adjusted = dir === "asc" ? c : -c;
  if (adjusted !== 0) return adjusted;
  return a.sort_order - b.sort_order;
}

/** Optional overrides so Time sort matches on-screen durations (DB + client probe + player). */
export type SortSamplesListOptions = {
  resolveDurationSeconds?: (s: IndividualSample) => number | null;
};

/** Sort a copy of `list` according to `sortKey`. */
export function sortSamplesList(
  list: IndividualSample[],
  sortKey: PackSamplesSortKey,
  options?: SortSamplesListOptions,
): IndividualSample[] {
  const resolveDur = options?.resolveDurationSeconds;
  const next = [...list];
  switch (sortKey) {
    case "az":
      next.sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, {
          sensitivity: "base",
        }),
      );
      break;
    case "filenameDesc":
      next.sort((a, b) =>
        b.filename.localeCompare(a.filename, undefined, {
          sensitivity: "base",
        }),
      );
      break;
    case "newest":
      next.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
    case "durationAsc":
      next.sort((a, b) => cmpDuration(a, b, "asc", resolveDur));
      break;
    case "durationDesc":
      next.sort((a, b) => cmpDuration(a, b, "desc", resolveDur));
      break;
    case "keyAsc":
      next.sort((a, b) => cmpKey(a, b, "asc"));
      break;
    case "keyDesc":
      next.sort((a, b) => cmpKey(a, b, "desc"));
      break;
    case "bpmAsc":
      next.sort((a, b) => cmpBpm(a, b, "asc"));
      break;
    case "bpmDesc":
      next.sort((a, b) => cmpBpm(a, b, "desc"));
      break;
    default:
      break;
  }
  return next;
}
