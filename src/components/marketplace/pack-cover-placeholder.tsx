import { cn } from "@/lib/utils";

/** Deterministic index from id so each pack keeps the same "art". */
function seedIndex(seed: string, modulo: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}

/** Moody abstract gradients + soft shapes (Stitch-style pack placeholders). */
const PALETTES: { a: string; b: string; c: string; angle: number }[] = [
  { a: "#2a1f3d", b: "#6b3d7a", c: "#120c18", angle: 128 },
  { a: "#1a2838", b: "#2d5a6e", c: "#0a1016", angle: 145 },
  { a: "#2c2218", b: "#8b5a2b", c: "#140f0a", angle: 160 },
  { a: "#1e2c24", b: "#3d6b52", c: "#0c1210", angle: 135 },
  { a: "#252018", b: "#6b5c2d", c: "#100e08", angle: 120 },
  { a: "#1a2230", b: "#4a4d6e", c: "#0a0e14", angle: 155 },
  { a: "#301a22", b: "#7a3548", c: "#140a10", angle: 140 },
  { a: "#182428", b: "#2d4a52", c: "#080c10", angle: 125 },
];

type Props = {
  /** Pack id or any stable string — picks palette + layout. */
  seed: string;
  className?: string;
};

export function PackCoverPlaceholder({ seed, className }: Props) {
  const i = seedIndex(seed, PALETTES.length);
  const p = PALETTES[i];
  const blob1 = seedIndex(seed + "a", 60) + 20;
  const blob2 = seedIndex(seed + "b", 50) + 15;
  const rot = seedIndex(seed + "c", 40) - 20;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${p.angle}deg, ${p.a} 0%, ${p.b} 48%, ${p.c} 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full bg-white/[0.07] blur-2xl"
        style={{
          width: `${blob1}%`,
          height: `${blob1}%`,
          right: "-12%",
          top: "-18%",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full bg-black/25 blur-xl"
        style={{
          width: `${blob2}%`,
          height: `${blob2}%`,
          left: "-8%",
          bottom: "-12%",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background:
            "repeating-linear-gradient(-18deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.04]"
        style={{ transform: `rotate(${rot}deg) scale(1.4)` }}
      />
    </div>
  );
}
