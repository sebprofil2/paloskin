import { describe, expect, it } from "vitest";
import { homeAlternates } from "../share-meta";
import { LANG_IDS, LANG_SHORT, langButtonLabel, pickLang } from "../i18n";

/* Sprachknopf in der Kopfzeile (Auftrag Dr. Vogel, 9. Oktober 2026): Kürzel nur zur Anzeige, interne Codes unverändert */
describe("Sprachknopf: Kürzel und Beschriftung", () => {
  it("Kürzel DE, EN, ES, FR, PT, UA, AR in der Reihenfolge der Sprachen", () => {
    expect(LANG_IDS.map((l) => LANG_SHORT[l])).toEqual(["DE", "EN", "ES", "FR", "PT", "UA", "AR"]);
  });

  it("Ukrainisch zeigt UA, intern bleibt es uk (Adresse, gespeicherte Wahl, hreflang)", () => {
    expect(LANG_SHORT.uk).toBe("UA");
    expect(LANG_IDS).toContain("uk");
    expect(LANG_IDS).not.toContain("ua");
    expect(pickLang({ param: "uk" })).toBe("uk");
    expect(pickLang({ param: "ua" })).toBe("de");
    expect(homeAlternates().map((a) => a.hreflang)).toContain("uk");
    expect(homeAlternates().some((a) => a.hreflang === "ua" || a.href.endsWith("/ua"))).toBe(false);
  });

  it("Beschriftung für Bildschirmleser mit vollem Sprachnamen, übersetzt", () => {
    expect(langButtonLabel("de")).toBe("Sprache: Deutsch");
    expect(langButtonLabel("en")).toBe("Language: English");
    expect(langButtonLabel("es")).toBe("Idioma: Español");
    expect(langButtonLabel("fr")).toBe("Langue: Français");
    expect(langButtonLabel("pt")).toBe("Idioma: Português");
    expect(langButtonLabel("uk")).toBe("Мова: Українська");
    expect(langButtonLabel("ar")).toBe("اللغة: العربية");
  });

  it("Arabisch: Kürzel in lateinischen Buchstaben", () => {
    expect(LANG_SHORT.ar).toMatch(/^[A-Z]{2}$/);
  });
});
