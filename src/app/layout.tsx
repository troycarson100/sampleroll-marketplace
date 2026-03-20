import type { Metadata } from "next";
import { DM_Sans, Manrope, Noto_Serif, Playfair_Display } from "next/font/google";
import { AudioPlayerProvider } from "@/components/audio/audio-player-context";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { SiteTopNav } from "@/components/site-top-nav";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const stitchSans = Manrope({
  subsets: ["latin"],
  variable: "--font-stitch-sans",
  display: "swap",
});

const stitchSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-stitch-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SampleRoll",
  description: "Sample pack marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} ${stitchSans.variable} ${stitchSerif.variable}`}
    >
      <body className="min-h-screen bg-sr-bg font-sans text-sr-ink">
        <SupabaseProvider>
          <AudioPlayerProvider>
            <SiteTopNav />
            {children}
          </AudioPlayerProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
