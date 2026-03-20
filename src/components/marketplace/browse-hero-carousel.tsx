import Link from "next/link";
import { PackCoverPlaceholder } from "@/components/marketplace/pack-cover-placeholder";
import type { PackWithCreator } from "@/lib/queries/marketplace";

type Props = {
  packs: PackWithCreator[];
};

function HeroSlide({ pack }: { pack: PackWithCreator }) {
  const subtitle = `Discover curated ${pack.genre.toLowerCase()} sounds — ${pack.sample_count} ${pack.sample_count === 1 ? "sample" : "samples"}.`;

  return (
    <Link
      href={`/sounds/packs/${pack.id}`}
      className="relative h-[320px] min-w-[min(100%,calc(100%-3.5rem))] shrink-0 snap-start overflow-hidden rounded-2xl shadow-2xl sm:h-[340px] sm:min-w-[82%] md:min-w-[78%]"
    >
      {pack.cover_art_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pack.cover_art_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <PackCoverPlaceholder seed={pack.id} className="absolute inset-0" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
      <div className="absolute bottom-8 left-8 right-8 max-w-xl sm:bottom-10 sm:left-10">
        <span className="inline-block border border-stitch-primary/40 bg-black/35 px-3 py-1 font-stitch-sans text-[10px] font-bold uppercase tracking-[0.22em] text-stitch-primary backdrop-blur-sm">
          Curated editorial
        </span>
        <h2 className="mt-4 font-stitch-serif text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
          {pack.title}
        </h2>
        <p className="mt-2 max-w-md font-stitch-sans text-sm leading-relaxed text-white/75">
          {subtitle}
        </p>
        <span className="mt-6 inline-block border border-white/20 bg-white px-6 py-2.5 font-stitch-sans text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-stitch-primary hover:text-stitch-on-primary">
          Get the pack
        </span>
      </div>
    </Link>
  );
}

/**
 * Sonic Atelier: horizontal hero with peek of the next slide; editorial pill.
 */
export function BrowseHeroCarousel({ packs }: Props) {
  const primary = packs[0];
  const secondary = packs[1];

  if (!primary) {
    return (
      <section className="relative mb-10">
        <div className="relative h-[320px] w-full overflow-hidden rounded-2xl sm:h-[340px]">
          <PackCoverPlaceholder seed="hero-empty" className="absolute inset-0" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative mb-10">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 hide-scrollbar">
        <HeroSlide pack={primary} />
        {secondary ? (
          <HeroSlide pack={secondary} />
        ) : (
          <div
            className="relative h-[320px] w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-stitch-outline-variant/20 sm:h-[340px] sm:w-48"
            aria-hidden
          >
            <PackCoverPlaceholder seed="hero-peek" className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-6 left-3 right-3 font-stitch-sans text-[10px] font-bold uppercase leading-tight tracking-wider text-stitch-on-surface-variant">
              More curated packs
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
