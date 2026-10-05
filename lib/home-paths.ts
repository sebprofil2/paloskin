import { isLang, type Lang } from "./i18n";

/*
 * Startseite mit eigener Adresse je Sprache (5. Oktober 2026): Deutsch auf „/“, sonst /en, /es, /fr, /pt, /uk, /ar.
 * Ohne Abhängigkeiten, damit Proxy, Server und Browser (Sprachwahl in der Kopfzeile) dieselben Regeln nutzen.
 */
export function homePath(lang: Lang): string {
  return lang === "de" ? "/" : `/${lang}`;
}

/** Sprache aus dem Pfad der Startseite; null für alle anderen Pfade */
export function homePathLang(pathname: string): Lang | null {
  if (pathname === "/") return "de";
  const m = /^\/([a-z]{2})$/.exec(pathname);
  return m && isLang(m[1]) && m[1] !== "de" ? m[1] : null;
}

/** Alte Adressen dauerhaft weiterleiten: /de auf /, /?lang=en auf /en; null, wenn nichts zu tun ist */
export function legacyHomeRedirect(pathname: string, langParam: string | null): string | null {
  if (pathname === "/de" || pathname === "/de/") return "/";
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
