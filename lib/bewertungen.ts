import { LANGS, type Lang } from "./i18n";

/*
 * Bewertungen an EINER Stelle (10. Oktober 2026). Austausch eines Zitats, der Sterne oder der Anzahl: nur hier ändern.
 * - Sterne und Anzahl: GOOGLE_BEWERTUNG (dazu „stand“ auf das Datum der Abfrage setzen).
 * - Angezeigte Zitate: ZITATE (genau drei Karten; Wortlaut unverändert, Kürzungen nur mit „(…)“, Sprache des Originals).
 * - Reserve: RESERVE (gespeichert, nicht angezeigt); zum Tauschen einen Eintrag zwischen ZITATE und RESERVE verschieben.
 * Bewertungen nie in die strukturierten Daten (kein aggregateRating, kein Review): Google lässt eigene Bewertungen dort nicht zu.
 */
export const GOOGLE_BEWERTUNG = {
  sterne: 5.0,
  anzahl: 28,
  stand: "2026-10-10",
  /** Google-Profil mit den Bewertungen (öffnet in neuem Tab) */
  profil: "https://maps.app.goo.gl/oesFGLYknXd5HBKu9",
} as const;

export type Zitat = { text: string; lang: Lang; name: string; initial: string };

export const ZITATE: Zitat[] = [
  { text: "„Ich bin selbst Ärztin (…). Bei Dr. Sebastian Vogel habe ich mich von Anfang an sehr gut aufgehoben gefühlt.“", lang: "de", name: "Kathleen", initial: "K" },
  { text: "„Er nimmt sich immer Zeit und hat beim ersten Mal direkt gesehen, dass meine linke Zornesfalte stärker ist als die rechte (…).“", lang: "de", name: "Antje D.", initial: "A" },
  { text: "„He never tries to make you look ridiculous.“", lang: "en", name: "Michael B.", initial: "M" },
];

export const RESERVE: Zitat[] = [
  { text: "„Ich war das erste Mal bei Dr. Vogel nachdem ich 12 Jahre lang einem anderen Studio treu gewesen bin. (…) Ich werde neue Stammkundin!“", lang: "de", name: "Blushing Indigo", initial: "B" },
];

/* Wort für „Bewertungen“ je Sprache und Mehrzahlform (Intl.PluralRules); {n} ist die formatierte Anzahl */
const WORT: Record<Lang, Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }> = {
  de: { one: "{n} Bewertung", other: "{n} Bewertungen" },
  en: { one: "{n} review", other: "{n} reviews" },
  es: { one: "{n} reseña", other: "{n} reseñas" },
  fr: { one: "{n} avis", other: "{n} avis" },
  pt: { one: "{n} avaliação", other: "{n} avaliações" },
  it: { one: "{n} recensione", other: "{n} recensioni" },
  tr: { other: "{n} değerlendirme" },
  uk: { one: "{n} відгук", few: "{n} відгуки", many: "{n} відгуків", other: "{n} відгуку" },
  ar: { zero: "{n} تقييم", one: "تقييم واحد", two: "تقييمان", few: "{n} تقييمات", many: "{n} تقييمًا", other: "{n} تقييم" },
};

/* Zahlformat der Seite (Arabisch mit lateinischen Ziffern wie auf der übrigen Seite) */
const loc = (lang: Lang) => LANGS.find((x) => x.id === lang)!.loc;

export function sterneText(lang: Lang): string {
  return new Intl.NumberFormat(loc(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(GOOGLE_BEWERTUNG.sterne);
}

export function anzahlZahl(lang: Lang): string {
  return new Intl.NumberFormat(loc(lang)).format(GOOGLE_BEWERTUNG.anzahl);
}

/** „28 Bewertungen“, „28 reviews“, „28 відгуків“, „28 تقييمًا“ */
export function anzahlText(lang: Lang): string {
  const form = new Intl.PluralRules(loc(lang)).select(GOOGLE_BEWERTUNG.anzahl);
  const w = WORT[lang];
  return (w[form] ?? w.other).replace("{n}", anzahlZahl(lang));
}

/** Texte der Bewertungspille in der Kopfzeile */
export type PillenTexte = { lang: string; kurz: string; aria: string; href: string };

/** „★ 5,0 · 28 Bewertungen“, auf dem Handy „★ 5,0 · 28“; für Bildschirmleser mit der Quelle (googleB, zum Beispiel „bei Google“) */
export function bewertungPille(lang: Lang, quelle: string): PillenTexte {
  return {
    lang: `★ ${sterneText(lang)} · ${anzahlText(lang)}`,
    kurz: `★ ${sterneText(lang)} · ${anzahlZahl(lang)}`,
    aria: `${sterneText(lang)} ★, ${anzahlText(lang)} ${quelle}`,
    href: GOOGLE_BEWERTUNG.profil,
  };
}
