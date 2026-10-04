import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildIcs, calendarLinks, confirmationMail, reminderMail, whenLabels } from "../mail-content";
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
    previous_starts_at: null,
    calendar_rev: 0,
    calendar_pending_at: null,
    mail_confirmation_claimed_until: null,
    mail_reminder_claimed_until: null,
    rescheduled_at: null,
    ...over,
  };
}

const FORBIDDEN = ["PS-ABC234", "Geheime Notiz", "Botox", "Stirn", "Zornesfalte", "Vorauswahl", "Buchungsnummer", "Palo Skin by"];

describe("Bestätigungsmail nach Freigabe", () => {
  const booked = new Date("2026-10-01T10:00:00Z"); // lange vor dem Termin: Erinnerung kommt, Verschieben möglich
  beforeEach(() => {
    process.env.LINK_SECRET = "test-schluessel";
    process.env.PUBLIC_BASE_URL = "https://www.paloskin.de";
  });
  afterEach(() => {
    delete process.env.LINK_SECRET;
    delete process.env.PUBLIC_BASE_URL;
  });

  it("Deutsch wörtlich, zu zweit, drei Kalender-Knöpfe, Verschieben-Satz, ohne Nummer und ohne Behandlung", () => {
    const m = confirmationMail(row(), booked);
    expect(m.to).toBe("verena@example.com");
    expect(m.subject).toBe("Gebucht: Donnerstag, 8.10., 08:00 Uhr");
    expect(m.subject.length).toBeLessThanOrEqual(40);
    const t = m.text;
    expect(t).toContain("Hallo Verena,\n\nschön, dass Sie zu uns kommen! Wir freuen uns auf Sie:\n\nDonnerstag, 8. Oktober, 08:00 Uhr\nPALO SKIN by Dr. Vogel\nHagenauer Straße 14, 10435 Berlin\nSo finden Sie uns: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8\n");
    expect(t).toContain("Ihre Zeit ist uns wichtig: Bei PALO SKIN beginnt Ihr Termin pünktlich, in der Regel ganz ohne Wartezeit.");
    expect(t).toContain("\nFür Sie beide haben wir Zeit eingeplant.\n");
    expect(t).toContain("Möchten Sie den Termin gleich im Kalender speichern?\nGoogle Kalender: https://calendar.google.com/calendar/render?action=TEMPLATE&text=Goodbye+Wrinkles%3A+Verena+Muster+%C2%B7+PALO+SKIN+by+Dr.+Vogel&dates=20261008T060000Z%2F20261008T065000Z&location=");
    expect(t).toMatch(/iPhone-Kalender: https:\/\/www\.paloskin\.de\/termin\/01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}\/kalender\.ics\n/);
    expect(t).toContain("Outlook: https://outlook.live.com/calendar/0/deeplink/compose?subject=Goodbye+Wrinkles%3A+Verena+Muster+%C2%B7+PALO+SKIN+by+Dr.+Vogel&startdt=2026-10-08T06%3A00%3A00.000Z");
    expect(t).toContain("Am Tag vorher erinnern wir Sie noch einmal.");
    expect(t).toMatch(/Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher über diesen Link\.\nTermin verschieben oder absagen: https:\/\/www\.paloskin\.de\/termin\/01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}\n/);
    expect(t).toContain("Bis bald!\nDr. med. Sebastian Vogel\nPALO SKIN by Dr. Vogel");
    expect(t).not.toContain("Ja, ich komme");
    expect(t).not.toContain("48 Stunden");
    for (const f of FORBIDDEN) {
      expect(t, f).not.toContain(f);
      expect(m.html, f).not.toContain(f);
      expect(m.ics!.content, f).not.toContain(f);
    }
    expect(m.html).toContain(">Google Kalender</a>");
    expect(m.html).toContain(">iPhone-Kalender</a>");
    expect(m.html).toContain(">Outlook</a>");
    expect(m.html).toContain(">Termin verschieben oder absagen</a>");
    expect(m.html).toContain("<strong>Donnerstag, 8. Oktober, 08:00 Uhr</strong>");
    expect(m.html).not.toContain("<img");
    expect(m.ics?.filename).toBe("termin.ics");
  });

  it("Buchung am Vortag 9:59 Uhr: Erinnerungssatz; 10:01 Uhr: kein Erinnerungssatz", () => {
    // Termin Donnerstag, 8. Oktober 08:00 Berlin; Vortag Mittwoch 7. Oktober, 10:00 Berlin = 08:00Z
    expect(confirmationMail(row(), new Date("2026-10-07T07:59:00Z")).text).toContain("Am Tag vorher erinnern wir Sie noch einmal.");
    expect(confirmationMail(row(), new Date("2026-10-07T08:01:00Z")).text).not.toContain("Am Tag vorher erinnern wir Sie noch einmal.");
  });

  it("Buchung weniger als 24 Stunden vorher (22 und 3 Stunden): kein 24-Stunden-Satz, Knopf „Termin verschieben oder absagen“", () => {
    for (const now of [new Date("2026-10-07T10:00:00Z"), new Date("2026-10-08T03:00:00Z")]) {
      const m = confirmationMail(row(), now);
      expect(m.text).not.toContain("bis 24 Stunden vorher");
      expect(m.text).toMatch(/Termin verschieben oder absagen: https:\/\/www\.paloskin\.de\/termin\//);
      expect(m.html).toContain(">Termin verschieben oder absagen</a>");
      expect(m.html).not.toContain("bis 24 Stunden vorher");
      expect(m.text).not.toContain("Termin ansehen:");
    }
  });

  it("Buchung mehr als 24 Stunden vorher: Satz zu den 24 Stunden und Knopf", () => {
    const m = confirmationMail(row(), new Date("2026-10-06T10:00:00Z"));
    expect(m.text).toContain("Den Termin verschieben oder absagen können Sie bis 24 Stunden vorher über diesen Link.\nTermin verschieben oder absagen: https://www.paloskin.de/termin/");
  });

  it("nach dem Verschieben: Betreff Verschoben, erster Satz, Hinweis auf den alten Kalendereintrag", () => {
    const m = confirmationMail(row({ rescheduled_at: "2026-10-02T10:00:00.000Z", previous_starts_at: "2026-10-07T06:00:00.000Z" }), booked);
    expect(m.subject).toBe("Verschoben: Donnerstag, 8.10., 08:00 Uhr");
    expect(m.text).toContain("Hallo Verena,\n\nIhr Termin ist verschoben. Wir freuen uns auf Sie:\n\nDonnerstag, 8. Oktober, 08:00 Uhr");
    expect(m.text).toContain("Falls Sie den alten Termin in Ihrem Kalender gespeichert haben, löschen Sie ihn bitte dort.");
    expect(m.text.indexOf("Outlook:")).toBeLessThan(m.text.indexOf("Falls Sie den alten Termin"));
  });

  it("allein: kein Satz für zwei; Testbetrieb kennzeichnet; Anfrage ohne Schalter", () => {
    expect(confirmationMail(row({ persons: 1 }), booked).text).not.toContain("beide");
    const t = confirmationMail(row({ test_mode: 1 }), booked);
    expect(t.subject).toBe("TEST: Gebucht: Donnerstag, 8.10., 08:00 Uhr");
    expect(t.text).toContain("Testbetrieb");
    const r = confirmationMail(row({ status: "requested" }), booked);
    expect(r.subject).toBe("Angefragt: Donnerstag, 8.10., 08:00 Uhr");
    expect(r.ics?.content).toContain("STATUS:TENTATIVE");
  });

  it("Kalenderdatei: Titel, Ort, persönlicher Link und Kartenlink, kein WhatsApp, Erinnerung 1 Stunde vorher, Weltzeit mit Endzeit, Winterzeit", () => {
    const ics = buildIcs(row(), "de", new Date("2026-10-01T10:00:00Z"));
    const flat = ics.replace(/\r\n /g, "");
    expect(flat).toContain("SUMMARY:Goodbye Wrinkles: Verena Muster · PALO SKIN by Dr. Vogel\r\n");
    expect(ics).toContain("LOCATION:PALO SKIN by Dr. Vogel\\, Hagenauer Straße 14\\, 10435 Berlin");
    expect(flat).toMatch(/\r\nDESCRIPTION:Termin ansehen\\, verschieben oder absagen \(bis 24 Stunden vorher\):\\nhttps:\/\/www\.paloskin\.de\/termin\/[A-Za-z0-9._-]+\\n\\nSo finden Sie uns:\\nhttps:\/\/maps\.app\.goo\.gl\/c3KoXo6d9YU5P2wy8\r\n/);
    expect(flat).toMatch(/\r\nX-ALT-DESC;FMTTYPE=text\/html:<html><body><a href="https:\/\/www\.paloskin\.de\/termin\/[A-Za-z0-9._-]+">Termin ansehen\\, verschieben oder absagen<\/a> \(bis 24 Stunden vorher\)<br><br><a href="https:\/\/maps\.app\.goo\.gl\/c3KoXo6d9YU5P2wy8">So finden Sie uns<\/a><\/body><\/html>\r\n/);
    expect(flat).not.toContain("WhatsApp");
    expect(flat).toContain("BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Goodbye Wrinkles: Verena Muster · PALO SKIN by Dr. Vogel\r\nTRIGGER:-PT1H\r\nEND:VALARM\r\nEND:VEVENT");
    for (const lang of ["en", "es", "fr", "pt"] as const) {
      const other = buildIcs(row(), lang).replace(/\r\n /g, "");
      expect(other).toMatch(/\r\nDESCRIPTION:[^\r]*\\nhttps:\/\/www\.paloskin\.de\/termin\/[^\r]*\\n\\n[^\r]*\\nhttps:\/\/maps\.app\.goo\.gl/);
      expect(other).toContain("SUMMARY:Goodbye Wrinkles: Verena Muster · PALO SKIN by Dr. Vogel");
      expect(other).not.toContain("WhatsApp");
    }
    expect(ics).toContain("DTSTART:20261008T060000Z");
    expect(ics).toContain("DTEND:20261008T065000Z");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
    const winter = whenLabels(new Date("2026-10-26T09:00:00Z"), "de");
    expect(winter).toMatchObject({ date: "Montag, 26. Oktober", short: "Montag, 26.10.", time: "10:00 Uhr" });
    expect(whenLabels(new Date("2026-10-26T09:00:00Z"), "es")).toMatchObject({ dateIn: "lunes, 26 de octubre" });
    expect(buildIcs(row({ starts_at: "2026-10-26T09:00:00.000Z", ends_at: "2026-10-26T09:30:00.000Z" }), "de")).toContain("DTSTART:20261026T090000Z");
  });

  it("Google und Outlook: Titel mit Namen, Google-Beschreibung als HTML mit verlinkten Wörtern, Outlook als Klartext mit Leerzeile", () => {
    const c = calendarLinks(row(), "de");
    const g = new URL(c.google).searchParams;
    expect(g.get("text")).toBe("Goodbye Wrinkles: Verena Muster · PALO SKIN by Dr. Vogel");
    expect(g.get("details")).toMatch(/^<a href="https:\/\/www\.paloskin\.de\/termin\/[A-Za-z0-9._-]+">Termin ansehen, verschieben oder absagen<\/a> \(bis 24 Stunden vorher\)<br><br><a href="https:\/\/maps\.app\.goo\.gl\/c3KoXo6d9YU5P2wy8">So finden Sie uns<\/a>$/);
    const o = new URL(c.outlook).searchParams;
    expect(o.get("subject")).toBe("Goodbye Wrinkles: Verena Muster · PALO SKIN by Dr. Vogel");
    expect(o.get("body")).toMatch(/^Termin ansehen, verschieben oder absagen \(bis 24 Stunden vorher\):\nhttps:\/\/www\.paloskin\.de\/termin\/[A-Za-z0-9._-]+\n\nSo finden Sie uns:\nhttps:\/\/maps\.app\.goo\.gl\/c3KoXo6d9YU5P2wy8$/);
    for (const lang of ["en", "es", "fr", "pt"] as const) {
      const l = new URL(calendarLinks(row(), lang).google).searchParams;
      expect(l.get("text")).toBe("Goodbye Wrinkles: Verena Muster · PALO SKIN by Dr. Vogel");
      expect(l.get("details")).toContain('<a href="https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8">');
    }
  });

  it("Erinnerung wörtlich: bestätigen mit einem Klick, sonst verschieben; ohne Kalender-Knöpfe, ohne WhatsApp-Absatz", () => {
    const m = reminderMail(row());
    expect(m.subject).toBe("Bitte kurz bestätigen: morgen, 08:00 Uhr");
    expect(m.text).toContain("Hallo Verena,\n\nmorgen sehen wir uns bei PALO SKIN, wir freuen uns auf Sie!\n\nDonnerstag, 8. Oktober, 08:00 Uhr\nHagenauer Straße 14, 10435 Berlin\nSo finden Sie uns: https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8\n\nPasst der Termin weiterhin für Sie? Dann bestätigen Sie bitte kurz mit einem Klick:\nJa, ich komme: https://www.paloskin.de/termin/");
    expect(m.text).toMatch(/Passt es doch nicht\? Dann verschieben Sie den Termin hier: Termin verschieben: https:\/\/www\.paloskin\.de\/termin\/[^\n]+\/verschieben\n/);
    expect(m.text).toContain("Ihr Termin beginnt pünktlich, in der Regel ganz ohne Wartezeit. Kommen Sie bitte zur vereinbarten Zeit oder höchstens fünf Minuten vorher.\n\nBis morgen!");
    expect(m.text).toContain("Bis morgen!\nDr. med. Sebastian Vogel\nPALO SKIN by Dr. Vogel");
    expect(m.text).not.toContain("reserviert");
    expect(m.text).not.toContain("wa.me");
    expect(m.text).not.toContain("calendar.google");
    expect(m.html).toContain(">Ja, ich komme</a>");
    expect(m.ics).toBeUndefined();
    for (const f of FORBIDDEN) expect(m.text, f).not.toContain(f);
  });

  it("alle Sprachen: Betreffzeilen wie vorgegeben, höchstens 40 Zeichen, nichts Verbotenes", () => {
    const booked7 = { ...row(), starts_at: "2026-10-07T06:00:00.000Z", ends_at: "2026-10-07T06:50:00.000Z" };
    const expected: Record<Lang, [string, string, string]> = {
      de: ["Gebucht: Mittwoch, 7.10., 08:00 Uhr", "Bitte kurz bestätigen: morgen, 08:00 Uhr", "Verschoben: Donnerstag, 8.10., 09:00 Uhr"],
      en: ["Booked: Wednesday, 7 October, 08:00", "Please confirm: tomorrow, 08:00", "Rescheduled: Thursday, 8 October, 09:00"],
      es: ["Reservado: miércoles, 7/10, 08:00 h", "Por favor, confirme: mañana, 08:00 h", "Cambiado: jueves, 8/10, 09:00 h"],
      fr: ["Réservé\u00A0: mercredi 7/10, 08 h 00", "Merci de confirmer\u00A0: demain, 08 h 00", "Déplacé\u00A0: jeudi 8/10, 09 h 00"],
      pt: ["Marcado: quarta-feira, 7/10, 08:00", "Confirme, por favor: amanhã, 08:00", "Remarcado: quinta-feira, 8/10, 09:00"],
    };
    for (const lang of Object.keys(expected) as Lang[]) {
      const m = confirmationMail({ ...booked7, language: lang }, booked);
      expect(m.subject, lang).toBe(expected[lang][0]);
      expect(reminderMail({ ...booked7, language: lang }).subject, lang).toBe(expected[lang][1]);
      const r = confirmationMail({ ...booked7, language: lang, starts_at: "2026-10-08T07:00:00.000Z", ends_at: "2026-10-08T07:50:00.000Z", rescheduled_at: "2026-10-02T10:00:00.000Z", previous_starts_at: "2026-10-07T06:00:00.000Z" }, booked);
      expect(r.subject, lang).toBe(expected[lang][2]);
      for (const sub of [m.subject, reminderMail({ ...booked7, language: lang }).subject, r.subject]) expect(sub.length, lang).toBeLessThanOrEqual(40);
      for (const f of FORBIDDEN) expect(m.text, `${lang} ${f}`).not.toContain(f);
    }
  });
});
