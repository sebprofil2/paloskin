import type { Deps } from "./booking";
import { readEnv } from "./env";
import { CONSULT_NAMES_DE } from "./i18n";
import { bookingsCalendarName } from "./instance";
import { phoneUnusual } from "./phone";
import { logEvent } from "./log";
import { mailErrorClass } from "./mail";
import { whenLabels } from "./mail-content";
import type { BookingRow } from "./store";

/*
 * Sofort-Mails an das Studio (Block 8): neue Buchung, Absage, kurzfristige Absage, Verschiebung; dazu die Rückmeldungen
 * des Kalenderabgleichs („Im Kalender abgesagt“, „Im Kalender verschoben“, lib/calendar-sync.ts). Nur Deutsch, ohne
 * Behandlung, Nummer, Adresse oder Buchungsnummer. Testbuchungen mit „[TEST]“ vorn. Jede Mail landet erst in der
 * Warteschlange der Datenbank und wird sofort versucht; scheitert der Versand, wiederholt der Hintergrundlauf.
 */
export type StudioMailKind = "booked" | "cancelled" | "cancelled_short" | "rescheduled" | "cancelled_calendar" | "rescheduled_calendar";

/** „Beratung auf Englisch“ für das Studio; ältere Buchungen ohne Angabe ohne Zeile */
export function consultLine(b: BookingRow): string | null {
  return b.consultation_language ? `Beratung auf ${CONSULT_NAMES_DE[b.consultation_language]}` : null;
}

function who(b: BookingRow): string {
  const initial = b.last_name.trim().charAt(0).toUpperCase();
  return `${b.first_name.trim()}${initial ? ` ${initial}.` : ""}, ${b.persons === 2 ? "zu zweit" : "allein"}`;
}

export function studioMailFor(kind: StudioMailKind, b: BookingRow): { subject: string; body: string } {
  const w = whenLabels(new Date(b.starts_at), "de");
  const prefix = b.test_mode === 1 ? "[TEST] " : "";
  const when = `${w.date}, ${w.time}`;
  if (kind === "booked") return { subject: `${prefix}Neue Buchung: ${w.short}, ${w.time}`, body: [when, who(b), consultLine(b), phoneUnusual(b.phone_e164) ? "Nummer prüfen" : null, `Details im Kalender „${bookingsCalendarName()}“.`].filter(Boolean).join("\n") };
  if (kind === "cancelled") return { subject: `${prefix}Abgesagt: ${w.short}, ${w.time}`, body: `${when}\n${who(b)}\nDie Zeit ist wieder frei.` };
  if (kind === "cancelled_short") return { subject: `${prefix}Kurzfristig abgesagt: ${w.short}, ${w.time}`, body: `${when}\n${who(b)}\nDie Zeit ist wieder frei.` };
  if (kind === "cancelled_calendar") return { subject: `${prefix}Im Kalender abgesagt: ${w.short}, ${w.time}`, body: `${when}\n${who(b)}\nDer Eintrag wurde im Kalender gelöscht. Die Zeit ist wieder frei, die Buchung gilt als abgesagt. Der Kunde hat keine Nachricht erhalten.` };
  const prev = b.previous_starts_at ? whenLabels(new Date(b.previous_starts_at), "de") : null;
  const bisherNeu = `${who(b)}\nBisher: ${prev ? `${prev.date}, ${prev.time}` : "unbekannt"}\nNeu: ${when}`;
  if (kind === "rescheduled_calendar") return { subject: `${prefix}Im Kalender verschoben: ${w.short}, ${w.time}`, body: `${bisherNeu}\nDer Eintrag wurde im Kalender verschoben. Der Kunde hat die neue Bestätigung erhalten.` };
  return { subject: `${prefix}Verschoben: ${w.short}, ${w.time}`, body: bisherNeu };
}

/** In die Warteschlange legen und sofort versuchen. Nie werfen. */
export async function notifyStudio(kind: StudioMailKind, b: BookingRow, deps: Deps, now = new Date()): Promise<void> {
  const { store } = deps;
  if (!readEnv().ownerMail) return;
  try {
    const m = studioMailFor(kind, b);
    store.enqueueStudioMail(m.subject, m.body, now);
  } catch (e) {
    logEvent("error", "studio_mail_queue_failed", { bookingRef: b.reference, errorClass: e instanceof Error ? e.name : "unknown" });
    return;
  }
  await runStudioMailQueue(deps, now);
}

/** Warteschlange abarbeiten: sofort nach dem Einreihen und alle 5 Minuten. */
export async function runStudioMailQueue(deps: Deps, now = new Date()): Promise<{ sent: number; failed: number }> {
  const { store, mailer } = deps;
  const to = readEnv().ownerMail;
  if (!to || !mailer.enabled) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  for (const m of store.studioMailsPending(now)) {
    // Beanspruchen, bevor gesendet wird: ein paralleler Lauf überspringt den Eintrag
    if (!store.claimStudioMail(m.id, now)) continue;
    try {
      await mailer.send({ to, subject: m.subject, text: m.body, html: `<pre style="font-family:Helvetica,Arial,sans-serif;font-size:16px;white-space:pre-wrap">${m.body.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>` });
      store.studioMailSent(m.id, now);
      sent++;
    } catch (e) {
      store.studioMailFailed(m.id, now);
      failed++;
      logEvent("error", "studio_mail_failed", { count: m.attempts + 1, errorClass: mailErrorClass(e) });
    }
  }
  if (sent) logEvent("info", "studio_mail_sent", { count: sent });
  return { sent, failed };
}
