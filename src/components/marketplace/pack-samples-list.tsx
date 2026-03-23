"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Download,
  Loader2,
  Lock,
  Pause,
  Play,
} from "lucide-react";
import { useAudioPlayer } from "@/components/audio/audio-player-context";
import {
  downloadSampleFileFromApi,
  downloadSampleFilesSequentially,
} from "@/lib/client/download-sample-file";
import { PackSamplesListHeader } from "@/components/marketplace/pack-samples-list-header";
import { SampleWaveformStrip } from "@/components/marketplace/sample-waveform-strip";
import type { IndividualSample } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PackSamplesMeta = {
  id: string;
  title: string;
  genre: string;
  tags: string[];
};

type Props = {
  samples: IndividualSample[];
  ownsPack: boolean;
  /** Without full pack: sample IDs the user may download (e.g. partial purchase). */
  ownedSampleIds?: string[];
  /** Pack art for list thumbnails (Stitch: 40px cover per row). */
  packCoverUrl: string | null;
  packMeta: PackSamplesMeta;
  demoPreviewUrl?: string | null;
};

type SortKey = "az" | "newest" | "bpmAsc" | "bpmDesc";

/** Static total length only (e.g. `20s`) — no live playback clock. */
function formatStaticDuration(sec: number | null) {
  if (sec == null || Number.isNaN(sec) || sec < 0) return "—";
  const n = Math.round(sec);
  if (n < 60) return `${n}s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Prefer DB duration; otherwise live decode from player; then cached value from prior plays. */
function resolveDurationSeconds(
  durationFromDb: number | null,
  isCurrentRow: boolean,
  playerDuration: number,
  cachedSeconds: number | undefined,
): number | null {
  if (
    durationFromDb != null &&
    Number.isFinite(durationFromDb) &&
    durationFromDb >= 0
  ) {
    return durationFromDb;
  }
  if (
    isCurrentRow &&
    Number.isFinite(playerDuration) &&
    playerDuration > 0
  ) {
    return playerDuration;
  }
  if (cachedSeconds != null && Number.isFinite(cachedSeconds) && cachedSeconds > 0) {
    return cachedSeconds;
  }
  return null;
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
  ownedSampleIds,
  packCoverUrl,
  packMeta,
  demoPreviewUrl = null,
}: Props) {
  const {
    play,
    seek,
    currentSample,
    isPlaying,
    currentTime,
    duration: playerDuration,
    setQueue,
  } = useAudioPlayer();
  const [sortKey, setSortKey] = useState<SortKey>("az");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  /** Filled when metadata loads in the player (many rows have null duration in DB). */
  const [heardDurationBySampleId, setHeardDurationBySampleId] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!currentSample?.id) return;
    if (!Number.isFinite(playerDuration) || playerDuration <= 0) return;
    setHeardDurationBySampleId((prev) => {
      const id = currentSample.id;
      if (prev[id] === playerDuration) return prev;
      return { ...prev, [id]: playerDuration };
    });
  }, [currentSample?.id, playerDuration]);

  const canDownloadSample = useCallback(
    (sampleId: string) => {
      if (ownsPack) return true;
      return ownedSampleIds?.includes(sampleId) ?? false;
    },
    [ownsPack, ownedSampleIds],
  );

  /** All samples the user may download (full pack or subset), in pack order. */
  const downloadableSamples = useMemo(
    () => samples.filter((s) => canDownloadSample(s.id)),
    [samples, canDownloadSample],
  );

  const bulkDownloadLabel = useMemo(() => {
    const n = downloadableSamples.length;
    if (n === 0) return null;
    if (ownsPack) return "Download Pack";
    return `Download ${n} Sample${n === 1 ? "" : "s"}`;
  }, [downloadableSamples.length, ownsPack]);

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

  /** Load duration from preview URL when DB has no length (common for older uploads). */
  const metadataProbeDoneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function probeMetadata() {
      for (const s of filteredSorted) {
        if (cancelled) return;
        const hasDb =
          s.duration_seconds != null &&
          Number.isFinite(s.duration_seconds) &&
          s.duration_seconds >= 0;
        if (hasDb) continue;
        if (!s.preview_url) continue;
        if (metadataProbeDoneRef.current.has(s.id)) continue;

        metadataProbeDoneRef.current.add(s.id);

        const el = new Audio();
        el.preload = "metadata";

        const seconds = await new Promise<number | null>((resolve) => {
          const ms = 12_000;
          const timeoutId = window.setTimeout(() => resolve(null), ms);
          const done = (v: number | null) => {
            window.clearTimeout(timeoutId);
            resolve(v);
          };
          el.addEventListener(
            "loadedmetadata",
            () => {
              const d = el.duration;
              done(Number.isFinite(d) && d > 0 ? d : null);
            },
            { once: true },
          );
          el.addEventListener(
            "error",
            () => done(null),
            { once: true },
          );
          try {
            el.src = s.preview_url!;
          } catch {
            done(null);
          }
        });

        try {
          el.removeAttribute("src");
          el.load();
        } catch {
          /* ignore */
        }

        if (cancelled) return;
        if (seconds != null) {
          setHeardDurationBySampleId((prev) =>
            prev[s.id] === seconds ? prev : { ...prev, [s.id]: seconds },
          );
        }

        await new Promise((r) => window.setTimeout(r, 40));
      }
    }

    void probeMetadata();
    return () => {
      cancelled = true;
    };
  }, [filteredSorted]);

  /** Queue order must match visible rows (`filteredSorted`), not raw `samples` order,
   *  or keyboard prev/next will skip items that sit between two tracks in the DB order. */
  useEffect(() => {
    const demoTrack = demoPreviewUrl
      ? [
          {
            id: `pack-demo-${packMeta.id}`,
            previewUrl: demoPreviewUrl,
            label: `${packMeta.title} — Demo`,
            source: "pack_demo" as const,
            packId: packMeta.id,
            coverUrl: packCoverUrl,
            subtitle: [packMeta.genre, ...packMeta.tags.slice(0, 5)]
              .filter(Boolean)
              .join(" · "),
            bpm: null,
            key: null,
          },
        ]
      : [];

    const sampleTracks = filteredSorted
      .filter((s) => !!s.preview_url)
      .map((s) => ({
        id: s.id,
        previewUrl: s.preview_url!,
        label: s.filename,
        source: "sample" as const,
        packId: packMeta.id,
        coverUrl: packCoverUrl,
        subtitle:
          [...s.genre_tags, ...s.instrument_tags].slice(0, 6).join(" · ") ||
          `${packMeta.title} · ${packMeta.genre}`,
        bpm: s.bpm,
        key: s.musical_key,
      }));

    setQueue([...demoTrack, ...sampleTracks]);
  }, [demoPreviewUrl, packCoverUrl, packMeta, filteredSorted, setQueue]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function downloadOneSample(sampleId: string, filename: string) {
    try {
      await downloadSampleFileFromApi(sampleId, filename);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Download failed");
    }
  }

  function toPlayerSample(s: IndividualSample) {
    const tagLine = [...s.genre_tags, ...s.instrument_tags]
      .slice(0, 6)
      .filter(Boolean)
      .join(" · ");
    return {
      id: s.id,
      previewUrl: s.preview_url!,
      label: s.filename,
      source: "sample" as const,
      packId: packMeta.id,
      coverUrl: packCoverUrl,
      subtitle: tagLine || `${packMeta.title} · ${packMeta.genre}`,
      bpm: s.bpm,
      key: s.musical_key,
    };
  }

  function playSampleFromRow(s: IndividualSample) {
    if (!s.preview_url) return;
    play(toPlayerSample(s));
  }

  function handleWaveformSeek(s: IndividualSample, pct: number) {
    if (!s.preview_url) return;
    const sample = toPlayerSample(s);
    if (
      currentSample?.id === s.id &&
      Number.isFinite(playerDuration) &&
      playerDuration > 0
    ) {
      seek(pct * playerDuration);
      return;
    }
    play(sample, { startPercent: pct });
  }

  async function downloadAllOwnedSamples() {
    if (downloadableSamples.length === 0) return;
    setBulkDownloading(true);
    try {
      const items = downloadableSamples.map((s) => ({
        id: s.id,
        filename: s.original_filename || s.filename,
      }));
      const { ok, failed } = await downloadSampleFilesSequentially(items);
      if (failed > 0) {
        window.alert(
          `Downloaded ${ok} file${ok === 1 ? "" : "s"}. ${failed} failed — try again.`,
        );
      }
    } finally {
      setBulkDownloading(false);
    }
  }

  return (
    <div className="mt-16 pt-12">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-sr-dim/35 to-transparent" />
      <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6 lg:block lg:max-w-md">
          <div>
            <h2 className="font-display text-2xl italic tracking-tight text-sr-ink">
              Samples
            </h2>
            <p className="mt-1.5 text-sm text-sr-muted">
              {filteredSorted.length} result
              {filteredSorted.length === 1 ? "" : "s"}
            </p>
          </div>
          {bulkDownloadLabel ? (
            <button
              type="button"
              disabled={bulkDownloading}
              onClick={() => void downloadAllOwnedSamples()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-sr-gold/15 px-4 py-2.5 text-sm font-medium text-sr-gold ring-1 ring-sr-gold/35 transition-colors hover:bg-sr-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkDownloading ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin"
                  aria-hidden
                />
              ) : (
                <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
              )}
              {bulkDownloading ? "Downloading…" : bulkDownloadLabel}
            </button>
          ) : null}
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

      {filteredSorted.length > 0 ? (
        <div className="mt-8">
          <PackSamplesListHeader />
          <ul className="mt-1.5 flex flex-col gap-1.5">
        {filteredSorted.map((s) => {
          const canPreview = !!s.preview_url;
          const rowActive = currentSample?.id === s.id && isPlaying;
          const isCurrentRow = currentSample?.id === s.id;
          const progress =
            isCurrentRow &&
            Number.isFinite(playerDuration) &&
            playerDuration > 0
              ? Math.min(1, currentTime / playerDuration)
              : undefined;
          const durationLabel = formatStaticDuration(
            resolveDurationSeconds(
              s.duration_seconds,
              isCurrentRow,
              playerDuration,
              heardDurationBySampleId[s.id],
            ),
          );
          const tagWords = [
            ...(s.instrument_tags ?? []),
            ...(s.genre_tags ?? []),
          ]
            .slice(0, 8)
            .filter(Boolean)
            .join(" ");

          return (
            <li
              key={s.id}
              className={cn(
                "rounded-xl px-2 py-2 transition-colors sm:px-3",
                "hover:bg-sr-card/35",
                canPreview && "cursor-pointer",
                rowActive &&
                  "border-l-2 border-l-sr-gold bg-sr-card/45 pl-[6px] shadow-[inset_4px_0_0_0_rgba(228,166,46,0.15)] sm:pl-2.5",
              )}
              onClick={() => {
                if (canPreview) playSampleFromRow(s);
              }}
            >
              {/* Single horizontal row (Splice-style): thumb · play · title+tags · waveform · time · key · bpm · dl */}
              <div className="scrollbar-hide flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 sm:gap-3 sm:overflow-visible sm:pb-0">
                <RowThumb url={packCoverUrl} />
                <button
                  type="button"
                  aria-label={rowActive ? "Pause" : "Play"}
                  disabled={!canPreview}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sr-card text-sr-ink ring-1 ring-white/[0.1] transition-all disabled:opacity-35",
                    rowActive && "bg-sr-gold/20 text-sr-gold ring-sr-gold/40",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    playSampleFromRow(s);
                  }}
                >
                  {rowActive ? (
                    <Pause className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    <Play className="h-3 w-3 pl-0.5" strokeWidth={2.5} />
                  )}
                </button>

                <div className="min-w-0 flex-1 basis-0 overflow-hidden">
                  <p
                    className="truncate text-sm leading-tight"
                    title={`${s.filename}${tagWords ? ` ${tagWords}` : ""}`}
                  >
                    <span className="font-semibold text-sr-ink">
                      {s.filename}
                    </span>
                    {tagWords ? (
                      <span className="font-normal text-sr-muted">
                        {" "}
                        {tagWords}
                      </span>
                    ) : null}
                  </p>
                </div>

                <SampleWaveformStrip
                  sampleId={s.id}
                  progress={progress}
                  onSeek={
                    canPreview
                      ? (pct) => handleWaveformSeek(s, pct)
                      : undefined
                  }
                />

                <span
                  className="w-[3.5rem] shrink-0 text-right tabular-nums text-xs text-sr-muted"
                  title={durationLabel}
                >
                  {durationLabel}
                </span>

                <span className="hidden w-11 shrink-0 text-center text-[11px] leading-none text-sr-muted sm:inline md:w-14">
                  {s.musical_key ?? "—"}
                </span>

                <span className="hidden w-9 shrink-0 text-center tabular-nums text-xs text-sr-muted md:inline">
                  {s.bpm != null ? s.bpm : "—"}
                </span>

                {canDownloadSample(s.id) ? (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sr-ink ring-1 ring-white/[0.1] transition-colors hover:bg-sr-gold/15 hover:text-sr-gold"
                    aria-label="Download sample"
                    onClick={(e) => {
                      e.stopPropagation();
                      void downloadOneSample(
                        s.id,
                        s.original_filename || s.filename,
                      );
                    }}
                  >
                    <Download className="h-4 w-4" strokeWidth={2} />
                  </button>
                ) : (
                  <span
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-sr-dim"
                    title="Purchase pack to download"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <Lock className="h-4 w-4" strokeWidth={2} />
                  </span>
                )}
              </div>
            </li>
          );
        })}
          </ul>
        </div>
      ) : null}

      {samples.length === 0 ? (
        <p className="mt-6 text-sm text-sr-muted">No samples in this pack.</p>
      ) : null}
    </div>
  );
}
