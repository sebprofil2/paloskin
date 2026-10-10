import { describe, expect, it } from "vitest";
import { buildDescription } from "../booking-description";
import { checkPhone, cleanPhone, formatPhone, normalizePhoneE164, phoneUnusual } from "../phone";
import { customerSchema } from "../schema";
import { emptySelection } from "../treatments";

/*
 * Handynummer (Fehler auf www vom 5. Oktober 2026: iPhone-Autofill setzt unsichtbare Zeichen um die Nummer).
 * Nur die Studionummer und erfundene Testnummern, keine Kundennummern.
 */
const STUDIO = "+4915158872566";
const SCHREIBWEISEN = ["+49 151 58872566", "0151 58872566", "151 58872566"];
const UNSICHTBAR = [0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0xfeff, 0x00a0, 0x2007, 0x202f];
const hex = (cp: number) => "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
const breit = (s: string) => s.replace(/[0-9]/g, (d) => String.fromCodePoint(0xff10 + Number(d))).replace("+", "＋");

describe("Handynummer: unsichtbare Zeichen und Unicode-Ziffern", () => {
  it("jedes Zeichen aus der Liste, vorn und hinten oder statt der Leerzeichen, in jeder Schreibweise: Studionummer gültig", () => {
    for (const cp of UNSICHTBAR) {
      const z = String.fromCodePoint(cp);
      for (const v of SCHREIBWEISEN) {
        for (const variante of [z + v + z, v.replace(/ /g, z), z + v.replace(/ /g, z + " ") + z]) {
          expect(normalizePhoneE164(variante), `${hex(cp)} in „${v}“`).toBe(STUDIO);
        }
      }
    }
  });

  it("iPhone-Muster aus den Kontakten (U+202A … U+202C) wird angenommen", () => {
    expect(normalizePhoneE164("‪+49 151 58872566‬")).toBe(STUDIO);
    expect(normalizePhoneE164("‪0151 58872566‬")).toBe(STUDIO);
  });

  it("Ziffern in voller Breite und das breite Plus U+FF0B", () => {
    for (const v of SCHREIBWEISEN) expect(normalizePhoneE164(breit(v)), breit(v)).toBe(STUDIO);
    expect(cleanPhone("＋４９")).toBe("+49");
  });

  it("arabisch-indische Ziffern werden zu 0-9", () => {
    const arabisch = "٠١٥١ ٥٨٨٧٢٥٦٦"; // 0151 58872566
    expect(normalizePhoneE164(arabisch)).toBe(STUDIO);
  });

  it("bereinigen: nur Ziffern und ein führendes Plus", () => {
    expect(cleanPhone(" +49 (151) 588-725.66 / x ")).toBe("+4915158872566");
    expect(cleanPhone("0151 5887+2566")).toBe("015158872566");
    expect(cleanPhone("abc")).toBe("");
    expect(cleanPhone("‪‬")).toBe("");
  });
});

describe("Handynummer: Regeln für gültig", () => {
  it("bisherige Schreibweisen der Studionummer bleiben gültig", () => {
    for (const v of ["0151 58872566", "0151-58872566", "0151/58872566", "(0151) 58872566", "0151.58872566", "+49 151 58872566", "+49151 58872566", "0049 151 58872566", "49 151 58872566", "4915158872566", "15158872566", "151 58872566", "+49 0151 58872566"]) {
      expect(normalizePhoneE164(v), v).toBe(STUDIO);
    }
  });

  it("deutsche Handynummern 015x, 016x, 017x mit 7 oder 8 Ziffern nach der Vorwahl", () => {
    expect(normalizePhoneE164("0160 1234567")).toBe("+491601234567");
    expect(normalizePhoneE164("0176 12345678")).toBe("+4917612345678");
    expect(normalizePhoneE164("0157 1234567")).toBe("+491571234567");
    expect(checkPhone("0176 123456")).toEqual({ value: "+49176123456", valid: false }); // 6 Ziffern: zu kurz
    expect(checkPhone("0176 123456789")?.valid).toBe(false); // 9 Ziffern: zu lang
  });

  it("ausländische Nummern mit + und 8 bis 15 Ziffern", () => {
    expect(normalizePhoneE164("+41 79 123 45 67")).toBe("+41791234567");
    expect(normalizePhoneE164("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhoneE164("0033 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhoneE164("+1 (415) 555-0199")).toBe("+14155550199");
    expect(checkPhone("+43 12345")?.valid).toBe(false); // 7 Ziffern
    expect(checkPhone("+1234567890123456")?.valid).toBe(false); // 16 Ziffern
  });

  it("ungewöhnlich, aber buchbar: Festnetz, zu kurz, ohne Vorwahl; gespeichert immer als + und Ziffern", () => {
    expect(checkPhone("030 12345678")).toEqual({ value: "+493012345678", valid: false });
    expect(checkPhone("0151 123")).toEqual({ value: "+49151123", valid: false });
    expect(checkPhone("123456")).toEqual({ value: "+123456", valid: false });
    expect(checkPhone("9915158872566")).toEqual({ value: "+9915158872566", valid: false });
    for (const v of ["", "   ", "abc", "+", "‪‬"]) expect(checkPhone(v), JSON.stringify(v)).toBeNull();
  });

  it("formatiert für die Anzeige", () => {
    expect(formatPhone(STUDIO)).toBe("+49 151 58872566");
    expect(formatPhone("+41791234567")).toBe("+41791234567");
  });
});

describe("Handynummer: Buchung nie an der Nummer scheitern lassen", () => {
  const kunde = (handy: string) => ({ vorname: "Test", nachname: "Nummer", handy, email: "test@example.com" });

  it("die Eingabeprüfung nimmt jede Nummer mit Ziffern an und speichert + und Ziffern", () => {
    expect(customerSchema.parse(kunde("‪+49 151 58872566‬")).handy).toBe(STUDIO);
    expect(customerSchema.parse(kunde(breit("+49 151 58872566"))).handy).toBe(STUDIO);
    expect(customerSchema.parse(kunde("030 12345678")).handy).toBe("+493012345678");
    expect(customerSchema.safeParse(kunde("keine Ziffer")).success).toBe(false);
  });

  it("Vermerk „Nummer prüfen“ nur bei ungewöhnlicher Nummer, im Kalender des Studios", () => {
    expect(phoneUnusual(STUDIO)).toBe(false);
    expect(phoneUnusual("+493012345678")).toBe(true);
    const desc = (handy: string) =>
      buildDescription({ bookingRef: "PS-TEST01", selection: { ...emptySelection(), visit: "first", beratung: true }, durationMinutes: 30, customer: kunde(handy), lang: "de", consentAt: new Date(), reminder: false });
    expect(desc(STUDIO)).not.toContain("Die Handynummer sieht ungewöhnlich aus. Bitte vor dem Termin kurz prüfen.");
    expect(desc("+493012345678")).toContain("Die Handynummer sieht ungewöhnlich aus. Bitte vor dem Termin kurz prüfen.");
  });
});
