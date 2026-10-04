import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { serviceCode } from "./booking-description";
import { normalizePhoneE164 } from "./phone";
import { isUniqueViolation, openDatabase } from "./db";
import { readEnv } from "./env";
import type { Customer } from "./schema";
import type { Interval } from "./slots";
import type { Lang, Selection } from "./treatments";
import { appointmentType, toSharedServiceCodes, toSharedZones, type AppointmentType } from "./service-codes";
import { ulid } from "./ulid";

/*
 * Reservierung in der eigenen Datenbank. Jede Buchung belegt alle 10-Minuten-Einheiten ihrer Dauer
 * in slot_locks; die Eindeutigkeit der Einheit entscheidet atomar, wer die Zeit bekommt.
 * Jede Änderung schreibt in derselben Transaktion ein Ereignis mit fortlaufender Nummer.
 */
export const UNIT_MINUTES = 10;
const UNIT_MS = UNIT_MINUTES * 60000;

export type BookingStatus = "requested" | "confirmed" | "cancelled" | "rescheduled" | "no_show" | "completed";
export type CalendarState = "pending" | "written" | "failed";
export type EventType = "created" | "confirmed" | "cancelled" | "rescheduled" | "reminder_changed" | "completed" | "deleted" | "attendance_confirmed";

export interface BookingRow {
  id: string;
  reference: string;
  created_at: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  persons: 1 | 2;
  first_visit: number;
  service_codes: string;
  zones: string;
  checkup: number;
  status: BookingStatus;
  channel: string;
  language: Lang;
  device: string;
  reminder_whatsapp: number;
  reminder_consent_at: string | null;
  consent_at: string;
  first_name: string;
  last_name: string;
  phone_e164: string;
  email: string;
  note: string;
  referral: string | null;
  selection: string;
  test_mode: number;
  calendar_event_id: string | null;
  calendar_state: CalendarState;
  calendar_attempts: number;
  calendar_attempted_at: string | null;
  updated_at: string;
  deleted_at: string | null;
  attendance_confirmed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  mail_confirmation_sent_at: string | null;
  mail_confirmation_attempts: number;
  mail_confirmation_attempted_at: string | null;
  mail_reminder_sent_at: string | null;
  mail_reminder_attempts: number;
  mail_reminder_skipped: number;
  previous_starts_at: string | null;
  rescheduled_at: string | null;
  /** Version der Terminzeit; jede Änderung von Beginn oder Ende zählt hoch (Schutz vor veralteten Kalenderantworten) */
  calendar_rev: number;
  /** gesetzt, wenn der Kalender einer Terminänderung nachgezogen werden muss */
  calendar_pending_at: string | null;
  mail_confirmation_claimed_until: string | null;
  mail_reminder_claimed_until: string | null;
}

/**
 * Vollständiger Buchungsstand, wie er in Ereignissen und am Endpunkt erscheint (Fassung 4):
 * gemeinsame Codes des Kundensystems, appointment_type, reminder_whatsapp als Objekt, test-Kennzeichen.
 */
export interface BookingPayload {
  id: string;
  reference: string;
  created_at: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  persons: 1 | 2;
  appointment_type: AppointmentType;
  first_visit: boolean;
  checkup: boolean;
  service_codes: string[];
  zones: string[];
  other_zone: string | null;
  zones_unknown: boolean;
  status: BookingStatus;
  channel: string;
  language: Lang;
  device: string;
  reminder_whatsapp: { consented: boolean; consented_at: string | null };
  consent_at: string;
  first_name: string;
  last_name: string;
  phone_e164: string;
  email: string;
  note: string;
  referral: string | null;
  test: boolean;
  calendar_event_id: string | null;
  calendar_state: CalendarState;
  attendance_confirmed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  updated_at: string;
}

/** Ereignis-Umschlag, wie er am Endpunkt ausgeliefert wird. */
export interface EventEnvelope {
  seq: number;
  event_id: string;
  type: EventType;
  occurred_at: string;
  booking: BookingPayload | { id: string; reference: string };
}

export interface ReserveInput {
  requestId: string;
  reference: string;
  start: Date;
  durationMinutes: number;
  selection: Selection;
  customer: Customer;
  lang: Lang;
  consentAt: Date;
  reminder: boolean;
  device: "mobile" | "desktop";
  testMode: boolean;
  status: "requested" | "confirmed";
  now?: Date;
}

export type ReserveResult = { outcome: "created" | "existing"; booking: BookingRow } | { outcome: "conflict" };

/** Die Anfragekennung selbst wird nicht gespeichert, nur ihr Hash. */
export function requestKey(requestId: string): string {
  return createHash("sha256").update(`paloskin-request:${requestId}`).digest("base64url");
}

