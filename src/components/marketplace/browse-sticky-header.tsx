"use client";

import { Bell, Search, ShoppingCart } from "lucide-react";

/** Sonic Atelier: search-forward bar; Upload as dark outline (not solid gold). */
export function BrowseStickyHeader() {
  return (
    <header className="sticky top-14 z-30 flex h-16 w-full items-center gap-4 border-b border-stitch-outline-variant/10 bg-[#141413] px-4 sm:px-6 lg:px-8">
      <div className="min-w-0 flex-1 lg:max-w-2xl lg:flex-none lg:flex-1">
        <div className="group relative w-full rounded-lg border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest/90 px-4 py-2.5 transition-colors focus-within:border-stitch-primary/40">
          <label className="sr-only" htmlFor="browse-search">
            Search
          </label>
          <div className="flex items-center gap-3">
            <Search
              className="h-5 w-5 shrink-0 text-stitch-on-surface-variant"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              id="browse-search"
              type="search"
              placeholder="Search packs, samples, and presets"
              className="w-full border-0 bg-transparent font-stitch-sans text-sm text-stitch-on-surface placeholder:text-stitch-on-surface-variant/45 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-4 sm:flex">
          <button
            type="button"
            className="text-stitch-on-surface-variant transition-colors hover:text-stitch-primary"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="text-stitch-on-surface-variant transition-colors hover:text-stitch-primary"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          className="rounded-md border border-stitch-on-surface/90 bg-transparent px-4 py-2 font-stitch-sans text-xs font-bold uppercase tracking-[0.15em] text-stitch-on-surface transition-colors hover:bg-stitch-on-surface/10"
        >
          Upload
        </button>
        <div className="hidden h-9 w-9 shrink-0 overflow-hidden rounded-full border border-stitch-outline-variant/30 bg-stitch-surface-container-high sm:block" />
      </div>
    </header>
  );
}
