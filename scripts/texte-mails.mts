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
  const weekday = raw({ weekday: "long" });
  const day = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", day: "numeric" }).format(d));
  const hh = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  const short = lang === "de" ? `${cap(weekday)}, ${day}.10.` : lang === "en" ? `${weekday}, ${day} ${raw({ month: "long" })}` : lang === "fr" ? `${weekday} ${day}/10` : `${weekday}, ${day}/10`;
  return { date: cap(date), dateYear: cap(raw({ weekday: "long", day: "numeric", month: "long", year: "numeric" })), dateIn: date, short, time: TEXTS[lang].at(hh) };
}
const out: string[] = [
  "# Kundentexte: Bestätigungsmail, Erinnerungsmail, Kalenderdatei, Terminseite, Bestätigungsseite (fünf Sprachen)",
  "",
  "Stand: 3. Oktober 2026, Gesamtauftrag abends (Freigabe Dr. Vogel). Deutsch wörtlich, die anderen Sprachen sinngemäß im selben Ton; Betreffzeilen höchstens 40 Zeichen mit Datum und Uhrzeit vorn. Erzeugt aus `lib/texts-mail.ts` und `lib/texts.ts` mit `scripts/texte-mails.mts`. Beispieltermin Mittwoch, 7. Oktober 2026, 08:00 Uhr (verschoben auf Donnerstag, 8. Oktober, 09:00 Uhr), Vorname Sebastian.",
  "",
];
for (const { id, name } of LANGS) {
  const m = MAIL_TEXTS[id];
  const t = TEXTS[id];
  const w = whenLabels(start, id);
  const w2 = whenLabels(new Date("2026-10-08T07:00:00Z"), id); // Donnerstag, 8. Oktober 2026, 09:00 Berliner Zeit
  out.push(`## ${name} (${id})`, "", "### Bestätigungsmail", "", `Absender: ${STUDIO} <bookings@paloskin.de>, Antwort an bookings@paloskin.de`, `Betreff (${m.subjectBooked(w.short, w.time).length} Zeichen): ${m.subjectBooked(w.short, w.time)}`, "", "```",
    m.greeting("Sebastian"), "", m.introBooked, "", `${w.date}, ${w.time} (fett)`, STUDIO, ADDRESS, `[${m.mapL}] (${MAPS_LINK})`, "", m.punctual, "", `${m.both} (nur bei zu zweit)`, "", m.saveQ, `[${m.gcal}] [${m.ical}] [${m.ocal}]`, "", `${m.reminderNote} (nur wenn eine Erinnerung kommt)`, "", `${m.cancelInfo} (nur wenn bei der Buchung mehr als 24 Stunden bleiben)`, `[${m.manageLink}] (immer)`, "", m.closing, SIGNER, STUDIO, "```", "",
    "### Mail nach dem Verschieben (wie die Bestätigung, drei Unterschiede)", "", `Betreff (${m.subjectRescheduled(w2.short, w2.time).length} Zeichen): ${m.subjectRescheduled(w2.short, w2.time)}`, `Erster Satz: ${m.introRescheduled}`, `Nach den Kalender-Knöpfen: ${m.oldCalendarNote}`, "",
    "### Erinnerungsmail (Vortag 10:00 Uhr)", "", `Betreff (${m.subjectReminder(w.time).length} Zeichen): ${m.subjectReminder(w.time)}`, "", "```",
    m.greeting("Sebastian"), "", m.introReminder, "", `${w.date}, ${w.time} (fett)`, ADDRESS, `[${m.mapL}]`, "", m.confirmQ, `[${m.yes}]`, `${m.notFit} [${m.rescheduleLink}]`, "", m.punctualShort, "", m.closingReminder, SIGNER, STUDIO, "```", "",
    "### Kalenderdatei und Kalender-Knöpfe", "", `Titel: ${m.icsTitle}`, `Ort: ${STUDIO}, ${ADDRESS}`, `Beschreibung: ${m.icsDescription("<persönlicher Link https://www.paloskin.de/termin/...>").replace(/\n/g, " / ")}`, "Erinnerung: 1 Stunde vorher (nur Kalenderdatei; Google und Outlook nehmen die eigene Standarderinnerung)", "",
    "### Terminseite", "", `- Überschrift: ${m.pageTitle}`, `- Anrede: ${m.greeting("Sebastian")} ${m.pageIntro}`, `- Kasten: ${w.date}, ${w.time} (fett), ${STUDIO}, ${ADDRESS}, [${m.mapL}]`, `- Hinweis: ${m.punctualShort}`, `- Zusage: ${m.confirmQ} [${m.yes}]`, `- Mehr als 24 Stunden: ${m.windowOpen} [${m.reschedule}] [${m.cancel}]`, `- 24 bis 2 Stunden: ${m.windowShort} [${m.reschedule}] [${m.cancelShort}]`, `- Weniger als 2 Stunden: kein Satz, keine Knöpfe`, `- Nach Zusage: ${m.doneYes(w.dateIn, w.time)}`, `- Rückfrage vor Absage: ${m.cancelQ} ${w.date}, ${w.time} [${m.cancelYes}] [${m.cancelNo}] ${m.orReschedule} [${m.reschedule}]`, `- Nach Absage: ${m.doneCancel} [${m.newBooking}]`, `- Bereits abgesagt: ${m.cancelledInfo} [${m.newBooking}]`, `- Termin vorbei: ${m.past(w.dateIn, w.time)} [${m.newBooking}]`, `- Ungültiger Link: ${m.invalid} [${m.waButton}]`, "",
    "### Verschieben", "", `- Überschrift: ${m.rescheduleH}`, `- ${m.rescheduleP(w.date, w.time)}`, `- Knopf: ${m.rescheduleBtn(w2.date, w2.time)}`, `- Danach: ${m.rescheduledH(w2.date, w2.time)} ${m.rescheduledP} ${m.saveQ} [${m.gcal}] [${m.ical}] [${m.ocal}] ${m.oldCalendarNote}`, `- Zeit vergeben: ${m.rescheduleGone}`, "",
    "### Bestätigungsseite der Buchung", "", `${t.doneBindingH} / ${t.doneBindingP} / ${t.mapL} / ${t.saveQ} / ${t.refQ}`, "", "### Hinweiskasten „Zeit für Sie“", "", `${t.cancelT}: ${t.cancelP} ${t.cancelP2}`, "", "### Terminauswahl", "", `- Unter den Uhrzeiten: ${t.noSlotHint}`, `- Nicht mehr buchbar: ${t.conflict} [${t.otherTime}]`, "");
}
writeFileSync("docs/TEXTE-MAILS.md", out.join("\n"));
console.log("geschrieben", out.length, "Zeilen");
