import { describe, expect, it } from "vitest";
import { bookRequestSchema, selectionSchema } from "../schema";
import { emptySelection } from "../treatments";

describe("Eingabeprüfung", () => {
  it("nur erlaubte Kennungen", () => {
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", zones: "z9" }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", extras: [8] }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", zones: "z3", extras: [0, 7] }).success).toBe(true);
  });
  it("Beratung oder Behandlung, Besuch nötig", () => {
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first" }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), visit: "first", beratung: true, zones: "z1" }).success).toBe(false);
    expect(selectionSchema.safeParse({ ...emptySelection(), zones: "z1" }).success).toBe(false);
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
  });
});
