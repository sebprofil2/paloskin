/* Erzeugt docs/TEXTE-MAILS.md aus lib/texts-mail.ts und lib/texts.ts: node --experimental-strip-types scripts/texte-mails.mts */
import { writeFileSync } from "node:fs";
import { MAIL_TEXTS, ADDRESS, STUDIO, SIGNER, MAPS_LINK, WA_LINK } from "../lib/texts-mail.ts";
import { TEXTS, LANGS } from "../lib/texts.ts";
import type { Lang } from "../lib/treatments.ts";

const start = new Date("2026-10-07T06:00:00Z"); // Mittwoch, 7. Oktober 2026, 08:00 Berliner Zeit
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/* Gleiche Darstellung wie whenLabels in lib/mail-content.ts (dort nicht direkt importierbar ohne Bundler) */
function whenLabels(d: Date, lang: Lang) {
  const loc = LANGS.find((x) => x.id === lang)?.loc ?? "de-DE";
  const raw = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: "Europe/Berlin", ...o }).format(d);
  const date = raw({ weekday: "long", day: "numeric", month: "long" });
  const short = lang === "de" ? `${cap(raw({ weekday: "long" }))}, 7.10.` : lang === "en" ? `${raw({ weekday: "short" })} 7 ${raw({ month: "short" })}` : `${raw({ weekday: "short" })} 7/10`;
  return { date: cap(date), dateYear: cap(raw({ weekday: "long", day: "numeric", month: "long", year: "numeric" })), dateIn: date, short, time: TEXTS[lang].at("08:00") };
}
const out: string[] = [
  "# Kundentexte: Bestätigungsmail, Erinnerungsmail, Kalenderdatei, Terminseite, Bestätigungsseite (fünf Sprachen)",
  "",
  "Stand: 3. Oktober 2026, endgültige Fassung (Freigabe Dr. Vogel). Deutsch wörtlich, die anderen Sprachen sinngemäß im selben Ton; Betreffzeilen höchstens 40 Zeichen mit Datum und Uhrzeit vorn. Erzeugt aus `lib/texts-mail.ts` und `lib/texts.ts` mit `scripts/texte-mails.mts`. Beispieltermin Mittwoch, 7. Oktober 2026, 08:00 Uhr, Vorname Verena, zu zweit.",
  "",
];
for (const { id, name } of LANGS) {
  const m = MAIL_TEXTS[id];
  const t = TEXTS[id];
  const w = whenLabels(start, id);
  out.push(`## ${name} (${id})`, "", "### Bestätigungsmail", "", `Absender: ${STUDIO} <bookings@paloskin.de>, Antwort an bookings@paloskin.de`, `Betreff (${m.subjectBooked(w.short, w.time).length} Zeichen): ${m.subjectBooked(w.short, w.time)}`, "", "```",
    m.greeting("Verena"), "", m.introBooked, "", `${w.date}, ${w.time} (fett)`, STUDIO, ADDRESS, `[${m.mapL}] (${MAPS_LINK})`, "", m.punctual, "", `${m.both} (nur bei zu zweit)`, "", m.saveQ, `[${m.gcal}] [${m.ical}] [${m.ocal}]`, "", m.reminderNote, "", m.cancelInfo, `[${m.manageLink}]`, "", m.closing, SIGNER, STUDIO, "```", "",
    "### Erinnerungsmail (Vortag 10:00 Uhr)", "", `Betreff (${m.subjectReminder(w.time).length} Zeichen): ${m.subjectReminder(w.time)}`, "", "```",
    m.greeting("Verena"), "", m.introReminder, "", `${w.date}, ${w.time} (fett)`, ADDRESS, `[${m.mapL}]`, "", m.punctualShort, "", m.signQ, `[${m.yes}]`, m.reservedNote, "", m.reminderCancel, `[${m.waButton}] (${WA_LINK})`, "", m.closingReminder, SIGNER, STUDIO, "```", "",
    "### Kalenderdatei und Kalender-Knöpfe", "", `Titel: ${m.icsTitle}`, `Ort: ${STUDIO}, ${ADDRESS}`, `Beschreibung: ${m.icsDescription}`, "",
    "### Terminseite", "", `- Überschrift: ${m.pageTitle}`, `- Anrede: ${m.greeting("Verena")} ${m.pageIntro}`, `- Kasten: ${w.dateYear}, ${w.time}, ${STUDIO}, ${ADDRESS}, [${m.mapL}]`, `- Hinweis: ${m.punctualShort}`, `- Offen, mehr als 48 Stunden: ${m.askOpen} [${m.yes}] [${m.cancel}]`, `- Rückfrage vor Absage: ${m.cancelQ} ${w.dateYear}, ${w.time} [${m.cancelYes}] [${m.cancelNo}]`, `- Offen, weniger als 48 Stunden: [${m.yes}] ${m.tooLate} [${m.waButton}]`, `- Nach Zusage: ${m.doneYes(w.dateIn, w.time)}`, `- Nach Absage: ${m.doneCancel} [${m.newBooking}]`, `- Bereits abgesagt: ${m.cancelledInfo} [${m.newBooking}]`, `- Termin vorbei: ${m.past(w.dateIn, w.time)} [${m.newBooking}]`, `- Ungültiger Link: ${m.invalid} [${m.waButton}]`, `- Testbetrieb (Mails): ${m.testNote}`, "",
    "### Bestätigungsseite der Buchung", "", `${t.doneBindingH} / ${t.doneBindingP}`, "", "### Hinweiskasten im letzten Buchungsschritt", "", `${t.cancelT}: ${t.cancelP} ${t.cancelP2}`, "");
}
writeFileSync("docs/TEXTE-MAILS.md", out.join("\n"));
console.log("geschrieben", out.length, "Zeilen");