/** Leistungscodes ohne Personenzahl und Kontrolltermin, die eigene Felder haben. */
export function serviceCodesOf(s: Selection): string[] {
  return serviceCode(s)
    .split("+")
    .filter((c) => c !== "NONE" && c !== "P2" && c !== "KON");
}

export function toPayload(r: BookingRow): BookingPayload {
  const sel = JSON.parse(r.selection) as Selection;
  return {
    id: r.id,
    reference: r.reference,
    created_at: r.created_at,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    duration_minutes: r.duration_minutes,
    persons: r.persons,
    appointment_type: appointmentType({ checkup: r.checkup === 1, firstVisit: r.first_visit === 1 }),
    first_visit: r.first_visit === 1,
    checkup: r.checkup === 1,
    service_codes: toSharedServiceCodes(JSON.parse(r.service_codes) as string[]),
    zones: toSharedZones(sel.zones),
    other_zone: sel.otherZone ?? null,
    zones_unknown: sel.zonesUnknown === true,
    status: r.status,
    channel: r.channel,
    language: r.language,
    device: r.device,
    reminder_whatsapp: { consented: r.reminder_whatsapp === 1, consented_at: r.reminder_consent_at },
    consent_at: r.consent_at,
    first_name: r.first_name,
    last_name: r.last_name,
    phone_e164: r.phone_e164,
    email: r.email,
    note: r.note,
    referral: r.referral,
    test: r.test_mode === 1,
    calendar_event_id: r.calendar_event_id,
    calendar_state: r.calendar_state,
    attendance_confirmed_at: r.attendance_confirmed_at,
    cancelled_at: r.cancelled_at,
    cancel_reason: r.cancel_reason,
    updated_at: r.updated_at,
  };
}

const iso = (d: Date) => d.toISOString();
/* Beanspruchung einer Mail vor dem Senden; bricht der Prozess ab, ist sie nach dieser Zeit wieder frei */
const CLAIM_MS = 10 * 60000;

export class Store {
  constructor(readonly db: DatabaseSync) {}

  private get(id: string): BookingRow | null {
    return (this.db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as BookingRow | undefined) ?? null;
  }

  findById(id: string): BookingRow | null {
    return this.get(id);
  }

  findByRequestId(requestId: string): BookingRow | null {
    const row = this.db
      .prepare("SELECT b.* FROM idempotency i JOIN bookings b ON b.id = i.booking_id WHERE i.request_key = ?")
      .get(requestKey(requestId)) as BookingRow | undefined;
    return row ?? null;
  }

  findByCalendarEventId(eventId: string): BookingRow | null {
    const row = this.db.prepare("SELECT * FROM bookings WHERE calendar_event_id = ? AND deleted_at IS NULL LIMIT 1").get(eventId) as BookingRow | undefined;
    return row ?? null;
  }

  findByReference(reference: string): BookingRow | null {
    const row = this.db
      .prepare("SELECT * FROM bookings WHERE reference = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1")
      .get(reference) as BookingRow | undefined;
    return row ?? null;
  }

  /** Ereignis in der laufenden Transaktion anhängen; Nutzlast ist der vollständige Stand nach der Änderung. */
  private appendEvent(booking: BookingRow, type: EventType, at: string, payload: unknown = toPayload(booking)): void {
    this.db
      .prepare("INSERT INTO booking_events (event_id, booking_id, type, payload, occurred_at) VALUES (?, ?, ?, ?, ?)")
      .run(ulid(), booking.id, type, JSON.stringify(payload), at);
  }

