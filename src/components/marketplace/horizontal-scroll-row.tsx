"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function HorizontalScrollRow({
  title,
  subtitle,
  children,
  className,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 480);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <section className={cn("py-8 md:py-10", className)}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl italic tracking-tight text-sr-ink md:text-[2rem]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-sr-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            aria-label="Scroll left"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#1a1918] text-sr-ink ring-1 ring-white/[0.06] transition-all hover:bg-[#252422] hover:text-sr-gold"
            onClick={() => scrollByDir(-1)}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#1a1918] text-sr-ink ring-1 ring-white/[0.06] transition-all hover:bg-[#252422] hover:text-sr-gold"
            onClick={() => scrollByDir(1)}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="-mx-1 flex gap-6 overflow-x-auto pb-3 pt-1 [scrollbar-color:rgba(85,85,82,0.45)_transparent]"
        style={{ scrollbarWidth: "thin" }}
      >
        {children}
      </div>
    </section>
  );
}
