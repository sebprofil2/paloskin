import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildIcs, confirmationMail, reminderMail, whenLabels } from "../mail-content";
import type { BookingRow } from "../store";
import { emptySelection, type Lang, type Selection } from "../treatments";

function row(over: Partial<BookingRow> = {}): BookingRow {
  const selection: Selection = { ...emptySelection(), persons: 2, visit: "first", zones: ["stirn", "zornesfalte", "kraehenfuesse"], note: "Geheime Notiz" };
  return {
    id: "01M3YWQ51D0EPJ4VSS2B2MQT7H",
    reference: "PS-ABC234",
    created_at: "2026-10-01T10:00:00.000Z",
    starts_at: "2026-10-08T06:00:00.000Z", // Donnerstag 08:00 Sommerzeit
    ends_at: "2026-10-08T06:50:00.000Z",
    duration_minutes: 50,
    persons: 2,
    first_visit: 1,
    service_codes: JSON.stringify(["BOT"]),
    zones: JSON.stringify(selection.zones),
    checkup: 0,
    status: "confirmed",
    channel: "web",
    language: "de",
    device: "mobile",
    reminder_whatsapp: 1,
    reminder_consent_at: "2026-10-01T10:00:00.000Z",
    consent_at: "2026-10-01T10:00:00.000Z",
    first_name: "Verena",
    last_name: "Muster",
    phone_e164: "+491511234567",
    email: "verena@example.com",
    note: "Geheime Notiz",
    referral: null,
    selection: JSON.stringify(selection),
    test_mode: 0,
    calendar_event_id: null,
    calendar_state: "pending",
    calendar_attempts: 0,
    calendar_attempted_at: null,
    updated_at: "2026-10-01T10:00:00.000Z",
    deleted_at: null,
    attendance_confirmed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    mail_confirmation_sent_at: null,
    mail_confirmation_attempts: 0,
    mail_confirmation_attempted_at: null,
    mail_reminder_sent_at: null,
    mail_reminder_attempts: 0,
    mail_reminder_skipped: 0,
    ...over,
  };
}

const FORBIDDEN = ["PS-ABC234", "Geheime Notiz", "Botox", "Stirn", "Zornesfalte", "Vorauswahl", "Buchungsnummer", "Palo Skin by"];

