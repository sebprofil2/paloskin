import { terminToken, terminUrl } from "./links";
import type { MailMessage } from "./mail";
import { readEnv } from "./env";
import { confirmFromFor } from "./attendance";
import type { BookingRow } from "./store";
import { LANGS, TEXTS } from "./texts";
import { langDir } from "./i18n";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, NB, SIGNER, STUDIO } from "./texts-mail";
import { addDaysKey, berlinDateKey, berlinParts, berlinTimeLabel, fromBerlinKey, TZ } from "./time";
import type { Lang } from "./treatments";

/*
 * Kundenmails nach dem Gesamtauftrag vom 3. Oktober 2026: Bestätigung (auch nach dem Verschieben), Erinnerung am Vortag,
 * Kalenderdatei und Kalender-Knöpfe. Keine Buchungsnummer, keine Behandlung, keine Notiz. Wochentag und Monat nie
 * abgekürzt. Reiner Text und einfache HTML-Fassung ohne Bilder.
 */

/* Großbuchstabe am Anfang nach den Regeln der Sprache (Türkisch: i wird İ, ı wird I) */
const cap = (s: string, loc = "de-DE") => s.charAt(0).toLocaleUpperCase(loc) + s.slice(1);

/** „Datum, Uhrzeit“ mit dem Komma der Sprache (Arabisch „،“) */
export function dateTime(lang: Lang, date: string, time: string): string {
  return `${date}${lang === "ar" ? "،" : ","} ${time}`;
}

export interface WhenLabels {
  /** am Satzanfang oder allein stehend, zum Beispiel „Mittwoch, 7. Oktober“ */
  date: string;
  dateYear: string;
  /** mitten im Satz: Spanisch, Französisch und Portugiesisch schreiben den Wochentag klein */
  dateIn: string;
  /** für den Betreff: „Mittwoch, 7.10.“, „Wednesday, 7 October“, „miércoles, 7/10“, „mercredi 7/10“, „quarta-feira, 7/10“, „mercoledì 7/10“, „7.10 Çarşamba“ */
  short: string;
  /** in der Schreibweise der Sprache, zum Beispiel „08:00 Uhr“ */
  time: string;
}

export function whenLabels(start: Date, lang: Lang): WhenLabels {
  const loc = LANGS.find((x) => x.id === lang)?.loc ?? "de-DE";
  const raw = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: TZ, ...o }).format(start);
  const date = raw({ weekday: "long", day: "numeric", month: "long" });
  const p = berlinParts(start);
  const weekday = raw({ weekday: "long" });
  const short =
    lang === "de" ? `${cap(weekday, loc)}, ${p.day}.${p.month}.`
    : lang === "en" ? `${weekday}, ${p.day} ${raw({ month: "long" })}`
    : lang === "fr" ? `${weekday} ${p.day}/${p.month}`
    : lang === "it" ? `${weekday} ${p.day}/${p.month}`
    : lang === "tr" ? `${p.day}.${p.month} ${weekday}`
    : lang === "uk" ? `${weekday}, ${p.day}.${String(p.month).padStart(2, "0")}`
    : lang === "ar" ? `${weekday} ${p.day}/${p.month}`
    : `${weekday}, ${p.day}/${p.month}`;
  return {
    date: cap(date, loc),
    dateYear: cap(raw({ weekday: "long", day: "numeric", month: "long", year: "numeric" }), loc),
    dateIn: date,
    short,
    time: TEXTS[lang].at(berlinTimeLabel(start)),
  };
}

/** Versandzeitpunkt der Erinnerung: Vortag 10:00 Uhr Berliner Zeit. */
/** Erinnerung und Zusage beginnen gleichzeitig: Vortag 10:00 Uhr Berliner Zeit (lib/attendance.ts). */
export function reminderTimeFor(start: Date): Date {
  return confirmFromFor(start);
}

export const CANCEL_LEAD_MS = 24 * 3600000;

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function icsStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

