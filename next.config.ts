import type { NextConfig } from "next";

// Sicherheits-Header für alle Antworten. Mikrofon nur für die eigene Seite (Voice-Orb).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Slice 1 (21.10.2026): Digest und Discover sind in „Read“ aufgegangen, Investments entfällt.
  // Temporär (307), damit alte Lesezeichen und Kurzbefehle weiter funktionieren und der Schritt umkehrbar bleibt.
  async redirects() {
    return [
      { source: "/digest", destination: "/read", permanent: false },
      { source: "/discover", destination: "/read", permanent: false },
      { source: "/investments", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
