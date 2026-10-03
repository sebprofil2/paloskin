import { buildDescription, buildTitle, serviceCode } from "./booking-description";
import { getEngine, SlotsUnavailableError, type BookingEngine } from "./engine";
import { errorClass, logEvent } from "./log";
import { getMailer, mailErrorClass, type Mailer } from "./mail";
import { confirmationMail, reminderMail } from "./mail-content";
import { bookingRefFor } from "./ref";
import type { Customer } from "./schema";
import { getStore, type BookingRow, type Store } from "./store";
import { toBerlinIso } from "./time";
import type { Lang, Selection } from "./treatments";

/*
 * Ablauf einer Buchung (Stufe 2): Eingaben sind geprüft. Kalender fragen, ob die Zeit frei ist (ein Fehler dort
 * verhindert die Buchung nicht, denn der Kunde hat die Zeit gerade als frei gesehen); dann in einer Transaktion
 * reservieren; danach Kalendereintrag und Bestätigungsmail. Scheitert eines davon, bleibt die Buchung gültig und der
 * Hintergrundlauf holt es nach. Die Reservierung in der Datenbank ist maßgeblich.
 */

export interface BookingSummary {
  ref: string;
  requestId: string;
  /** Beginn und Ende mit Berliner Versatz */
  start: string;
  end: string;
  durationMinutes: number;
  /** verbindlich gebucht (confirmed) oder Terminanfrage (requested) */
  binding: boolean;
}

export type BookResult = { status: "booked"; booking: BookingSummary } | { status: "conflict" };

export interface PlaceInput {
  requestId: string;
  selection: Selection;
  start: Date;
  durationMinutes: number;
  customer: Customer;
  lang: Lang;
  consentAt: Date;
  reminder: boolean;
  device: "mobile" | "desktop";
  testMode: boolean;
  /** BOOKING_BINDING: verbindlich (confirmed) statt Anfrage (requested) */
  binding: boolean;
}

export interface Deps {
  store: Store;
  engine: BookingEngine;
  mailer: Mailer;
}

const defaultDeps = (): Deps => ({ store: getStore(), engine: getEngine(), mailer: getMailer() });

/** Absage über den Link nur bis 48 Stunden vor dem Termin. */
export const CANCEL_LEAD_MS = 48 * 3600000;
export function canCancelOnline(b: BookingRow, now = new Date()): boolean {
  return b.status !== "cancelled" && !b.deleted_at && Date.parse(b.starts_at) - now.getTime() >= CANCEL_LEAD_MS;
}

export function summarize(b: BookingRow, requestId: string): BookingSummary {
  return {
    ref: b.reference,
    requestId,
    start: toBerlinIso(new Date(b.starts_at)),
    end: toBerlinIso(new Date(b.ends_at)),
    durationMinutes: b.duration_minutes,
    binding: b.status === "confirmed",
  };
}

export async function placeBooking(i: PlaceInput, deps: Deps = defaultDeps()): Promise<BookResult> {
  const { store, engine } = deps;
  const existing = store.findByRequestId(i.requestId);
  if (existing) return { status: "booked", booking: summarize(existing, i.requestId) };

  const reference = bookingRefFor(i.requestId);
  let free: boolean | null = null;
  try {
    free = await engine.isStartFree({ start: i.start, durationMinutes: i.durationMinutes });
  } catch (e) {
    if (!(e instanceof SlotsUnavailableError)) throw e;
    logEvent("warn", "calendar_check_unavailable", { bookingRef: reference, engine: engine.name, errorClass: errorClass(e) });
  }
  if (free === false) return { status: "conflict" };

  const r = store.reserve({
    requestId: i.requestId,
    reference,
    start: i.start,
    durationMinutes: i.durationMinutes,
    selection: i.selection,
    customer: i.customer,
    lang: i.lang,
    consentAt: i.consentAt,
    reminder: i.reminder,
    device: i.device,
    testMode: i.testMode,
    status: i.binding ? "confirmed" : "requested",
  });
  if (r.outcome === "conflict") return { status: "conflict" };
  if (r.outcome === "created") {
    logEvent("info", "reserved", { bookingRef: reference, status: r.booking.status, engine: engine.name });
    await Promise.all([writeCalendar(r.booking, deps, false), sendConfirmation(r.booking, deps)]);
  }
  return { status: "booked", booking: summarize(r.booking, i.requestId) };
}

function calendarInput(b: BookingRow) {
  const selection = JSON.parse(b.selection) as Selection;
  const customer: Customer = { vorname: b.first_name, nachname: b.last_name, handy: b.phone_e164, email: b.email };
  let description = buildDescription({
    bookingRef: b.reference,
    selection,
    durationMinutes: b.duration_minutes,
    customer,
    lang: b.language,
    consentAt: new Date(b.consent_at),
    reminder: b.reminder_whatsapp === 1,
  });
  if (b.referral) description += `\nEmpfehlung: ${b.referral}`;
  return {
    reference: b.reference,
    title: buildTitle(customer, b.test_mode === 1),
    description,
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
    serviceCode: serviceCode(selection),
    reminder: b.reminder_whatsapp === 1,
  };
}

