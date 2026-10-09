import { buildDescription, buildTitle, PHONE_CHECK_NOTE, serviceCode } from "./booking-description";
import { getEngine, SlotsUnavailableError, type BookingEngine } from "./engine";
import { errorClass, logEvent } from "./log";
import { getMailer, mailErrorClass, type Mailer } from "./mail";
import { calendarLinks, CANCEL_LEAD_MS, confirmationMail, reminderMail } from "./mail-content";
import { anchorStarts, bookingRange, isBookableStart, type Interval } from "./slots";
import { readEnv } from "./env";
import { notifyStudio } from "./studio-mail";
import { inConfirmWindow } from "./attendance";
import { phoneUnusual } from "./phone";
import { isCustomerCancel } from "./cancel-reasons";
import { terminUrl } from "./links";
import { bookingRefFor } from "./ref";
import type { Customer } from "./schema";
import { CHANNEL_WALK_IN, getStore, type BookingRow, type Store } from "./store";
import { toBerlinIso } from "./time";
import type { ConsultLang } from "./i18n";
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
  /** Links für die Bestätigungsseite: Terminseite und drei Kalender-Knöpfe */
  manageUrl: string;
  calendar: { google: string; ics: string; outlook: string };
  /** mehr als 24 Stunden bis zum Termin: Verschieben und Absagen über den Link möglich */
  canManage: boolean;
}

/** unavailable: die Verfügbarkeit ließ sich bei Google nicht prüfen, deshalb wurde nichts gebucht (Kunde versucht es erneut). */
export type BookResult = { status: "booked"; booking: BookingSummary } | { status: "conflict" } | { status: "unavailable" };

