import { describe, expect, it } from "vitest";
import { anzahlText, bewertungPille, GOOGLE_BEWERTUNG, RESERVE, sterneText, ZITATE, zitatMitZeichen } from "../bewertungen";
import { LANG_IDS } from "../i18n";
import { homeJsonLd } from "../share-meta";

describe("Bewertungen aus einer Datei", () => {
  it("Stand 10. Oktober 2026: 5,0 Sterne, 28 Bewertungen, Link aufs Google-Profil", () => {
    expect(GOOGLE_BEWERTUNG).toMatchObject({ sterne: 5, anzahl: 28, stand: "2026-10-10", profil: "https://maps.app.goo.gl/oesFGLYknXd5HBKu9" });
  });

  it("Zahlen und Mehrzahl je Sprache", () => {
    expect(bewertungPille("de", "bei Google").lang).toBe("★ 5,0 · 28 Bewertungen");
    expect(bewertungPille("de", "bei Google").kurz).toBe("★ 5,0 · 28");
    expect(bewertungPille("en", "on Google").lang).toBe("★ 5.0 · 28 reviews");
    expect(anzahlText("es")).toBe("28 reseñas");
    expect(anzahlText("fr")).toBe("28 avis");
    expect(anzahlText("pt")).toBe("28 avaliações");
    expect(anzahlText("it")).toBe("28 recensioni");
    expect(anzahlText("tr")).toBe("28 değerlendirme");
    expect(anzahlText("uk")).toBe("28 відгуків");
    expect(anzahlText("ar")).toBe("28 تقييمًا");
    expect(sterneText("ar")).toBe("5.0");
  });

  it("drei Zitate angezeigt, eines in Reserve; nie „Botox“, keine langen Gedankenstriche", () => {
    expect(ZITATE.map((z) => z.name)).toEqual(["Kathleen", "Antje D.", "Michael B."]);
    expect(ZITATE[2]).toMatchObject({ text: "He never tries to make you look ridiculous.", lang: "en" });
    // Anführungszeichen nach Originalsprache: Englisch “…”, Deutsch „…“
    expect(zitatMitZeichen(ZITATE[2])).toBe("“He never tries to make you look ridiculous.”");
    expect(zitatMitZeichen(ZITATE[0])).toBe("„Ich bin selbst Ärztin (…). Bei Dr. Sebastian Vogel habe ich mich von Anfang an sehr gut aufgehoben gefühlt.“");
    expect(RESERVE.map((z) => z.name)).toEqual(["Blushing Indigo"]);
    for (const z of [...ZITATE, ...RESERVE]) expect(z.text).not.toMatch(/botox|[–—]/i);
  });

  it("keine Bewertungen in den strukturierten Daten", () => {
    for (const l of LANG_IDS) expect(homeJsonLd(l)).not.toMatch(/aggregateRating|"Review"|ratingValue/);
  });
});
