/** Stitch browse screen — emoji + label + tinted tile (from exported HTML). */
export const BROWSE_GENRE_CARDS = [
  { genre: "Lo-Fi", emoji: "☕", tone: "purple" as const },
  { genre: "Trap", emoji: "👺", tone: "red" as const },
  { genre: "Neo Soul", emoji: "🌱", tone: "emerald" as const },
  { genre: "Jazz", emoji: "🎷", tone: "blue" as const },
  { genre: "Afrobeat", emoji: "🥁", tone: "orange" as const },
  { genre: "Funk", emoji: "🎸", tone: "yellow" as const },
  { genre: "Ambient", emoji: "☁️", tone: "cyan" as const },
  { genre: "Breaks", emoji: "💿", tone: "violet" as const },
] as const;

export type GenreTone = (typeof BROWSE_GENRE_CARDS)[number]["tone"];

export const GENRE_TONE_CLASSES: Record<
  GenreTone,
  string
> = {
  purple:
    "bg-purple-900/20 hover:bg-purple-900/40 border-purple-500/10",
  red: "bg-red-900/20 hover:bg-red-900/40 border-red-500/10",
  emerald:
    "bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-500/10",
  blue: "bg-blue-900/20 hover:bg-blue-900/40 border-blue-500/10",
  orange:
    "bg-orange-900/20 hover:bg-orange-900/40 border-orange-500/10",
  yellow:
    "bg-yellow-900/20 hover:bg-yellow-900/40 border-yellow-500/10",
  cyan: "bg-cyan-900/20 hover:bg-cyan-900/40 border-cyan-500/10",
  violet:
    "bg-violet-900/20 hover:bg-violet-900/40 border-violet-500/10",
};
