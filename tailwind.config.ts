import type { Config } from "tailwindcss";

/** Google Stitch / Material — Sonic Atelier tokens (browse page). */
const stitchColors = {
  background: "#131312",
  surface: "#131312",
  "on-background": "#e5e2e0",
  primary: "#ffc257",
  "on-primary": "#432c00",
  "primary-container": "#e4a62e",
  "on-primary-container": "#5c3e00",
  "surface-container-low": "#1c1c1a",
  "surface-container": "#20201e",
  "surface-container-high": "#2a2a29",
  "surface-container-lowest": "#0e0e0d",
  "surface-container-highest": "#353533",
  "on-surface": "#e5e2e0",
  "on-surface-variant": "#d4c4af",
  "outline-variant": "#504535",
  secondary: "#e5c18a",
  "secondary-container": "#5b4317",
  "on-secondary-container": "#d2b07a",
  tertiary: "#a8d0ff",
} as const;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sr-bg": "#111110",
        "sr-panel": "#161615",
        "sr-card": "#1C1C1A",
        "sr-ink": "#EDEDEA",
        "sr-muted": "#9A9A94",
        "sr-dim": "#555552",
        "sr-gold": "#E4A62E",
        stitch: stitchColors,
      },
      borderColor: {
        sr: "#2C2C2A",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        "stitch-sans": ["var(--font-stitch-sans)", "Manrope", "system-ui", "sans-serif"],
        "stitch-serif": [
          "var(--font-stitch-serif)",
          "Noto Serif",
          "Georgia",
          "serif",
        ],
      },
      borderRadius: {
        stitch: "0.125rem",
        "stitch-lg": "0.25rem",
        "stitch-xl": "0.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
