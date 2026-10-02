import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildIcs, confirmationMail, reminderMail, treatmentRows, whenLabels } from "../mail-content";
import type { BookingRow } from "../store";
import { emptySelection, type Lang, type Selection } from "../treatments";

function row(over: Partial<BookingRow> = {}, sel: Partial<Selection> = {}): BookingRow {
  const selection: Selection = { ...emptySelection(), persons: 2, visit: "first", zones: ["stirn", "zornesfalte", "kraehenfuesse"], note: "Geheime Notiz", ...sel };
  return {
    id: "01M3YWQ51D0EPJ4VSS2B2MQT7H",
    reference: "PS-ABC234",
    created_at: "2026-10-01T10:00:00.000Z",
    starts_at: "2026-10-05T12:00:00.000Z", // Montag 14:00 Sommerzeit
    ends_at: "2026-10-05T12:50:00.000Z",
    duration_minutes: 50,
    persons: 2,
    first_visit: 1,
    service_codes: JSON.stringify(["BOT"]),
    zones: JSON.stringify(selection.zones),
    checkup: 0,
    status: "requested",
    channel: "web",
    language: "de",
    device: "mobile",
    reminder_whatsapp: 1,
    reminder_consent_at: "2026-10-01T10:00:00.000Z",
    consent_at: "2026-10-01T10:00:00.000Z",
    first_name: "Erika",
    last_name: "Muster",
    phone_e164: "+491511234567",
    email: "erika@example.com",
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

describe("Bestätigungsmail", () => {
  beforeEach(() => {
    process.env.LINK_SECRET = "test-schluessel";
    process.env.PUBLIC_BASE_URL = "https://www.paloskin.de";
  });
  afterEach(() => {
    delete process.env.LINK_SECRET;
    delete process.env.PUBLIC_BASE_URL;
  });

  it("Deutsch, Terminanfrage, zu zweit, Struktur der Übersicht, keine Notiz", () => {
    const m = confirmationMail(row(), new Date("2026-10-01T10:00:00Z"));
    expect(m.to).toBe("erika@example.com");
    expect(m.subject).toBe("Ihre Terminanfrage bei Palo Skin am Montag, 5. Oktober um 14:00 Uhr");
    expect(m.text).toContain("Guten Tag Erika,");
    expect(m.text).toContain("Termin: Montag, 5. Oktober 2026, 14:00 Uhr");
    expect(m.text).toContain("Wir haben für Sie beide Zeit eingeplant.");
    expect(m.text).toContain("Hagenauer Straße 14, 10435 Berlin");
    expect(m.text).toContain("Buchungsnummer: PS-ABC234");
    expect(m.text).toContain("Unverbindliche Vorauswahl:");
    expect(m.text).toContain("- Zu zweit");
    expect(m.text).toContain("- Botox: 3 Zonen: Stirn, Zornesfalte, Krähenfüße");
    expect(m.text).toContain("48 Stunden");
    expect(m.text).toContain("+49 151 58872566");
    expect(m.text).toMatch(/Ja, ich komme: https:\/\/www\.paloskin\.de\/termin\/01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}\?a=ja/);
    expect(m.text).toMatch(/Termin absagen: https:\/\/www\.paloskin\.de\/termin\/[^ ]+\?a=absagen/);
    expect(m.text).not.toContain("Geheime Notiz");
    expect(m.html).not.toContain("Geheime Notiz");
    expect(m.html).toContain("<a href=\"https://www.paloskin.de/termin/");
    expect(m.html).not.toContain("<img");
    expect(m.text).not.toContain("TEST");
    expect(m.ics?.filename).toBe("termin.ics");
  });

  it("verbindlich: anderer Betreff und Einstieg, Testbetrieb kennzeichnet", () => {
    const m = confirmationMail(row({ status: "confirmed", test_mode: 1 }));
    expect(m.subject).toBe("TEST: Ihr Termin bei Palo Skin am Montag, 5. Oktober um 14:00 Uhr");
    expect(m.text).toContain("Ihr Termin ist gebucht.");
    expect(m.text).toContain("Testbetrieb");
    expect(m.ics?.content).toContain("STATUS:CONFIRMED");
  });

  it("ICS in Weltzeit, Sommer- und Winterzeit", () => {
    const summer = buildIcs(row(), "de", "https://www.paloskin.de/termin/x", new Date("2026-10-01T10:00:00Z"));
    expect(summer).toContain("DTSTART:20261005T120000Z");
    expect(summer).toContain("DTEND:20261005T125000Z");
    expect(summer).toContain("UID:PS-ABC234@paloskin.de");
    expect(summer).toContain("STATUS:TENTATIVE");
    expect(summer).toContain("LOCATION:Hagenauer Straße 14\\, 10435 Berlin");
    expect(summer.split("\r\n").every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
    // 26. Oktober 2026, 10:00 Berlin ist nach der Umstellung 09:00 Weltzeit
    const winter = whenLabels(new Date("2026-10-26T09:00:00Z"), "de");
    expect(winter).toEqual({ date: "Montag, 26. Oktober", dateYear: "Montag, 26. Oktober 2026", time: "10:00 Uhr" });
    const w = buildIcs(row({ starts_at: "2026-10-26T09:00:00.000Z", ends_at: "2026-10-26T09:30:00.000Z" }), "de", "https://x", new Date());
    expect(w).toContain("DTSTART:20261026T090000Z");
  });

  it("alle Sprachen: Betreff, Anrede, Uhrzeit in Landesschreibweise", () => {
    // Die Datumsschreibweise (Komma nach dem Wochentag) hängt von der ICU-Version der Node-Installation ab
    const expected: Record<Lang, [RegExp, string]> = {
      de: [/^Ihre Terminanfrage bei Palo Skin am Montag, 5\. Oktober um 14:00 Uhr$/, "Guten Tag Erika,"],
      en: [/^Your appointment request at Palo Skin for Monday,? 5 October at 14:00$/, "Hello Erika,"],
      es: [/^Su solicitud de cita en Palo Skin para el Lunes,? 5 de octubre a las 14:00 h$/, "Hola Erika,"],
      fr: [/^Votre demande de rendez-vous chez Palo Skin pour le Lundi 5 octobre à 14 h 00$/, "Bonjour Erika,"],
      pt: [/^Seu pedido de horário na Palo Skin para Segunda-feira,? 5 de outubro às 14:00$/, "Olá Erika,"],
    };
    for (const lang of Object.keys(expected) as Lang[]) {
      const m = confirmationMail(row({ language: lang }));
      expect(m.subject, lang).toMatch(expected[lang][0]);
      expect(m.text, lang).toContain(expected[lang][1]);
      expect(m.text, lang).not.toContain("Geheime Notiz");
    }
    // Französisch mit geschütztem Leerzeichen vor dem Doppelpunkt
    expect(reminderMail(row({ language: "fr" })).subject.startsWith("Rappel\u00A0:")).toBe(true);
  });

  it("Erinnerung ohne Kalenderdatei, Kontrolltermin als Zeile", () => {
    const m = reminderMail(row());
    expect(m.subject).toBe("Erinnerung: Ihr Termin bei Palo Skin am Montag, 5. Oktober um 14:00 Uhr");
    expect(m.text).toContain("steht bevor");
    expect(m.ics).toBeUndefined();
    expect(treatmentRows({ ...emptySelection(), checkup: true, persons: 1 }, "de")).toEqual(["Kontrolltermin"]);
    expect(treatmentRows({ ...emptySelection(), visit: "return", beratung: true }, "en")).toEqual(["Consultation, treatment to be decided"]);
    expect(treatmentRows({ ...emptySelection(), visit: "return", zones: [], otherZone: "Kinn", lachs: "pack" }, "de")).toEqual(["Botox: 1 Zone: Sonstiges: Kinn", "Skin Booster: Lachs-DNA Viererpaket"]);
  });
});
