import type { MetadataRoute } from "next";

// Installierbare Web-App: iPhone/iPad „Zum Home-Bildschirm“, Mac „Zum Dock hinzufügen“.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Personal OS",
    short_name: "Personal OS",
    description: "Tasks, calendar, reading and your voice assistant.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#f5f5f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Quick Capture", url: "/?capture=1" },
      { name: "Talk to assistant", url: "/voice" },
    ],
  };
}
