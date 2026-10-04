import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, LANG_HEADER, pickLang } from "./lib/i18n";

/*
 * Seitensprache für jede Seitenanfrage bestimmen (?lang=, gespeicherte Wahl im Cookie, Sprache des Geräts, sonst Deutsch)
 * und als Kopfzeile an Layout und Seiten weitergeben. So setzt schon der Server lang-Attribut, Titel und Texte.
 */
export function proxy(req: NextRequest) {
  const lang = pickLang({
    param: req.nextUrl.searchParams.get("lang"),
    cookie: req.cookies.get(LANG_COOKIE)?.value,
    acceptLanguage: req.headers.get("accept-language"),
  });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LANG_HEADER, lang);
  // Seiten mit Sprache sind dynamisch und werden nicht zwischengespeichert (Cache-Control private bzw. no-store)
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Nur Seiten: keine Schnittstellen, keine Dateien mit Endung, keine Next.js-Bausteine
  matcher: ["/((?!api/|intern/|_next/|assets/|.*\\.[a-z0-9]+$).*)"],
};
