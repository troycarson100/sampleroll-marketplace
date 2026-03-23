"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useAudioPlayer } from "@/components/audio/audio-player-context";
import { PackCoverPlaceholder } from "@/components/marketplace/pack-cover-placeholder";

type Props = {
  packId: string;
  title: string;
  genre: string;
  sampleCount: number;
  creatorDisplayName: string;
  coverArtUrl: string | null;
  purchasedAtLabel: string;
  demoPreviewUrl: string | null;
};

export function LibraryPackCard({
  packId,
  title,
  genre,
  sampleCount,
  creatorDisplayName,
  coverArtUrl,
  purchasedAtLabel,
  demoPreviewUrl,
}: Props) {
  const { play, currentSample, isPlaying } = useAudioPlayer();
  const sampleLabel = sampleCount === 1 ? "1 sample" : `${sampleCount} samples`;
  const playbackId = `library-pack-demo-${packId}`;
  const active = currentSample?.id === playbackId && isPlaying;

  return (
    <div className="group min-w-0">
      <Link
        href={`/sounds/packs/${packId}`}
        className="relative mb-3 block aspect-square overflow-hidden rounded-xl border border-stitch-outline-variant/10 bg-stitch-surface-container shadow-md"
      >
        {coverArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverArtUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PackCoverPlaceholder seed={packId} className="h-full w-full" />
        )}
      </Link>
      <h3 className="line-clamp-2 font-stitch-serif text-base font-bold leading-snug text-stitch-on-surface transition-colors group-hover:text-stitch-primary">
        {title}
      </h3>
      <p className="mt-1 line-clamp-1 font-stitch-sans text-xs font-medium text-stitch-on-surface-variant">
        {creatorDisplayName}
      </p>
      <p className="mt-0.5 font-stitch-sans text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/70">
        {genre} · {sampleLabel}
      </p>
      <p className="mt-2 font-stitch-sans text-[11px] text-stitch-on-surface-variant/80">
        Purchased {purchasedAtLabel}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={!demoPreviewUrl}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-sr-muted transition-colors enabled:hover:text-sr-gold disabled:opacity-40"
          onClick={() => {
            if (!demoPreviewUrl) return;
            play({
              id: playbackId,
              previewUrl: demoPreviewUrl,
              label: `${title} — Demo`,
              source: "pack_demo",
              packId,
              coverUrl: coverArtUrl,
              subtitle: `${creatorDisplayName} · ${genre}`,
              bpm: null,
              key: null,
            });
          }}
        >
          {active ? (
            <Pause className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <Play className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {active ? "Pause" : "Preview"}
        </button>
        {!demoPreviewUrl ? (
          <span className="text-[11px] text-sr-dim">No demo</span>
        ) : null}
      </div>
    </div>
  );
}
