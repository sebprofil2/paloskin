import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { normalizePhone, serviceCode } from "./booking-description";
import { isUniqueViolation, openDatabase } from "./db";
import { readEnv } from "./env";
import type { Customer } from "./schema";
import type { Interval } from "./slots";
import type { Lang, Selection } from "./treatments";
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
export type EventType = "created" | "confirmed" | "cancelled" | "rescheduled" | "reminder_changed" | "completed" | "deleted";

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
}

/** Vollständiger Buchungsstand, wie er in Ereignissen und am Endpunkt erscheint. */
export interface BookingPublic {
  id: string;
  reference: string;
  created_at: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  persons: 1 | 2;
  first_visit: boolean;
  service_codes: string[];
  zones: string[];
  other_zone: string | null;
  zones_unknown: boolean;
  checkup: boolean;
  status: BookingStatus;
  channel: string;
  language: Lang;
  device: string;
  reminder_whatsapp: boolean;
  reminder_consent_at: string | null;
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
  updated_at: string;
  deleted_at: string | null;
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

export function toPublic(r: BookingRow): BookingPublic {
  const sel = JSON.parse(r.selection) as Selection;
  return {
    id: r.id,
    reference: r.reference,
    created_at: r.created_at,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    duration_minutes: r.duration_minutes,
    persons: r.persons,
    first_visit: r.first_visit === 1,
    service_codes: JSON.parse(r.service_codes) as string[],
    zones: JSON.parse(r.zones) as string[],
    other_zone: sel.otherZone ?? null,
    zones_unknown: sel.zonesUnknown === true,
    checkup: r.checkup === 1,
    status: r.status,
    channel: r.channel,
    language: r.language,
    device: r.device,
    reminder_whatsapp: r.reminder_whatsapp === 1,
    reminder_consent_at: r.reminder_consent_at,
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
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
  };
}

const iso = (d: Date) => d.toISOString();

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

  findByReference(reference: string): BookingRow | null {
    const row = this.db
      .prepare("SELECT * FROM bookings WHERE reference = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1")
      .get(reference) as BookingRow | undefined;
    return row ?? null;
  }

  /** Ereignis in der laufenden Transaktion anhängen; Nutzlast ist der vollständige Stand nach der Änderung. */
  private appendEvent(booking: BookingRow, type: EventType, at: string, payload: unknown = toPublic(booking)): void {
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
          normalizePhone(i.customer.handy),
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

  calendarWritten(id: string, eventId: string, now = new Date()): void {
    this.db
      .prepare(
        `UPDATE bookings SET calendar_state = 'written', calendar_event_id = ?, calendar_attempts = calendar_attempts + 1,
         calendar_attempted_at = ?, updated_at = ? WHERE id = ?`,
      )
      .run(eventId, iso(now), iso(now), id);
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
         AND (calendar_state = 'failed' OR created_at < ?) ORDER BY created_at LIMIT ?`,
      )
      .all(stale, limit) as unknown as BookingRow[];
  }

  /** Anzahl Buchungen, deren Kalendereintrag seit mehr als 24 Stunden fehlt. */
  countCalendarOverdue(now = new Date()): number {
    const limit = iso(new Date(now.getTime() - 24 * 3600000));
    const r = this.db
      .prepare("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND calendar_state <> 'written' AND created_at < ?")
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

  /** Nur für Tests und Prüfungen. */
  eventsForBooking(id: string): { seq: number; type: EventType; payload: BookingPublic; occurred_at: string }[] {
    const rows = this.db.prepare("SELECT seq, type, payload, occurred_at FROM booking_events WHERE booking_id = ? ORDER BY seq").all(id) as {
      seq: number;
      type: EventType;
      payload: string;
      occurred_at: string;
    }[];
    return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) as BookingPublic }));
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
