import Link from "next/link";
import { NavAuth } from "@/components/auth/nav-auth";

const links = [
  { href: "/sounds", label: "Sounds" },
  { href: "/dig", label: "Dig" },
  { href: "/crate", label: "Crate" },
] as const;

export function SiteTopNav() {
  return (
    <header className="border-b border-sr bg-sr-panel">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg tracking-tight text-sr-ink"
        >
          <span aria-hidden>🎲</span>
          <span>SampleRoll</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sr-muted transition-colors hover:text-sr-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
        <NavAuth />
      </div>
    </header>
  );
}
