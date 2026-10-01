import type { Customer } from "./schema";
import { lineItemsDe, totalPrice, hasTreatment, type Lang, type Selection } from "./treatments";
import { formatBerlinDe } from "./time";

export const LANG_NAMES: Record<Lang, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
};

export function normalizePhone(v: string): string {
  let d = v.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  else if (d.startsWith("0")) d = "+49" + d.slice(1);
  else if (d && !d.startsWith("+")) d = "+49" + d;
  return d;
}

export interface DescriptionInput {
  bookingRef: string;
  selection: Selection;
  durationMinutes: number;
  customer: Customer;
  lang: Lang;
  consentAt: Date;
}

/*
 * Beschreibung des Kalendereintrags in Stufe 1. Enthält Kontaktdaten und Behandlungswünsche,
 * vertretbar nur, weil im Test ausschließlich erfundene Daten verwendet werden.
 * In Stufe 2 bleiben hier nur Buchungsnummer, Vorname und Dauer.
 */
export function buildDescription(i: DescriptionInput): string {
  const s = i.selection;
  const rows: string[] = [];
  rows.push(`Buchungsnummer: ${i.bookingRef}`);
  rows.push(`Besuch: ${s.checkup ? "Kontrolltermin" : s.visit === "first" ? "Erster Besuch" : "Schon einmal da"}`);
  if (s.persons === 2) rows.push("Personen: 2 (die zweite Person wählt ihre Behandlung vor Ort)");
  if (s.beratung) rows.push("Behandlung: Noch unsicher, Beratung gewünscht");
  const items = lineItemsDe(s);
  if (items.length) {
    rows.push("Behandlungen:");
    for (const it of items) rows.push(`- ${it.label} (${it.price} Euro brutto)`);
    if (hasTreatment(s) && totalPrice(s) > 0) rows.push(`Summe voraussichtlich: ${totalPrice(s)} Euro brutto`);
  }
  rows.push(`Dauer: ${i.durationMinutes} Minuten`);
  rows.push(`Handynummer: ${normalizePhone(i.customer.handy)}`);
  rows.push(`E-Mail-Adresse: ${i.customer.email.trim()}`);
  rows.push(`Sprache: ${LANG_NAMES[i.lang]}`);
  rows.push(`Einwilligung: ${formatBerlinDe(i.consentAt)} (Berliner Zeit)`);
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
