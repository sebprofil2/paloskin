import { hasBotulinum, type Selection } from "./treatments";

/*
 * Dauer eines Termins in Minuten. Berechnet ausschließlich der Server. Entscheidung Dr. Vogel, 3. Oktober 2026:
 *   Kontrolltermin (nur über Link): 15 Minuten, nur allein
 *   Beratung, Botox (Zonen, andere Zone, Kaumuskel, Nefertiti-Lift, Schwitzen) oder nur Lachs-DNA: 30 Minuten
 *   Botox zusammen mit Lachs-DNA: plus 20 Minuten
 *   Zu zweit: plus 20 Minuten
 *   Erster Besuch und Folgebesuch dauern gleich lang (die Frage bleibt für appointment_type).
 */
export const CHECKUP_MINUTES = 15;
export const CONSULT_MINUTES = 30;
export const FIRST_VISIT_MINUTES = 30;
export const RETURN_VISIT_MINUTES = 30;
export const BOTULINUM_WITH_LACHS_EXTRA = 20;
export const EXTRA_PERSON_MINUTES = 20;

export function durationMinutes(s: Selection): number {
  if (s.checkup) return CHECKUP_MINUTES;
  const extraPersons = (s.persons - 1) * EXTRA_PERSON_MINUTES;
  if (s.beratung) return CONSULT_MINUTES + extraPersons;
  if (!s.visit) throw new Error("Besuch nicht gewählt");
  let m = s.visit === "return" ? RETURN_VISIT_MINUTES : FIRST_VISIT_MINUTES;
  if (hasBotulinum(s) && s.lachs) m += BOTULINUM_WITH_LACHS_EXTRA;
  return m + extraPersons;
}
