"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Lock,
  Pause,
  Play,
} from "lucide-react";
import { useAudioPlayer } from "@/components/audio/audio-player-context";
import type { IndividualSample } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  samples: IndividualSample[];
  ownsPack: boolean;
  /** Pack art for list thumbnails (Stitch: 40px cover per row). */
  packCoverUrl: string | null;
};

type SortKey = "az" | "newest" | "bpmAsc" | "bpmDesc";

function formatDuration(sec: number | null) {
  if (sec == null || Number.isNaN(sec) || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function collectTags(samples: IndividualSample[]) {
  const set = new Set<string>();
  for (const s of samples) {
    for (const t of s.instrument_tags ?? []) {
      if (t?.trim()) set.add(t.trim());
    }
    for (const t of s.genre_tags ?? []) {
      if (t?.trim()) set.add(t.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function cmpBpm(
  a: IndividualSample,
  b: IndividualSample,
  dir: "asc" | "desc",
) {
  const ab = a.bpm;
  const bb = b.bpm;
  if (ab == null && bb == null) return 0;
  if (ab == null) return 1;
  if (bb == null) return -1;
  return dir === "asc" ? ab - bb : bb - ab;
}

function RowThumb({ url }: { url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-white/[0.08]"
      />
    );
  }
  return (
    <div className="h-10 w-10 shrink-0 rounded-md bg-gradient-to-br from-sr-card to-sr-bg ring-1 ring-white/[0.08]" />
  );
}

export function PackSamplesList({
  samples,
  ownsPack,
  packCoverUrl,
}: Props) {
  const { play, currentSample, isPlaying } = useAudioPlayer();
  const [sortKey, setSortKey] = useState<SortKey>("az");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => collectTags(samples), [samples]);

  const filteredSorted = useMemo(() => {
    let list = [...samples];
    if (activeTags.length > 0) {
      list = list.filter((s) => {
        const tags = [
          ...(s.instrument_tags ?? []),
          ...(s.genre_tags ?? []),
        ].map((t) => t?.trim().toLowerCase());
        return activeTags.every((at) =>
          tags.includes(at.toLowerCase()),
        );
      });
    }

    switch (sortKey) {
      case "az":
        list.sort((a, b) =>
          a.filename.localeCompare(b.filename, undefined, {
            sensitivity: "base",
          }),
        );
        break;
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
        break;
      case "bpmAsc":
        list.sort((a, b) => cmpBpm(a, b, "asc"));
        break;
      case "bpmDesc":
        list.sort((a, b) => cmpBpm(a, b, "desc"));
        break;
      default:
        break;
    }
    return list;
  }, [samples, activeTags, sortKey]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function downloadSample(sampleId: string) {
    const res = await fetch(`/api/samples/download/${sampleId}`, {
      credentials: "include",
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) {
      window.alert(data.error ?? "Download failed");
      return;
    }
    if (data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="mt-16 pt-12">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-sr-dim/35 to-transparent" />
      <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-2xl italic tracking-tight text-sr-ink">
            Samples
          </h2>
          <p className="mt-1.5 text-sm text-sr-muted">
            {filteredSorted.length} result
            {filteredSorted.length === 1 ? "" : "s"}
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs text-sr-dim sm:flex-row sm:items-center sm:gap-3">
          <span className="uppercase tracking-[0.12em]">Sort</span>
          <select
            className="min-w-[10rem] rounded-lg bg-sr-card/90 py-2 pl-3 pr-8 text-sm text-sr-ink ring-1 ring-white/[0.1] transition-shadow focus:outline-none focus:ring-2 focus:ring-sr-gold/40"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="az">A–Z</option>
            <option value="newest">Newest</option>
            <option value="bpmAsc">BPM low → high</option>
            <option value="bpmDesc">BPM high → low</option>
          </select>
        </label>
      </div>

      {allTags.length > 0 ? (
        <div className="scrollbar-hide mt-8 flex gap-2 overflow-x-auto pb-1">
          {allTags.map((tag) => {
            const on = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  on
                    ? "bg-sr-gold/15 text-sr-gold ring-1 ring-sr-gold/40"
                    : "bg-sr-card/80 text-sr-muted ring-1 ring-white/[0.06] hover:bg-sr-panel hover:text-sr-ink",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="mt-8 flex flex-col gap-1.5">
        {filteredSorted.map((s) => {
          const canPreview = !!s.preview_url;
          const rowActive = currentSample?.id === s.id && isPlaying;
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-xl px-2 py-2.5 transition-colors sm:px-3",
                "hover:bg-sr-card/35",
                rowActive &&
                  "border-l-2 border-l-sr-gold bg-sr-card/45 pl-[6px] shadow-[inset_4px_0_0_0_rgba(228,166,46,0.15)] sm:pl-2.5",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <RowThumb url={packCoverUrl} />
                  <button
                    type="button"
                    aria-label={rowActive ? "Pause" : "Play"}
                    disabled={!canPreview}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sr-card text-sr-ink ring-1 ring-white/[0.1] transition-all disabled:opacity-35",
                      rowActive && "bg-sr-gold/20 text-sr-gold ring-sr-gold/40",
                    )}
                    onClick={() => {
                      if (!s.preview_url) return;
                      play({
                        id: s.id,
                        previewUrl: s.preview_url,
                        label: s.filename,
                      });
                    }}
                  >
                    {rowActive ? (
                      <Pause className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      <Play className="h-3 w-3 pl-0.5" strokeWidth={2.5} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-sr-ink">
                      {s.filename}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {[...(s.instrument_tags ?? []), ...(s.genre_tags ?? [])]
                        .slice(0, 5)
                        .map((t) => (
                          <span
                            key={t}
                            className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sr-dim"
                          >
                            {t}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 pl-12 text-xs text-sr-muted sm:shrink-0 sm:pl-0">
                  <span className="min-w-[2.5rem] text-right tabular-nums">
                    {formatDuration(s.duration_seconds)}
                  </span>
                  <span className="hidden min-w-[4rem] text-right tabular-nums sm:inline">
                    {s.bpm != null ? `${s.bpm} BPM` : "—"}
                  </span>
                  <span className="hidden w-10 text-center sm:inline">
                    {s.musical_key ?? "—"}
                  </span>
                  {ownsPack ? (
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sr-ink ring-1 ring-white/[0.1] transition-colors hover:bg-sr-gold/15 hover:text-sr-gold"
                      aria-label="Download sample"
                      onClick={() => void downloadSample(s.id)}
                    >
                      <Download className="h-4 w-4" strokeWidth={2} />
                    </button>
                  ) : (
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center text-sr-dim"
                      title="Purchase pack to download"
                    >
                      <Lock className="h-4 w-4" strokeWidth={2} />
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {samples.length === 0 ? (
        <p className="mt-6 text-sm text-sr-muted">No samples in this pack.</p>
      ) : null}
    </div>
  );
}
