import type { Customer } from "../schema";
import type { SlotDay } from "../slots";
import type { Lang, Selection } from "../treatments";

export class SlotsUnavailableError extends Error {
  constructor(message = "Freie Zeiten nicht verfügbar") {
    super(message);
    this.name = "SlotsUnavailableError";
  }
}

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what}: noch nicht gebaut`);
    this.name = "NotImplementedError";
  }
}

export interface SlotsResult {
  days: SlotDay[];
  from: string;
  to: string;
}

export interface BookInput {
  requestId: string;
  selection: Selection;
  start: Date;
  durationMinutes: number;
  customer: Customer;
  lang: Lang;
  consentAt: Date;
  testMode: boolean;
}

export interface BookingSummary {
  ref: string;
  requestId: string;
  /** Beginn und Ende mit Berliner Versatz */
  start: string;
  end: string;
  durationMinutes: number;
}

export type BookResult =
  | { status: "booked"; booking: BookingSummary }
  | { status: "conflict" }
  | { status: "pending" };

export interface BookingEngine {
  readonly name: "mock" | "google";
  getSlots(input: { durationMinutes: number; now?: Date }): Promise<SlotsResult>;
  book(input: BookInput): Promise<BookResult>;
  findByRequestId(requestId: string): Promise<BookingSummary | null>;
  addReferral(requestId: string, referral: string): Promise<boolean>;
  cancel(bookingRef: string): Promise<void>;
  reschedule(bookingRef: string, newStart: Date): Promise<void>;
}
