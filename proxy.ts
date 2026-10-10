import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, LANG_HEADER, pickLang } from "./lib/i18n";
import { isTestInstance } from "./lib/instance";
import { homePathLang, legacyHomeRedirect } from "./lib/home-paths";
import { pagePathLang, pageRedirect } from "./lib/seiten-pfade";

/*
 * Seitensprache für jede Seitenanfrage bestimmen und als Kopfzeile an Layout und Seiten weitergeben. So setzt schon der
 * Server lang-Attribut, Titel und Texte.
 * Startseite (5. Oktober 2026): Die Adresse bestimmt die Sprache. „/“ ist immer Deutsch, unabhängig von Gerätesprache und
 * gespeicherter Wahl; /en, /es, /fr, /pt, /uk, /ar sind die anderen Fassungen. /de und /?lang=xx leiten dauerhaft (301) weiter.
 * Inhaltsseiten (10. Oktober 2026, lib/seiten-pfade.ts): Sprache aus dem Pfad wie bei der Startseite (/dr-sebastian-vogel,
 * /en/dr-sebastian-vogel); /de/… dauerhaft ohne Kürzel, nicht freigegebene Sprachen vorübergehend (302) auf Deutsch.
 * Übrige Seiten wie bisher: ?lang=, gespeicherte Wahl im Cookie, Sprache des Geräts, sonst Deutsch.
 * Testinstanz (neu.paloskin.de): jede Seite noindex über X-Robots-Tag. Terminseiten (/termin/…) überall zusätzlich zum
 * Meta-Tag noindex, nofollow im X-Robots-Tag (10. Oktober 2026); sie bleiben in robots.txt lesbar.
 */
export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const ziel = legacyHomeRedirect(pathname, searchParams.get("lang"));
  if (ziel) {
    const url = req.nextUrl.clone();
    url.pathname = ziel;
    url.searchParams.delete("lang");
    return withRobots(NextResponse.redirect(url, 301), pathname);
  }
  const seite = pageRedirect(pathname);
  if (seite) {
    const url = req.nextUrl.clone();
    url.pathname = seite.to;
    return withRobots(NextResponse.redirect(url, seite.status), pathname);
  }
  const lang =
    homePathLang(pathname) ??
    pagePathLang(pathname) ??
    pickLang({
      param: searchParams.get("lang"),
      cookie: req.cookies.get(LANG_COOKIE)?.value,
      acceptLanguage: req.headers.get("accept-language"),
    });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LANG_HEADER, lang);
  // Seiten mit Sprache sind dynamisch und werden nicht zwischengespeichert (Cache-Control private bzw. no-store)
  return withRobots(NextResponse.next({ request: { headers: requestHeaders } }), pathname);
}

function withRobots(res: NextResponse, pathname: string): NextResponse {
  if (isTestInstance() || pathname.startsWith("/termin/")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  // Nur Seiten: keine Schnittstellen, keine Dateien mit Endung, keine Next.js-Bausteine
  matcher: ["/((?!api/|intern/|_next/|assets/|.*\\.[a-z0-9]+$).*)"],
};