/** Kalendereintrag schreiben und Zustand vermerken. Bei Wiederholung zuerst nach einem vorhandenen Eintrag suchen. */
export async function writeCalendar(b: BookingRow, deps: Deps = defaultDeps(), lookupFirst = true): Promise<boolean> {
  const { store, engine } = deps;
  try {
    let eventId = lookupFirst ? await engine.findEventIdByRef(b.reference) : null;
    if (!eventId) eventId = await engine.createEvent(calendarInput(b));
    store.calendarWritten(b.id, eventId);
    logEvent("info", "calendar_written", { bookingRef: b.reference, engine: engine.name });
    return true;
  } catch (e) {
    store.calendarFailed(b.id);
    logEvent("error", "calendar_write_failed", { bookingRef: b.reference, engine: engine.name, errorClass: errorClass(e) });
    return false;
  }
}

/** Bestätigungsmail sofort nach dem Commit; bei Fehler bleibt die Buchung gültig, der Hintergrundlauf wiederholt. */
export async function sendConfirmation(b: BookingRow, deps: Deps = defaultDeps(), now = new Date()): Promise<boolean> {
  const { store, mailer } = deps;
  if (!mailer.enabled) return false;
  try {
    await mailer.send(confirmationMail(b, now));
    store.mailConfirmationSent(b.id, now);
    logEvent("info", "mail_sent", { bookingRef: b.reference, mail: "confirmation" });
    return true;
  } catch (e) {
    store.mailConfirmationFailed(b.id, now);
    logEvent("error", "mail_failed", { bookingRef: b.reference, mail: "confirmation", errorClass: mailErrorClass(e) });
    return false;
  }
}

/** Erinnerungsmail an eine Buchung; Fälligkeit entscheidet lib/reminder-list.ts (Vortag 10:00 Uhr). */
export async function sendReminder(b: BookingRow, deps: Deps = defaultDeps(), now = new Date()): Promise<"sent" | "failed"> {
  const { store, mailer } = deps;
  try {
    await mailer.send(reminderMail(b));
    store.mailReminderSent(b.id, now);
    logEvent("info", "mail_sent", { bookingRef: b.reference, mail: "reminder" });
    return "sent";
  } catch (e) {
    store.mailReminderFailed(b.id, now);
    logEvent("error", "mail_failed", { bookingRef: b.reference, mail: "reminder", errorClass: mailErrorClass(e) });
    return "failed";
  }
}

/** Absage: Datenbank zuerst (Belegung frei), dann Kalendereintrag löschen; scheitert das, räumt der Hintergrundlauf nach. */
export async function cancelBooking(id: string, reason: string, deps: Deps = defaultDeps(), now = new Date()): Promise<BookingRow | null> {
  const { store } = deps;
  const row = store.cancel(id, reason, now);
  if (!row) return null;
  logEvent("info", "cancelled", { bookingRef: row.reference, reason });
  await removeCalendarEvent(row, deps);
  return row;
}

async function removeCalendarEvent(b: BookingRow, deps: Deps): Promise<boolean> {
  if (!b.calendar_event_id) return true;
  try {
    await deps.engine.deleteEvent(b.calendar_event_id);
    deps.store.calendarEventRemoved(b.id);
    logEvent("info", "calendar_removed", { bookingRef: b.reference, engine: deps.engine.name });
    return true;
  } catch (e) {
    logEvent("warn", "calendar_remove_failed", { bookingRef: b.reference, engine: deps.engine.name, errorClass: errorClass(e) });
    return false;
  }
}

/** Zusage „Ja, ich komme“. */
export function confirmAttendance(id: string, deps: Deps = defaultDeps(), now = new Date()): BookingRow | null {
  const row = deps.store.confirmAttendance(id, now);
  if (row) logEvent("info", "attendance_confirmed", { bookingRef: row.reference });
  return row;
}

/** Hintergrundlauf: fehlende Kalendereinträge nachholen, nach 24 Stunden Alarm, alte Idempotenzschlüssel löschen. */
export async function retryCalendar(deps: Deps = defaultDeps(), now = new Date()): Promise<{ retried: number; written: number; overdue: number }> {
  const { store } = deps;
  const backlog = store.calendarBacklog(now);
  let written = 0;
  for (const b of backlog) if (await writeCalendar(b, deps, true)) written++;
  for (const b of store.cancelledWithCalendarEvent()) await removeCalendarEvent(b, deps);
  const overdue = store.countCalendarOverdue(now);
  // Der Heartbeat erkennt diese Zeile und bleibt aus, bis der Eintrag nachgeholt ist
  if (overdue > 0) logEvent("error", "ALARM Kalendereintrag seit 24 Stunden offen", { count: overdue });
  store.purgeIdempotency(now);
  return { retried: backlog.length, written, overdue };
}

/** Hintergrundlauf: Bestätigungsmails nachholen, nach 24 Stunden Alarm. Erinnerungen: lib/reminder-list.ts. */
export async function runMailJobs(deps: Deps = defaultDeps(), now = new Date()): Promise<{ confirmations: number; overdue: number }> {
  const { store, mailer } = deps;
  if (!mailer.enabled) return { confirmations: 0, overdue: 0 };
  let confirmations = 0;
  for (const b of store.confirmationMailBacklog(now)) if (await sendConfirmation(b, deps, now)) confirmations++;
  const overdue = store.countMailOverdue(now);
  if (overdue > 0) logEvent("error", "ALARM Bestätigungsmail seit 24 Stunden nicht zugestellt", { count: overdue });
  return { confirmations, overdue };
}
