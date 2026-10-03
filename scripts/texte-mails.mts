/* Erzeugt docs/TEXTE-MAILS.md aus den Texten in lib/texts-mail.ts: node --experimental-strip-types scripts/texte-mails.mts */
import { writeFileSync } from "node:fs";
import { MAIL_TEXTS, ADDRESS, STUDIO, SIGNER, STREET } from "../lib/texts-mail.ts";
import { TEXTS, LANGS } from "../lib/texts.ts";
import type { Lang } from "../lib/treatments.ts";

/* [mitten im Satz ohne Jahr, allein stehend mit Jahr, mitten im Satz mit Jahr, Wochentag mitten im Satz, Uhrzeit] */
const DATE: Record<Lang, [string, string, string, string, string]> = {
  de: ["Donnerstag, 8. Oktober", "Donnerstag, 8. Oktober 2026", "Donnerstag, 8. Oktober 2026", "Donnerstag", "08:00 Uhr"],
  en: ["Thursday 8 October", "Thursday 8 October 2026", "Thursday 8 October 2026", "Thursday", "08:00"],
  es: ["jueves, 8 de octubre", "Jueves, 8 de octubre de 2026", "jueves, 8 de octubre de 2026", "jueves", "08:00 h"],
  fr: ["jeudi 8 octobre", "Jeudi 8 octobre 2026", "jeudi 8 octobre 2026", "jeudi", "08 h 00"],
  pt: ["quinta-feira, 8 de outubro", "Quinta-feira, 8 de outubro de 2026", "quinta-feira, 8 de outubro de 2026", "quinta-feira", "08:00"],
};
const out: string[] = ["# Texte: Bestätigungsmail, Erinnerungsmail, Terminseite (fünf Sprachen)", "", "Stand: 3. Oktober 2026. Deutsch ist die Freigabe von Dr. Vogel; EN, ES, FR, PT sind freigegeben (Feinschliff folgt), Wochentage in ES, FR, PT mitten im Satz klein. Erzeugt aus `lib/texts-mail.ts` mit `scripts/texte-mails.mts`, Beispieltermin Donnerstag, 8. Oktober 2026, 08:00 Uhr, Vorname Verena, zu zweit.", ""];
for (const { id, name } of LANGS) {
  const m = MAIL_TEXTS[id];
  const [d, dy, dyIn, w, t] = DATE[id];
  out.push(`## ${name} (${id})`, "", "### Bestätigungsmail", "", `Absender: ${STUDIO} <bookings@paloskin.de>, Antwort an bookings@paloskin.de`, `Betreff: ${m.subjectBinding(d, t)}`, "", "```", m.greeting("Verena"), "", m.introBinding, "", `${dy}, ${t}`, `${STUDIO}, ${ADDRESS} (${m.mapL})`, "", `${m.both} [nur bei zu zweit]`, "", m.reminderNote, "", `${m.cancelLead} ${m.cancelLink} [Link]. ${m.cancelRule}`, "", m.icsNote, "", m.closing, SIGNER, `${STUDIO}, ${ADDRESS}`, "WhatsApp +49 151 58872566", "```", "", `Ohne Schalter (Terminanfrage), nur bis zum Ausrollen: Betreff „${m.subjectRequest(d, t)}“, Einstieg „${m.introRequest}“`, "", "### Erinnerungsmail", "", `Betreff: ${m.subjectReminder(t)}`, "", "```", m.greeting("Verena"), "", m.introReminder(d, t), "", `${m.oneClick} ${m.yes} [Knopf]`, "", m.reminderCancel, "", m.closingReminder, SIGNER, STUDIO, "```", "", "### Kalenderdatei", "", `Titel: ${m.icsTitle}`, `Ort: ${STUDIO}, ${ADDRESS}`, `Beschreibung: ${m.icsDescription}`, "", "### Terminseite", "", `- Überschrift: ${m.pageTitle}`, `- Knöpfe: ${m.yes} / ${m.cancel}`, `- Rückfrage vor der Absage: ${m.cancelQ(dyIn, t)} / ${m.cancelYes} / ${m.cancelNo}`, `- Weniger als 48 Stunden: ${m.tooLate} [Knopf: ${m.waButton}]`, `- Nach Zusage: ${m.doneYes(w, t)}`, `- Nach Absage: ${m.doneCancel} [Knopf: ${m.newBooking}]`, `- Bereits abgesagt: ${m.cancelledInfo}`, `- Vergangen: ${m.past}`, `- Ungültiger Link: ${m.invalid} [Knopf: ${m.waButton}]`, `- Testbetrieb (Mails): ${m.testNote}`, "", "### Bestätigungsseite der Website (Schalter an)", "", `${TEXTS[id].doneBindingH}`, "");
}
writeFileSync("docs/TEXTE-MAILS.md", out.join("\n"));
console.log("geschrieben", out.length, "Zeilen", STREET);
