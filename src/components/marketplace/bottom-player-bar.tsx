"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useAudioPlayer } from "@/components/audio/audio-player-context";
import { cn } from "@/lib/utils";

export function BottomPlayerBar() {
  const {
    currentSample,
    isPlaying,
    currentTime,
    duration,
    volume,
    toggle,
    prev,
    next,
    canPrev,
    canNext,
    seek,
    setVolume,
  } = useAudioPlayer();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pad = currentSample ? "6.25rem" : "0px";
    document.documentElement.style.setProperty("--sr-player-pad", pad);
    return () => {
      document.documentElement.style.setProperty("--sr-player-pad", "0px");
    };
  }, [currentSample]);

  if (!currentSample) return null;

  const progress =
    duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-black/10 bg-white text-neutral-900 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
      role="region"
      aria-label="Audio player"
      title="Keyboard: ← / → seek ±10% · ↑ / ↓ prev/next track · Shift + ↑ / ↓ skip 5 tracks · Space play/pause"
    >
      {/* Progress line — scaleX + rAF-driven time = smooth motion */}
      <button
        type="button"
        className="relative h-1.5 w-full cursor-pointer overflow-hidden bg-neutral-200"
        aria-label="Seek"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const pct = rect.width > 0 ? x / rect.width : 0;
          seek(pct * (duration || 0));
        }}
      >
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-full origin-left bg-blue-500 will-change-transform"
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: "left center",
          }}
        />
      </button>

      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="rounded p-1.5 text-neutral-500 transition-colors enabled:hover:text-neutral-800 disabled:opacity-30"
            disabled={!canPrev}
            aria-label="Previous"
            onClick={() => prev()}
          >
            <SkipBack className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => toggle()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 pl-0.5" fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-neutral-500 transition-colors enabled:hover:text-neutral-800 disabled:opacity-30"
            disabled={!canNext}
            aria-label="Next"
            onClick={() => next()}
          >
            <SkipForward className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-100 ring-1 ring-black/5">
            {currentSample.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSample.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                ♪
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight text-neutral-900">
              {currentSample.label}
            </p>
            {currentSample.subtitle ? (
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {currentSample.subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-4 border-l border-neutral-200 pl-4 sm:flex">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Key
            </p>
            <p className="min-w-[2rem] text-sm font-medium tabular-nums text-neutral-800">
              {currentSample.key ?? "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              BPM
            </p>
            <p className="min-w-[2.5rem] text-sm font-medium tabular-nums text-neutral-800">
              {currentSample.bpm != null ? String(currentSample.bpm) : "—"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Volume2 className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={cn(
              "h-1 w-20 cursor-pointer accent-neutral-900 sm:w-28",
            )}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
