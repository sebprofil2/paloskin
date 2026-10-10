import { ARZTSEITE_SPRACHEN } from "./freigabe";
import { isLang, type Lang } from "./i18n";

/*
 * Adressen der Inhaltsseiten mit Sprache im Pfad, wie bei der Startseite: Deutsch ohne Kürzel, sonst /en/…, /es/… .
 * Ohne Abhängigkeiten zu Server oder Browser, damit Proxy und Seiten dieselben Regeln nutzen.
 */
export const ARZT_SLUG = "dr-sebastian-vogel";

export function arztPath(lang: Lang): string {
  return lang === "de" ? `/${ARZT_SLUG}` : `/${lang}/${ARZT_SLUG}`;
}

/** Zerlegt /dr-sebastian-vogel oder /en/dr-sebastian-vogel; null für alle anderen Pfade */
function parse(pathname: string): { lang: Lang; rest: string } | null {
  const m = /^(?:\/([a-z]{2}))?(\/.+?)\/?$/.exec(pathname);
  if (!m) return null;
  const rest = m[2];
  if (rest !== `/${ARZT_SLUG}`) return null;
  if (m[1] === undefined) return { lang: "de", rest };
  return isLang(m[1]) ? { lang: m[1], rest } : null;
}

/** Sprache aus dem Pfad einer Inhaltsseite; null für alle anderen Pfade */
export function pagePathLang(pathname: string): Lang | null {
  return parse(pathname)?.lang ?? null;
}

/**
 * Weiterleitung für Inhaltsseiten: /de/… dauerhaft auf die Adresse ohne Kürzel, nicht freigegebene Sprachen
 * vorübergehend auf Deutsch. null, wenn nichts zu tun ist.
 */
export function pageRedirect(pathname: string): { to: string; status: 301 | 302 } | null {
  const p = parse(pathname);
  if (!p) return null;
  if (/^\/de\//.test(pathname)) return { to: p.rest, status: 301 };
  if (p.rest === `/${ARZT_SLUG}` && !ARZTSEITE_SPRACHEN.includes(p.lang)) return { to: arztPath("de"), status: 302 };
  return null;
}
