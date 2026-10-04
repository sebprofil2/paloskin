import { readEnv } from "./env";

/*
 * Produktion oder Testinstanz (neu.paloskin.de). Die Testinstanz setzt PALOSKIN_INSTANCE=test in der Compose-Datei.
 * Für die Testinstanz gilt (Reparaturauftrag 4. Oktober 2026):
 *   Kalender nur aus TEST_CALENDAR_ID (Lesen und Schreiben); CALENDAR_* der Produktion werden nie gelesen (lib/env.ts).
 *   Jede Mail geht an MAIL_REDIRECT_TO und trägt „[TEST]“ im Betreff (lib/mail.ts). Ohne Umleitung wird nichts gesendet.
 *   Fehlt etwas davon, verweigert sie Buchungen mit eindeutiger Meldung; ein Rückfall auf die Produktion ist ausgeschlossen.
 * Für die Produktion: LINK_SECRET ist Pflicht (kein Rückfall auf Testschlüssel mehr, lib/links.ts).
 */
export type Instance = "production" | "test";

export function instance(): Instance {
  return (process.env.PALOSKIN_INSTANCE ?? "").trim() === "test" ? "test" : "production";
}

export function isTestInstance(): boolean {
  return instance() === "test";
}

/** Fehlende Pflichtwerte als lesbare Liste, ohne Werte auszugeben. Leer heißt: in Ordnung. */
export function configProblems(): string[] {
  const env = readEnv();
  const out: string[] = [];
  if (isTestInstance()) {
    if (env.mail.mode !== "off" && !env.mail.redirectTo) out.push("Testinstanz: MAIL_REDIRECT_TO fehlt, ohne Umleitung wird nichts gesendet");
    if (env.engine === "google" && !env.google.calendarBookingsId) out.push("Testinstanz: TEST_CALENDAR_ID fehlt, ohne Testkalender keine Buchung");
  } else if (!env.linkSecret) {
    out.push("LINK_SECRET fehlt");
  }
  return out;
}