describe("Bestätigungsmail nach Freigabe", () => {
  beforeEach(() => {
    process.env.LINK_SECRET = "test-schluessel";
    process.env.PUBLIC_BASE_URL = "https://www.paloskin.de";
  });
  afterEach(() => {
    delete process.env.LINK_SECRET;
    delete process.env.PUBLIC_BASE_URL;
  });

  it("Deutsch wörtlich, zu zweit, drei Kalender-Knöpfe, ohne Nummer und ohne Behandlung", () => {
    const m = confirmationMail(row(), new Date("2026-10-01T10:00:00Z"));
    expect(m.to).toBe("verena@example.com");
    expect(m.subject).toBe("Gebucht: Donnerstag, 8.10., 08:00 Uhr");
    expect(m.subject.length).toBeLessThanOrEqual(40);
    const t = m.text;
    expect(t).toContain("Hallo Verena,\n\nschön, dass Sie zu uns kommen! Wir freuen uns auf Sie:\n\nDonnerstag, 8. Oktober, 08:00 Uhr\nPALO SKIN by Dr. Vogel\nHagenauer Straße 14, 10435 Berlin\nSo finden Sie uns: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8\n");
    expect(t).toContain("Ihre Zeit ist uns wichtig: Bei PALO SKIN beginnt Ihr Termin pünktlich, ohne Wartezeit.");
    expect(t).toContain("\nFür Sie beide haben wir Zeit eingeplant.\n");
    expect(t).toContain("Möchten Sie den Termin gleich im Kalender speichern?\nGoogle Kalender: https://calendar.google.com/calendar/render?action=TEMPLATE&text=Termin+bei+PALO+SKIN&dates=20261008T060000Z%2F20261008T065000Z&location=");
    expect(t).toMatch(/iPhone-Kalender: https:\/\/www\.paloskin\.de\/termin\/01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}\/kalender\.ics\n/);
    expect(t).toContain("Outlook: https://outlook.live.com/calendar/0/deeplink/compose?subject=Termin+bei+PALO+SKIN&startdt=2026-10-08T06%3A00%3A00.000Z");
    expect(t).toContain("Am Tag vorher erinnern wir Sie noch einmal.");
    expect(t).toContain("Falls etwas dazwischenkommt, können Sie Ihren Termin bis 48 Stunden vorher über den Link absagen. Danach schreiben Sie uns bitte per WhatsApp an +49 151 58872566.");
    expect(t).toMatch(/Termin ansehen oder absagen: https:\/\/www\.paloskin\.de\/termin\/01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}\n/);
    expect(t).toContain("Bis bald!\nDr. med. Sebastian Vogel\nPALO SKIN by Dr. Vogel");
    expect(t).not.toContain("Ja, ich komme");
    for (const f of FORBIDDEN) {
      expect(t, f).not.toContain(f);
      expect(m.html, f).not.toContain(f);
      expect(m.ics!.content, f).not.toContain(f);
    }
    expect(m.html).toContain(">Google Kalender</a>");
    expect(m.html).toContain(">iPhone-Kalender</a>");
    expect(m.html).toContain(">Outlook</a>");
    expect(m.html).toContain(">Termin ansehen oder absagen</a>");
    expect(m.html).toContain("<strong>Donnerstag, 8. Oktober, 08:00 Uhr</strong>");
    expect(m.html).not.toContain("<img");
    expect(m.ics?.filename).toBe("termin.ics");
  });

  it("allein: kein Satz für zwei; Testbetrieb kennzeichnet; Anfrage ohne Schalter", () => {
    expect(confirmationMail(row({ persons: 1 })).text).not.toContain("beide");
    const t = confirmationMail(row({ test_mode: 1 }));
    expect(t.subject).toBe("TEST: Gebucht: Donnerstag, 8.10., 08:00 Uhr");
    expect(t.text).toContain("Testbetrieb");
    const r = confirmationMail(row({ status: "requested" }));
    expect(r.subject).toBe("Angefragt: Donnerstag, 8.10., 08:00 Uhr");
    expect(r.ics?.content).toContain("STATUS:TENTATIVE");
  });

  it("Kalenderdatei: Titel, Ort, nur Absagehinweis mit WhatsApp und Kartenlink, Weltzeit mit Endzeit, Winterzeit", () => {
    const ics = buildIcs(row(), "de", new Date("2026-10-01T10:00:00Z"));
    expect(ics).toContain("SUMMARY:Termin bei PALO SKIN");
    expect(ics).toContain("LOCATION:PALO SKIN by Dr. Vogel\\, Hagenauer Straße 14\\, 10435 Berlin");
    expect(ics.replace(/\r\n /g, "")).toContain("DESCRIPTION:Absagen bis 48 Stunden vorher über den Link in Ihrer Bestätigung\\, danach per WhatsApp an +49 151 58872566. So finden Sie uns: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8");
    expect(ics).toContain("DTSTART:20261008T060000Z");
    expect(ics).toContain("DTEND:20261008T065000Z");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
    const winter = whenLabels(new Date("2026-10-26T09:00:00Z"), "de");
    expect(winter).toMatchObject({ date: "Montag, 26. Oktober", short: "Montag, 26.10.", time: "10:00 Uhr" });
    expect(whenLabels(new Date("2026-10-26T09:00:00Z"), "es")).toMatchObject({ dateIn: "lunes, 26 de octubre" });
    expect(buildIcs(row({ starts_at: "2026-10-26T09:00:00.000Z", ends_at: "2026-10-26T09:30:00.000Z" }), "de")).toContain("DTSTART:20261026T090000Z");
  });

  it("Erinnerung wörtlich, mit Knopf und WhatsApp, ohne Kalender-Knöpfe und ohne Kalenderdatei", () => {
    const m = reminderMail(row());
    expect(m.subject).toBe("Bis morgen um 08:00 Uhr!");
    expect(m.text).toContain("Hallo Verena,\n\nmorgen sehen wir uns bei PALO SKIN. Wir freuen uns auf Sie!\n\nDonnerstag, 8. Oktober, 08:00 Uhr\nHagenauer Straße 14, 10435 Berlin\nSo finden Sie uns: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8\n\nIhr Termin beginnt pünktlich, ohne Wartezeit.");
    expect(m.text).toMatch(/Wenn Sie möchten, geben Sie uns kurz ein Zeichen:\nJa, ich komme: https:\/\/www\.paloskin\.de\/termin\/[^\n]+\?a=ja\nIhr Termin bleibt auch ohne Klick für Sie reserviert\./);
    expect(m.text).toContain("Falls etwas dazwischenkommt, schreiben Sie uns bitte per WhatsApp an +49 151 58872566.\nPer WhatsApp schreiben: https://wa.me/4915158872566\n\nBis morgen!\nDr. med. Sebastian Vogel\nPALO SKIN by Dr. Vogel");
    expect(m.text).not.toContain("calendar.google");
    expect(m.html).toContain(">Ja, ich komme</a>");
    expect(m.html).toContain(">Per WhatsApp schreiben</a>");
    expect(m.ics).toBeUndefined();
    for (const f of FORBIDDEN) expect(m.text, f).not.toContain(f);
  });

  it("alle Sprachen: Betreff höchstens 40 Zeichen mit Datum und Uhrzeit vorn, Anrede, nichts Verbotenes", () => {
    const expected: Record<Lang, [RegExp, string, RegExp]> = {
      de: [/^Gebucht: Donnerstag, 8\.10\., 08:00 Uhr$/, "Hallo Verena,", /^Bis morgen um 08:00 Uhr!$/],
      en: [/^Booked: Thursday, 8 October, 08:00$/, "Hello Verena,", /^See you tomorrow at 08:00!$/],
      es: [/^Reservado: jueves, 8\/10, 08:00 h$/, "Hola Verena,", /^¡Hasta mañana a las 08:00 h!$/],
      fr: [/^Réservé\u00A0: jeudi 8\/10, 08 h 00$/, "Bonjour Verena,", /^À demain à 08 h 00\u00A0!$/],
      pt: [/^Marcado: quinta-feira, 8\/10, 08:00$/, "Olá Verena,", /^Até amanhã às 08:00!$/],
    };
    for (const lang of Object.keys(expected) as Lang[]) {
      const m = confirmationMail(row({ language: lang }));
      expect(m.subject, lang).toMatch(expected[lang][0]);
      expect(m.subject.length, lang).toBeLessThanOrEqual(40);
      expect(m.text, lang).toContain(expected[lang][1]);
      const r = reminderMail(row({ language: lang }));
      expect(r.subject, lang).toMatch(expected[lang][2]);
      expect(r.subject.length, lang).toBeLessThanOrEqual(40);
      for (const f of FORBIDDEN) expect(m.text, `${lang} ${f}`).not.toContain(f);
    }
  });
});
