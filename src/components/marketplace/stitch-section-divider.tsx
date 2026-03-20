import { cn } from "@/lib/utils";

/** Soft separator — Stitch “no hard line” rule: fade instead of 1px border. */
export function StitchSectionDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none my-10 h-px w-full bg-gradient-to-r from-transparent via-sr-dim/35 to-transparent md:my-14",
        className,
      )}
      aria-hidden
    />
  );
}
