import Link from "next/link";
import { Minus, Star, TrendingDown, TrendingUp } from "lucide-react";
import { PackCoverPlaceholder } from "@/components/marketplace/pack-cover-placeholder";
import { cn } from "@/lib/utils";
import type { PackWithCreator } from "@/lib/queries/marketplace";

type Props = {
  topPacks: PackWithCreator[];
  className?: string;
};

const SLOT_COUNT = 7;

function TrendIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2} />
    );
  }
  if (index === 1) {
    return (
      <Minus className="h-4 w-4 shrink-0 text-stitch-on-surface-variant/30" strokeWidth={2} />
    );
  }
  if (index === 2) {
    return (
      <TrendingDown className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />
    );
  }
  return (
    <div className="h-4 w-4 shrink-0 rounded-sm bg-stitch-on-surface-variant/15" aria-hidden />
  );
}

export function SoundsRightRail({ topPacks, className }: Props) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => topPacks[i] ?? null);

  return (
    <div
      className={cn(
        "flex flex-col font-stitch-sans text-stitch-on-background",
        className,
      )}
    >
      <section className="mb-10">
        <div className="mb-6 flex items-center justify-between gap-2">
          <h3 className="font-stitch-serif text-lg font-bold text-stitch-on-surface">
            Top packs
          </h3>
          <span className="rounded-full border border-stitch-outline-variant/25 bg-stitch-surface-container-high px-2.5 py-1 font-stitch-sans text-[9px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
            Weekly
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {slots.map((pack, i) =>
            pack ? (
              <Link
                key={pack.id + String(i)}
                href={`/sounds/packs/${pack.id}`}
                className={cn(
                  "group flex cursor-pointer items-center gap-3",
                  i >= 3 && "opacity-75",
                )}
              >
                <span
                  className={cn(
                    "w-8 shrink-0 text-right font-stitch-serif text-lg font-bold tabular-nums not-italic",
                    i < 3
                      ? "text-stitch-primary"
                      : "text-stitch-on-surface-variant/35",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stitch-surface-container ring-1 ring-stitch-outline-variant/15">
                  {pack.cover_art_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pack.cover_art_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-stitch-sans text-sm font-bold text-stitch-on-surface">
                    {pack.title}
                  </p>
                  <p className="truncate font-stitch-sans text-xs text-stitch-on-surface-variant">
                    {pack.genre}
                  </p>
                </div>
                <TrendIcon index={i} />
              </Link>
            ) : (
              <div
                key={`ghost-${i}`}
                className="flex items-center gap-3 opacity-40"
              >
                <span className="w-8 shrink-0 text-right font-stitch-serif text-lg font-bold tabular-nums text-stitch-on-surface-variant/25">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-stitch-outline-variant/10">
                  <PackCoverPlaceholder seed={`ghost-${i}`} />
                  <div className="absolute inset-0 bg-stitch-surface-container-low/40" />
                </div>
                <div className="h-3 flex-1 rounded bg-stitch-on-surface-variant/10" />
              </div>
            ),
          )}
        </div>
        <Link
          href="/sounds/top"
          className="mt-8 block w-full border border-stitch-outline-variant/35 py-2.5 text-center font-stitch-sans text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface transition-colors hover:border-stitch-primary/40 hover:text-stitch-primary"
        >
          View top 50
        </Link>
      </section>

      <section className="mb-10">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-stitch-serif text-lg font-bold text-stitch-on-surface">
            Top labels
          </h3>
        </div>
        <div className="flex flex-col gap-6">
          {[
            { name: "SampleRoll Originals", sub: "142 packs", bg: "bg-white" },
            { name: "Splice Sound", sub: "89 packs", bg: "bg-black" },
            { name: "Soul Surplus", sub: "56 packs", bg: "bg-[#ffc257]" },
          ].map((row) => (
            <div key={row.name} className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md p-1",
                  row.bg,
                  row.bg === "bg-black" && "border border-stitch-outline-variant/20",
                )}
              />
              <div>
                <p className="font-stitch-sans text-sm font-bold text-stitch-on-surface">
                  {row.name}
                </p>
                <p className="font-stitch-sans text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant">
                  {row.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-stitch-primary/30 bg-gradient-to-br from-stitch-primary/15 to-transparent p-5">
        <Star className="h-6 w-6 text-stitch-primary" strokeWidth={1.5} aria-hidden />
        <p className="mt-3 font-stitch-serif text-lg font-semibold text-stitch-on-surface">
          Go professional
        </p>
        <p className="mt-2 font-stitch-sans text-xs leading-relaxed text-stitch-on-surface-variant">
          Unlock the full curator experience, priority uploads, and exclusive
          label partnerships.
        </p>
        <button
          type="button"
          className="mt-5 w-full rounded-lg border border-stitch-primary/60 bg-transparent py-2.5 font-stitch-sans text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-primary transition-colors hover:bg-stitch-primary/10"
        >
          Go professional
        </button>
      </section>
    </div>
  );
}
