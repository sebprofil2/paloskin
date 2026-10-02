import type { Interval, SlotDay } from "../slots";

export class SlotsUnavailableError extends Error {
  constructor(message = "Freie Zeiten nicht verfügbar") {
    super(message);
    this.name = "SlotsUnavailableError";
  }
}

export interface SlotsResult {
  days: SlotDay[];
  from: string;
  to: string;
}

/** Kalendereintrag, den die Buchung nach der Reservierung schreibt. */
export interface CalendarEventInput {
  reference: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  serviceCode: string;
  reminder: boolean;
}

/*
 * Der Motor kennt nur den Kalender. Reservierung, Idempotenz und Buchungsstand liegen in der Datenbank (lib/store.ts),
 * der Ablauf in lib/booking.ts.
 */
export interface BookingEngine {
  readonly name: "mock" | "google";
  /** Freie Zeiten aus Fenstern minus belegt; extraBusy sind die Reservierungen der Datenbank. */
  getSlots(input: { durationMinutes: number; now?: Date; extraBusy?: Interval[] }): Promise<SlotsResult>;
  /** Liegt der Beginn in einem offenen Fenster und ist die Zeit laut Kalender frei? Wirft SlotsUnavailableError, wenn der Kalender nicht lesbar ist. */
  isStartFree(input: { start: Date; durationMinutes: number; now?: Date }): Promise<boolean>;
  /** Eintrag anlegen; liefert die Kennung des Eintrags. Fehler werden geworfen und vom Aufrufer als „failed“ vermerkt. */
  createEvent(input: CalendarEventInput): Promise<string>;
  /** Vorhandenen Eintrag zur Buchungsnummer suchen (Wiederholung nach unklarem Ausgang). */
  findEventIdByRef(reference: string): Promise<string | null>;
  deleteEvent(eventId: string): Promise<void>;
  /** Zeile an die Beschreibung anhängen, zum Beispiel die Empfehlung. */
  appendDescription(eventId: string, line: string): Promise<void>;
}
