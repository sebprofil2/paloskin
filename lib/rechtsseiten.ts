import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isLang, LANG_COOKIE, type Lang } from "./i18n";

/*
 * Impressum und Datenschutz: Rechtstext auf Deutsch (public/impressum/index.html, public/datenschutz/index.html).
 * Oben stehen kurze Hinweise in anderen Sprachen, markiert mit data-hinweis="en|uk|ar". Sichtbar ist genau der Hinweis
 * der gewählten Sprache; bei Deutsch und bei Sprachen ohne eigenen Hinweis keiner. Der Rechtstext bleibt unverändert.
 * Sprache: ?lang=, sonst die gespeicherte Wahl (Cookie), sonst Deutsch. Die Gerätesprache zählt hier bewusst nicht:
 * Wer die Seite direkt aufruft, ohne eine Sprache gewählt zu haben, sieht Deutsch.
 */
export type Rechtsseite = "impressum" | "datenschutz";

const cache = new Map<Rechtsseite, string>();

function datei(seite: Rechtsseite): string {
  const hit = cache.get(seite);
  if (hit && process.env.NODE_ENV === "production") return hit;
  const html = readFileSync(join(process.cwd(), "public", seite, "index.html"), "utf8");
  cache.set(seite, html);
  return html;
}

/** Nur den Hinweis der Sprache stehen lassen (Zeile samt Einrückung und Zeilenende entfernen). */
export function nurHinweis(html: string, lang: Lang): string {
  return html.replace(/[ \t]*<p\b[^>]*\bdata-hinweis="([a-z]{2})"[^>]*>[\s\S]*?<\/p>[ \t]*\r?\n?/g, (zeile, l: string) => (l === lang ? zeile : ""));
}

export function rechtsseiteLang(req: Request): Lang {
  const param = new URL(req.url).searchParams.get("lang");
  if (isLang(param)) return param;
  const cookie = new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([a-z]{2})`).exec(req.headers.get("cookie") ?? "")?.[1];
  return isLang(cookie) ? cookie : "de";
}

export function rechtsseiteAntwort(seite: Rechtsseite, req: Request): Response {
  return new Response(nurHinweis(datei(seite), rechtsseiteLang(req)), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-cache" },
  });
}
