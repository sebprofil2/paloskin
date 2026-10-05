import localFont from "next/font/local";

/*
 * Schriften, selbst gehostet über next/font (keine Anfrage an Google oder andere Server).
 * Schibsted Grotesk 400 bis 700 für alles. Newsreader nur für den kursiven blauen zweiten Teil der Überschriften und,
 * aufrecht, für das Zitat von Dr. Vogel im Kasten „Ihr Arzt“ (Entscheidung Dr. Vogel, 5. Oktober 2026).
 * Ukrainisch und Arabisch deckt keine der beiden ab: Noto Sans (Kyrillisch) und Noto Sans Arabic, die der Browser nur lädt,
 * wenn solche Zeichen auf der Seite stehen (unicode-range). Lizenzen: app/fonts/OFL-*.txt.
 */
export const schibsted = localFont({
  src: "./fonts/SchibstedGrotesk-Variable.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-schibsted",
});

export const newsreader = localFont({
  src: [
    { path: "./fonts/Newsreader-Italic-Variable.woff2", weight: "400 500", style: "italic" },
    { path: "./fonts/Newsreader-Variable.woff2", weight: "400 500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-newsreader",
});

export const notoKyrillisch = localFont({
  src: "./fonts/NotoSans-Cyrillic-Variable.woff2",
  weight: "100 900",
  display: "swap",
  preload: false,
  variable: "--font-noto-kyr",
  declarations: [{ prop: "unicode-range", value: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116" }],
});

export const notoArabisch = localFont({
  src: "./fonts/NotoSansArabic-Variable.woff2",
  weight: "100 900",
  display: "swap",
  preload: false,
  variable: "--font-noto-ar",
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC" }],
});

export const fontVariables = [schibsted.variable, newsreader.variable, notoKyrillisch.variable, notoArabisch.variable].join(" ");
