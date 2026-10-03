import { normalizePhoneE164 } from "./phone";
import type { Customer } from "./schema";
import { lineItemsDe, totalPrice, hasTreatment, type Lang, type Selection } from "./treatments";

export const LANG_NAMES: Record<Lang, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
};

export function normalizePhone(v: string): string {
  return normalizePhoneE164(v) ?? v;
}

export interface DescriptionInput {
  bookingRef: string;
  selection: Selection;
  durationMinutes: number;
  customer: Customer;
  lang: Lang;
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
  rows.push(`Sprache: ${LANG_NAMES[i.lang]}`);
  // Handliste für die WhatsApp-Erinnerung: die Nummer steht nur im Kalender, wenn der Kunde die Erinnerung möchte
  if (i.reminder) rows.push(`WhatsApp-Erinnerung: ja, ${normalizePhone(i.customer.handy)}`);
  return rows.join("\n");
}

/** Titel „Palo Skin: Vorname N.“, Nachname nur als Initiale */
export function buildTitle(customer: Customer, testMode: boolean): string {
  const initial = customer.nachname.trim().charAt(0).toUpperCase();
  const name = `${customer.vorname.trim()}${initial ? ` ${initial}.` : ""}`;
  return `${testMode ? "TEST " : ""}Palo Skin: ${name}`;
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
