import { describe, expect, it } from "vitest";
import { LANG_IDS, pickLang, type Lang } from "../i18n";
import { bookingMetadata, homeShare, STUDIO_JSONLD } from "../share-meta";
import { startseiteHtml } from "../startseite";
import { TEXTS } from "../texts";
import { HOME_TEXTS } from "../texts-home";
import { MAIL_TEXTS } from "../texts-mail";

/* Jeder Textschlüssel der deutschen Vorlage muss in jeder Sprache vorhanden sein, gleicher Art, nicht leer wenn Deutsch nicht leer ist */
function sameKeys(name: string, table: Record<Lang, object>) {
  const de = table.de as Record<string, unknown>;
  for (const lang of LANG_IDS) {
    const t = table[lang] as Record<string, unknown>;
    expect(Object.keys(t).sort(), `${name}.${lang}: Schlüssel`).toEqual(Object.keys(de).sort());
    for (const k of Object.keys(de)) {
      expect(typeof t[k], `${name}.${lang}.${k}: Art`).toBe(typeof de[k]);
      if (typeof de[k] === "string" && de[k]) expect(t[k], `${name}.${lang}.${k}: leer`).not.toBe("");
      if (de[k] && typeof de[k] === "object") expect(Object.keys(t[k] as object).sort(), `${name}.${lang}.${k}`).toEqual(Object.keys(de[k] as object).sort());
    }
  }
}

describe("Gemeinsames Sprachsystem (4. Oktober 2026)", () => {
  it("jeder Textschlüssel ist in allen Sprachen vorhanden: Startseite, Buchung, Mails und Terminseite, Vorschautexte", () => {
    sameKeys("Startseite", HOME_TEXTS);
    sameKeys("Buchung", TEXTS);
    sameKeys("Mails", MAIL_TEXTS);
    for (const lang of LANG_IDS) {
      const m = bookingMetadata(lang);
      expect(m.title, `Buchung ${lang}`).toBeTruthy();
      expect(m.description, `Buchung ${lang}`).toBeTruthy();
      expect(homeShare(lang).title).toBe(HOME_TEXTS[lang].title);
    }
  });

  it("Sprache: Adresse vor gespeicherter Wahl vor Gerätesprache, sonst Deutsch", () => {
    expect(pickLang({})).toBe("de");
    expect(pickLang({ acceptLanguage: "en-GB,en;q=0.9,de;q=0.8" })).toBe("en");
    expect(pickLang({ acceptLanguage: "nl-NL,nl;q=0.9,fr;q=0.8,de;q=0.7" })).toBe("fr");
    expect(pickLang({ acceptLanguage: "de;q=0.5,pt-BR" })).toBe("pt");
    expect(pickLang({ acceptLanguage: "ja-JP" })).toBe("de");
    expect(pickLang({ cookie: "es", acceptLanguage: "en" })).toBe("es");
    expect(pickLang({ param: "fr", cookie: "es", acceptLanguage: "en" })).toBe("fr");
    expect(pickLang({ param: "xx", cookie: "yy", acceptLanguage: "zz" })).toBe("de");
  });

  it("Startseite kommt vom Server in der gewählten Sprache: lang-Attribut, Titel, Vorschau, Texte, JSON-LD unverändert", () => {
    for (const lang of LANG_IDS) {
      const html = startseiteHtml(lang);
      expect(html).toContain(`<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">`);
      expect(html).toContain(`<title>${HOME_TEXTS[lang].title.replace(/&/g, "&amp;")}</title>`);
      expect(html).toContain(`<meta property="og:title" content="${HOME_TEXTS[lang].title}">`);
      expect(html).toContain(`<script type="application/ld+json">\n${STUDIO_JSONLD}\n</script>`);
      expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">');
      expect(html).toContain(lang === "de" ? 'href="/booking"' : `href="/booking?lang=${lang}"`);
      // keine Übersetzung mehr im Browser
      expect(html).not.toContain("home-text.js");
      expect(html).not.toContain("data-i18n");
    }
    expect(JSON.parse(STUDIO_JSONLD)["@graph"][0]["@type"]).toBe("MedicalBusiness");
    expect(startseiteHtml("de")).not.toMatch(/Botox/i);
  });
});