const icsEscape = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function icsFold(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= 75) return line;
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch, "utf8") > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

/*
 * Kalendereintrag des Kunden (Entscheidung Dr. Vogel, 3. Oktober 2026), gleich für Google, Outlook und Kalenderdatei:
 *   Titel „Goodbye Wrinkles: Vorname Nachname · PALO SKIN by Dr. Vogel“, in allen Sprachen gleich
 *   Google: Beschreibung als HTML mit verlinkten Wörtern; Outlook und Kalenderdatei: Klartext mit Leerzeile,
 *   die Kalenderdatei zusätzlich mit X-ALT-DESC (HTML) für Outlook am Computer. Erinnerung 1 Stunde vorher nur in der Datei.
 */
/** Blaue Kugel als Erkennungszeichen vor Betreff und Kalendertitel für Kunden (Entscheidung Dr. Vogel, 4. Oktober 2026). Nie bei Studio-Mails. */
export const KUGEL = "\u{1F535} ";

/** Betreff einer Kundenmail: Kugel zuerst, im Testbetrieb danach „TEST:“. Höchstens 42 Zeichen (Kugel zählt als ein Zeichen). */
export function customerSubject(subject: string, test: boolean): string {
  return `${KUGEL}${test ? "TEST: " : ""}${subject}`;
}

export function calendarTitle(b: BookingRow): string {
  return `${KUGEL}Goodbye Wrinkles: ${b.first_name.trim()} ${b.last_name.trim()} · ${STUDIO}`;
}

export function calendarDescriptionText(b: BookingRow, lang: Lang): string {
  const m = MAIL_TEXTS[lang];
  const colon = lang === "fr" ? `${NB}:` : ":";
  return `${m.icsManage} ${m.icsWindow}${colon}\n${terminUrl(b.id)}\n\n${m.mapL}${colon}\n${MAPS_LINK}`;
}

export function calendarDescriptionHtml(b: BookingRow, lang: Lang): string {
  const m = MAIL_TEXTS[lang];
  return `<a href="${escapeHtml(terminUrl(b.id))}">${escapeHtml(m.icsManage)}</a> ${escapeHtml(m.icsWindow)}<br><br><a href="${escapeHtml(MAPS_LINK)}">${escapeHtml(m.mapL)}</a>`;
}

