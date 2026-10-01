import { describe, expect, it } from "vitest";
import { bookRequestSchema, selectionSchema } from "../schema";
import { emptySelection } from "../treatments";

describe("Eingabeprüfung", () => {
  it("nur erlaubte Kennungen", () => {
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", zones: ["hals"] }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", zones: ["stirn", "stirn"] }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", zones: ["stirn", "lipflip", "nase"], otherZone: "Hals" }).success).toBe(true);
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", zonesUnknown: true }).success).toBe(true);
  });
  it("Beratung oder Behandlung, Besuch nötig", () => {
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first" }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", beratung: true, zones: ["stirn"] }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), zones: ["stirn"] }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), checkup: true }).success).toBe(true);
  });
  it("Buchung mit Lockfeld wird abgelehnt", () => {
    const ok = {
      requestId: "11111111-1111-4111-8111-111111111111",
      selection: { ...emptySelection(), visit: "first", beratung: true },
      start: "2026-10-26T10:00:00+01:00",
      lang: "de",
      customer: { vorname: "Erika", nachname: "Muster", handy: "0151 1234567", email: "erika@example.com" },
      consent: true,
    };
    expect(bookRequestSchema.safeParse(ok).success).toBe(true);
    expect(bookRequestSchema.safeParse({ ...ok, website: "http://spam" }).success).toBe(false);
    expect(bookRequestSchema.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(bookRequestSchema.safeParse({ ...ok, calendarId: "x" }).success).toBe(false);
    expect(bookRequestSchema.safeParse({ ...ok, end: "2026-10-26T12:00:00+01:00" }).success).toBe(false);
    expect(bookRequestSchema.safeParse({ ...ok, customer: { ...ok.customer, guests: ["a@b.de"] } }).success).toBe(false);
  });
});
