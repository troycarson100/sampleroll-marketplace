import Link from "next/link";
import type { PackWithCreator } from "@/lib/queries/marketplace";
import { BrowsePackCard } from "@/components/marketplace/browse-pack-card";

type Props = {
  title: string;
  subtitle: string;
  packs: PackWithCreator[];
  viewAllHref?: string;
  variant?: "scroll" | "grid";
  showPlayOverlay?: boolean;
  className?: string;
};

export function BrowsePackGridSection({
  title,
  subtitle,
  packs,
  viewAllHref = "/sounds",
  variant = "scroll",
  showPlayOverlay = true,
  className,
}: Props) {
  return (
    <section className={className}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-stitch-serif text-2xl font-bold text-stitch-on-surface sm:text-3xl">
            {title}
          </h3>
          <p className="mt-1.5 max-w-xl font-stitch-sans text-sm text-stitch-on-surface-variant">
            {subtitle}
          </p>
        </div>
        {packs.length > 0 ? (
          <Link
            href={viewAllHref}
            className="font-stitch-sans text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-primary hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
      {packs.length === 0 ? (
        <p className="font-stitch-sans text-sm text-stitch-on-surface-variant/60">
          No packs to show yet.
        </p>
      ) : variant === "scroll" ? (
        <div className="-mx-2 flex gap-5 overflow-x-auto px-2 pb-4 hide-scrollbar">
          {packs.map((p) => (
            <BrowsePackCard
              key={p.id}
              pack={p}
              showPlayOverlay={showPlayOverlay}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
          {packs.map((p) => (
            <BrowsePackCard
              key={p.id}
              pack={p}
              layout="grid"
              showPlayOverlay={showPlayOverlay}
            />
          ))}
        </div>
      )}
    </section>
  );
}