/** Kalenderdatei: Titel, Ort, Beschreibung als Klartext und als HTML, Erinnerung 1 Stunde vorher. */
export function buildIcs(b: BookingRow, lang: Lang, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PALO SKIN by Dr. Vogel//Buchung//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@paloskin.de`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(new Date(b.starts_at))}`,
    `DTEND:${icsStamp(new Date(b.ends_at))}`,
    `SUMMARY:${icsEscape(calendarTitle(b))}`,
    `LOCATION:${icsEscape(`${STUDIO}, ${ADDRESS}`)}`,
    `DESCRIPTION:${icsEscape(calendarDescriptionText(b, lang))}`,
    `X-ALT-DESC;FMTTYPE=text/html:${icsEscape(`<html><body>${calendarDescriptionHtml(b, lang)}</body></html>`)}`,
    `STATUS:${b.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(calendarTitle(b))}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

export interface CalendarLinks {
  google: string;
  ics: string;
  outlook: string;
}

/** Drei Kalender-Knöpfe: Google, iPhone (Datei vom Server), Outlook. Ohne Namen, Buchungsnummer oder Behandlung. */
export function calendarLinks(b: BookingRow, lang: Lang): CalendarLinks {
  const start = new Date(b.starts_at);
  const end = new Date(b.ends_at);
  const location = `${STUDIO}, ${ADDRESS}`;
  const title = calendarTitle(b);
  const google = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${icsStamp(start)}/${icsStamp(end)}`, location, details: calendarDescriptionHtml(b, lang) });
  const outlook = new URLSearchParams({ subject: title, startdt: start.toISOString(), enddt: end.toISOString(), location, body: calendarDescriptionText(b, lang), path: "/calendar/action/compose", rru: "addevent" });
  return {
    google: `https://calendar.google.com/calendar/render?${google}`,
    ics: `${readEnv().publicBaseUrl}/termin/${terminToken(b.id)}/kalender.ics`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?${outlook}`,
  };
}

const p = (s: string) => `<p style="margin:0 0 14px">${escapeHtml(s)}</p>`;
const a = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:#1534A6">${escapeHtml(label)}</a>`;
const button = (href: string, label: string, primary = true) =>
  primary
    ? `<a href="${escapeHtml(href)}" style="display:inline-block;background:#1534A6;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:500;margin:0 8px 8px 0">${escapeHtml(label)}</a>`
    : `<a href="${escapeHtml(href)}" style="display:inline-block;border:1px solid #1d1f22;color:#1d1f22;text-decoration:none;padding:11px 20px;margin:0 8px 8px 0">${escapeHtml(label)}</a>`;

/* Arabisch von rechts nach links: dir und Ausrichtung an html, body und Inhalt (manche Mailprogramme lesen nur eines davon) */
function wrap(lang: Lang, test: boolean, body: string[]): string {
  const m = MAIL_TEXTS[lang];
  const dir = langDir(lang);
  const align = dir === "rtl" ? "text-align:right;direction:rtl;" : "";
  return [
    `<!doctype html><html lang="${lang}" dir="${dir}"><body dir="${dir}" style="margin:0;padding:24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1f22;background:#ffffff;${align}"><div dir="${dir}" style="max-width:560px;margin:0 auto;${align}">`,
    test ? `<p style="margin:0 0 16px;padding:8px 12px;background:#f3f1ec;font-size:14px">${escapeHtml(m.testNote)}</p>` : "",
    ...body,
    "</div></body></html>",
  ].join("");
}

/**
 * Bestätigungsmail nach der Buchung, oder nach dem Verschieben (rescheduled_at gesetzt): dann Betreff „Verschoben“,
 * anderer erster Satz und der Hinweis, den alten Kalendereintrag zu löschen. Der Erinnerungssatz steht nur, wenn die
 * Erinnerung noch kommt; der Verschieben-Satz nur, wenn mehr als 24 Stunden bis zum Termin bleiben; der Knopf „Termin verschieben oder absagen“ steht immer.
 */
export function confirmationMail(b: BookingRow, now = new Date()): MailMessage {
  const lang = b.language;
  const m = MAIL_TEXTS[lang];
  const start = new Date(b.starts_at);
  const when = whenLabels(start, lang);
  const binding = b.status === "confirmed";
  const rescheduled = !!b.rescheduled_at;
  const test = b.test_mode === 1;
  const cal = calendarLinks(b, lang);
  const reminderComes = now.getTime() < reminderTimeFor(start).getTime() && b.mail_reminder_sent_at === null;
  const canManage = start.getTime() - now.getTime() >= CANCEL_LEAD_MS;
  const link = terminUrl(b.id);
  const intro = rescheduled ? m.introRescheduled : binding ? m.introBooked : m.introRequest;
  const subject = rescheduled ? m.subjectRescheduled(when.short, when.time) : binding ? m.subjectBooked(when.short, when.time) : m.subjectRequest(when.short, when.time);

  const text: string[] = [];
  if (test) text.push(m.testNote, "");
  text.push(m.greeting(b.first_name), "", intro, "", dateTime(lang, when.date, when.time), STUDIO, ADDRESS, `${m.mapL}: ${MAPS_LINK}`, "", m.punctual, "");
  if (b.persons === 2) text.push(m.both, "");
  text.push(m.saveQ, `${m.gcal}: ${cal.google}`, `${m.ical}: ${cal.ics}`, `${m.ocal}: ${cal.outlook}`, "");
  if (rescheduled) text.push(m.oldCalendarNote, "");
  if (reminderComes) text.push(m.reminderNote, "");
  // Jede Buchung geht mindestens 2 Stunden vorher ein: der Knopf heißt immer „Termin verschieben oder absagen“, der Satz zu den 24 Stunden nur, wenn noch mehr als 24 Stunden bleiben
  if (canManage) text.push(m.cancelInfo);
  text.push(`${m.manageLink}: ${link}`, "");
  text.push(m.closing, SIGNER, STUDIO);

  const html = wrap(lang, test, [
    p(m.greeting(b.first_name)),
    p(intro),
    `<p style="margin:0 0 14px"><strong>${escapeHtml(dateTime(lang, when.date, when.time))}</strong><br><span dir="ltr">${escapeHtml(STUDIO)}<br>${escapeHtml(ADDRESS)}</span><br>${a(MAPS_LINK, m.mapL)}</p>`,
    p(m.punctual),
    b.persons === 2 ? p(m.both) : "",
    `<p style="margin:0 0 6px">${escapeHtml(m.saveQ)}</p><p style="margin:0 0 14px">${button(cal.google, m.gcal, false)}${button(cal.ics, m.ical, false)}${button(cal.outlook, m.ocal, false)}</p>`,
    rescheduled ? p(m.oldCalendarNote) : "",
    reminderComes ? p(m.reminderNote) : "",
    `${canManage ? `<p style="margin:0 0 6px">${escapeHtml(m.cancelInfo)}</p>` : ""}<p style="margin:0 0 14px">${button(link, m.manageLink)}</p>`,
    `<p style="margin:16px 0 0">${escapeHtml(m.closing)}<br>${escapeHtml(SIGNER)}<br>${escapeHtml(STUDIO)}</p>`,
  ]);

  return { to: b.email, subject: customerSubject(subject, test), text: text.join("\n"), html, ics: { filename: "termin.ics", content: buildIcs(b, lang, now) } };
}

/** Erinnerung am Vortag um 10:00 Uhr: Bestätigen mit einem Klick, sonst verschieben. Keine Kalender-Knöpfe. */
export function reminderMail(b: BookingRow): MailMessage {
  const lang = b.language;
  const m = MAIL_TEXTS[lang];
  const when = whenLabels(new Date(b.starts_at), lang);
  const test = b.test_mode === 1;
  const yesUrl = terminUrl(b.id, "ja");
  const moveUrl = `${terminUrl(b.id)}/verschieben`;

  const text: string[] = [];
  if (test) text.push(m.testNote, "");
  text.push(m.greeting(b.first_name), "", m.introReminder, "", dateTime(lang, when.date, when.time), ADDRESS, `${m.mapL}: ${MAPS_LINK}`, "", m.confirmQ, `${m.yes}: ${yesUrl}`, `${m.notFit} ${m.rescheduleLink}: ${moveUrl}`, "", m.punctualShort, "", m.closingReminder, SIGNER, STUDIO);

  const html = wrap(lang, test, [
    p(m.greeting(b.first_name)),
    p(m.introReminder),
    `<p style="margin:0 0 14px"><strong>${escapeHtml(dateTime(lang, when.date, when.time))}</strong><br><span dir="ltr">${escapeHtml(ADDRESS)}</span><br>${a(MAPS_LINK, m.mapL)}</p>`,
    `<p style="margin:0 0 6px">${escapeHtml(m.confirmQ)}</p><p style="margin:0 0 6px">${button(yesUrl, m.yes)}</p><p style="margin:0 0 14px">${escapeHtml(m.notFit)} ${a(moveUrl, m.rescheduleLink)}</p>`,
    p(m.punctualShort),
    `<p style="margin:16px 0 0">${escapeHtml(m.closingReminder)}<br>${escapeHtml(SIGNER)}<br>${escapeHtml(STUDIO)}</p>`,
  ]);

  return { to: b.email, subject: customerSubject(m.subjectReminder(when.time), test), text: text.join("\n"), html };
}
