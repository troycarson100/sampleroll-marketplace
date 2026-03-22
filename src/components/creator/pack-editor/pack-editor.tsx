"use client";

import { useCallback, useState } from "react";
import { PublishBar } from "./publish-bar";
import { PackDetailsForm } from "./pack-details-form";
import { SamplesSection } from "./samples-section";
import type { PackEditorPack, PackEditorSample } from "./types";

type Props = {
  initialPack: PackEditorPack;
  initialSamples: PackEditorSample[];
};

export function PackEditor({ initialPack, initialSamples }: Props) {
  const [pack, setPack] = useState(initialPack);
  const [samples, setSamples] = useState(initialSamples);

  const mergePack = useCallback((u: Partial<PackEditorPack>) => {
    setPack((p) => ({ ...p, ...u }));
  }, []);

  return (
    <div className="pb-16">
      <PublishBar pack={pack} onPackUpdate={mergePack} />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <h1 className="font-display text-3xl text-sr-ink">Edit pack</h1>
        <PackDetailsForm pack={pack} onPackUpdate={mergePack} />
        <SamplesSection
          packId={pack.id}
          samples={samples}
          onSamplesChange={setSamples}
          appendSamples={(more) =>
            setSamples((prev) => [...prev, ...more])
          }
          onIncrementSampleCount={(delta) =>
            setPack((p) => ({ ...p, sampleCount: p.sampleCount + delta }))
          }
        />
      </div>
    </div>
  );
}
