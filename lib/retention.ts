import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Deps } from "./booking";
import { readEnv } from "./env";
import { errorClass, logEvent } from "./log";
import type { BookingRow } from "./store";
import { berlinDateKey, berlinParts } from "./time";

/*
 * Täglicher Lauf (Abschnitt 4 des Bauauftrags), 03:30 Uhr Berliner Zeit:
 *   1. Buchungen, deren Termin mehr als 90 Tage zurückliegt und deren Ereignisse vom Kundensystem bestätigt sind,
 *      werden gelöscht (Zeile weg, Ereignis deleted nur mit Kennung und Nummer). Nach 120 Tagen auch unbestätigt,
 *      mit Vermerk im Protokoll.
 *   2. Ereignisse werden gelöscht, sobald sie bestätigt und älter als 90 Tage sind; nach 120 Tagen auch unbestätigt.
 *   3. Export von „Palo Skin Termine“ als Kalenderdatei neben der Datenbank, 30 Tage aufbewahrt.
 * Die SQLite-Sicherung macht der Server um 03:45 Uhr (deploy/backup.sh).
 */
export const DELETE_AFTER_DAYS = 90;
export const FORCE_AFTER_DAYS = 120;
export const EXPORT_KEEP_DAYS = 30;
export const DAILY_HOUR = 3;
export const DAILY_MINUTE = 30;
const META_KEY = "daily_run_date";

/** Fällig, wenn es in Berlin nach 03:30 Uhr ist und der Lauf heute noch nicht stattfand (holt verpasste Läufe nach). */
export function isDailyDue(now: Date, lastRunDate: string | null): boolean {
  const p = berlinParts(now);
  const afterTime = p.hour > DAILY_HOUR || (p.hour === DAILY_HOUR && p.minute >= DAILY_MINUTE);
  return afterTime && lastRunDate !== berlinDateKey(now);
}

export interface RetentionResult {
  deleted: number;
  deletedForced: number;
  calendarRemoved: number;
  eventsPurged: number;
  eventsPurgedForced: number;
}

/**
 * Zuerst den Kalendereintrag löschen (ein schon fehlender Eintrag ist kein Fehler), dann die Buchung.
 * Ist der Kalender nicht erreichbar, bleibt die Buchung bis zum nächsten Lauf stehen.
 */
async function removeBooking(deps: Pick<Deps, "store" | "engine">, b: BookingRow, now: Date): Promise<"deleted" | "calendar_failed" | "missing"> {
  if (b.calendar_event_id) {
    try {
      await deps.engine.deleteEvent(b.calendar_event_id);
    } catch (e) {
      logEvent("warn", "retention_calendar_failed", { bookingRef: b.reference, errorClass: errorClass(e) });
      return "calendar_failed";
    }
  }
  return deps.store.deleteBooking(b.id, now) ? "deleted" : "missing";
}

export async function runRetention(deps: Pick<Deps, "store" | "engine">, now = new Date()): Promise<RetentionResult> {
  const { store } = deps;
  const ackMin = store.acknowledgedMin();
  let deleted = 0;
  let deletedForced = 0;
  let calendarRemoved = 0;
  // Bestätigte Buchungen nach 90 Tagen
  for (const b of store.bookingsForDeletion(now, DELETE_AFTER_DAYS, ackMin ?? -1)) {
    if ((await removeBooking(deps, b, now)) === "deleted") {
      deleted++;
      if (b.calendar_event_id) calendarRemoved++;
    }
  }
  // Unbestätigte nach 120 Tagen, auch ohne angeschlossenes Kundensystem
  for (const b of store.bookingsForDeletion(now, FORCE_AFTER_DAYS, null)) {
    if ((await removeBooking(deps, b, now)) === "deleted") {
      deletedForced++;
      if (b.calendar_event_id) calendarRemoved++;
      logEvent("warn", "retention_forced_delete", { bookingRef: b.reference, forced: true });
    }
  }
  const eventsPurged = store.purgeEvents(now, DELETE_AFTER_DAYS, ackMin);
  const eventsPurgedForced = store.purgeEventsForced(now, FORCE_AFTER_DAYS);
  if (eventsPurgedForced > 0) logEvent("warn", "retention_forced_events", { count: eventsPurgedForced, forced: true });
  logEvent("info", "retention_run", { count: deleted + deletedForced, status: `${deleted} gelöscht, ${deletedForced} erzwungen, ${calendarRemoved} Kalendereinträge, ${eventsPurged + eventsPurgedForced} Ereignisse` });
  return { deleted, deletedForced, calendarRemoved, eventsPurged, eventsPurgedForced };
}

function exportDir(): string {
  const env = readEnv();
  return env.exportDir || join(dirname(env.dbPath), "export");
}

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsEscape = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Kalenderdatei aus „Palo Skin Termine“: 7 Tage zurück bis 90 Tage voraus. */
export async function exportCalendar(deps: Pick<Deps, "engine">, now = new Date()): Promise<string> {
  const from = new Date(now.getTime() - 7 * 86400000);
  const to = new Date(now.getTime() + 90 * 86400000);
  const events = await deps.engine.exportEvents(from, to);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PALO SKIN by Dr. Vogel//Export//DE", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Palo Skin Termine (Export)"];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}@export.paloskin.de`, `DTSTAMP:${icsStamp(now)}`, `DTSTART:${icsStamp(e.start)}`, `DTEND:${icsStamp(e.end)}`, `SUMMARY:${icsEscape(e.summary)}`, `DESCRIPTION:${icsEscape(e.description)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const dir = exportDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, `palo-skin-termine-${berlinDateKey(now)}.ics`);
  writeFileSync(file, lines.join("\r\n") + "\r\n", { mode: 0o600 });
  // Alte Exporte entfernen
  const keepFrom = berlinDateKey(new Date(now.getTime() - EXPORT_KEEP_DAYS * 86400000));
  for (const name of readdirSync(dir)) {
    const m = /^palo-skin-termine-(\d{4}-\d{2}-\d{2})\.ics$/.exec(name);
    if (m && m[1] < keepFrom) unlinkSync(join(dir, name));
  }
  logEvent("info", "calendar_exported", { count: events.length });
  return file;
}

/** Täglicher Lauf, wenn fällig. Liefert true, wenn er lief. */
export async function runDailyIfDue(deps: Deps, now = new Date()): Promise<boolean> {
  const { store } = deps;
  if (!isDailyDue(now, store.getMeta(META_KEY))) return false;
  store.setMeta(META_KEY, berlinDateKey(now));
  try {
    await runRetention(deps, now);
  } catch (e) {
    logEvent("error", "retention_failed", { errorClass: errorClass(e) });
  }
  try {
    await exportCalendar(deps, now);
  } catch (e) {
    logEvent("error", "calendar_export_failed", { errorClass: errorClass(e) });
  }
  return true;
}
