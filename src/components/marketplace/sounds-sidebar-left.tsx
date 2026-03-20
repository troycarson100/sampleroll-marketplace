"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  CalendarDays,
  Compass,
  Heart,
  Layers,
  Library,
  Music,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GOLD = "#E4A62E";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Compass;
  match: RegExp;
};

/** Sonic Atelier order: Sounds (library) → Browse (marketplace, active in ref) → Charts → Artists */
const PRIMARY_NAV: NavItem[] = [
  { href: "/library", label: "Sounds", Icon: Music, match: /^\/library/ },
  { href: "/sounds", label: "Browse", Icon: Compass, match: /^\/sounds/ },
  { href: "/charts", label: "Charts", Icon: BarChart2, match: /^\/charts/ },
  { href: "/artists", label: "Artists", Icon: User, match: /^\/artists/ },
];

const YOUR_SPACE_NAV: NavItem[] = [
  { href: "/library", label: "Library", Icon: Library, match: /^\/library$/ },
  { href: "/stacks", label: "Stacks", Icon: Layers, match: /^\/stacks/ },
];

type Props = {
  className?: string;
};

function NavRow({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: typeof Compass;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-3 border-l-4 py-3 pl-4 pr-4 font-stitch-sans text-sm font-medium tracking-wide transition-colors",
        active
          ? "bg-[#2a2a29] font-medium"
          : "border-transparent text-[#e5e2e0]/50 hover:bg-[#20201e] hover:text-[#e5e2e0]",
      )}
      style={active ? { borderLeftColor: GOLD, color: GOLD } : undefined}
    >
      <Icon
        className="h-5 w-5 shrink-0"
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden
      />
      {label}
    </Link>
  );
}

export function SoundsSidebarLeft({ className }: Props) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full min-h-0 w-full min-w-0 flex-col", className)}>
      <div className="mb-8 px-5">
        <p className="font-stitch-serif text-2xl font-semibold italic leading-tight tracking-tight text-[#E4A62E]">
          SampleRoll
        </p>
        <p className="mt-1.5 font-stitch-sans text-[10px] font-bold uppercase tracking-[0.28em] text-stitch-on-surface-variant/80">
          The Curator
        </p>
      </div>

      <nav className="flex w-full flex-1 flex-col overflow-y-auto" aria-label="Browse">
        {PRIMARY_NAV.map((item) => (
          <NavRow
            key={item.href + item.label}
            href={item.href}
            label={item.label}
            Icon={item.Icon}
            active={item.match.test(pathname ?? "")}
          />
        ))}

        <div className="my-5 h-px w-full bg-stitch-outline-variant/10" />
        <span className="px-5 py-2 font-stitch-sans text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
          Your space
        </span>
        {YOUR_SPACE_NAV.map((item) => (
          <NavRow
            key={item.href + item.label + "-lib"}
            href={item.href}
            label={item.label}
            Icon={item.Icon}
            active={item.match.test(pathname ?? "")}
          />
        ))}

        <div className="my-4 h-px w-full bg-stitch-outline-variant/10" />

        <NavRow
          href="/library"
          label="Likes"
          Icon={Heart}
          active={false}
        />
        <Link
          href="#"
          className="flex w-full items-center gap-3 border-l-4 border-transparent py-3 pl-4 pr-4 font-stitch-sans text-sm font-medium tracking-wide text-[#e5e2e0]/50 transition-colors hover:bg-[#20201e] hover:text-[#e5e2e0]"
        >
          <Sparkles className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          Collections
        </Link>
        <Link
          href="/sounds"
          className="flex w-full items-center gap-3 border-l-4 border-transparent py-3 pl-4 pr-4 font-stitch-sans text-sm font-medium tracking-wide text-[#e5e2e0]/50 transition-colors hover:bg-[#20201e] hover:text-[#e5e2e0]"
        >
          <CalendarDays className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          Daily picks
        </Link>
      </nav>

      <div className="mt-auto px-5 pt-8">
        <div className="rounded-xl border border-stitch-primary/35 bg-gradient-to-br from-stitch-primary/30 via-stitch-primary/10 to-transparent p-4 shadow-lg shadow-black/20">
          <p className="font-stitch-serif text-base font-semibold text-stitch-on-surface">
            Unlock full gallery
          </p>
          <p className="mt-1 font-stitch-sans text-xs leading-relaxed text-stitch-on-surface-variant">
            Professional tools and exclusive drops for serious producers.
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-stitch-surface-container-lowest py-2.5 font-stitch-sans text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-primary ring-1 ring-stitch-outline-variant/25 transition-colors hover:bg-stitch-surface-container-high"
          >
            Go Pro
          </button>
        </div>
      </div>
    </div>
  );
}
