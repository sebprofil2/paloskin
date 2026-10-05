import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANG_IDS } from "../i18n";
import { nurHinweis, rechtsseiteLang } from "../rechtsseiten";

/*
 * Impressum und Datenschutz (Fehler auf www vom 5. Oktober 2026): Es darf genau der Hinweis der gewählten Sprache
 * sichtbar sein, bei Deutsch keiner; der deutsche Rechtstext bleibt unverändert.
 */
const roh = (seite: string) => readFileSync(join(process.cwd(), "public", seite, "index.html"), "utf8");
const hinweise = (html: string) => [...html.matchAll(/data-hinweis="([a-z]{2})"/g)].map((m) => m[1]);
const ohneAlle = (html: string) => html.replace(/[ \t]*<p\b[^>]*\bdata-hinweis="[a-z]{2}"[^>]*>[\s\S]*?<\/p>[ \t]*\r?\n?/g, "");

describe("Impressum und Datenschutz: nur der Hinweis der gewählten Sprache", () => {
  it("die Dateien enthalten die markierten Hinweise (Datenschutz: en, uk, ar; Impressum: uk, ar)", () => {
    expect(hinweise(roh("datenschutz")).sort()).toEqual(["ar", "en", "uk"]);
    expect(hinweise(roh("impressum")).sort()).toEqual(["ar", "uk"]);
  });

  for (const seite of ["impressum", "datenschutz"]) {
    it(`${seite}: in jeder der sieben Sprachen höchstens der eigene Hinweis, Rechtstext unverändert`, () => {
      const html = roh(seite);
      const vorhanden = hinweise(html);
      for (const lang of LANG_IDS) {
        const out = nurHinweis(html, lang);
        const sichtbar = hinweise(out);
        expect(sichtbar, `${seite} ${lang}`).toEqual(lang !== "de" && vorhanden.includes(lang) ? [lang] : []);
        if (lang === "de") {
          expect(out).not.toMatch(/lang="(en|uk|ar)"/);
          expect(out).not.toContain("Цей текст");
          expect(out).not.toContain("هذا النص");
          expect(out).not.toContain("This privacy policy is provided in German");
        }
        if (lang === "ar" && sichtbar.length) expect(out).toMatch(/<p lang="ar" dir="rtl"[^>]*data-hinweis="ar">/);
        // Der deutsche Rechtstext ist in jeder Sprache derselbe
        expect(ohneAlle(out), `${seite} ${lang}`).toBe(ohneAlle(html));
        expect(out).toContain('<html lang="de">');
      }
    });
  }

  it("Sprache: ?lang= vor gespeicherter Wahl, ohne beides Deutsch (auch bei fremder Gerätesprache)", () => {
    const req = (url: string, cookie?: string, al?: string) => new Request(url, { headers: { ...(cookie ? { cookie } : {}), ...(al ? { "accept-language": al } : {}) } });
    expect(rechtsseiteLang(req("https://www.paloskin.de/datenschutz"))).toBe("de");
    expect(rechtsseiteLang(req("https://www.paloskin.de/datenschutz", undefined, "uk-UA,uk;q=0.9"))).toBe("de");
    expect(rechtsseiteLang(req("https://www.paloskin.de/datenschutz", "palo_lang=uk"))).toBe("uk");
    expect(rechtsseiteLang(req("https://www.paloskin.de/datenschutz?lang=ar", "palo_lang=uk"))).toBe("ar");
    expect(rechtsseiteLang(req("https://www.paloskin.de/datenschutz?lang=xx"))).toBe("de");
  });
});
