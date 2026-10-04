import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.paloskin.de"),
  title: "PALO SKIN by Dr. Vogel",
  icons: {
    /* Nur ICO: 16 Pixel als eigene, größere Fassung (freigegeben 4. Oktober 2026); ein SVG-Favicon würde sie verdrängen */
    icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48" }],
    apple: { url: "/assets/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#002FA7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
