import { isLang, LANG_COOKIE, LANG_HEADER, pickLang } from "@/lib/i18n";
import { startseiteHtml } from "@/lib/startseite";

export const dynamic = "force-dynamic";

/* Startseite: fertiges HTML in der Sprache der Anfrage (proxy.ts, lib/i18n.ts), ohne React-Laufzeit im Browser */
export function GET(req: Request) {
  const fromProxy = req.headers.get(LANG_HEADER);
  const cookie = new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([a-z]{2})`).exec(req.headers.get("cookie") ?? "")?.[1];
  const lang = isLang(fromProxy)
    ? fromProxy
    : pickLang({ param: new URL(req.url).searchParams.get("lang"), cookie, acceptLanguage: req.headers.get("accept-language") });
  return new Response(startseiteHtml(lang), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // hängt von Cookie und Gerätesprache ab: nicht in fremden Zwischenspeichern ablegen
      "cache-control": "private, no-cache",
    },
  });
}

