import localFont from "next/font/local";

/*
 * Schriften, selbst gehostet über next/font (keine Anfrage an Google oder andere Server).
 * Schibsted Grotesk 400 bis 700 für alles. Newsreader nur für den kursiven blauen zweiten Teil der Überschriften und,
 * aufrecht, für das Zitat von Dr. Vogel im Kasten „Ihr Arzt“ (Entscheidung Dr. Vogel, 5. Oktober 2026).
 * Ukrainisch und Arabisch deckt keine der beiden ab: Noto Sans (Kyrillisch) und Noto Sans Arabic, die der Browser nur lädt,
 * wenn solche Zeichen auf der Seite stehen (unicode-range). Lizenzen: app/fonts/OFL-*.txt.
 * Newsreader erweitert lateinisch (9. Oktober 2026, für Türkisch: ğ, ş, İ und weitere): dieselbe Fassung 5.3.0 aus
 * @fontsource-variable/newsreader, selbst gehostet, nur geladen, wenn solche Zeichen vorkommen (unicode-range).
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

export const newsreaderExt = localFont({
  src: [
    { path: "./fonts/Newsreader-Italic-LatinExt-Variable.woff2", weight: "400 500", style: "italic" },
    { path: "./fonts/Newsreader-LatinExt-Variable.woff2", weight: "400 500", style: "normal" },
  ],
  display: "swap",
  preload: false,
  // Ohne eigene Ersatzschrift: Sie würde sonst alle übrigen Zeichen abfangen, bevor Newsreader an der Reihe ist
  adjustFontFallback: false,
  variable: "--font-newsreader-ext",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
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

export const fontVariables = [schibsted.variable, newsreader.variable, newsreaderExt.variable, notoKyrillisch.variable, notoArabisch.variable].join(" ");
