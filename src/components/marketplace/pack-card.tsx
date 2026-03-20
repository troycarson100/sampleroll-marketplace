import Link from "next/link";
import { PackCoverPlaceholder } from "@/components/marketplace/pack-cover-placeholder";
import { cn } from "@/lib/utils";
import type { PackWithCreator } from "@/lib/queries/marketplace";

type Props = {
  pack: PackWithCreator;
  className?: string;
  variant?: "default" | "row";
};

function CoverArt({ pack }: { pack: PackWithCreator }) {
  if (pack.cover_art_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={pack.cover_art_url}
        alt=""
        className="h-full w-full object-cover"
      />
    );
  }
  return <PackCoverPlaceholder seed={pack.id} className="h-full w-full" />;
}

export function PackCard({ pack, className, variant = "default" }: Props) {
  const count = pack.sample_count ?? 0;
  const metaLine = `${pack.genre.toUpperCase()} • ${count} ${count === 1 ? "SAMPLE" : "SAMPLES"}`;

  return (
    <Link
      href={`/sounds/packs/${pack.id}`}
      className={cn(
        "group block min-w-[210px] max-w-[260px] shrink-0",
        variant === "row" && "max-w-[240px]",
        "transition-transform duration-300 hover:-translate-y-1",
        className,
      )}
    >
      <div className="aspect-square w-full overflow-hidden rounded-md bg-[#1a1918] shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
        <CoverArt pack={pack} />
      </div>
      <p className="mt-4 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-sr-ink group-hover:text-sr-gold">
        {pack.title}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sr-muted">
        {metaLine}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-sr-dim">
        {pack.creator_display_name}
      </p>
    </Link>
  );
}
