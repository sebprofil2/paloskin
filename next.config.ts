import type { NextConfig } from "next";

/*
 * paloskin.de: statische Website im Ordner public, Buchung unter /booking.
 * Weiterleitungen und saubere Adressen aus der früheren vercel.json sind hier übernommen.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
  // Mailversand läuft als normales Node-Modul, nicht gebündelt
  serverExternalPackages: ["nodemailer"],
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
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/booking/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/termin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/intern/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          /*
           * Content-Security-Policy: nur eigene Quellen. Inline-Skripte und -Stile sind nötig
           * (Zwischenlösung und Next.js-Laufzeit), externe Skripte, Schriften oder Einbettungen gibt es nicht.
           * HSTS setzt erst der Reverse-Proxy, sobald HTTPS dauerhaft läuft.
           */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
