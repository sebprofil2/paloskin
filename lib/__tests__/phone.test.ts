import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhoneE164 } from "../phone";

describe("Handynummer normalisieren", () => {
  it("bringt alle Schreibweisen auf E.164", () => {
    for (const v of ["0151 58872566", "0151-58872566", "0151/58872566", "(0151) 58872566", "0151.58872566", "+49 151 58872566", "+49151 58872566", "0049 151 58872566", "49 151 58872566", "4915158872566", "15158872566", "151 58872566"]) {
      expect(normalizePhoneE164(v), v).toBe("+4915158872566");
    }
    expect(normalizePhoneE164("0160 1234567")).toBe("+491601234567");
    expect(normalizePhoneE164("017612345678")).toBe("+4917612345678");
    expect(normalizePhoneE164("030 12345678")).toBe("+493012345678");
  });

  it("lässt ausländische Nummern mit Plus stehen", () => {
    expect(normalizePhoneE164("+41 79 123 45 67")).toBe("+41791234567");
    expect(normalizePhoneE164("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhoneE164("0033 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhoneE164("+1 (415) 555-0199")).toBe("+14155550199");
  });

  it("weist offensichtlich falsche Nummern zurück", () => {
    for (const v of ["", "   ", "abc", "+49 0151 58872566", "0151 123", "123456", "12345678901234567", "+", "0151 5887 2566 x", "9915158872566"]) {
      expect(normalizePhoneE164(v), v).toBeNull();
    }
  });

  it("formatiert für die Anzeige", () => {
    expect(formatPhone("+4915158872566")).toBe("+49 151 58872566");
    expect(formatPhone("+41791234567")).toBe("+41791234567");
  });
});
