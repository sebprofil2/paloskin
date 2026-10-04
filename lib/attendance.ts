import { addDaysKey, berlinDateKey, fromBerlinKey } from "./time";

/*
 * Zusage „Ja, ich komme“ (Entscheidung Dr. Vogel, 4. Oktober 2026): erst ab dem Vortag des Termins, 10:00 Uhr Berliner Zeit,
 * zeitgleich mit der Erinnerungsmail. Eine Zusage Tage vorher sagt nichts aus.
 *   Vorher: kein Zusage-Block auf der Terminseite, der Server lehnt eine Zusage ab.
 *   Wer erst nach diesem Zeitpunkt bucht oder auf einen Termin verschiebt, dessen Vortag 10 Uhr vorbei ist,
 *   bekommt keine Erinnerung mehr und gilt automatisch als bestätigt (attendance_confirmed_at = Zeitpunkt der Buchung).
 */
export function confirmFromFor(start: Date): Date {
  return fromBerlinKey(addDaysKey(berlinDateKey(start), -1), "10:00");
}

/** Liegt `now` im Zeitfenster für die Zusage (ab Vortag 10:00 Uhr)? */
export function inConfirmWindow(start: Date, now: Date): boolean {
  return now.getTime() >= confirmFromFor(start).getTime();
}
