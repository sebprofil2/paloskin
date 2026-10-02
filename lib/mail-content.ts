import { terminUrl } from "./links";
import type { MailMessage } from "./mail";
import type { BookingRow } from "./store";
import { LANGS, TEXTS } from "./texts";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, PHONE, SIGNER, STUDIO, WA_LINK } from "./texts-mail";
import { berlinTimeLabel, TZ } from "./time";
import type { Lang } from "./treatments";

/*
 * Bestätigungs- und Erinnerungsmail nach der Freigabe vom 2. Oktober 2026: nur Datum, Uhrzeit, Adresse, bei zu zweit
 * ein Satz; keine Buchungsnummer, keine Behandlung, keine Notiz. Reiner Text und einfache HTML-Fassung, keine Bilder,
 * kein Tracking. Kalenderdatei in Weltzeit mit Endzeit.
 */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface WhenLabels {
  /** zum Beispiel „Donnerstag, 8. Oktober“ */
  date: string;
  /** mit Jahr, zum Beispiel „Donnerstag, 8. Oktober 2026“ */
  dateYear: string;
  /** nur der Wochentag, zum Beispiel „Donnerstag“ */
  weekday: string;
  /** in der Schreibweise der Sprache, zum Beispiel „08:00 Uhr“ */
  time: string;
}

export function whenLabels(start: Date, lang: Lang): WhenLabels {
  const loc = LANGS.find((x) => x.id === lang)?.loc ?? "de-DE";
  const fmt = (o: Intl.DateTimeFormatOptions) => cap(new Intl.DateTimeFormat(loc, { timeZone: TZ, ...o }).format(start));
  return {
    date: fmt({ weekday: "long", day: "numeric", month: "long" }),
    dateYear: fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    weekday: fmt({ weekday: "long" }),
    time: TEXTS[lang].at(berlinTimeLabel(start)),
  };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function icsStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

const icsEscape = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Zeilen länger als 75 Oktette falten (RFC 5545). */
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

/** Kalenderdatei: Titel „Termin bei PALO SKIN“, Ort, Beschreibung nur der Absagehinweis. Kennung aus der Buchung, nicht sichtbar. */
export function buildIcs(b: BookingRow, lang: Lang, now = new Date()): string {
  const m = MAIL_TEXTS[lang];
  const binding = b.status === "confirmed";
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
    `DESCRIPTION:${icsEscape(m.icsDescription)}`,
    `STATUS:${binding ? "CONFIRMED" : "TENTATIVE"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

const p = (s: string) => `<p style="margin:0 0 14px">${escapeHtml(s)}</p>`;
const a = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:#002FA7">${escapeHtml(label)}</a>`;
const button = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="display:inline-block;background:#002FA7;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:500">${escapeHtml(label)}</a>`;

function wrap(lang: Lang, test: boolean, body: string[]): string {
  const m = MAIL_TEXTS[lang];
  return [
    `<!doctype html><html lang="${lang}"><body style="margin:0;padding:24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1f22;background:#ffffff"><div style="max-width:560px;margin:0 auto">`,
    test ? `<p style="margin:0 0 16px;padding:8px 12px;background:#f3f1ec;font-size:14px">${escapeHtml(m.testNote)}</p>` : "",
    ...body,
    "</div></body></html>",
  ].join("");
}

/** Bestätigungsmail: verbindlich, wenn die Buchung den Status confirmed hat, sonst Eingangsbestätigung der Anfrage. */
export function confirmationMail(b: BookingRow, now = new Date()): MailMessage {
  const lang = b.language;
  const m = MAIL_TEXTS[lang];
  const when = whenLabels(new Date(b.starts_at), lang);
  const binding = b.status === "confirmed";
  const test = b.test_mode === 1;
  const cancelUrl = terminUrl(b.id, "absagen");
  const place = `${STUDIO}, ${ADDRESS}`;

  const text: string[] = [];
  if (test) text.push(m.testNote, "");
  text.push(m.greeting(b.first_name), "", binding ? m.introBinding : m.introRequest, "", `${when.dateYear}, ${when.time}`, `${place} (${m.mapL}: ${MAPS_LINK})`, "");
  if (b.persons === 2) text.push(m.both, "");
  text.push(m.reminderNote, "", `${m.cancelLead} ${m.cancelLink}: ${cancelUrl}`, m.cancelRule, "", m.icsNote, "", m.closing, SIGNER, place, `WhatsApp ${PHONE}`);

  const html = wrap(lang, test, [
    p(m.greeting(b.first_name)),
    p(binding ? m.introBinding : m.introRequest),
    `<p style="margin:0 0 14px"><strong>${escapeHtml(`${when.dateYear}, ${when.time}`)}</strong><br>${escapeHtml(place)} (${a(MAPS_LINK, m.mapL)})</p>`,
    b.persons === 2 ? p(m.both) : "",
    p(m.reminderNote),
    `<p style="margin:0 0 14px">${escapeHtml(m.cancelLead)} ${a(cancelUrl, m.cancelLink)}. ${escapeHtml(m.cancelRule).replace(escapeHtml(PHONE), a(WA_LINK, PHONE))}</p>`,
    p(m.icsNote),
    `<p style="margin:16px 0 0">${escapeHtml(m.closing)}<br>${escapeHtml(SIGNER)}<br>${escapeHtml(place)}<br>WhatsApp ${a(WA_LINK, PHONE)}</p>`,
  ]);

  return {
    to: b.email,
    subject: `${test ? "TEST: " : ""}${binding ? m.subjectBinding(when.date, when.time) : m.subjectRequest(when.date, when.time)}`,
    text: text.join("\n"),
    html,
    ics: { filename: "termin.ics", content: buildIcs(b, lang, now) },
  };
}

/** Erinnerung etwa 24 Stunden vor dem Termin, mit dem Knopf „Ja, ich komme“, ohne Kalenderdatei. */
export function reminderMail(b: BookingRow): MailMessage {
  const lang = b.language;
  const m = MAIL_TEXTS[lang];
  const when = whenLabels(new Date(b.starts_at), lang);
  const test = b.test_mode === 1;
  const yesUrl = terminUrl(b.id, "ja");

  const text: string[] = [];
  if (test) text.push(m.testNote, "");
  text.push(m.greeting(b.first_name), "", m.introReminder(when.date, when.time), "", `${m.oneClick} ${m.yes}: ${yesUrl}`, "", m.reminderCancel, "", m.closingReminder, SIGNER, STUDIO);

  const html = wrap(lang, test, [
    p(m.greeting(b.first_name)),
    p(m.introReminder(when.date, when.time)),
    `<p style="margin:0 0 16px">${escapeHtml(m.oneClick)}<br><br>${button(yesUrl, m.yes)}</p>`,
    `<p style="margin:0 0 14px">${escapeHtml(m.reminderCancel).replace(escapeHtml(PHONE), a(WA_LINK, PHONE))}</p>`,
    `<p style="margin:16px 0 0">${escapeHtml(m.closingReminder)}<br>${escapeHtml(SIGNER)}<br>${escapeHtml(STUDIO)}</p>`,
  ]);

  return { to: b.email, subject: `${test ? "TEST: " : ""}${m.subjectReminder(when.time)}`, text: text.join("\n"), html };
}
