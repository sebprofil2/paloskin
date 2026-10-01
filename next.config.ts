import type { NextConfig } from "next";

/*
 * paloskin.de: statische Website im Ordner public, Buchung unter /booking.
 * Weiterleitungen und saubere Adressen aus der früheren vercel.json sind hier übernommen.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
  trailingSlash: false,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/booking": ["./content/**"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/impressum", destination: "/impressum/index.html" },
        { source: "/datenschutz", destination: "/datenschutz/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/termine", destination: "/booking", permanent: true },
      { source: "/buchung", destination: "/booking", permanent: true },
      { source: "/termin", destination: "/booking", permanent: true },
      { source: "/book", destination: "/booking", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/impressum/index.html", destination: "/impressum", permanent: true },
      { source: "/datenschutz/index.html", destination: "/datenschutz", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/assets/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
