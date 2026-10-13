import localFont from "next/font/local";

// Zeitungsschriften der Digest-Karten aus dem Design (OFL, über Fontsource), lokal eingebunden.
// Nur in diesem Modul deklariert, damit sie ausschließlich auf der Digest-Seite geladen werden.
export const paperSerif = localFont({
  src: "./fonts/source-serif-4-latin-wght-normal.woff2",
  weight: "200 900",
  variable: "--font-paper",
  display: "swap",
});

export const paperDisplay = localFont({
  src: [
    { path: "./fonts/playfair-display-latin-wght-normal.woff2", style: "normal", weight: "400 900" },
    { path: "./fonts/playfair-display-latin-wght-italic.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--font-paper-display",
  display: "swap",
});
