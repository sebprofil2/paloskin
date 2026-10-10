import { isLang, type Lang } from "./i18n";

/*
 * Startseite mit eigener Adresse je Sprache (5. Oktober 2026): Deutsch auf „/“, sonst /en, /es, /fr, /pt, /it, /tr, /ua, /ar.
 * Ohne Abhängigkeiten, damit Proxy, Server und Browser (Sprachwahl in der Kopfzeile) dieselben Regeln nutzen.
 */

/*
 * Sprachkürzel in Adressen (10. Oktober 2026, Entscheidung Dr. Vogel): wie der Sprachcode, nur Ukrainisch „ua“ statt „uk“.
 * Intern und für Suchmaschinen bleibt der Code „uk“ (hreflang, lang im HTML, ?lang=uk, Datenbank, Kundensystem).
 * Alte Adressen mit /uk leitet legacyHomeRedirect dauerhaft auf /ua weiter.
 */
export function langSegment(lang: Lang): string {
  return lang === "uk" ? "ua" : lang;
}

/** Sprache aus dem Kürzel einer Adresse; „uk“ ist keine Adresse mehr (Weiterleitung), null für Unbekanntes */
export function segmentLang(seg: string): Lang | null {
  if (seg === "ua") return "uk";
  if (seg === "uk") return null;
  return isLang(seg) ? seg : null;
}

export function homePath(lang: Lang): string {
  return lang === "de" ? "/" : `/${langSegment(lang)}`;
}

/** Sprache aus dem Pfad der Startseite; null für alle anderen Pfade */
export function homePathLang(pathname: string): Lang | null {
  if (pathname === "/") return "de";
  const m = /^\/([a-z]{2})$/.exec(pathname);
  const lang = m ? segmentLang(m[1]) : null;
  return lang && lang !== "de" ? lang : null;
}

/**
 * Alte Adressen dauerhaft weiterleiten: /de auf /, /?lang=en auf /en, /uk und /uk/… auf /ua und /ua/… (alle Seiten mit
 * Sprachpfad); null, wenn nichts zu tun ist
 */
export function legacyHomeRedirect(pathname: string, langParam: string | null): string | null {
  if (pathname === "/de" || pathname === "/de/") return "/";
  if (/^\/uk(\/|$)/.test(pathname)) return pathname.replace(/^\/uk\/?$/, "/ua").replace(/^\/uk\//, "/ua/");
  if (pathname === "/" && langParam !== null) return isLang(langParam) ? homePath(langParam) : "/";
  return null;
}

/** Hinweis auf der deutschen Startseite: erste Sprache des Browsers, die wir anbieten; Deutsch oder keine heißt kein Hinweis */
export function hinweisSprache(languages: readonly string[]): Exclude<Lang, "de"> | null {
  for (const tag of languages) {
    const code = tag.slice(0, 2).toLowerCase();
    if (isLang(code)) return code === "de" ? null : code;
  }
  return null;
}
