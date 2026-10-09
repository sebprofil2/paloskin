import { normalizePhoneE164, phoneUnusual } from "./phone";
import type { Customer } from "./schema";
import { CONSULT_NAMES_DE, type ConsultLang } from "./i18n";
import { lineItemsDe, totalPrice, hasTreatment, type Lang, type Selection } from "./treatments";

/* Seitensprache für das Studio ausgeschrieben auf Deutsch */
export const LANG_NAMES: Record<Lang, string> = {
  de: "Deutsch",
  en: "Englisch",
  es: "Spanisch",
  fr: "Französisch",
  pt: "Portugiesisch",
  it: "Italienisch",
  tr: "Türkisch",
  uk: "Ukrainisch",
  ar: "Arabisch",
};

/** Erster Buchstabe des Nachnamens als Großbuchstabe; bei türkischen Buchungen nach türkischen Regeln (i zu İ, ı zu I) */
export function initialOf(name: string, lang: Lang): string {
  return name.trim().charAt(0).toLocaleUpperCase(lang === "tr" ? "tr-TR" : "de-DE");
}

export function normalizePhone(v: string): string {
  return normalizePhoneE164(v) ?? v;
}

export interface DescriptionInput {
  bookingRef: string;
  selection: Selection;
  durationMinutes: number;
  customer: Customer;
  lang: Lang;
  /** Beratungssprache; null bei Buchungen vor dem 4. Oktober 2026 */
  consultLang?: ConsultLang | null;
  consentAt: Date;
  reminder: boolean;
}

/*
 * Beschreibung des Kalendereintrags, nur was Dr. Vogel zum Planen braucht: Buchungsnummer, Besuch, zu zweit,
 * Vorauswahl, Sprache, Empfehlung (hängt lib/booking.ts an), bei WhatsApp-Haken die Handynummer. E-Mail-Adresse,
 * Einwilligung und Dauer stehen nur in der Datenbank. Nie die Notiz.
 */
export function buildDescription(i: DescriptionInput): string {
  const s = i.selection;
  const rows: string[] = [];
  rows.push(`Buchungsnummer: ${i.bookingRef}`);
  rows.push(`Besuch: ${s.checkup ? "Kontrolltermin" : s.visit === "first" ? "Erster Besuch" : "Schon einmal da"}`);
  if (s.persons === 2) rows.push("Zu zweit (die Begleitung entscheidet vor Ort, Behandlung gilt für die buchende Person)");
  if (s.beratung) rows.push("Behandlung: Noch unsicher, Beratung gewünscht");
  const items = lineItemsDe(s);
  if (items.length) {
    rows.push("Behandlungen (unverbindliche Vorauswahl):");
    for (const it of items) rows.push(`- ${it.label} (${it.price} Euro brutto)`);
    if (hasTreatment(s) && totalPrice(s) > 0) rows.push(`Summe voraussichtlich: ${totalPrice(s)} Euro brutto`);
  }
  // Beratungssprache ausgeschrieben (Entscheidung 4. Oktober 2026); die Seitensprache nur, wenn sie davon abweicht (Mails gehen in der Seitensprache)
  if (i.consultLang) {
    rows.push(`Beratung: ${CONSULT_NAMES_DE[i.consultLang]}`);
    if (i.lang !== i.consultLang) rows.push(`Hat auf ${LANG_NAMES[i.lang]} gebucht, Mails auf ${LANG_NAMES[i.lang]}`);
  } else rows.push(`Sprache: ${LANG_NAMES[i.lang]}`);
  // Handliste für die WhatsApp-Erinnerung: die Nummer steht nur im Kalender, wenn der Kunde die Erinnerung möchte
  if (i.reminder) rows.push(`WhatsApp-Erinnerung: ja, ${normalizePhone(i.customer.handy)}`);
  if (phoneUnusual(i.customer.handy)) rows.push(PHONE_CHECK_NOTE);
  return rows.join("\n");
}

/** Hinweis für das Studio bei ungewöhnlicher Handynummer (Sprachleitfaden: ruhig und mit Lösung, 10. Oktober 2026) */
export const PHONE_CHECK_NOTE = "Die Handynummer sieht ungewöhnlich aus. Bitte vor dem Termin kurz prüfen.";

/** Titel „PALO SKIN: Vorname N.“, Testbuchungen „Testbuchung, PALO SKIN: …“; Nachname nur als Initiale (Großbuchstabe nach den Regeln der Buchungssprache, Türkisch i zu İ) */
export function buildTitle(customer: Customer, testMode: boolean, lang: Lang = "de"): string {
  const initial = initialOf(customer.nachname, lang);
  const name = `${customer.vorname.trim()}${initial ? ` ${initial}.` : ""}`;
  return `${testMode ? "Testbuchung, " : ""}PALO SKIN: ${name}`;
}

/** Leistungscode für extendedProperties, zum Beispiel BOT+LDN */
export function serviceCode(s: Selection): string {
  const codes: string[] = [];
  if (s.beratung) codes.push("BER");
  if (s.zones.length || s.otherZone !== null || s.zonesUnknown) codes.push("BOT");
  if (s.kaumuskel) codes.push("KAU");
  if (s.nefertiti) codes.push("NEF");
  if (s.achsel) codes.push("HYP");
  if (s.lachs === "single") codes.push("LDN");
  if (s.lachs === "pack") codes.push("LDN4");
  if (s.checkup) codes.push("KON");
  if (s.persons === 2) codes.push("P2");
  return codes.join("+") || "NONE";
}
