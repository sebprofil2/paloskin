import { sendReminder, type Deps } from "./booking";
import { readEnv } from "./env";
import { logEvent } from "./log";
import { mailErrorClass } from "./mail";
import type { BookingRow } from "./store";
import { addDaysKey, berlinDateKey, berlinParts, berlinTimeLabel, fromBerlinKey } from "./time";

/*
 * Zwei tägliche Läufe (Berliner Zeit), gestartet aus lib/jobs.ts:
 *   10:00 Uhr: Erinnerungsmail an alle nicht abgesagten Termine des nächsten Tages, die vor 10:00 Uhr gebucht wurden.
 *              Später gebuchte Termine bekommen keine Erinnerung.
 *   18:00 Uhr: Handliste an OWNER_MAIL mit allen Terminen des nächsten Tages, Uhrzeit, Name und Bestätigungsstand;
 *              bei noch offenen Terminen ein WhatsApp-Link (mit Haken) oder ein Telefonlink (ohne Haken). Keine Mail ohne Termine.
 */
export const REMINDER_HOUR = 10;
export const LIST_HOUR = 18;
const META_REMINDER = "reminder_run_date";
const META_LIST = "reminder_list_date";

export function isDueAt(hour: number, now: Date, lastRunDate: string | null): boolean {
  return berlinParts(now).hour >= hour && lastRunDate !== berlinDateKey(now);
}

/** Alle nicht abgesagten Termine des nächsten Berliner Tages. */
export function tomorrowsBookings(deps: Pick<Deps, "store">, now = new Date()): BookingRow[] {
  const tomorrow = addDaysKey(berlinDateKey(now), 1);
  return deps.store.bookingsBetween(fromBerlinKey(tomorrow, "00:00"), fromBerlinKey(addDaysKey(tomorrow, 1), "00:00"));
}

/** Erinnerungen ab 10:00 Uhr; gescheiterte Sendungen werden beim nächsten Tick erneut versucht. */
export async function sendRemindersIfDue(deps: Deps, now = new Date()): Promise<{ sent: number; skipped: number; failed: number } | null> {
  const { store, mailer } = deps;
  if (!mailer.enabled || !isDueAt(REMINDER_HOUR, now, store.getMeta(META_REMINDER))) return null;
  const cutoff = fromBerlinKey(berlinDateKey(now), `${String(REMINDER_HOUR).padStart(2, "0")}:00`).toISOString();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const b of tomorrowsBookings(deps, now)) {
    if (b.mail_reminder_sent_at || b.mail_reminder_skipped) continue;
    if (b.created_at >= cutoff) {
      store.mailReminderSkipped(b.id, now);
      skipped++;
      continue;
    }
    if ((await sendReminder(b, deps, now)) === "sent") sent++;
    else failed++;
  }
  if (failed === 0) store.setMeta(META_REMINDER, berlinDateKey(now));
  logEvent("info", "reminders_run", { count: sent, status: `${sent} gesendet, ${skipped} zu spät gebucht, ${failed} gescheitert` });
  return { sent, skipped, failed };
}

export function listMail(rows: BookingRow[], now: Date): { subject: string; text: string; html: string } {
  const tomorrow = addDaysKey(berlinDateKey(now), 1);
  const n = rows.length;
  const open = rows.filter((b) => !b.attendance_confirmed_at).length;
  const subject = `Morgen: ${n} ${n === 1 ? "Termin" : "Termine"}, davon ${open} noch nicht bestätigt`;
  const line = (b: BookingRow) => {
    const t = `${berlinTimeLabel(new Date(b.starts_at))} Uhr, ${b.first_name} ${b.last_name}`;
    if (b.attendance_confirmed_at) return { t: `${t}, bestätigt`, link: null };
    const link = b.reminder_whatsapp === 1 ? `https://wa.me/${b.phone_e164.replace(/^\+/, "")}` : `tel:${b.phone_e164}`;
    return { t: `${t}, noch offen`, link };
  };
  const lines = rows.map(line);
  const day = tomorrow.split("-").reverse().join(".");
  const text = [`Termine am ${day}:`, "", ...lines.map((l) => (l.link ? `${l.t}, ${l.link}` : l.t)), "", "PALO SKIN Buchung"].join("\n");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html><html lang="de"><body style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6"><p>Termine am ${esc(day)}:</p><ul>${lines
    .map((l) => `<li>${esc(l.t)}${l.link ? `, <a href="${esc(l.link)}">${esc(l.link)}</a>` : ""}</li>`)
    .join("")}</ul><p>PALO SKIN Buchung</p></body></html>`;
  return { subject, text, html };
}

/** Handliste ab 18:00 Uhr. Liefert die Anzahl der Termine oder null, wenn nichts zu tun war. */
export async function sendReminderListIfDue(deps: Deps, now = new Date()): Promise<number | null> {
  const { store, mailer } = deps;
  const to = readEnv().ownerMail;
  if (!to || !mailer.enabled || !isDueAt(LIST_HOUR, now, store.getMeta(META_LIST))) return null;
  const rows = tomorrowsBookings(deps, now);
  if (rows.length === 0) {
    store.setMeta(META_LIST, berlinDateKey(now));
    logEvent("info", "reminder_list", { count: 0, status: "keine" });
    return 0;
  }
  try {
    await mailer.send({ to, ...listMail(rows, now) });
    store.setMeta(META_LIST, berlinDateKey(now));
    logEvent("info", "reminder_list", { count: rows.length, status: "gesendet" });
    return rows.length;
  } catch (e) {
    logEvent("error", "reminder_list_failed", { count: rows.length, errorClass: mailErrorClass(e) });
    return null;
  }
}
