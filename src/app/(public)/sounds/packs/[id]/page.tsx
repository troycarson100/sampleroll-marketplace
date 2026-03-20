import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchPackDetailPageData } from "@/lib/queries/marketplace";
import { PackHero } from "@/components/marketplace/pack-hero";
import { PackSamplesList } from "@/components/marketplace/pack-samples-list";
import { PurchaseToast } from "@/components/marketplace/purchase-toast";

export default async function PackDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const detail = await fetchPackDetailPageData(
    supabase,
    params.id,
    user?.id ?? null,
  );

  if (!detail) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sr-muted">Pack not found.</p>
      </main>
    );
  }

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
