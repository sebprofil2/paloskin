import type { Lang } from "./i18n";
import { PRICES } from "./treatments";

/*
 * Preise für Startseite und Behandlungsseiten (10. Oktober 2026). Die Beträge stehen nur in lib/treatments.ts (PRICES,
 * brutto, dort liest auch die Buchung); hier nur die Schreibweise je Sprache. Immer mit Sternchen als Richtwert.
 */
const THOUSANDS: Record<Lang, string> = { de: ".", en: ",", es: ".", fr: "\u00a0", pt: ".", it: ".", tr: ".", uk: "\u00a0", ar: "," };

export type PreisKey = keyof typeof PRICES;

/** Betrag als Richtwert mit Sternchen und geschütztem Leerzeichen vor dem Euro, zum Beispiel „1.000 €*“ */
export function formatPrice(lang: Lang, n: number): string {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS[lang])}\u00a0€*`;
}

export function price(lang: Lang, key: PreisKey): string {
  return formatPrice(lang, PRICES[key]);
}
