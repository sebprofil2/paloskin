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
  /** Freie Zeiten aus Fenstern minus belegt; extraBusy sind die Reservierungen der Datenbank, anchors die Anschlusszeiten (lib/slots.ts). */
  getSlots(input: { durationMinutes: number; now?: Date; extraBusy?: Interval[]; anchors?: number[]; quarterFill?: Interval[] }): Promise<SlotsResult>;
  /** Liegt der Beginn in einem offenen Fenster und ist die Zeit laut Kalender frei? Wirft SlotsUnavailableError, wenn der Kalender nicht lesbar ist. */
  isStartFree(input: { start: Date; durationMinutes: number; now?: Date }): Promise<boolean>;
  /** Eintrag anlegen; liefert die Kennung des Eintrags. Fehler werden geworfen und vom Aufrufer als „failed“ vermerkt. */
  createEvent(input: CalendarEventInput): Promise<string>;
  /** Vorhandenen Eintrag zur Buchungsnummer suchen (Wiederholung nach unklarem Ausgang). */
  findEventIdByRef(reference: string): Promise<string | null>;
  deleteEvent(eventId: string): Promise<void>;
  /** Eintrag auf eine neue Zeit verschieben (kein zweiter Eintrag). */
  moveEvent(eventId: string, start: Date, end: Date): Promise<void>;
  /** Zeile an die Beschreibung anhängen, zum Beispiel die Empfehlung. */
  appendDescription(eventId: string, line: string): Promise<void>;
  /** Einträge aus „Palo Skin Termine“ für den nächtlichen Export als Kalenderdatei. */
  exportEvents(from: Date, to: Date): Promise<ExportedEvent[]>;
  /**
   * Einträge aus „Palo Skin Termine“, die seit `since` geändert oder gelöscht wurden (Abgleich alle 5 Minuten, lib/calendar-sync.ts).
   * Wirft, wenn der Kalender nicht lesbar ist; der Aufrufer ändert dann nichts und holt beim nächsten Lauf nach.
   */
  changedEvents(since: Date): Promise<ChangedEvent[]>;
}

/** Geänderter Eintrag im Kalender „Palo Skin Termine“; start und end fehlen bei ganztägigen oder unvollständigen Einträgen. */
export interface ChangedEvent {
  id: string;
  deleted: boolean;
  bookingRef: string | null;
  start: Date | null;
  end: Date | null;
  updated: Date;
}

export interface ExportedEvent {
  id: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
}
