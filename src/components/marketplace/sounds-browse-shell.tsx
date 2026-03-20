"use client";

import { useState, type ReactNode } from "react";
import { SoundsSidebarLeft } from "@/components/marketplace/sounds-sidebar-left";
import { cn } from "@/lib/utils";

type Props = {
  center: ReactNode;
  rightRail: ReactNode;
  className?: string;
};

export function SoundsBrowseShell({ center, rightRail, className }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      className={cn(
        "browse-stitch min-h-screen bg-[#0c0c0b] font-stitch-sans text-stitch-on-background selection:bg-stitch-primary/30",
        className,
      )}
    >
      {/* Desktop left — w-64, Stitch surface-container-low */}
      <nav
        className="fixed left-0 top-14 z-50 hidden h-[calc(100vh-3.5rem)] w-64 flex flex-col overflow-y-auto bg-stitch-surface-container-low py-6 shadow-2xl shadow-black/20 hide-scrollbar lg:flex"
        aria-label="Browse navigation"
      >
        <SoundsSidebarLeft />
      </nav>

      {/* Desktop right — 320px (Stitch export) */}
      <aside
        className="fixed right-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-[320px] overflow-y-auto border-l border-stitch-outline-variant/10 bg-stitch-surface-container-low p-6 hide-scrollbar lg:block"
        aria-label="Top packs"
      >
        {rightRail}
      </aside>

      {/* Mobile */}
      <div className="flex items-center justify-between gap-3 border-b border-stitch-outline-variant/10 bg-stitch-surface-container-low px-4 py-3 lg:hidden">
        <button
          type="button"
          className="rounded-full bg-stitch-surface-container-lowest px-4 py-2 text-sm text-stitch-on-surface ring-1 ring-stitch-outline-variant/20"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="sounds-mobile-drawer"
        >
          Menu
        </button>
        <span className="font-stitch-serif text-lg italic text-stitch-primary">
          Browse
        </span>
        <span className="w-16" aria-hidden />
      </div>

      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/60 lg:hidden"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <div
        id="sounds-mobile-drawer"
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-[min(100%,288px)] overflow-y-auto bg-stitch-surface-container-low py-6 shadow-2xl transition-transform duration-200 lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
      >
        <SoundsSidebarLeft />
        <button
          type="button"
          className="mx-6 mt-6 w-[calc(100%-3rem)] rounded-full bg-stitch-surface-container-high py-2.5 text-sm text-stitch-on-surface-variant"
          onClick={() => setDrawerOpen(false)}
        >
          Close
        </button>
      </div>

      {/* Main — ml-64 (256px) mr-[320px] on large screens */}
      <main className="min-h-[calc(100vh-3.5rem)] bg-[#121211] lg:ml-64 lg:mr-[320px]">
        {center}
      </main>
    </div>
  );
}
