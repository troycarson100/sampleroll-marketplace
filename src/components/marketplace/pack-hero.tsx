"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAudioPlayer } from "@/components/audio/audio-player-context";
import { BuyPackButton } from "@/components/marketplace/buy-pack-button";
import { PackCoverPlaceholder } from "@/components/marketplace/pack-cover-placeholder";
import { Button } from "@/components/ui/button";
import type { IndividualSample, SamplePack } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  pack: SamplePack;
  creatorDisplayName: string;
  samples: IndividualSample[];
};

function Cover({ pack }: { pack: SamplePack }) {
  if (pack.cover_art_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={pack.cover_art_url}
        alt=""
        className="h-full w-full object-cover"
      />
    );
  }
  return <PackCoverPlaceholder seed={pack.id} className="h-full w-full" />;
}

export function PackHero({ pack, creatorDisplayName, samples }: Props) {
  const { play, currentSample, isPlaying } = useAudioPlayer();
  const [expanded, setExpanded] = useState(false);
  const [hearted, setHearted] = useState(false);

  useEffect(() => {
    try {
      setHearted(
        typeof window !== "undefined" &&
          localStorage.getItem(`sr-pack-heart-${pack.id}`) === "1",
      );
    } catch {
      /* ignore */
    }
  }, [pack.id]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `sr-pack-heart-${pack.id}`,
        hearted ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }, [hearted, pack.id]);

  const previewTarget = useMemo(() => {
    const withPreview = samples.find((s) => s.preview_url);
    return withPreview ?? samples[0];
  }, [samples]);

  function onPreview() {
    if (!previewTarget?.preview_url) return;
    play({
      id: previewTarget.id,
      previewUrl: previewTarget.preview_url,
      label: previewTarget.filename,
    });
  }

  const previewActive =
    previewTarget &&
    currentSample?.id === previewTarget.id &&
    isPlaying;

  const description = pack.description?.trim();
  const needsClamp = description && description.length > 180;

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
      <div className="mx-auto h-[200px] w-[200px] shrink-0 overflow-hidden rounded-2xl bg-sr-card shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.08] lg:mx-0">
        <Cover pack={pack} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-sr-muted">
          <Link
            href={`/creators/${pack.creator_id}`}
            className="transition-colors hover:text-sr-gold"
          >
            {creatorDisplayName}
          </Link>
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-sr-ink md:text-[2.5rem] md:leading-[1.15]">
          {pack.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-sr-muted">
          <span className="rounded-md bg-sr-card/90 px-2.5 py-1 text-xs font-medium text-sr-ink ring-1 ring-white/[0.08]">
            {pack.genre}
          </span>
          <span aria-hidden className="text-sr-dim">
            •
          </span>
          <span>{pack.sample_count} samples</span>
        </div>

        {description ? (
          <div className="mt-5 max-w-2xl">
            <p
              className={cn(
                "text-sm leading-relaxed text-sr-muted",
                !expanded && needsClamp && "line-clamp-3",
              )}
            >
              {description}
            </p>
            {needsClamp ? (
              <button
                type="button"
                className="mt-1 text-sm font-medium text-sr-gold hover:underline"
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? "Less" : "…more"}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-9 flex w-full flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <BuyPackButton packId={pack.id} priceCents={pack.price_cents} />
            <Button
              type="button"
              variant="ghost"
              disabled={!previewTarget?.preview_url}
              onClick={onPreview}
              className={cn(
                "ring-1 ring-white/[0.1]",
                previewActive && "border-sr-gold/50 text-sr-gold ring-sr-gold/30",
              )}
            >
              {previewActive ? "Pause preview" : "Preview"}
            </Button>
          </div>
          <button
            type="button"
            aria-label={hearted ? "Unlike pack" : "Like pack"}
            className={cn(
              "ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-lg transition-all",
              "bg-sr-card/80 ring-1 ring-white/[0.06]",
              hearted
                ? "text-sr-gold ring-sr-gold/40"
                : "text-sr-muted hover:bg-sr-panel hover:text-sr-ink",
            )}
            onClick={() => setHearted((h) => !h)}
          >
            {hearted ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </div>
  );
}
