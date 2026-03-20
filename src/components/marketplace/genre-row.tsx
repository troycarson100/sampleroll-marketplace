import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  BROWSE_GENRE_CARDS,
  GENRE_TONE_CLASSES,
} from "@/lib/browse-genres";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Sonic Atelier: horizontal row tiles with chevron, lifted charcoal panels. */
export function GenreRow({ className }: Props) {
  return (
    <section className={cn("mb-14", className)}>
      <div className="mb-6 flex items-center gap-3">
        <h3 className="font-stitch-serif text-2xl font-bold text-stitch-on-surface sm:text-3xl">
          Browse by genre
        </h3>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3 hide-scrollbar sm:flex-wrap sm:overflow-visible">
        {BROWSE_GENRE_CARDS.map((g) => (
          <Link
            key={g.genre}
            href={`/sounds?genre=${encodeURIComponent(g.genre)}`}
            className={cn(
              "flex min-w-[140px] shrink-0 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-all hover:brightness-110 sm:min-w-0 sm:flex-1 sm:basis-[calc(25%-0.75rem)]",
              GENRE_TONE_CLASSES[g.tone],
            )}
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="text-2xl leading-none" aria-hidden>
                {g.emoji}
              </span>
              <span className="truncate font-stitch-sans text-xs font-bold text-stitch-on-surface">
                {g.genre}
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-stitch-on-surface-variant/60"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
