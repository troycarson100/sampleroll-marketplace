import { Suspense } from "react";
import { auth } from "@/auth";
import { CatalogUnavailableBanner } from "@/components/marketplace/catalog-unavailable-banner";
import { DevDatabaseNotice } from "@/components/marketplace/dev-database-notice";
import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/database-env";
import { fetchPackDetailPageData } from "@/lib/queries/marketplace";
import { PackHero } from "@/components/marketplace/pack-hero";
import { PackSamplesList } from "@/components/marketplace/pack-samples-list";
import { PurchaseToast } from "@/components/marketplace/purchase-toast";

export default async function PackDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    userId = null;
  }

  const result = await fetchPackDetailPageData(prisma, params.id, userId);

  if (!result.ok && result.kind === "unavailable") {
    const showDevHint =
      process.env.NODE_ENV !== "production" && !isDatabaseConfigured();
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        {showDevHint ? (
          <>
            <DevDatabaseNotice />
            <p className="mt-8 text-center text-sr-muted">
              Pack pages need a database connection. Set{" "}
              <code className="text-sr-ink">DATABASE_URL</code> in{" "}
              <code className="text-sr-ink">.env.local</code>.
            </p>
          </>
        ) : (
          <>
            <CatalogUnavailableBanner />
            <p className="mt-8 text-center text-sm text-sr-muted">
              Could not load this pack. Confirm{" "}
              <code className="text-sr-ink">DATABASE_URL</code>, network access
              to Postgres, and that migrations have been applied.
            </p>
          </>
        )}
      </main>
    );
  }

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sr-muted">Pack not found.</p>
      </main>
    );
  }

  const detail = result.data;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <Suspense fallback={null}>
        <PurchaseToast />
      </Suspense>
      <PackHero
        pack={detail.pack}
        creatorDisplayName={detail.creatorDisplayName}
        samples={detail.samples}
      />
      <PackSamplesList
        samples={detail.samples}
        ownsPack={detail.ownsPack}
        packCoverUrl={detail.pack.cover_art_url}
      />
    </main>
  );
}
