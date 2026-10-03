import { terminToken, terminUrl } from "./links";
import type { MailMessage } from "./mail";
import { readEnv } from "./env";
import type { BookingRow } from "./store";
import { LANGS, TEXTS } from "./texts";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, SIGNER, STUDIO } from "./texts-mail";
import { addDaysKey, berlinDateKey, berlinParts, berlinTimeLabel, fromBerlinKey, TZ } from "./time";
import type { Lang } from "./treatments";

/*
 * Kundenmails nach dem Gesamtauftrag vom 3. Oktober 2026: Bestätigung (auch nach dem Verschieben), Erinnerung am Vortag,
 * Kalenderdatei und Kalender-Knöpfe. Keine Buchungsnummer, keine Behandlung, keine Notiz. Wochentag und Monat nie
 * abgekürzt. Reiner Text und einfache HTML-Fassung ohne Bilder.
 */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface WhenLabels {
  /** am Satzanfang oder allein stehend, zum Beispiel „Mittwoch, 7. Oktober“ */
  date: string;
  dateYear: string;
  /** mitten im Satz: Spanisch, Französisch und Portugiesisch schreiben den Wochentag klein */
  dateIn: string;
  /** für den Betreff: „Mittwoch, 7.10.“, „Wednesday, 7 October“, „miércoles, 7/10“, „mercredi 7/10“, „quarta-feira, 7/10“ */
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
    lang === "de" ? `${cap(weekday)}, ${p.day}.${p.month}.` : lang === "en" ? `${weekday}, ${p.day} ${raw({ month: "long" })}` : lang === "fr" ? `${weekday} ${p.day}/${p.month}` : `${weekday}, ${p.day}/${p.month}`;
  return {
    date: cap(date),
    dateYear: cap(raw({ weekday: "long", day: "numeric", month: "long", year: "numeric" })),
    dateIn: date,
    short,
    time: TEXTS[lang].at(berlinTimeLabel(start)),
  };
}

