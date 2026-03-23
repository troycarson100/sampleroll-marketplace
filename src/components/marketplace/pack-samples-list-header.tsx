"use client";

import { ArrowUpDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";

/** Decorative sort hint (global sort lives in the toolbar). */
function SortHint() {
  return (
    <ArrowUpDown
      className="ml-0.5 inline h-3 w-3 shrink-0 opacity-45"
      strokeWidth={2}
      aria-hidden
    />
  );
}

/**
 * Column titles aligned with `PackSamplesList` rows (Splice-style).
 * Widths must stay in sync with row cells + `SampleWaveformStrip`.
 */
export function PackSamplesListHeader({ className }: { className?: string }) {
  return (
    <div
      role="row"
      className={cn(
        "scrollbar-hide flex min-w-0 flex-nowrap items-end gap-2 overflow-x-auto border-b border-white/[0.08] px-2 pb-2.5 pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-sr-dim sm:gap-3 sm:px-3",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-end justify-center">
        <span className="text-center leading-tight">Pack</span>
      </div>
      <div className="h-6 w-6 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 basis-0 items-end overflow-hidden pb-0.5">
        <span className="truncate">
          Filename
          <SortHint />
        </span>
      </div>
      <div className="flex w-24 shrink-0 items-end justify-center sm:w-32 md:w-40 lg:w-44">
        <span className="truncate">Waveform</span>
      </div>
      <div className="flex w-[3.5rem] shrink-0 items-end justify-end">
        <span>
          Time
          <SortHint />
        </span>
      </div>
      <div className="hidden w-11 shrink-0 items-end justify-center sm:flex md:w-14">
        <span>
          Key
          <SortHint />
        </span>
      </div>
      <div className="hidden w-9 shrink-0 items-end justify-center md:flex">
        <span className="text-center">
          BPM
          <SortHint />
        </span>
      </div>
      <div
        className="flex w-8 shrink-0 items-end justify-center pb-0.5 text-sr-dim"
        title="Download"
      >
        <Download className="h-3.5 w-3.5 opacity-50" strokeWidth={2} aria-hidden />
        <span className="sr-only">Download</span>
      </div>
    </div>
  );
}
