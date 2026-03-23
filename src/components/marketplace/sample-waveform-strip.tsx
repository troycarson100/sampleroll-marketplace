"use client";

import { useMemo, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 52;

/** Deterministic pseudo-random height 0–1 from sample id + bar index (Splice-style bars). */
function barLevel(sampleId: string, i: number): number {
  let x = 0;
  for (let c = 0; c < sampleId.length; c++) {
    x = (x + sampleId.charCodeAt(c) * (c + 31)) % 9973;
  }
  x = (x + i * 2654435761) >>> 0;
  const wave = Math.sin(i * 0.42 + x * 0.001) * 0.35 + 0.5;
  const jitter = (x % 37) / 200;
  return Math.max(0.12, Math.min(1, wave * 0.65 + jitter));
}

type Props = {
  sampleId: string;
  /** 0–1 playback progress for this row; omit when not the active row. */
  progress?: number;
  /** Click to seek to a position in the clip (0–1). Omit when not interactive. */
  onSeek?: (percent: number) => void;
  className?: string;
};

/**
 * Compact bar waveform (decorative) + optional progress highlight — similar to Splice list rows.
 */
export function SampleWaveformStrip({
  sampleId,
  progress,
  onSeek,
  className,
}: Props) {
  const heights = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => barLevel(sampleId, i));
  }, [sampleId]);

  const interactive = typeof onSeek === "function";

  const p =
    typeof progress === "number" &&
    Number.isFinite(progress) &&
    progress >= 0
      ? Math.min(1, progress)
      : undefined;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!onSeek) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = rect.width > 0 ? x / rect.width : 0;
    onSeek(Math.max(0, Math.min(1, pct)));
  };

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={handleClick}
      className={cn(
        "flex h-7 w-24 shrink-0 items-center gap-[1.5px] overflow-hidden rounded-md bg-black/20 px-1.5 py-1 ring-1 ring-white/[0.06] sm:w-32 md:w-40 lg:w-44",
        interactive &&
          "cursor-pointer transition-[box-shadow,background-color] hover:bg-black/30 hover:ring-sr-gold/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-sr-gold/40",
        !interactive && "cursor-default",
        className,
      )}
      aria-label={interactive ? "Seek in preview" : undefined}
    >
      {heights.map((h, i) => {
        const played =
          p != null && (i + 0.5) / BAR_COUNT <= p + 0.001;
        return (
          <div
            key={i}
            className={cn(
              "pointer-events-none w-[2px] shrink-0 rounded-[1px] transition-colors duration-150",
              played ? "bg-sr-gold/80" : "bg-sr-muted/55",
            )}
            style={{ height: `${h * 100}%` }}
          />
        );
      })}
    </button>
  );
}
