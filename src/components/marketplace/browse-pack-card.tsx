import Link from "next/link";
import { CirclePlay } from "lucide-react";
import { PackCoverPlaceholder } from "@/components/marketplace/pack-cover-placeholder";
import type { PackWithCreator } from "@/lib/queries/marketplace";
import { cn } from "@/lib/utils";

type Props = {
  pack: PackWithCreator;
  showPlayOverlay?: boolean;
  layout?: "scroll" | "grid";
};

export function BrowsePackCard({
  pack,
  showPlayOverlay = true,
  layout = "scroll",
}: Props) {
  const sampleLabel =
    pack.sample_count === 1
      ? "1 sample"
      : `${pack.sample_count} samples`;

  return (
    <Link
      href={`/sounds/packs/${pack.id}`}
      className={cn(
        "group cursor-pointer transition-all duration-300",
        layout === "scroll" && "min-w-[200px] max-w-[220px] shrink-0",
        layout === "grid" && "min-w-0 max-w-none",
      )}
    >
      <div
        className={cn(
          "relative mb-3 aspect-square overflow-hidden rounded-xl border border-stitch-outline-variant/10 bg-stitch-surface-container shadow-md",
          !showPlayOverlay && "shadow-none",
        )}
      >
        {pack.cover_art_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pack.cover_art_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PackCoverPlaceholder seed={pack.id} className="h-full w-full" />
        )}
        {showPlayOverlay ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <CirclePlay
              className="h-14 w-14 text-white"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        ) : null}
      </div>
      <h4 className="font-stitch-serif text-base font-bold leading-snug text-stitch-on-surface transition-colors group-hover:text-stitch-primary">
        {pack.title}
      </h4>
      <p className="mt-1 font-stitch-sans text-xs font-medium text-stitch-on-surface-variant">
        {pack.genre}
      </p>
      <p className="mt-0.5 font-stitch-sans text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/70">
        {sampleLabel}
      </p>
    </Link>
  );
}
