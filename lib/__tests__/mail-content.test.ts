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

  it("Deutsch wörtlich, zu zweit, ohne Nummer und ohne Behandlung", () => {
    const m = confirmationMail(row(), new Date("2026-10-01T10:00:00Z"));
    expect(m.to).toBe("verena@example.com");
    expect(m.subject).toBe("Ihr Termin bei PALO SKIN am Donnerstag, 8. Oktober um 08:00 Uhr");
    const t = m.text;
    expect(t).toContain("Guten Tag Verena,\n\nschön, dass Sie kommen. Ihr Termin steht:\n\nDonnerstag, 8. Oktober 2026, 08:00 Uhr\nPALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin (Karte öffnen: https://www.google.com/maps/");
    expect(t).toContain("\n\nWir haben für Sie beide Zeit eingeplant.\n");
    expect(t).toContain("Einen Tag vorher erinnern wir Sie noch einmal kurz.");
    expect(t).toMatch(/Kommt etwas dazwischen\? Termin absagen oder verschieben: https:\/\/www\.paloskin\.de\/termin\/01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}\?a=absagen\n/);
    expect(t).toContain("Bitte mindestens 48 Stunden vorher, dann freut sich jemand anderes über die Zeit. Kurzfristig erreichen Sie uns per WhatsApp unter +49 151 58872566.");
    expect(t).toContain("Die Kalenderdatei für Ihr Handy hängt an.");
    expect(t).toContain("Bis bald\nDr. med. Sebastian Vogel\nPALO SKIN by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin\nWhatsApp +49 151 58872566");
    expect(t).not.toContain("Ja, ich komme");
    for (const f of FORBIDDEN) {
      expect(t, f).not.toContain(f);
      expect(m.html, f).not.toContain(f);
      expect(m.ics!.content, f).not.toContain(f);
    }
    expect(m.html).toContain("Termin absagen oder verschieben</a>");
    expect(m.html).not.toContain("<img");
    expect(m.ics?.filename).toBe("termin.ics");
  });

  it("allein: kein Satz für zwei; Testbetrieb kennzeichnet; Anfrage ohne Schalter", () => {
    const m = confirmationMail(row({ persons: 1 }));
    expect(m.text).not.toContain("beide");
    const t = confirmationMail(row({ test_mode: 1 }));
    expect(t.subject).toBe("TEST: Ihr Termin bei PALO SKIN am Donnerstag, 8. Oktober um 08:00 Uhr");
    expect(t.text).toContain("Testbetrieb");
    const r = confirmationMail(row({ status: "requested" }));
    expect(r.subject).toBe("Ihre Terminanfrage bei PALO SKIN am Donnerstag, 8. Oktober um 08:00 Uhr");
    expect(r.text).toContain("vorgemerkt");
    expect(r.ics?.content).toContain("STATUS:TENTATIVE");
  });

  it("Kalenderdatei: Titel, Ort, nur Absagehinweis, Weltzeit mit Endzeit, Winterzeit", () => {
    const ics = buildIcs(row(), "de", new Date("2026-10-01T10:00:00Z"));
    expect(ics).toContain("SUMMARY:Termin bei PALO SKIN");
    expect(ics).toContain("LOCATION:PALO SKIN by Dr. Vogel\\, Hagenauer Straße 14\\, 10435 Berlin");
    expect(ics).toContain("DESCRIPTION:Absagen oder verschieben bitte mindestens 48 Stunden vorher.");
    expect(ics).toContain("DTSTART:20261008T060000Z");
    expect(ics).toContain("DTEND:20261008T065000Z");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).not.toContain("URL:");
    expect(ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
    const winter = whenLabels(new Date("2026-10-26T09:00:00Z"), "de");
    expect(winter).toMatchObject({ date: "Montag, 26. Oktober", dateYear: "Montag, 26. Oktober 2026", weekday: "Montag", time: "10:00 Uhr" });
    expect(whenLabels(new Date("2026-10-26T09:00:00Z"), "es")).toMatchObject({ weekday: "Lunes", weekdayIn: "lunes" });
    expect(buildIcs(row({ starts_at: "2026-10-26T09:00:00.000Z", ends_at: "2026-10-26T09:30:00.000Z" }), "de")).toContain("DTSTART:20261026T090000Z");
  });

  it("Erinnerung wörtlich, mit Knopf, ohne Kalenderdatei", () => {
    const m = reminderMail(row());
    expect(m.subject).toBe("Morgen um 08:00 Uhr bei PALO SKIN");
    expect(m.text).toContain("Guten Tag Verena,\n\nmorgen ist es so weit: Donnerstag, 8. Oktober, 08:00 Uhr, bei uns in der Hagenauer Straße 14. Wir freuen uns auf Sie.\n\nEin Klick genügt: Ja, ich komme: https://www.paloskin.de/termin/");
    expect(m.text).toContain("Falls es doch nicht passt, schreiben Sie uns bitte kurz per WhatsApp unter +49 151 58872566, dann finden wir eine neue Zeit.\n\nBis morgen\nDr. med. Sebastian Vogel\nPALO SKIN by Dr. Vogel");
    expect(m.text).not.toContain("absagen");
    expect(m.html).toContain(">Ja, ich komme</a>");
    expect(m.ics).toBeUndefined();
    for (const f of FORBIDDEN) expect(m.text, f).not.toContain(f);
  });

  it("alle Sprachen: Betreff, Anrede, nichts Verbotenes", () => {
    const expected: Record<Lang, [RegExp, string, RegExp]> = {
      de: [/^Ihr Termin bei PALO SKIN am Donnerstag, 8\. Oktober um 08:00 Uhr$/, "Guten Tag Verena,", /^Morgen um 08:00 Uhr bei PALO SKIN$/],
      en: [/^Your appointment at PALO SKIN on Thursday,? 8 October at 08:00$/, "Hello Verena,", /^Tomorrow at 08:00 at PALO SKIN$/],
      es: [/^Su cita en PALO SKIN el jueves,? 8 de octubre a las 08:00 h$/, "Hola Verena,", /^Mañana a las 08:00 h en PALO SKIN$/],
      fr: [/^Votre rendez-vous chez PALO SKIN le jeudi 8 octobre à 08 h 00$/, "Bonjour Verena,", /^Demain à 08 h 00 chez PALO SKIN$/],
      pt: [/^Sua consulta na PALO SKIN em quinta-feira,? 8 de outubro às 08:00$/, "Olá Verena,", /^Amanhã às 08:00 na PALO SKIN$/],
    };
    for (const lang of Object.keys(expected) as Lang[]) {
      const m = confirmationMail(row({ language: lang }));
      expect(m.subject, lang).toMatch(expected[lang][0]);
      expect(m.text, lang).toContain(expected[lang][1]);
      expect(reminderMail(row({ language: lang })).subject, lang).toMatch(expected[lang][2]);
      for (const f of FORBIDDEN) expect(m.text, `${lang} ${f}`).not.toContain(f);
    }
    expect(confirmationMail(row({ language: "fr" })).text).toContain("fixé :");
  });
});