  /**
   * Reservieren: Idempotenz prüfen, Einheiten belegen, Buchung und Ereignis schreiben, alles in einer Transaktion.
   * Eine belegte Einheit heißt „Da war jemand schneller“.
   */
  reserve(i: ReserveInput): ReserveResult {
    const startMs = i.start.getTime();
    if (startMs % UNIT_MS !== 0) throw new Error("Beginn liegt nicht im 10-Minuten-Raster");
    if (!Number.isInteger(i.durationMinutes) || i.durationMinutes <= 0) throw new Error("Dauer ungültig");
    const now = iso(i.now ?? new Date());
    const key = requestKey(i.requestId);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.findByRequestId(i.requestId);
      if (existing) {
        this.db.exec("COMMIT");
        return { outcome: "existing", booking: existing };
      }
      const id = ulid();
      const endMs = startMs + i.durationMinutes * 60000;
      const s = i.selection;
      this.db
        .prepare(
          `INSERT INTO bookings (id, reference, created_at, starts_at, ends_at, duration_minutes, persons, first_visit, service_codes, zones, checkup,
             status, channel, language, device, reminder_whatsapp, reminder_consent_at, consent_at, first_name, last_name, phone_e164, email, note,
             referral, selection, test_mode, calendar_event_id, calendar_state, calendar_attempts, calendar_attempted_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'web', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, 'pending', 0, NULL, ?, NULL)`,
        )
        .run(
          id,
          i.reference,
          now,
          iso(i.start),
          iso(new Date(endMs)),
          i.durationMinutes,
          s.persons,
          s.visit === "first" ? 1 : 0,
          JSON.stringify(serviceCodesOf(s)),
          JSON.stringify(s.zones),
          s.checkup ? 1 : 0,
          i.status,
          i.lang,
          i.device,
          i.reminder ? 1 : 0,
          i.reminder ? iso(i.consentAt) : null,
          iso(i.consentAt),
          i.customer.vorname.trim(),
          i.customer.nachname.trim(),
          normalizePhoneE164(i.customer.handy) ?? i.customer.handy,
          i.customer.email.trim().toLowerCase(),
          s.note ?? "",
          JSON.stringify(s),
          i.testMode ? 1 : 0,
          now,
        );
      const insertLock = this.db.prepare("INSERT INTO slot_locks (slot_start, booking_id) VALUES (?, ?)");
      const firstUnit = startMs / 60000;
      const units = Math.ceil(i.durationMinutes / UNIT_MINUTES);
      for (let u = 0; u < units; u++) insertLock.run(firstUnit + u * UNIT_MINUTES, id);
      this.db.prepare("INSERT INTO idempotency (request_key, booking_id, created_at) VALUES (?, ?, ?)").run(key, id, now);
      const row = this.get(id)!;
      this.appendEvent(row, "created", now);
      this.db.exec("COMMIT");
      return { outcome: "created", booking: row };
    } catch (e) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        /* Transaktion war schon beendet */
      }
      if (isUniqueViolation(e)) return { outcome: "conflict" };
      throw e;
    }
  }

  /** Belegte Zeiten aus der Datenbank im Zeitraum, als Intervalle in Millisekunden. */
  lockedIntervals(from: Date, to: Date): Interval[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT b.starts_at, b.ends_at FROM slot_locks l JOIN bookings b ON b.id = l.booking_id
         WHERE l.slot_start >= ? AND l.slot_start < ?`,
      )
      .all(Math.floor(from.getTime() / 60000) - 24 * 60, Math.ceil(to.getTime() / 60000)) as { starts_at: string; ends_at: string }[];
    return rows.map((r) => ({ start: Date.parse(r.starts_at), end: Date.parse(r.ends_at) }));
  }

  /**
   * Kalendereintrag geschrieben. Mit rev nur dann „written“, wenn sich die Terminzeit seit dem Lesen nicht geändert hat;
   * sonst bleibt die Buchung zum Nachziehen vorgemerkt und der Hintergrundlauf gleicht mit der neuen Zeit ab.
   */
  calendarWritten(id: string, eventId: string, now = new Date(), rev?: number): boolean {
    const at = iso(now);
    if (rev === undefined) {
      this.db
        .prepare(
          `UPDATE bookings SET calendar_state = 'written', calendar_event_id = ?, calendar_pending_at = NULL, calendar_attempts = calendar_attempts + 1,
           calendar_attempted_at = ?, updated_at = ? WHERE id = ?`,
        )
        .run(eventId, at, at, id);
      return true;
    }
    const r = this.db
      .prepare(
        `UPDATE bookings SET calendar_state = 'written', calendar_event_id = ?, calendar_pending_at = NULL, calendar_attempts = calendar_attempts + 1,
         calendar_attempted_at = ?, updated_at = ? WHERE id = ? AND calendar_rev = ?`,
      )
      .run(eventId, at, at, id, rev);
    if (r.changes === 1) return true;
    // Zwischendurch geändert: Kennung merken, Abgleich bleibt offen
    this.db
      .prepare("UPDATE bookings SET calendar_event_id = ?, calendar_state = 'pending', calendar_pending_at = ?, calendar_attempts = calendar_attempts + 1, calendar_attempted_at = ? WHERE id = ?")
      .run(eventId, iso(new Date(now.getTime() - 3 * 60000)), at, id);
    return false;
  }

  calendarFailed(id: string, now = new Date()): void {
    this.db
      .prepare(
        `UPDATE bookings SET calendar_state = 'failed', calendar_attempts = calendar_attempts + 1,
         calendar_attempted_at = ?, updated_at = ? WHERE id = ?`,
      )
      .run(iso(now), iso(now), id);
  }

  /** Buchungen ohne Kalendereintrag: gescheitert, oder seit über zwei Minuten offen (Abbruch zwischen Commit und Eintrag). */
  calendarBacklog(now = new Date(), limit = 50): BookingRow[] {
    const stale = iso(new Date(now.getTime() - 2 * 60000));
    return this.db
      .prepare(
        `SELECT * FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND calendar_state <> 'written'
         AND (calendar_state = 'failed' OR COALESCE(calendar_pending_at, created_at) < ?) ORDER BY created_at LIMIT ?`,
      )
      .all(stale, limit) as unknown as BookingRow[];
  }

  /** Anzahl Buchungen, deren Kalendereintrag seit mehr als 24 Stunden fehlt. */
  countCalendarOverdue(now = new Date()): number {
    const limit = iso(new Date(now.getTime() - 24 * 3600000));
    const r = this.db
      .prepare("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND calendar_state <> 'written' AND COALESCE(calendar_pending_at, created_at) < ?")
      .get(limit) as { n: number };
    return r.n;
  }

  countCalendarFailed(): number {
    const r = this.db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND calendar_state = 'failed'").get() as { n: number };
    return r.n;
  }

  setReferral(id: string, referral: string, now = new Date()): void {
    this.db.prepare("UPDATE bookings SET referral = ?, updated_at = ? WHERE id = ?").run(referral, iso(now), id);
  }

  /** Idempotenzschlüssel bleiben 7 Tage. */
  purgeIdempotency(now = new Date()): number {
    const limit = iso(new Date(now.getTime() - 7 * 86400000));
    return Number(this.db.prepare("DELETE FROM idempotency WHERE created_at < ?").run(limit).changes);
  }

  /** Absage: Status, Belegung freigeben, Ereignis, alles in einer Transaktion. Liefert null, wenn schon abgesagt oder gelöscht. */
  cancel(id: string, reason: string, now = new Date()): BookingRow | null {
    const at = iso(now);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.get(id);
      if (!row || row.deleted_at || row.status === "cancelled") {
        this.db.exec("COMMIT");
        return null;
      }
      this.db
        .prepare("UPDATE bookings SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = ? WHERE id = ?")
        .run(at, reason.slice(0, 80), at, id);
      this.db.prepare("DELETE FROM slot_locks WHERE booking_id = ?").run(id);
      const updated = this.get(id)!;
      this.appendEvent(updated, "cancelled", at);
      this.db.exec("COMMIT");
      return updated;
    } catch (e) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        /* schon beendet */
      }
      throw e;
    }
  }

  /** Zusage des Kunden („Ja, ich komme“): einmalig vermerken und als Ereignis schreiben. */
  confirmAttendance(id: string, now = new Date()): BookingRow | null {
    const at = iso(now);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.get(id);
      if (!row || row.deleted_at || row.status === "cancelled") {
        this.db.exec("COMMIT");
        return null;
      }
      if (row.attendance_confirmed_at) {
        this.db.exec("COMMIT");
        return row;
      }
      this.db.prepare("UPDATE bookings SET attendance_confirmed_at = ?, updated_at = ? WHERE id = ?").run(at, at, id);
      const updated = this.get(id)!;
      this.appendEvent(updated, "attendance_confirmed", at);
      this.db.exec("COMMIT");
      return updated;
    } catch (e) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        /* schon beendet */
      }
      throw e;
    }
  }

  mailConfirmationSent(id: string, now = new Date()): void {
    this.db
      .prepare("UPDATE bookings SET mail_confirmation_sent_at = ?, mail_confirmation_attempts = mail_confirmation_attempts + 1, mail_confirmation_attempted_at = ?, updated_at = ? WHERE id = ?")
      .run(iso(now), iso(now), iso(now), id);
  }

  mailConfirmationFailed(id: string, now = new Date()): void {
    this.db
      .prepare("UPDATE bookings SET mail_confirmation_attempts = mail_confirmation_attempts + 1, mail_confirmation_attempted_at = ?, updated_at = ? WHERE id = ?")
      .run(iso(now), iso(now), id);
  }

  mailReminderSent(id: string, now = new Date()): void {
    this.db
      .prepare("UPDATE bookings SET mail_reminder_sent_at = ?, mail_reminder_attempts = mail_reminder_attempts + 1, updated_at = ? WHERE id = ?")
      .run(iso(now), iso(now), id);
  }

  mailReminderFailed(id: string, now = new Date()): void {
    this.db.prepare("UPDATE bookings SET mail_reminder_attempts = mail_reminder_attempts + 1, updated_at = ? WHERE id = ?").run(iso(now), id);
  }

  mailReminderSkipped(id: string, now = new Date()): void {
    this.db.prepare("UPDATE bookings SET mail_reminder_skipped = 1, updated_at = ? WHERE id = ?").run(iso(now), id);
  }

  /** Bestätigungsmails, die noch fehlen: gescheitert oder seit über zwei Minuten offen, Termin noch nicht vorbei. */
  confirmationMailBacklog(now = new Date(), limit = 50): BookingRow[] {
    const stale = iso(new Date(now.getTime() - 2 * 60000));
    return this.db
      .prepare(
        `SELECT * FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND mail_confirmation_sent_at IS NULL
         AND starts_at > ? AND (mail_confirmation_attempts > 0 OR created_at < ?) ORDER BY created_at LIMIT ?`,
      )
      .all(iso(now), stale, limit) as unknown as BookingRow[];
  }

  /** Nicht abgesagte Termine im Zeitraum, nach Beginn sortiert (Erinnerung, Handliste). */
  bookingsBetween(from: Date, to: Date): BookingRow[] {
    return this.db
      .prepare("SELECT * FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND starts_at >= ? AND starts_at < ? ORDER BY starts_at")
      .all(iso(from), iso(to)) as unknown as BookingRow[];
  }

  /** Abgesagte Buchungen, deren Kalendereintrag noch steht. */
  cancelledWithCalendarEvent(limit = 50): BookingRow[] {
    return this.db
      .prepare("SELECT * FROM bookings WHERE deleted_at IS NULL AND status = 'cancelled' AND calendar_event_id IS NOT NULL ORDER BY updated_at LIMIT ?")
      .all(limit) as unknown as BookingRow[];
  }

  calendarEventRemoved(id: string, now = new Date()): void {
    this.db.prepare("UPDATE bookings SET calendar_event_id = NULL, updated_at = ? WHERE id = ?").run(iso(now), id);
  }

  /** Anzahl Buchungen, deren Bestätigungsmail seit mehr als 24 Stunden fehlt (Termin noch nicht vorbei). */
  countMailOverdue(now = new Date()): number {
    const limit = iso(new Date(now.getTime() - 24 * 3600000));
    const r = this.db
      .prepare("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND mail_confirmation_sent_at IS NULL AND starts_at > ? AND created_at < ?")
      .get(iso(now), limit) as { n: number };
    return r.n;
  }

  /**
   * Verschieben: alte Belegung freigeben und neue belegen in einer Transaktion. Scheitert die neue Zeit, bleibt die
   * alte stehen (Rollback). Zusage, Erinnerung und Bestätigungsmail werden zurückgesetzt, Ereignis rescheduled.
   */
  reschedule(id: string, newStart: Date, now = new Date()): { outcome: "rescheduled" | "conflict" | "missing"; booking: BookingRow | null } {
    const startMs = newStart.getTime();
    if (startMs % UNIT_MS !== 0) throw new Error("Beginn liegt nicht im 10-Minuten-Raster");
    const at = iso(now);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.get(id);
      if (!row || row.deleted_at || row.status === "cancelled") {
        this.db.exec("COMMIT");
        return { outcome: "missing", booking: null };
      }
      this.db.prepare("DELETE FROM slot_locks WHERE booking_id = ?").run(id);
      const insertLock = this.db.prepare("INSERT INTO slot_locks (slot_start, booking_id) VALUES (?, ?)");
      const firstUnit = startMs / 60000;
      const units = Math.ceil(row.duration_minutes / UNIT_MINUTES);
      for (let u = 0; u < units; u++) insertLock.run(firstUnit + u * UNIT_MINUTES, id);
      const endMs = startMs + row.duration_minutes * 60000;
      this.db
        .prepare(
          `UPDATE bookings SET previous_starts_at = starts_at, starts_at = ?, ends_at = ?, rescheduled_at = ?, attendance_confirmed_at = NULL,
           mail_reminder_sent_at = NULL, mail_reminder_skipped = 0, mail_reminder_attempts = 0,
           mail_confirmation_sent_at = NULL, mail_confirmation_attempts = 0, mail_confirmation_attempted_at = NULL,
           calendar_state = 'pending', calendar_pending_at = ?, calendar_rev = calendar_rev + 1, updated_at = ? WHERE id = ?`,
        )
        .run(iso(newStart), iso(new Date(endMs)), at, at, at, id);
      const updated = this.get(id)!;
      this.appendEvent(updated, "rescheduled", at);
      this.db.exec("COMMIT");
      return { outcome: "rescheduled", booking: updated };
    } catch (e) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        /* schon beendet */
      }
      if (isUniqueViolation(e)) return { outcome: "conflict", booking: null };
      throw e;
    }
  }

  /**
   * Zeiten aus dem Kalender übernehmen (Abgleich, lib/calendar-sync.ts). Was das Studio im Kalender macht, gilt immer:
   * kein Raster, keine Fenster, kein Vorlauf; liegt eine Einheit schon bei einer anderen Buchung, bleibt sie dort (der
   * Kalender selbst blockt die Zeit online über frei/belegt). „moved“: wie Verschieben (Bisher, Zusage und Mails zurück).
   * „resized“: nur Ende und Dauer, sonst nichts. Beide schreiben das Ereignis rescheduled.
   */
  applyCalendarTimes(id: string, start: Date, end: Date, kind: "moved" | "resized", now = new Date()): { outcome: "applied" | "missing"; booking: BookingRow | null; overlap: boolean } {
    const startMs = start.getTime();
    const endMs = end.getTime();
    if (!(endMs > startMs)) throw new Error("Ende liegt nicht nach dem Beginn");
    const at = iso(now);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.get(id);
      if (!row || row.deleted_at || row.status === "cancelled") {
        this.db.exec("COMMIT");
        return { outcome: "missing", booking: null, overlap: false };
      }
      this.db.prepare("DELETE FROM slot_locks WHERE booking_id = ?").run(id);
      const insertLock = this.db.prepare("INSERT OR IGNORE INTO slot_locks (slot_start, booking_id) VALUES (?, ?)");
      const firstUnit = Math.floor(startMs / UNIT_MS) * UNIT_MINUTES;
      const lastUnit = Math.ceil(endMs / UNIT_MS) * UNIT_MINUTES;
      let overlap = false;
      for (let u = firstUnit; u < lastUnit; u += UNIT_MINUTES) if (insertLock.run(u, id).changes === 0) overlap = true;
      const minutes = Math.max(1, Math.round((endMs - startMs) / 60000));
      if (kind === "moved") {
        this.db
          .prepare(
            `UPDATE bookings SET previous_starts_at = starts_at, starts_at = ?, ends_at = ?, duration_minutes = ?, rescheduled_at = ?, attendance_confirmed_at = NULL,
             mail_reminder_sent_at = NULL, mail_reminder_skipped = 0, mail_reminder_attempts = 0,
             mail_confirmation_sent_at = NULL, mail_confirmation_attempts = 0, mail_confirmation_attempted_at = NULL,
             calendar_rev = calendar_rev + 1, updated_at = ? WHERE id = ?`,
          )
          .run(iso(start), iso(end), minutes, at, at, id);
      } else {
        this.db.prepare("UPDATE bookings SET ends_at = ?, duration_minutes = ?, calendar_rev = calendar_rev + 1, updated_at = ? WHERE id = ?").run(iso(end), minutes, at, id);
      }
      const updated = this.get(id)!;
      this.appendEvent(updated, "rescheduled", at);
      this.db.exec("COMMIT");
      return { outcome: "applied", booking: updated, overlap };
    } catch (e) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        /* schon beendet */
      }
      throw e;
    }
  }

  /** Studio-Mails: Warteschlange, damit ein Versandfehler nie eine Buchung verhindert. */
  enqueueStudioMail(subject: string, body: string, now = new Date()): number {
    const r = this.db.prepare("INSERT INTO studio_mails (subject, body, created_at) VALUES (?, ?, ?)").run(subject, body, iso(now));
    return Number(r.lastInsertRowid);
  }

  studioMailsPending(now = new Date(), limit = 50): { id: number; subject: string; body: string; attempts: number }[] {
    const retryBefore = iso(new Date(now.getTime() - 4 * 60000));
    return this.db
      .prepare("SELECT id, subject, body, attempts FROM studio_mails WHERE sent_at IS NULL AND attempts < 20 AND (attempted_at IS NULL OR attempted_at < ?) AND (claimed_until IS NULL OR claimed_until < ?) ORDER BY id LIMIT ?")
      .all(retryBefore, iso(now), limit) as { id: number; subject: string; body: string; attempts: number }[];
  }

  /** Eintrag vor dem Senden für zehn Minuten beanspruchen; false, wenn ein anderer Lauf ihn schon bearbeitet oder er gesendet ist. */
  claimStudioMail(id: number, now = new Date()): boolean {
    const r = this.db
      .prepare("UPDATE studio_mails SET claimed_until = ? WHERE id = ? AND sent_at IS NULL AND (claimed_until IS NULL OR claimed_until < ?)")
      .run(iso(new Date(now.getTime() + CLAIM_MS)), id, iso(now));
    return r.changes === 1;
  }

  studioMailSent(id: number, now = new Date()): void {
    this.db.prepare("UPDATE studio_mails SET sent_at = ?, attempts = attempts + 1, attempted_at = ?, claimed_until = NULL WHERE id = ?").run(iso(now), iso(now), id);
  }

  studioMailFailed(id: number, now = new Date()): void {
    this.db.prepare("UPDATE studio_mails SET attempts = attempts + 1, attempted_at = ?, claimed_until = NULL WHERE id = ?").run(iso(now), id);
  }

  /** Bestätigungs- oder Erinnerungsmail einer Buchung vor dem Senden beanspruchen (gleiches Prinzip wie Studio-Mails). */
  claimBookingMail(id: string, kind: "confirmation" | "reminder", now = new Date()): boolean {
    const col = kind === "confirmation" ? "mail_confirmation_claimed_until" : "mail_reminder_claimed_until";
    const sent = kind === "confirmation" ? "mail_confirmation_sent_at" : "mail_reminder_sent_at";
    const r = this.db
      .prepare(`UPDATE bookings SET ${col} = ? WHERE id = ? AND ${sent} IS NULL AND (${col} IS NULL OR ${col} < ?)`)
      .run(iso(new Date(now.getTime() + CLAIM_MS)), id, iso(now));
    return r.changes === 1;
  }

  releaseBookingMail(id: string, kind: "confirmation" | "reminder"): void {
    const col = kind === "confirmation" ? "mail_confirmation_claimed_until" : "mail_reminder_claimed_until";
    this.db.prepare(`UPDATE bookings SET ${col} = NULL WHERE id = ?`).run(id);
  }

  /** Zustand für die Überwachung: offene Arbeiten älter als die Grenze, ohne Kundendaten. */
  overdueWork(now = new Date(), olderThanMinutes = 30): { calendar: number; confirmation: number; studio: number } {
    const limit = iso(new Date(now.getTime() - olderThanMinutes * 60000));
    const one = (sql: string, ...args: (string | number)[]) => (this.db.prepare(sql).get(...args) as { n: number }).n;
    return {
      calendar: one("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND calendar_state <> 'written' AND COALESCE(calendar_pending_at, created_at) < ?", limit),
      confirmation: one("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND mail_confirmation_sent_at IS NULL AND starts_at > ? AND COALESCE(rescheduled_at, created_at) < ?", iso(now), limit),
      studio: one("SELECT COUNT(*) AS n FROM studio_mails WHERE sent_at IS NULL AND created_at < ?", limit),
    };
  }

  /** Bestätigung durch das Kundensystem: requested wird confirmed, Ereignis confirmed; sonst unverändert. */
  confirmByCrm(id: string, now = new Date()): { outcome: "confirmed" | "unchanged" | "cancelled" | "missing"; booking: BookingRow | null } {
    const at = iso(now);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.get(id);
      if (!row || row.deleted_at) {
        this.db.exec("COMMIT");
        return { outcome: "missing", booking: null };
      }
      if (row.status === "cancelled") {
        this.db.exec("COMMIT");
        return { outcome: "cancelled", booking: row };
      }
      if (row.status !== "requested") {
        this.db.exec("COMMIT");
        return { outcome: "unchanged", booking: row };
      }
      this.db.prepare("UPDATE bookings SET status = 'confirmed', updated_at = ? WHERE id = ?").run(at, id);
      const updated = this.get(id)!;
      this.appendEvent(updated, "confirmed", at);
      this.db.exec("COMMIT");
      return { outcome: "confirmed", booking: updated };
    } catch (e) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        /* schon beendet */
      }
      throw e;
    }
  }

  /** Ereignisse mit seq größer als after, aufsteigend, höchstens limit Stück. */
  eventsAfter(after: number, limit: number): EventEnvelope[] {
    const rows = this.db
      .prepare("SELECT seq, event_id, type, payload, occurred_at FROM booking_events WHERE seq > ? ORDER BY seq LIMIT ?")
      .all(after, limit) as { seq: number; event_id: string; type: EventType; payload: string; occurred_at: string }[];
    return rows.map((r) => ({ seq: r.seq, event_id: r.event_id, type: r.type, occurred_at: r.occurred_at, booking: JSON.parse(r.payload) as BookingPayload }));
  }

  lastSeq(): number {
    const r = this.db.prepare("SELECT COALESCE(MAX(seq), 0) AS n FROM booking_events").get() as { n: number };
    return r.n;
  }

  /** Empfang bestätigen; die Nummer geht nie rückwärts. */
  acknowledge(consumer: string, seq: number, now = new Date()): number {
    this.db
      .prepare(
        `INSERT INTO consumers (name, acknowledged_seq, last_seen_at) VALUES (?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET acknowledged_seq = MAX(acknowledged_seq, excluded.acknowledged_seq), last_seen_at = excluded.last_seen_at`,
      )
      .run(consumer, seq, iso(now));
    const r = this.db.prepare("SELECT acknowledged_seq FROM consumers WHERE name = ?").get(consumer) as { acknowledged_seq: number };
    return r.acknowledged_seq;
  }

  touchConsumer(consumer: string, now = new Date()): void {
    this.db
      .prepare("INSERT INTO consumers (name, acknowledged_seq, last_seen_at) VALUES (?, 0, ?) ON CONFLICT(name) DO UPDATE SET last_seen_at = excluded.last_seen_at")
      .run(consumer, iso(now));
  }

  consumers(): { name: string; acknowledged_seq: number; last_seen_at: string | null }[] {
    return this.db.prepare("SELECT name, acknowledged_seq, last_seen_at FROM consumers ORDER BY name").all() as { name: string; acknowledged_seq: number; last_seen_at: string | null }[];
  }

  countMailUnsent(now = new Date()): number {
    const r = this.db
      .prepare("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND mail_confirmation_sent_at IS NULL AND starts_at > ?")
      .get(iso(now)) as { n: number };
    return r.n;
  }

  getMeta(key: string): string | null {
    const r = this.db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined;
    return r?.value ?? null;
  }

  setMeta(key: string, value: string): void {
    this.db.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
  }

  /** Kleinste bestätigte Nummer über alle Abnehmer; null, wenn noch kein Abnehmer angemeldet ist. */
  acknowledgedMin(): number | null {
    const r = this.db.prepare("SELECT MIN(acknowledged_seq) AS n, COUNT(*) AS c FROM consumers").get() as { n: number | null; c: number };
    return r.c === 0 ? null : (r.n ?? 0);
  }

  /**
   * Buchungen für den Löschlauf: Termin länger als days Tage vorbei. Mit requireAck nur solche, deren letztes Ereignis
   * vom Kundensystem bestätigt wurde (seq kleiner oder gleich ackMin).
   */
  bookingsForDeletion(now: Date, days: number, ackMin: number | null, limit = 500): BookingRow[] {
    const limitAt = iso(new Date(now.getTime() - days * 86400000));
    if (ackMin === null) {
      return this.db.prepare("SELECT * FROM bookings WHERE ends_at < ? ORDER BY ends_at LIMIT ?").all(limitAt, limit) as unknown as BookingRow[];
    }
    return this.db
      .prepare(
        `SELECT b.* FROM bookings b WHERE b.ends_at < ? AND NOT EXISTS (SELECT 1 FROM booking_events e WHERE e.booking_id = b.id AND e.seq > ?)
         ORDER BY b.ends_at LIMIT ?`,
      )
      .all(limitAt, ackMin, limit) as unknown as BookingRow[];
  }

  /** Buchung endgültig löschen: Zeile, Belegung und Idempotenz entfernen, Ereignis deleted nur mit Kennung und Nummer. */
  deleteBooking(id: string, now = new Date()): boolean {
    const at = iso(now);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.get(id);
      if (!row) {
        this.db.exec("COMMIT");
        return false;
      }
      this.db.prepare("DELETE FROM slot_locks WHERE booking_id = ?").run(id);
      this.db.prepare("DELETE FROM idempotency WHERE booking_id = ?").run(id);
      this.db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
      this.appendEvent(row, "deleted", at, { id: row.id, reference: row.reference });
      this.db.exec("COMMIT");
      return true;
    } catch (e) {
      try {
        this.db.exec("ROLLBACK");
      } catch {
        /* schon beendet */
      }
      throw e;
    }
  }

  /** Ereignisse löschen, die älter als days Tage sind; mit ackMin nur bestätigte (seq kleiner oder gleich ackMin). */
  purgeEvents(now: Date, days: number, ackMin: number | null): number {
    const limitAt = iso(new Date(now.getTime() - days * 86400000));
    if (ackMin === null) return 0;
    return Number(this.db.prepare("DELETE FROM booking_events WHERE occurred_at < ? AND seq <= ?").run(limitAt, ackMin).changes);
  }

  purgeEventsForced(now: Date, days: number): number {
    const limitAt = iso(new Date(now.getTime() - days * 86400000));
    return Number(this.db.prepare("DELETE FROM booking_events WHERE occurred_at < ?").run(limitAt).changes);
  }

  /** Nur für Tests und Prüfungen. */
  eventsForBooking(id: string): { seq: number; type: EventType; payload: BookingPayload; occurred_at: string }[] {
    const rows = this.db.prepare("SELECT seq, type, payload, occurred_at FROM booking_events WHERE booking_id = ? ORDER BY seq").all(id) as {
      seq: number;
      type: EventType;
      payload: string;
      occurred_at: string;
    }[];
    return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) as BookingPayload }));
  }

  close(): void {
    this.db.close();
  }
}

export function openStore(path: string): Store {
  return new Store(openDatabase(path));
}

/* Eine Verbindung je Prozess; die Datei kommt aus BOOKING_DB_PATH. */
let instance: Store | null = null;
let instancePath = "";

export function getStore(): Store {
  const path = readEnv().dbPath;
  if (!instance || instancePath !== path) {
    instance = openStore(path);
    instancePath = path;
  }
  return instance;
}