/** Versandzeitpunkt der Erinnerung: Vortag 10:00 Uhr Berliner Zeit. */
export function reminderTimeFor(start: Date): Date {
  return fromBerlinKey(addDaysKey(berlinDateKey(start), -1), "10:00");
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

/** Kalenderdatei: Titel „Termin bei PALO SKIN“, Ort, Beschreibung mit persönlichem Link zur Terminseite und Kartenlink, Erinnerung 1 Stunde vorher. */
export function buildIcs(b: BookingRow, lang: Lang, now = new Date()): string {
  const m = MAIL_TEXTS[lang];
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
    `SUMMARY:${icsEscape(m.icsTitle)}`,
    `LOCATION:${icsEscape(`${STUDIO}, ${ADDRESS}`)}`,
    `DESCRIPTION:${icsEscape(m.icsDescription(terminUrl(b.id)))}`,
    `STATUS:${b.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(m.icsTitle)}`,
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
  const m = MAIL_TEXTS[lang];
  const start = new Date(b.starts_at);
  const end = new Date(b.ends_at);
  const location = `${STUDIO}, ${ADDRESS}`;
  const details = m.icsDescription(terminUrl(b.id));
  const google = new URLSearchParams({ action: "TEMPLATE", text: m.icsTitle, dates: `${icsStamp(start)}/${icsStamp(end)}`, location, details });
  const outlook = new URLSearchParams({ subject: m.icsTitle, startdt: start.toISOString(), enddt: end.toISOString(), location, body: details, path: "/calendar/action/compose", rru: "addevent" });
  return {
    google: `https://calendar.google.com/calendar/render?${google}`,
    ics: `${readEnv().publicBaseUrl}/termin/${terminToken(b.id)}/kalender.ics`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?${outlook}`,
  };
}

const p = (s: string) => `<p style="margin:0 0 14px">${escapeHtml(s)}</p>`;
const a = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:#002FA7">${escapeHtml(label)}</a>`;
const button = (href: string, label: string, primary = true) =>
  primary
    ? `<a href="${escapeHtml(href)}" style="display:inline-block;background:#002FA7;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:500;margin:0 8px 8px 0">${escapeHtml(label)}</a>`
    : `<a href="${escapeHtml(href)}" style="display:inline-block;border:1px solid #1d1f22;color:#1d1f22;text-decoration:none;padding:11px 20px;margin:0 8px 8px 0">${escapeHtml(label)}</a>`;

function wrap(lang: Lang, test: boolean, body: string[]): string {
  const m = MAIL_TEXTS[lang];
  return [
    `<!doctype html><html lang="${lang}"><body style="margin:0;padding:24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1f22;background:#ffffff"><div style="max-width:560px;margin:0 auto">`,
    test ? `<p style="margin:0 0 16px;padding:8px 12px;background:#f3f1ec;font-size:14px">${escapeHtml(m.testNote)}</p>` : "",
    ...body,
    "</div></body></html>",
  ].join("");
}

/**
 * Bestätigungsmail nach der Buchung, oder nach dem Verschieben (rescheduled_at gesetzt): dann Betreff „Verschoben“,
 * anderer erster Satz und der Hinweis, den alten Kalendereintrag zu löschen. Der Erinnerungssatz steht nur, wenn die
 * Erinnerung noch kommt; der Verschieben-Satz nur, wenn mehr als 24 Stunden bis zum Termin bleiben.
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
  text.push(m.greeting(b.first_name), "", intro, "", `${when.date}, ${when.time}`, STUDIO, ADDRESS, `${m.mapL}: ${MAPS_LINK}`, "", m.punctual, "");
  if (b.persons === 2) text.push(m.both, "");
  text.push(m.saveQ, `${m.gcal}: ${cal.google}`, `${m.ical}: ${cal.ics}`, `${m.ocal}: ${cal.outlook}`, "");
  if (rescheduled) text.push(m.oldCalendarNote, "");
  if (reminderComes) text.push(m.reminderNote, "");
  if (canManage) text.push(m.cancelInfo, `${m.manageLink}: ${link}`, "");
  else text.push(`${m.viewLink}: ${link}`, "");
  text.push(m.closing, SIGNER, STUDIO);

  const html = wrap(lang, test, [
    p(m.greeting(b.first_name)),
    p(intro),
    `<p style="margin:0 0 14px"><strong>${escapeHtml(`${when.date}, ${when.time}`)}</strong><br>${escapeHtml(STUDIO)}<br>${escapeHtml(ADDRESS)}<br>${a(MAPS_LINK, m.mapL)}</p>`,
    p(m.punctual),
    b.persons === 2 ? p(m.both) : "",
    `<p style="margin:0 0 6px">${escapeHtml(m.saveQ)}</p><p style="margin:0 0 14px">${button(cal.google, m.gcal, false)}${button(cal.ics, m.ical, false)}${button(cal.outlook, m.ocal, false)}</p>`,
    rescheduled ? p(m.oldCalendarNote) : "",
    reminderComes ? p(m.reminderNote) : "",
    canManage ? `<p style="margin:0 0 6px">${escapeHtml(m.cancelInfo)}</p><p style="margin:0 0 14px">${button(link, m.manageLink)}</p>` : `<p style="margin:0 0 14px">${button(link, m.viewLink)}</p>`,
    `<p style="margin:16px 0 0">${escapeHtml(m.closing)}<br>${escapeHtml(SIGNER)}<br>${escapeHtml(STUDIO)}</p>`,
  ]);

  return { to: b.email, subject: `${test ? "TEST: " : ""}${subject}`, text: text.join("\n"), html, ics: { filename: "termin.ics", content: buildIcs(b, lang, now) } };
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
  text.push(m.greeting(b.first_name), "", m.introReminder, "", `${when.date}, ${when.time}`, ADDRESS, `${m.mapL}: ${MAPS_LINK}`, "", m.confirmQ, `${m.yes}: ${yesUrl}`, `${m.notFit} ${m.rescheduleLink}: ${moveUrl}`, "", m.punctualShort, "", m.closingReminder, SIGNER, STUDIO);

  const html = wrap(lang, test, [
    p(m.greeting(b.first_name)),
    p(m.introReminder),
    `<p style="margin:0 0 14px"><strong>${escapeHtml(`${when.date}, ${when.time}`)}</strong><br>${escapeHtml(ADDRESS)}<br>${a(MAPS_LINK, m.mapL)}</p>`,
    `<p style="margin:0 0 6px">${escapeHtml(m.confirmQ)}</p><p style="margin:0 0 6px">${button(yesUrl, m.yes)}</p><p style="margin:0 0 14px">${escapeHtml(m.notFit)} ${a(moveUrl, m.rescheduleLink)}</p>`,
    p(m.punctualShort),
    `<p style="margin:16px 0 0">${escapeHtml(m.closingReminder)}<br>${escapeHtml(SIGNER)}<br>${escapeHtml(STUDIO)}</p>`,
  ]);

  return { to: b.email, subject: `${test ? "TEST: " : ""}${m.subjectReminder(when.time)}`, text: text.join("\n"), html };
}
