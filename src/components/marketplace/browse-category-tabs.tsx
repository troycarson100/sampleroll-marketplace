"use client";

import { cn } from "@/lib/utils";

/** Sonic Atelier strip — uppercase, gold active underline. */
const TABS = [
  "Overview",
  "Instruments",
  "Drums",
  "Vocals",
  "Cinematic",
  "Presets",
] as const;

export function BrowseCategoryTabs() {
  return (
    <nav
      className="mb-10 flex items-center gap-6 overflow-x-auto hide-scrollbar border-b border-stitch-outline-variant/15 lg:gap-10"
      aria-label="Browse categories"
    >
      {TABS.map((tab, i) => (
        <button
          key={tab}
          type="button"
          className={cn(
            "whitespace-nowrap pb-4 font-stitch-sans text-xs font-bold uppercase tracking-[0.18em] transition-colors",
            i === 0
              ? "border-b-2 border-stitch-primary text-stitch-primary"
              : "border-b-2 border-transparent text-stitch-on-surface-variant hover:text-stitch-on-surface",
          )}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}