export interface PlaceInput {
  requestId: string;
  selection: Selection;
  start: Date;
  durationMinutes: number;
  customer: Customer;
  lang: Lang;
  /** Beratungssprache, getrennt von der Seitensprache */
  consultLang?: ConsultLang | null;
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

/** Verschieben und kurzfristige Absage über den Link bis 2 Stunden vor dem Termin (Entscheidung Dr. Vogel, 3. Oktober 2026); kommuniziert werden 24 Stunden. */
export const SHORT_NOTICE_MS = 2 * 3600000;
export { CANCEL_LEAD_MS };

export type TerminWindow = "open" | "short" | "closed" | "past" | "cancelled";

/** Was die Terminseite anbietet: open (mehr als 24 Stunden), short (24 bis 2 Stunden), closed (unter 2), past, cancelled. */
export function terminWindow(b: BookingRow, now = new Date()): TerminWindow {
  if (b.status === "cancelled" || b.deleted_at) return "cancelled";
  if (Date.parse(b.ends_at) <= now.getTime()) return "past";
  const left = Date.parse(b.starts_at) - now.getTime();
  if (left >= CANCEL_LEAD_MS) return "open";
  if (left >= SHORT_NOTICE_MS) return "short";
  return "closed";
}

export function canCancelOnline(b: BookingRow, now = new Date()): boolean {
  const w = terminWindow(b, now);
  return w === "open" || w === "short";
}

export function summarize(b: BookingRow, requestId: string, now = new Date()): BookingSummary {
  return {
    ref: b.reference,
    requestId,
    start: toBerlinIso(new Date(b.starts_at)),
    end: toBerlinIso(new Date(b.ends_at)),
    durationMinutes: b.duration_minutes,
    binding: b.status === "confirmed",
    manageUrl: terminUrl(b.id),
    calendar: calendarLinks(b, b.language),
    canManage: Date.parse(b.starts_at) - now.getTime() >= CANCEL_LEAD_MS,
  };
}

/**
 * Was die Datenbank zur Zeitauswahl beiträgt: belegte Zeiten (blockieren) und Anschlusszeiten an den Enden eigener
 * Termine (lib/slots.ts). Beim Verschieben zählt der eigene Termin nicht als Anknüpfungspunkt.
 */
export function dbSlotInputs(store: Store, exceptId?: string, now = new Date(), checkup = false): { extraBusy: Interval[]; anchors: number[]; quarterFill?: Interval[] } {
  const { from, to } = bookingRange(now);
  const booked = store.bookedIntervals(from, to);
  const own = booked.filter((b) => b.id !== exceptId).map(({ start, end }) => ({ start, end }));
  return {
    extraBusy: booked.map(({ start, end }) => ({ start, end })),
    anchors: anchorStarts(own, readEnv().stepMinutes),
    // Nur Kontrolle: Lückenfüller um :15 und :45 an eigenen Terminen
    ...(checkup ? { quarterFill: own } : {}),
  };
}

export async function placeBooking(i: PlaceInput, deps: Deps = defaultDeps()): Promise<BookResult> {
  const { store, engine } = deps;
  const existing = store.findByRequestId(i.requestId);
  if (existing) return { status: "booked", booking: summarize(existing, i.requestId) };

  const reference = bookingRefFor(i.requestId);
  // Ohne erfolgreiche Prüfung der Verfügbarkeit keine verbindliche Buchung (Reparaturauftrag 4. Oktober 2026)
  let free: boolean;
  try {
    free = await engine.isStartFree({ start: i.start, durationMinutes: i.durationMinutes });
  } catch (e) {
    if (!(e instanceof SlotsUnavailableError)) throw e;
    logEvent("warn", "calendar_check_unavailable", { bookingRef: reference, engine: engine.name, errorClass: errorClass(e) });
    return { status: "unavailable" };
  }
  if (!free) return { status: "conflict" };

  const r = store.reserve({
    requestId: i.requestId,
    reference,
    start: i.start,
    durationMinutes: i.durationMinutes,
    selection: i.selection,
    customer: i.customer,
    lang: i.lang,
    consultLang: i.consultLang ?? null,
    consentAt: i.consentAt,
    reminder: i.reminder,
    device: i.device,
    testMode: i.testMode,
    status: i.binding ? "confirmed" : "requested",
  });
  if (r.outcome === "conflict") return { status: "conflict" };
  if (r.outcome === "created") {
    logEvent("info", "reserved", { bookingRef: reference, status: r.booking.status, engine: engine.name });
    // Ungewöhnliche Nummer: nur mitzählen, nie die Nummer selbst ins Protokoll
    if (phoneUnusual(r.booking.phone_e164)) {
      const count = Number(store.getMeta("phone_unusual_count") ?? 0) + 1;
      store.setMeta("phone_unusual_count", String(count));
      logEvent("warn", "phone_unusual", { bookingRef: reference, count });
    }
    await Promise.all([writeCalendar(r.booking, deps, false), sendConfirmation(r.booking, deps), notifyStudio("booked", r.booking, deps)]);
  }
  return { status: "booked", booking: summarize(r.booking, i.requestId) };
}

/** Zusatz im Kalender für Walk-ins (Auftrag Dr. Vogel, 9. Oktober 2026; Wortlaut nach dem Sprachleitfaden seit 10. Oktober 2026) */
export const WALK_IN_NOTE = "ohne Termin gekommen, vor Ort eingetragen";

export function calendarInput(b: BookingRow) {
  const selection = JSON.parse(b.selection) as Selection;
  const customer: Customer = { vorname: b.first_name, nachname: b.last_name, handy: b.phone_e164, email: b.email };
  if (b.channel === CHANNEL_WALK_IN) {
    // Walk-in: nur, was das Studio im Kalender braucht; keine Vorauswahl, keine Sprache, keine Erinnerung
    const rows = [WALK_IN_NOTE.charAt(0).toUpperCase() + WALK_IN_NOTE.slice(1), `Buchungsnummer: ${b.reference}`, `Besuch: ${b.first_visit === 1 ? "Erster Besuch" : "Schon einmal da"}`];
    if (phoneUnusual(b.phone_e164)) rows.push(PHONE_CHECK_NOTE);
    return {
      reference: b.reference,
      title: `${buildTitle(customer, b.test_mode === 1, b.language)} (${WALK_IN_NOTE})`,
      description: rows.join("\n"),
      start: new Date(b.starts_at),
      end: new Date(b.ends_at),
      serviceCode: serviceCode(selection),
      reminder: false,
    };
  }
  let description = buildDescription({
    bookingRef: b.reference,
    selection,
    durationMinutes: b.duration_minutes,
    customer,
    lang: b.language,
    consultLang: b.consultation_language,
    consentAt: new Date(b.consent_at),
    reminder: b.reminder_whatsapp === 1,
  });
  if (b.referral) description += `\nEmpfehlung: ${b.referral}`;
  return {
    reference: b.reference,
    title: buildTitle(customer, b.test_mode === 1, b.language),
    description,
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
    serviceCode: serviceCode(selection),
    reminder: b.reminder_whatsapp === 1,
  };
}

/**
 * Kalendereintrag schreiben und Zustand vermerken. Liest den aktuellen Stand aus der Datenbank (Version calendar_rev);
 * ein vorhandener Eintrag wird verschoben, nie ein zweiter angelegt. Hat sich die Terminzeit während des Schreibens
 * geändert, bleibt die Buchung zum Nachziehen vorgemerkt (eine ältere Antwort überschreibt nie die neuere Zeit).
 */
export async function writeCalendar(b: BookingRow, deps: Deps = defaultDeps(), lookupFirst = true): Promise<boolean> {
  const { store, engine } = deps;
  const cur = store.findById(b.id) ?? b;
  try {
    let eventId = cur.calendar_event_id ?? (lookupFirst ? await engine.findEventIdByRef(cur.reference) : null);
    if (eventId) await engine.moveEvent(eventId, new Date(cur.starts_at), new Date(cur.ends_at)); // Zeiten angleichen, kein zweiter Eintrag
    if (!eventId) eventId = await engine.createEvent(calendarInput(cur));
    if (!store.calendarWritten(cur.id, eventId, new Date(), cur.calendar_rev)) {
      logEvent("warn", "calendar_stale", { bookingRef: cur.reference, engine: engine.name });
      return false;
    }
    logEvent("info", "calendar_written", { bookingRef: cur.reference, engine: engine.name });
    return true;
  } catch (e) {
    store.calendarFailed(b.id);
    logEvent("error", "calendar_write_failed", { bookingRef: b.reference, engine: engine.name, errorClass: errorClass(e) });
    return false;
  }
}

export interface WalkInRequest {
  requestId: string;
  checkedInAt: Date;
  durationMinutes: number;
  firstName: string;
  lastName: string;
  /** schon bereinigt: + und Ziffern */
  phone: string;
  email: string;
  firstVisit: boolean;
  testMode: boolean;
}

export type WalkInOutcome = { created: boolean; booking: BookingRow; overlaps: { id: string; reference: string }[] };

/**
 * Walk-in nachtragen: bestätigter Termin (Kanal walk_in), Belegung, Ereignis created, Kalendereintrag mit Zusatz
 * „ohne Termin gekommen, vor Ort eingetragen“. Keine Mail an den Kunden, keine Erinnerung, keine Studio-Mail (das Studio hat ihn selbst
 * gemeldet). Scheitert der Kalendereintrag, holt ihn der Hintergrundlauf nach.
 */
export async function recordWalkIn(i: WalkInRequest, deps: Deps = defaultDeps()): Promise<WalkInOutcome> {
  const { store, engine } = deps;
  const r = store.reserveWalkIn({
    requestId: i.requestId,
    reference: bookingRefFor(i.requestId),
    start: i.checkedInAt,
    durationMinutes: i.durationMinutes,
    firstName: i.firstName,
    lastName: i.lastName,
    phone: i.phone,
    email: i.email,
    firstVisit: i.firstVisit,
    testMode: i.testMode,
  });
  if (r.outcome === "existing") return { created: false, booking: r.booking, overlaps: [] };
  logEvent("info", "walk_in_recorded", { bookingRef: r.booking.reference, engine: engine.name, status: r.overlaps.length ? "überlappt" : "frei" });
  await writeCalendar(r.booking, deps, false);
  return { created: true, booking: store.findById(r.booking.id) ?? r.booking, overlaps: r.overlaps };
}

/** Bestätigungsmail sofort nach dem Commit; bei Fehler bleibt die Buchung gültig, der Hintergrundlauf wiederholt. */
export async function sendConfirmation(b: BookingRow, deps: Deps = defaultDeps(), now = new Date()): Promise<boolean> {
  const { store, mailer } = deps;
  if (!mailer.enabled || b.channel === CHANNEL_WALK_IN) return false;
  // Vor dem Senden beanspruchen: Sofortversand und Hintergrundlauf senden dieselbe Mail nie doppelt
  if (!store.claimBookingMail(b.id, "confirmation", now)) return false;
  const cur = store.findById(b.id) ?? b;
  try {
    await mailer.send(confirmationMail(cur, now));
    store.mailConfirmationSent(b.id, now);
    store.releaseBookingMail(b.id, "confirmation");
    logEvent("info", "mail_sent", { bookingRef: b.reference, mail: "confirmation" });
    return true;
  } catch (e) {
    store.mailConfirmationFailed(b.id, now);
    store.releaseBookingMail(b.id, "confirmation");
    logEvent("error", "mail_failed", { bookingRef: b.reference, mail: "confirmation", errorClass: mailErrorClass(e) });
    return false;
  }
}

/** Erinnerungsmail an eine Buchung; Fälligkeit entscheidet lib/reminder-list.ts (Vortag 10:00 Uhr). */
export async function sendReminder(b: BookingRow, deps: Deps = defaultDeps(), now = new Date()): Promise<"sent" | "failed" | "busy"> {
  const { store, mailer } = deps;
  if (!store.claimBookingMail(b.id, "reminder", now)) return "busy";
  try {
    await mailer.send(reminderMail(b));
    store.mailReminderSent(b.id, now);
    store.releaseBookingMail(b.id, "reminder");
    logEvent("info", "mail_sent", { bookingRef: b.reference, mail: "reminder" });
    return "sent";
  } catch (e) {
    store.mailReminderFailed(b.id, now);
    store.releaseBookingMail(b.id, "reminder");
    logEvent("error", "mail_failed", { bookingRef: b.reference, mail: "reminder", errorClass: mailErrorClass(e) });
    return "failed";
  }
}

/** Absage: Datenbank zuerst (Belegung frei), dann Kalendereintrag löschen; scheitert das, räumt der Hintergrundlauf nach. */
export async function cancelBooking(id: string, reason: string, deps: Deps = defaultDeps(), now = new Date()): Promise<BookingRow | null> {
  const { store } = deps;
  const before = store.findById(id);
  const shortNotice = before ? terminWindow(before, now) === "short" : false;
  const row = store.cancel(id, reason, now);
  if (!row) return null;
  logEvent("info", "cancelled", { bookingRef: row.reference, reason });
  await removeCalendarEvent(row, deps);
  if (isCustomerCancel(reason)) await notifyStudio(shortNotice ? "cancelled_short" : "cancelled", row, deps, now);
  return row;
}

export type RescheduleResult = { status: "rescheduled"; booking: BookingRow } | { status: "conflict" } | { status: "invalid" } | { status: "missing" } | { status: "unavailable" };

/**
 * Verschieben (bis 2 Stunden vor dem alten Termin, beliebig oft): neue Zeit nach denselben Regeln wie bei der Buchung,
 * dieselbe Dauer; erst neue Belegung, dann Freigabe der alten (eine Transaktion). Kalendereintrag wird verschoben,
 * neue Bestätigung geht raus, Erinnerung nach den normalen Regeln, Studio-Mail.
 */
export async function rescheduleBooking(id: string, newStart: Date, deps: Deps = defaultDeps(), now = new Date()): Promise<RescheduleResult> {
  const { store, engine } = deps;
  const current = store.findById(id);
  if (!current || current.deleted_at || current.status === "cancelled") return { status: "missing" };
  const w = terminWindow(current, now);
  if (w !== "open" && w !== "short") return { status: "invalid" };
  if (newStart.getTime() % 300000 !== 0 || !isBookableStart(newStart, now)) return { status: "invalid" };
  // Ohne erfolgreiche Prüfung keine Verschiebung; der bisherige Termin bleibt unverändert
  let free: boolean;
  try {
    free = await engine.isStartFree({ start: newStart, durationMinutes: current.duration_minutes, now });
  } catch (e) {
    if (!(e instanceof SlotsUnavailableError)) throw e;
    logEvent("warn", "calendar_check_unavailable", { bookingRef: current.reference, engine: engine.name, errorClass: errorClass(e) });
    return { status: "unavailable" };
  }
  if (!free) return { status: "conflict" };
  const r = store.reschedule(id, newStart, now);
  if (r.outcome !== "rescheduled") return r.outcome === "conflict" ? { status: "conflict" } : { status: "missing" };
  const b = r.booking!;
  logEvent("info", "rescheduled", { bookingRef: b.reference });
  await Promise.all([writeCalendar(b, deps, true), sendConfirmation(b, deps, now), notifyStudio("rescheduled", b, deps, now)]);
  return { status: "rescheduled", booking: store.findById(id)! };
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
/** Zusage „Ja, ich komme“; erst ab Vortag 10 Uhr, vorher null (lib/attendance.ts). */
export function confirmAttendance(id: string, deps: Deps = defaultDeps(), now = new Date()): BookingRow | null {
  const row = deps.store.confirmAttendance(id, now);
  if (row) logEvent("info", "attendance_confirmed", { bookingRef: row.reference });
  return row;
}

/** Darf die Terminseite den Zusage-Block zeigen? Nur im Zusagefenster und solange der Termin aussteht. */
export function canConfirmAttendance(b: BookingRow, now = new Date()): boolean {
  const w = terminWindow(b, now);
  return (w === "open" || w === "short" || w === "closed") && !b.attendance_confirmed_at && inConfirmWindow(new Date(b.starts_at), now);
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
