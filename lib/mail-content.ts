import { terminUrl } from "./links";
import type { MailMessage } from "./mail";
import type { BookingRow } from "./store";
import { LANGS, TEXTS } from "./texts";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, PHONE, STUDIO, WA_LINK } from "./texts-mail";
import { berlinTimeLabel, TZ } from "./time";
import { zoneCount, type Lang, type Selection } from "./treatments";

/*
 * Inhalt der Bestätigungs- und Erinnerungsmail: reiner Text und einfache HTML-Fassung, keine Bilder, kein Tracking,
 * keine Notiz des Kunden. Kalenderdatei (ICS) in Weltzeit, damit iPhone und Outlook die Berliner Zeit richtig zeigen.
 */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Doppelpunkt nach einer Beschriftung; Französisch mit geschütztem Leerzeichen davor */
const colon = (lang: Lang) => (lang === "fr" ? "\u00A0:" : ":");

export interface WhenLabels {
  /** zum Beispiel „Montag, 5. Oktober“ */
  date: string;
  /** mit Jahr, zum Beispiel „Montag, 5. Oktober 2026“ */
  dateYear: string;
  /** in der Schreibweise der Sprache, zum Beispiel „14:00 Uhr“ */
  time: string;
}

export function whenLabels(start: Date, lang: Lang): WhenLabels {
  const loc = LANGS.find((x) => x.id === lang)?.loc ?? "de-DE";
  const date = cap(new Intl.DateTimeFormat(loc, { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(start));
  const dateYear = cap(new Intl.DateTimeFormat(loc, { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(start));
  const time = TEXTS[lang].at(berlinTimeLabel(start));
  return { date, dateYear, time };
}

/** Zeilen der Behandlungen in der Struktur der Übersicht („Unverbindliche Vorauswahl“). */
export function treatmentRows(selection: Selection, lang: Lang): string[] {
  const l = TEXTS[lang];
  const m = MAIL_TEXTS[lang];
  const s = selection;
  const out: string[] = [];
  if (s.checkup) out.push(m.checkupRow);
  if (s.persons === 2) out.push(l.persons2);
  if (s.beratung) out.push(l.beratungRow);
  const n = zoneCount({ zones: s.zones, otherZone: s.otherZone });
  const names = [...s.zones.map((z) => l.zoneNames[z]), ...(s.otherZone !== null ? [s.otherZone.trim() ? `${l.zoneOther}${colon(lang)} ${s.otherZone.trim()}` : l.zoneOther] : [])];
  if (n > 0) out.push(`${l.botRow}${l.zoneCountLabel(n)}${colon(lang)} ${names.join(", ")}`);
  else if (s.zonesUnknown) out.push(`${l.botRow}${l.zonesOpen}`);
  if (s.kaumuskel) out.push(`${l.botRow}${l.kaumuskel}`);
  if (s.nefertiti) out.push(`${l.botRow}${l.nefertiti}`);
  if (s.achsel) out.push(`${l.botRow}${l.achsel}`);
  if (s.lachs === "single") out.push(`${l.boostRow}${l.lachsRow}`);
  if (s.lachs === "pack") out.push(`${l.boostRow}${l.lachsPack}`);
  return out;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function icsStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

const icsEscape = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Zeilen länger als 75 Oktette falten (RFC 5545). */
function icsFold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
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

export function buildIcs(b: BookingRow, lang: Lang, link: string, now = new Date()): string {
  const m = MAIL_TEXTS[lang];
  const binding = b.status === "confirmed";
  const desc = `${STUDIO}\n${ADDRESS}\n${m.refL}: ${b.reference}\n${link}\nWhatsApp: ${PHONE}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Palo Skin by Dr. Vogel//Buchung//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.reference}@paloskin.de`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(new Date(b.starts_at))}`,
    `DTEND:${icsStamp(new Date(b.ends_at))}`,
    `SUMMARY:${icsEscape(STUDIO)}`,
    `LOCATION:${icsEscape(ADDRESS)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `URL:${link}`,
    `STATUS:${binding ? "CONFIRMED" : "TENTATIVE"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

interface Parts {
  subject: string;
  intro: string;
  withIcs: boolean;
}

function compose(b: BookingRow, parts: Parts, now: Date): MailMessage {
  const lang = b.language;
  const m = MAIL_TEXTS[lang];
  const selection = JSON.parse(b.selection) as Selection;
  const when = whenLabels(new Date(b.starts_at), lang);
  const yesUrl = terminUrl(b.id, "ja");
  const cancelUrl = terminUrl(b.id, "absagen");
  const rows = treatmentRows(selection, lang);
  const test = b.test_mode === 1;
  const c = colon(lang);

  const text: string[] = [];
  if (test) text.push(m.testNote, "");
  text.push(m.greeting(b.first_name), "", parts.intro, "");
  text.push(`${m.whenL}${c} ${when.dateYear}, ${when.time}`);
  if (b.persons === 2) text.push(m.both);
  text.push(`${m.addressL}${c} ${STUDIO}, ${ADDRESS}`, `${m.mapL}${c} ${MAPS_LINK}`, `${m.refL}${c} ${b.reference}`, "");
  if (rows.length) text.push(`${m.treatmentsL}${c}`, ...rows.map((r) => `- ${r}`), "");
  text.push(m.askL, `${m.yes}${c} ${yesUrl}`, `${m.cancel}${c} ${cancelUrl}`, "", m.cancelRule, "");
  if (parts.withIcs) text.push(m.icsNote, "");
  text.push(m.closing, "", m.signatureL, STUDIO, ADDRESS, `WhatsApp ${PHONE}`, "info@paloskin.de");

  const p = (s: string) => `<p style="margin:0 0 12px">${escapeHtml(s)}</p>`;
  const a = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:#002FA7">${escapeHtml(label)}</a>`;
  const html: string[] = [`<!doctype html><html lang="${lang}"><body style="margin:0;padding:24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#1d1f22;background:#ffffff">`];
  html.push(`<div style="max-width:560px;margin:0 auto">`);
  if (test) html.push(`<p style="margin:0 0 16px;padding:8px 12px;background:#f3f1ec;font-size:14px">${escapeHtml(m.testNote)}</p>`);
  html.push(p(m.greeting(b.first_name)), p(parts.intro));
  html.push(`<p style="margin:0 0 12px"><strong>${escapeHtml(m.whenL + c)}</strong> ${escapeHtml(`${when.dateYear}, ${when.time}`)}${b.persons === 2 ? `<br>${escapeHtml(m.both)}` : ""}</p>`);
  html.push(`<p style="margin:0 0 12px"><strong>${escapeHtml(m.addressL + c)}</strong> ${escapeHtml(`${STUDIO}, ${ADDRESS}`)}<br>${a(MAPS_LINK, m.mapL)}</p>`);
  html.push(`<p style="margin:0 0 12px"><strong>${escapeHtml(m.refL + c)}</strong> ${escapeHtml(b.reference)}</p>`);
  if (rows.length) html.push(`<p style="margin:0 0 4px"><strong>${escapeHtml(m.treatmentsL + c)}</strong></p><ul style="margin:0 0 12px;padding-left:20px">${rows.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`);
  html.push(p(m.askL));
  html.push(
    `<p style="margin:0 0 16px"><a href="${escapeHtml(yesUrl)}" style="display:inline-block;background:#002FA7;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:500">${escapeHtml(m.yes)}</a>` +
      `&nbsp;&nbsp;<a href="${escapeHtml(cancelUrl)}" style="display:inline-block;border:1px solid #1d1f22;color:#1d1f22;text-decoration:none;padding:11px 20px">${escapeHtml(m.cancel)}</a></p>`,
  );
  html.push(`<p style="margin:0 0 12px;font-size:14px;color:#555">${escapeHtml(m.cancelRule).replace(escapeHtml(PHONE), a(WA_LINK, PHONE))}</p>`);
  if (parts.withIcs) html.push(`<p style="margin:0 0 12px;font-size:14px;color:#555">${escapeHtml(m.icsNote)}</p>`);
  html.push(p(m.closing));
  html.push(`<p style="margin:16px 0 0">${escapeHtml(m.signatureL)}<br><strong>${escapeHtml(STUDIO)}</strong><br>${escapeHtml(ADDRESS)}<br>WhatsApp ${a(WA_LINK, PHONE)}<br>${a("mailto:info@paloskin.de", "info@paloskin.de")}</p>`);
  html.push("</div></body></html>");

  return {
    to: b.email,
    subject: `${test ? "TEST: " : ""}${parts.subject}`,
    text: text.join("\n"),
    html: html.join(""),
    ics: parts.withIcs ? { filename: "termin.ics", content: buildIcs(b, lang, terminUrl(b.id), now) } : undefined,
  };
}

/** Bestätigungsmail: verbindlich, wenn die Buchung den Status confirmed hat, sonst Eingangsbestätigung der Anfrage. */
export function confirmationMail(b: BookingRow, now = new Date()): MailMessage {
  const m = MAIL_TEXTS[b.language];
  const when = whenLabels(new Date(b.starts_at), b.language);
  const binding = b.status === "confirmed";
  return compose(
    b,
    {
      subject: binding ? m.subjectBinding(when.date, when.time) : m.subjectRequest(when.date, when.time),
      intro: binding ? m.introBinding : m.introRequest,
      withIcs: true,
    },
    now,
  );
}

/** Erinnerung etwa 24 Stunden vor dem Termin. */
export function reminderMail(b: BookingRow, now = new Date()): MailMessage {
  const m = MAIL_TEXTS[b.language];
  const when = whenLabels(new Date(b.starts_at), b.language);
  return compose(b, { subject: m.subjectReminder(when.date, when.time), intro: m.introReminder, withIcs: false }, now);
}
