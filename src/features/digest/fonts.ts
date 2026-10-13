import localFont from "next/font/local";

// Zeitungsschriften der Digest-Karten aus dem Design (OFL, über Fontsource), lokal eingebunden.
// preload: false, weil Next die Preload-Hinweise sonst mit dem Prefetch von /digest auf jeder Seite verteilt.
// Geladen werden die Dateien erst, wenn die Digest-Karten sie per @font-face anfordern.
export const paperSerif = localFont({
  src: "./fonts/source-serif-4-latin-wght-normal.woff2",
  weight: "200 900",
  variable: "--font-paper",
  display: "swap",
  preload: false,
});

export const paperDisplay = localFont({
  src: "./fonts/playfair-display-latin-wght-normal.woff2",
  weight: "400 900",
  variable: "--font-paper-display",
  display: "swap",
  preload: false,
});
