import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Instrument Serif (OFL) aus dem Design-Artefakt, lokal eingebunden: keine Anfrage an Google beim Laden.
const serif = localFont({
  src: [
    { path: "./instrument-serif-regular.woff2", style: "normal", weight: "400" },
    { path: "./instrument-serif-italic.woff2", style: "italic", weight: "400" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Personal OS",
  description: "Tasks, calendar, investments and your voice assistant in one place.",
  applicationName: "Personal OS",
  appleWebApp: { capable: true, title: "Personal OS", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#101114" },
  ],
};

// Setzt das gewählte Theme vor dem ersten Paint (kein Aufblitzen). Werte: light | dark | system.
const themeScript = `try{var t=localStorage.getItem("pos-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
