import { retryCalendar, runMailJobs } from "./booking";
import { errorClass, logEvent } from "./log";

/*
 * Hintergrundläufe im Serverprozess, gestartet aus instrumentation.ts.
 * Alle 5 Minuten: Kalendereinträge nachholen, Bestätigungsmails nachholen, Erinnerungen senden.
 * Einmal je Prozess, auch bei Neuladen in der Entwicklung.
 */
const KEY = Symbol.for("paloskin.jobs");
const INTERVAL_MS = 5 * 60000;
const FIRST_DELAY_MS = 30000;

export function startBackgroundJobs(): void {
  const g = globalThis as unknown as Record<symbol, boolean>;
  if (g[KEY]) return;
  g[KEY] = true;
  const tick = async () => {
    try {
      const r = await retryCalendar();
      if (r.retried) logEvent("info", "calendar_retry", { count: r.retried, status: `${r.written} nachgetragen` });
    } catch (e) {
      logEvent("error", "job_failed", { route: "calendar_retry", errorClass: errorClass(e) });
    }
    try {
      const m = await runMailJobs();
      if (m.confirmations || m.reminders) logEvent("info", "mail_jobs", { count: m.confirmations + m.reminders, status: `${m.confirmations} Bestätigungen, ${m.reminders} Erinnerungen` });
    } catch (e) {
      logEvent("error", "job_failed", { route: "mail_jobs", errorClass: errorClass(e) });
    }
  };
  setTimeout(tick, FIRST_DELAY_MS).unref();
  setInterval(tick, INTERVAL_MS).unref();
  logEvent("info", "jobs_started");
}
