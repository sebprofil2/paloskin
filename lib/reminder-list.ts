import type { Deps } from "./booking";
import { readEnv } from "./env";
import { logEvent } from "./log";
import { mailErrorClass } from "./mail";
import type { BookingRow } from "./store";
import { addDaysKey, berlinDateKey, berlinParts, berlinTimeLabel, fromBerlinKey } from "./time";

/*
 * Handliste für WhatsApp-Erinnerungen, bis das Kundensystem das übernimmt: täglich ab 18:00 Uhr Berliner Zeit eine Mail
 * an OWNER_MAIL mit den Terminen des nächsten Tages, bei denen der Kunde die Erinnerung möchte. Je Termin Vorname,
 * Nachname, Uhrzeit und WhatsApp-Link. Keine Behandlungsangaben. Keine Mail, wenn es keine Termine gibt.
 */
export const LIST_HOUR = 18;
const META_KEY = "reminder_list_date";

export function isListDue(now: Date, lastRunDate: string | null): boolean {
  return berlinParts(now).hour >= LIST_HOUR && lastRunDate !== berlinDateKey(now);
}

/** Termine des nächsten Berliner Tages mit WhatsApp-Haken, nicht abgesagt. */
export function tomorrowsReminders(deps: Pick<Deps, "store">, now = new Date()): BookingRow[] {
  const tomorrow = addDaysKey(berlinDateKey(now), 1);
  const from = fromBerlinKey(tomorrow, "00:00");
  const to = fromBerlinKey(addDaysKey(tomorrow, 1), "00:00");
  return deps.store.remindersBetween(from, to);
}

export function listMail(rows: BookingRow[], now: Date): { subject: string; text: string; html: string } {
  const tomorrow = addDaysKey(berlinDateKey(now), 1);
  const n = rows.length;
  const subject = `Morgen erinnern: ${n} ${n === 1 ? "Termin" : "Termine"}`;
  const lines = rows.map((b) => `${b.first_name} ${b.last_name}, ${berlinTimeLabel(new Date(b.starts_at))} Uhr, https://wa.me/${b.phone_e164.replace(/^\+/, "")}`);
  const text = [`WhatsApp-Erinnerungen für ${tomorrow.split("-").reverse().join(".")}:`, "", ...lines, "", "PALO SKIN Buchung"].join("\n");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html><html lang="de"><body style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6"><p>WhatsApp-Erinnerungen für ${esc(tomorrow.split("-").reverse().join("."))}:</p><ul>${rows
    .map((b) => {
      const wa = `https://wa.me/${b.phone_e164.replace(/^\+/, "")}`;
      return `<li>${esc(`${b.first_name} ${b.last_name}`)}, ${berlinTimeLabel(new Date(b.starts_at))} Uhr, <a href="${wa}">${esc(wa)}</a></li>`;
    })
    .join("")}</ul><p>PALO SKIN Buchung</p></body></html>`;
  return { subject, text, html };
}

/** Liste senden, wenn fällig. Liefert die Anzahl der Termine oder null, wenn nichts zu tun war. */
export async function sendReminderListIfDue(deps: Deps, now = new Date()): Promise<number | null> {
  const { store, mailer } = deps;
  const to = readEnv().ownerMail;
  if (!to || !mailer.enabled) return null;
  if (!isListDue(now, store.getMeta(META_KEY))) return null;
  const rows = tomorrowsReminders(deps, now);
  if (rows.length === 0) {
    store.setMeta(META_KEY, berlinDateKey(now));
    logEvent("info", "reminder_list", { count: 0, status: "keine" });
    return 0;
  }
  try {
    const m = listMail(rows, now);
    await mailer.send({ to, ...m });
    store.setMeta(META_KEY, berlinDateKey(now));
    logEvent("info", "reminder_list", { count: rows.length, status: "gesendet" });
    return rows.length;
  } catch (e) {
    // Nicht als erledigt vermerken: der nächste Tick versucht es erneut
    logEvent("error", "reminder_list_failed", { count: rows.length, errorClass: mailErrorClass(e) });
    return null;
  }
}
