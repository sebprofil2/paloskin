import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

/*
 * SQLite-Datenbank der Buchung (Stufe 2). Eine Datei auf einem beschreibbaren Volume, WAL-Modus,
 * Zeiten als ISO-Zeichenketten in Weltzeit (Endung Z), Zeitraster der Belegung in Minuten seit 1970.
 * Feldnamen Englisch, Oberfläche Deutsch. Nur Buchungsdaten: Kontakt, Termin, Leistungswunsch, Notiz.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  created_at TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  persons INTEGER NOT NULL CHECK (persons IN (1, 2)),
  first_visit INTEGER NOT NULL,
  service_codes TEXT NOT NULL,
  zones TEXT NOT NULL,
  checkup INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'confirmed', 'cancelled', 'rescheduled', 'no_show', 'completed')),
  channel TEXT NOT NULL DEFAULT 'web',
  language TEXT NOT NULL,
  device TEXT NOT NULL,
  reminder_whatsapp INTEGER NOT NULL,
  reminder_consent_at TEXT,
  consent_at TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  email TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  referral TEXT,
  selection TEXT NOT NULL,
  test_mode INTEGER NOT NULL,
  calendar_event_id TEXT,
  calendar_state TEXT NOT NULL CHECK (calendar_state IN ('pending', 'written', 'failed')),
  calendar_attempts INTEGER NOT NULL DEFAULT 0,
  calendar_attempted_at TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  attendance_confirmed_at TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT,
  mail_confirmation_sent_at TEXT,
  mail_confirmation_attempts INTEGER NOT NULL DEFAULT 0,
  mail_confirmation_attempted_at TEXT,
  mail_reminder_sent_at TEXT,
  mail_reminder_attempts INTEGER NOT NULL DEFAULT 0,
  mail_reminder_skipped INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS bookings_starts_at ON bookings (starts_at);
CREATE INDEX IF NOT EXISTS bookings_reference ON bookings (reference);
CREATE INDEX IF NOT EXISTS bookings_calendar_state ON bookings (calendar_state);

CREATE TABLE IF NOT EXISTS slot_locks (
  slot_start INTEGER PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings (id)
);
CREATE INDEX IF NOT EXISTS slot_locks_booking ON slot_locks (booking_id);

CREATE TABLE IF NOT EXISTS booking_events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  booking_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('created', 'confirmed', 'cancelled', 'rescheduled', 'reminder_changed', 'completed', 'deleted', 'attendance_confirmed')),
  payload TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS booking_events_booking ON booking_events (booking_id);

CREATE TABLE IF NOT EXISTS consumers (
  name TEXT PRIMARY KEY,
  acknowledged_seq INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS idempotency (
  request_key TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  if (path !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/*
 * Nachträge für Datenbanken, die mit einem älteren Schema angelegt wurden. Jeder Schritt prüft den Ist-Zustand
 * und ist damit beliebig oft ausführbar. Schritt 2 (Bestätigungsmail, Zusage, Absage, Erinnerung).
 */
function migrate(db: DatabaseSync): void {
  const columns = new Set((db.prepare("PRAGMA table_info(bookings)").all() as { name: string }[]).map((r) => r.name));
  if (!columns.has("attendance_confirmed_at")) {
    db.exec(`
      BEGIN;
      ALTER TABLE bookings ADD COLUMN attendance_confirmed_at TEXT;
      ALTER TABLE bookings ADD COLUMN cancelled_at TEXT;
      ALTER TABLE bookings ADD COLUMN cancel_reason TEXT;
      ALTER TABLE bookings ADD COLUMN mail_confirmation_sent_at TEXT;
      ALTER TABLE bookings ADD COLUMN mail_confirmation_attempts INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN mail_confirmation_attempted_at TEXT;
      ALTER TABLE bookings ADD COLUMN mail_reminder_sent_at TEXT;
      ALTER TABLE bookings ADD COLUMN mail_reminder_attempts INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN mail_reminder_skipped INTEGER NOT NULL DEFAULT 0;
      COMMIT;
    `);
  }
  // Die Prüfung der Ereignistypen lässt sich in SQLite nicht ändern: Tabelle neu anlegen, Zeilen samt Nummern übernehmen
  const eventsSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'booking_events'").get() as { sql: string } | undefined)?.sql ?? "";
  if (eventsSql && !eventsSql.includes("attendance_confirmed")) {
    db.exec(`
      BEGIN;
      CREATE TABLE booking_events_new (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        booking_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('created', 'confirmed', 'cancelled', 'rescheduled', 'reminder_changed', 'completed', 'deleted', 'attendance_confirmed')),
        payload TEXT NOT NULL,
        occurred_at TEXT NOT NULL
      );
      INSERT INTO booking_events_new (seq, event_id, booking_id, type, payload, occurred_at)
        SELECT seq, event_id, booking_id, type, payload, occurred_at FROM booking_events ORDER BY seq;
      DROP TABLE booking_events;
      ALTER TABLE booking_events_new RENAME TO booking_events;
      CREATE INDEX IF NOT EXISTS booking_events_booking ON booking_events (booking_id);
      COMMIT;
    `);
  }
}

/** Verletzung einer Eindeutigkeit (PRIMARY KEY oder UNIQUE): „Da war jemand schneller“. */
export function isUniqueViolation(e: unknown): boolean {
  const code = (e as { errcode?: number } | null)?.errcode;
  return code === 1555 || code === 2067;
}
