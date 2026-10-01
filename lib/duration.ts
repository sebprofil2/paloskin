import { hasBotulinum, type Selection } from "./treatments";

/*
 * Dauer eines Termins in Minuten. Berechnet ausschließlich der Server.
 * Vorläufige Regel, die endgültige Logik liefert Dr. Vogel nach:
 *   Kontrolltermin (nur über Link): 15 Minuten
 *   „Ich bin noch unsicher“: immer 30 Minuten
 *   Erster Besuch 30 Minuten, schon einmal da 20 Minuten
 *   Botulinum (Zonen, andere Zone, Kaumuskel, Nefertiti-Lift, Schwitzen) zusammen mit Lachs-DNA: plus 20 Minuten
 */
export const CHECKUP_MINUTES = 15;
export const CONSULT_MINUTES = 30;
export const FIRST_VISIT_MINUTES = 30;
export const RETURN_VISIT_MINUTES = 20;
export const BOTULINUM_WITH_LACHS_EXTRA = 20;

export function durationMinutes(s: Selection): number {
  if (s.checkup) return CHECKUP_MINUTES;
  if (s.beratung) return CONSULT_MINUTES;
  if (!s.visit) throw new Error("Besuch nicht gewählt");
  let m = s.visit === "return" ? RETURN_VISIT_MINUTES : FIRST_VISIT_MINUTES;
  if (hasBotulinum(s) && s.lachs) m += BOTULINUM_WITH_LACHS_EXTRA;
  return m;
}
