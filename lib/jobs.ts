import { retryCalendar, runMailJobs } from "./booking";
import { syncCalendarChanges } from "./calendar-sync";
import { errorClass, logEvent } from "./log";
import { runDailyIfDue } from "./retention";
import { sendReminderListIfDue, sendRemindersIfDue } from "./reminder-list";
import { runStudioMailQueue } from "./studio-mail";
import { getEngine } from "./engine";
import { getMailer } from "./mail";
import { getStore } from "./store";
import { configProblems, instance } from "./instance";

/*
 * Hintergrundläufe im Serverprozess, gestartet aus instrumentation.ts.
 * Alle 5 Minuten: Kalendereinträge nachholen, Änderungen des Studios im Kalender abgleichen (lib/calendar-sync.ts),
 * Bestätigungsmails nachholen, Erinnerungen senden.
 * Einmal täglich ab 03:30 Uhr Berliner Zeit: Löschlauf und Kalenderexport (lib/retention.ts).
 * Einmal täglich ab 10:00 Uhr: Erinnerungsmails für morgen; ab 18:00 Uhr: Handliste für morgen (lib/reminder-list.ts).
 * Einmal je Prozess, auch bei Neuladen in der Entwicklung.
 */
const KEY = Symbol.for("paloskin.jobs");
const INTERVAL_MS = 5 * 60000;
const FIRST_DELAY_MS = 30000;

export function startBackgroundJobs(): void {
  const g = globalThis as unknown as Record<symbol, boolean>;
  if (g[KEY]) return;
  g[KEY] = true;
  const problems = configProblems();
  if (problems.length) logEvent("error", "ALARM Konfiguration unvollständig", { reason: problems.join("; ") });
  logEvent("info", "instance", { status: instance() });
  // Ein noch laufender Durchgang darf sich nie mit dem nächsten überschneiden (zum Beispiel bei langsamem Kalender oder Mailserver)
  let running = false;
  const tick = async () => {
    if (running) {
      logEvent("warn", "job_skipped_overlap");
      return;
    }
    running = true;
    try {
      await tickOnce();
    } finally {
      running = false;
    }
  };
  const tickOnce = async () => {
    try {
      const r = await retryCalendar();
      if (r.retried) logEvent("info", "calendar_retry", { count: r.retried, status: `${r.written} nachgetragen` });
    } catch (e) {
      logEvent("error", "job_failed", { route: "calendar_retry", errorClass: errorClass(e) });
    }
    try {
      // Nichts darf verloren gehen: ein Ereignis länger als 3 Tage unbestätigt (nur mit angemeldetem Verbraucher) ist ein Alarm
      const stale = getStore().countUnacknowledgedOlderThan(new Date(), 3);
      if (stale > 0) logEvent("error", "ALARM Ereignis seit über 3 Tagen nicht bestätigt", { count: stale });
    } catch (e) {
      logEvent("error", "job_failed", { route: "ack_check", errorClass: errorClass(e) });
    }
    try {
      const reset = getStore().resetEarlyAttendance();
      if (reset.length) logEvent("info", "attendance_reset", { count: reset.length, status: reset.join(", ") });
    } catch (e) {
      logEvent("error", "job_failed", { route: "attendance_reset", errorClass: errorClass(e) });
    }
    try {
      await syncCalendarChanges({ store: getStore(), engine: getEngine(), mailer: getMailer() });
    } catch (e) {
      logEvent("error", "job_failed", { route: "calendar_sync", errorClass: errorClass(e) });
    }
    try {
      if (await runDailyIfDue({ store: getStore(), engine: getEngine(), mailer: getMailer() })) logEvent("info", "daily_run");
    } catch (e) {
      logEvent("error", "job_failed", { route: "daily", errorClass: errorClass(e) });
    }
    try {
      await sendRemindersIfDue({ store: getStore(), engine: getEngine(), mailer: getMailer() });
    } catch (e) {
      logEvent("error", "job_failed", { route: "reminders", errorClass: errorClass(e) });
    }
    try {
      await sendReminderListIfDue({ store: getStore(), engine: getEngine(), mailer: getMailer() });
    } catch (e) {
      logEvent("error", "job_failed", { route: "reminder_list", errorClass: errorClass(e) });
    }
    try {
      await runStudioMailQueue({ store: getStore(), engine: getEngine(), mailer: getMailer() });
    } catch (e) {
      logEvent("error", "job_failed", { route: "studio_mails", errorClass: errorClass(e) });
    }
    try {
      const m = await runMailJobs();
      if (m.confirmations) logEvent("info", "mail_jobs", { count: m.confirmations, status: `${m.confirmations} Bestätigungen nachgeholt` });
    } catch (e) {
      logEvent("error", "job_failed", { route: "mail_jobs", errorClass: errorClass(e) });
    }
    // Für die Überwachung: Ende des letzten vollständigen Durchgangs
    try {
      getStore().setMeta("jobs_tick_at", new Date().toISOString());
    } catch {
      /* Überwachung erkennt das Ausbleiben */
    }
  };
  setTimeout(tick, FIRST_DELAY_MS).unref();
  setInterval(tick, INTERVAL_MS).unref();
  logEvent("info", "jobs_started");
}
