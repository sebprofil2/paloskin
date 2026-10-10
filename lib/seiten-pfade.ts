import { isBehandlung, type BehandlungSlug } from "./behandlungen";
import { ARZTSEITE_SPRACHEN, freigegeben } from "./freigabe";
import { langSegment, segmentLang } from "./home-paths";
import type { Lang } from "./i18n";

/*
 * Adressen der Inhaltsseiten mit Sprache im Pfad, wie bei der Startseite: Deutsch ohne Kürzel, sonst /en/…, /es/… .
 * Ohne Abhängigkeiten zu Server oder Browser, damit Proxy und Seiten dieselben Regeln nutzen.
 */
export const ARZT_SLUG = "dr-sebastian-vogel";

export function arztPath(lang: Lang): string {
  return lang === "de" ? `/${ARZT_SLUG}` : `/${langSegment(lang)}/${ARZT_SLUG}`;
}

export function behandlungPath(slug: BehandlungSlug, lang: Lang): string {
  return lang === "de" ? `/behandlungen/${slug}` : `/${langSegment(lang)}/behandlungen/${slug}`;
}

/** Name der Behandlung aus dem Pfadrest /behandlungen/<name>; null für alles andere */
function behandlungAus(rest: string): BehandlungSlug | null {
  const m = /^\/behandlungen\/([a-z-]+)$/.exec(rest);
  return m && isBehandlung(m[1]) ? m[1] : null;
}

/** Zerlegt /dr-sebastian-vogel, /en/dr-sebastian-vogel, /behandlungen/<name>, /en/behandlungen/<name>; sonst null */
function parse(pathname: string): { lang: Lang; rest: string } | null {
  const m = /^(?:\/([a-z]{2}))?(\/.+?)\/?$/.exec(pathname);
  if (!m) return null;
  const rest = m[2];
  if (rest !== `/${ARZT_SLUG}` && !behandlungAus(rest)) return null;
  if (m[1] === undefined) return { lang: "de", rest };
  const lang = segmentLang(m[1]);
  return lang ? { lang, rest } : null;
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
  const slug = behandlungAus(p.rest);
  if (slug && p.lang !== "de" && !freigegeben(slug, p.lang)) return { to: behandlungPath(slug, "de"), status: 302 };
  return null;
}
