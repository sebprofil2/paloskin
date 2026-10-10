import { cancelBooking, sendConfirmation, type Deps } from "./booking";
import { CANCEL_REASON } from "./cancel-reasons";
import type { ChangedEvent } from "./engine/types";
import { errorClass, logEvent } from "./log";
import type { BookingRow } from "./store";
import { notifyStudio } from "./studio-mail";

/*
 * Der Kalender „PALO SKIN Termine“ ist das Werkzeug des Studios. Alle 5 Minuten gleicht dieser Lauf Änderungen,
 * die direkt im Kalender gemacht wurden, mit den eigenen Buchungen ab (Google events.list mit updatedMin und showDeleted):
 *   Eintrag gelöscht: Buchung gilt als vom Studio abgesagt (cancel_reason studio_calendar), Zeit frei, Erinnerung entfällt,
 *     Ereignis cancelled, keine Mail an den Kunden, Studio-Mail „Im Kalender abgesagt“.
 *   Beginn verschoben: Buchung gilt als verschoben, Ereignis rescheduled, Kunde bekommt Mail C („Verschoben“),
 *     Studio-Mail „Im Kalender verschoben“ mit Bisher und Neu, Zusage zurückgesetzt, Erinnerung nach den normalen Regeln.
 *   Nur Ende geändert (Dauer): Buchung übernimmt die neue Dauer, Belegung online passt sich an, keine Mail,
 *     Ereignis rescheduled mit unverändertem starts_at und neuem ends_at.
 * Was das Studio im Kalender macht, gilt immer; Fenster, Vorlauf, Nachtregel und Belegung werden nicht geprüft.
 * Ignoriert werden eigene Änderungen der Buchung (Zeiten stimmen schon, Buchung schon abgesagt oder gelöscht),
 * vergangene Termine, Einträge ohne Buchung und Änderungen nur an Titel oder Beschreibung.
 * Ist der Kalender nicht lesbar, ändert sich nichts; die Marke bleibt stehen und der nächste Lauf holt nach.
 */
export const CANCEL_REASON_CALENDAR = CANCEL_REASON.studioCalendar;
const META_KEY = "calendar_sync_since";
/* Überlappung der Abfrage, damit keine Änderung zwischen zwei Läufen verloren geht; doppelt gesehene Änderungen sind folgenlos */
const OVERLAP_MS = 60000;
const FIRST_LOOKBACK_MS = 5 * 60000;

export interface SyncResult {
  checked: number;
  cancelled: number;
  moved: number;
  resized: number;
  ignored: number;
  unavailable: boolean;
}

function sameMinute(a: Date, b: Date): boolean {
  return Math.abs(a.getTime() - b.getTime()) < 1000;
}

function findBooking(deps: Deps, ev: ChangedEvent): BookingRow | null {
  const byId = deps.store.findByCalendarEventId(ev.id);
  if (byId) return byId;
  if (!ev.bookingRef) return null;
  const byRef = deps.store.findByReference(ev.bookingRef);
  // Nur der aktuell verknüpfte Eintrag zählt; ein verwaister zweiter Eintrag zur selben Nummer ändert nichts
  return byRef && (byRef.calendar_event_id === null || byRef.calendar_event_id === ev.id) ? byRef : null;
}

async function applyChange(deps: Deps, ev: ChangedEvent, now: Date): Promise<"cancelled" | "moved" | "resized" | "ignored"> {
  const b = findBooking(deps, ev);
  if (!b) return "ignored";
  if (b.deleted_at || b.status === "cancelled") return "ignored"; // eigene Absage, Löschlauf oder schon abgeglichen
  if (new Date(b.starts_at).getTime() <= now.getTime()) return "ignored"; // vergangener Termin

  if (ev.deleted) {
    const row = await cancelBooking(b.id, CANCEL_REASON_CALENDAR, deps, now);
    if (!row) return "ignored";
    logEvent("info", "calendar_sync_cancelled", { bookingRef: b.reference });
    await notifyStudio("cancelled_calendar", row, deps, now);
    return "cancelled";
  }

  if (!ev.start || !ev.end || ev.end <= ev.start) {
    logEvent("warn", "calendar_sync_unreadable", { bookingRef: b.reference });
    return "ignored";
  }
  // Zwischenzustand nach einem Verschieben: die Datenbank hat die neue Zeit, der Kalender wird gerade nachgezogen.
  // Dann gilt die Datenbank; der Abgleich setzt nichts auf die alte Zeit zurück und verschickt keine Mail.
  if (b.calendar_state !== "written") return "ignored";
  const startSame = sameMinute(ev.start, new Date(b.starts_at));
  const endSame = sameMinute(ev.end, new Date(b.ends_at));
  if (startSame && endSame) return "ignored"; // eigene Änderung oder nur Titel und Beschreibung

  const kind = startSame ? "resized" : "moved";
  const r = deps.store.applyCalendarTimes(b.id, ev.start, ev.end, kind, now);
  if (r.outcome !== "applied" || !r.booking) return "ignored";
  logEvent("info", kind === "moved" ? "calendar_sync_moved" : "calendar_sync_resized", { bookingRef: b.reference, status: r.overlap ? "überlappt" : "frei" });
  if (kind === "moved") {
    await Promise.all([sendConfirmation(r.booking, deps, now), notifyStudio("rescheduled_calendar", r.booking, deps, now)]);
  }
  return kind;
}

/** Ein Lauf des Abgleichs. Nie werfen; bei nicht lesbarem Kalender bleibt alles stehen. */
export async function syncCalendarChanges(deps: Deps, now = new Date()): Promise<SyncResult> {
  const result: SyncResult = { checked: 0, cancelled: 0, moved: 0, resized: 0, ignored: 0, unavailable: false };
  const { store, engine } = deps;
  const stored = store.getMeta(META_KEY);
  const sinceMs = stored && Number.isFinite(Date.parse(stored)) ? Date.parse(stored) : now.getTime() - FIRST_LOOKBACK_MS;
  let events: ChangedEvent[];
  try {
    events = await engine.changedEvents(new Date(sinceMs - OVERLAP_MS));
  } catch (e) {
    logEvent("warn", "calendar_sync_unavailable", { engine: engine.name, errorClass: errorClass(e) });
    result.unavailable = true;
    return result;
  }
  let failed = false;
  for (const ev of events) {
    result.checked++;
    try {
      result[await applyChange(deps, ev, now)]++;
    } catch (e) {
      failed = true;
      logEvent("error", "calendar_sync_failed", { engine: engine.name, errorClass: errorClass(e) });
    }
  }
  // Marke erst setzen, wenn alles verarbeitet ist; sonst holt der nächste Lauf denselben Zeitraum noch einmal
  if (!failed) store.setMeta(META_KEY, now.toISOString());
  // Für die Überwachung: Zeitpunkt des letzten erfolgreichen Abgleichs
  if (!failed) store.setMeta("calendar_sync_ok_at", now.toISOString());
  if (result.cancelled || result.moved || result.resized) {
    logEvent("info", "calendar_sync", { count: result.checked, status: `${result.cancelled} abgesagt, ${result.moved} verschoben, ${result.resized} Dauer geändert` });
  }
  return result;
}
