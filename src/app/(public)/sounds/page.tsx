import { fetchBrowsePageData } from "@/lib/queries/marketplace";
import { prisma } from "@/lib/db";
import { BrowseCategoryTabs } from "@/components/marketplace/browse-category-tabs";
import { BrowseHeroCarousel } from "@/components/marketplace/browse-hero-carousel";
import { BrowsePackCard } from "@/components/marketplace/browse-pack-card";
import { BrowsePackGridSection } from "@/components/marketplace/browse-pack-grid-section";
import { BrowseStickyHeader } from "@/components/marketplace/browse-sticky-header";
import { GenreRow } from "@/components/marketplace/genre-row";
import { CatalogUnavailableBanner } from "@/components/marketplace/catalog-unavailable-banner";
import { DevDatabaseNotice } from "@/components/marketplace/dev-database-notice";
import { SoundsBrowseShell } from "@/components/marketplace/sounds-browse-shell";
import { SoundsRightRail } from "@/components/marketplace/sounds-right-rail";
import Link from "next/link";

export default async function SoundsPage({
  searchParams,
}: {
  searchParams: { genre?: string };
}) {
  const data = await fetchBrowsePageData(prisma, {
    genre: searchParams.genre ?? null,
  });

  const heroPacks = data.recommendedForYou.slice(0, 3);
  const recommendedRow = data.recommendedForYou.slice(0, 10);
  const newRow = data.newThisWeek.slice(0, 10);

  const center = (
    <>
      <DevDatabaseNotice />
      {data.catalogUnavailable ? <CatalogUnavailableBanner /> : null}
      <BrowseStickyHeader />

      <div className="px-3 pb-16 pt-3 sm:px-5 sm:pt-4 lg:px-8 lg:pb-20 lg:pt-5">
        <BrowseHeroCarousel packs={heroPacks} />

        <div className="mb-12">
          <BrowseCategoryTabs />
        </div>

        {data.genreFilter ? (
          <div className="mb-10 rounded-full bg-stitch-surface-container-lowest px-5 py-3 font-stitch-sans text-sm text-stitch-on-surface-variant ring-1 ring-stitch-outline-variant/15">
            Filtering by{" "}
            <span className="font-semibold text-stitch-on-surface">
              {data.genreFilter}
            </span>
            <span className="mx-2 text-stitch-on-surface-variant/50">·</span>
            <Link
              href="/sounds"
              className="font-bold text-stitch-primary hover:underline"
            >
              Clear
            </Link>
          </div>
        ) : null}

        <BrowsePackGridSection
          className="mb-16"
          title="Recommended for you"
          subtitle="Based on your recent aesthetic exploration"
          packs={recommendedRow}
          variant="scroll"
          showPlayOverlay
        />

        <GenreRow className="mb-16" />

        <BrowsePackGridSection
          className="mb-16"
          title="What's new this week"
          subtitle={
            data.hasNewInLastWeek
              ? "Brand-new loops and one-shots from newly released packs."
              : "Showing the newest packs — nothing dated in the last 7 days."
          }
          packs={newRow}
          variant="scroll"
          showPlayOverlay={false}
        />

        {data.genreFiltered ? (
          <section className="mt-16 border-t border-stitch-outline-variant/10 pt-12">
            <h3 className="mb-8 font-stitch-serif text-2xl italic text-stitch-on-surface sm:text-3xl">
              Results
            </h3>
            {data.genreFiltered.length === 0 ? (
              <p className="font-stitch-sans text-sm text-stitch-on-surface-variant/60">
                No packs in this genre yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
                {data.genreFiltered.map((p) => (
                  <BrowsePackCard
                    key={p.id}
                    pack={p}
                    layout="grid"
                    showPlayOverlay
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </>
  );

  return (
    <SoundsBrowseShell
      center={center}
      rightRail={<SoundsRightRail topPacks={data.topPacks} />}
    />
  );
}
