import { describe, expect, it } from "vitest";
import { MockEngine } from "../engine/mock";
import { bookingRange, isBookableStart, RANGE_DAYS } from "../slots";
import { fromBerlinKey } from "../time";

/* Feste Berliner Uhrzeiten (Sommerzeit bis 25. Oktober 2026) */
const b = (day: string, time: string) => fromBerlinKey(day, time);

describe("Vorlauf, Nachtregel, Horizont (Block 7)", () => {
  it("Montag 9:00: 11:00 buchbar, 10:30 nicht (2 Stunden Vorlauf)", () => {
    const now = b("2026-10-05", "09:00");
    expect(isBookableStart(b("2026-10-05", "11:00"), now)).toBe(true);
    expect(isBookableStart(b("2026-10-05", "10:30"), now)).toBe(false);
  });

  it("Nachtregel: Dienstag 7:30 bis 9:30 nur bis Montag 23:00 Uhr", () => {
    expect(isBookableStart(b("2026-10-06", "07:30"), b("2026-10-05", "22:59"))).toBe(true);
    for (const now of [b("2026-10-05", "23:00"), b("2026-10-05", "23:01")]) {
      for (const t of ["07:30", "08:00", "09:00", "09:30"]) expect(isBookableStart(b("2026-10-06", t), now), t).toBe(false);
      expect(isBookableStart(b("2026-10-06", "10:00"), now)).toBe(true);
    }
    // Dienstag 6:00 Uhr: 9:30 nicht mehr, 10:00 ja
    expect(isBookableStart(b("2026-10-06", "09:30"), b("2026-10-06", "06:00"))).toBe(false);
    expect(isBookableStart(b("2026-10-06", "10:00"), b("2026-10-06", "06:00"))).toBe(true);
  });

  it("Freitag 22:59 und 23:01: Samstag 9:00 buchbar beziehungsweise nicht; Samstag 23:30: Sonntag 11:00 buchbar", () => {
    expect(isBookableStart(b("2026-10-10", "09:00"), b("2026-10-09", "22:59"))).toBe(true);
    expect(isBookableStart(b("2026-10-10", "09:00"), b("2026-10-09", "23:01"))).toBe(false);
    expect(isBookableStart(b("2026-10-11", "11:00"), b("2026-10-10", "23:30"))).toBe(true);
  });

  it("Zeitumstellung am 25. Oktober 2026: Samstag 22:59 und 23:01, Sonntag 9:00 und 11:00", () => {
    expect(isBookableStart(b("2026-10-25", "09:00"), b("2026-10-24", "22:59"))).toBe(true);
    expect(isBookableStart(b("2026-10-25", "09:00"), b("2026-10-24", "23:01"))).toBe(false);
    expect(isBookableStart(b("2026-10-25", "11:00"), b("2026-10-24", "23:01"))).toBe(true);
    expect(isBookableStart(b("2026-10-25", "11:00"), b("2026-10-25", "09:00"))).toBe(true);
    // Berliner Zeit nach der Umstellung: 11:00 Uhr ist 10:00 Weltzeit
    expect(b("2026-10-25", "11:00").toISOString()).toBe("2026-10-25T10:00:00.000Z");
  });

  it("Horizont: Tag 42 buchbar, Tag 43 nicht", () => {
    const now = b("2026-10-05", "09:00");
    expect(isBookableStart(new Date(now.getTime() + RANGE_DAYS * 86400000), now)).toBe(true);
    expect(isBookableStart(new Date(now.getTime() + (RANGE_DAYS + 1) * 86400000), now)).toBe(false);
    expect(bookingRange(now).to.getTime() - now.getTime()).toBe(RANGE_DAYS * 86400000);
  });

  it("Absenden nach 23 Uhr mit vor 23 Uhr geladener Seite: der Server lehnt ab (Prüfung mit der Absendezeit)", async () => {
    const engine = new MockEngine();
    const loaded = b("2026-10-05", "22:30"); // Montag, Seite geladen
    const slots = await engine.getSlots({ durationMinutes: 30, now: loaded });
    const tuesday = slots.days.find((d) => d.date === "2026-10-06")!;
    expect(tuesday.slots.some((s) => s.time === "12:00" || s.time === "12:30")).toBe(true);
    // Der Testmotor hat dienstags erst ab 12:00 Fenster; Nachtregel mit Montagsfenster 10:00 prüfen
    const monday = slots.days.find((d) => d.date === "2026-10-12")!;
    expect(monday.slots.some((s) => s.time === "10:00")).toBe(true);
    // Absendezeit: Sonntag 23:30 vor dem Montag, 10:00 Uhr beginnt vor 10:00? nein, 10:00 ist nicht vor 10:00 → buchbar
    expect(isBookableStart(b("2026-10-12", "10:00"), b("2026-10-11", "23:30"))).toBe(true);
    // Ein 9:30-Termin wäre nach 23:00 nicht mehr buchbar, auch wenn die Seite ihn vor 23:00 zeigte
    expect(isBookableStart(b("2026-10-12", "09:30"), b("2026-10-11", "22:59"))).toBe(true);
    expect(isBookableStart(b("2026-10-12", "09:30"), b("2026-10-11", "23:00"))).toBe(false);
    expect(await engine.isStartFree({ start: b("2026-10-12", "10:00"), durationMinutes: 30, now: b("2026-10-11", "23:30") })).toBe(true);
  });

  it("freie Zeiten enthalten nichts vor dem Vorlauf und nichts hinter der Nachtregel", async () => {
    const engine = new MockEngine();
    const now = b("2026-10-05", "23:30"); // Montag spät
    const r = await engine.getSlots({ durationMinutes: 30, now });
    for (const d of r.days) for (const s of d.slots) expect(isBookableStart(new Date(s.start), now), s.start).toBe(true);
    expect(r.days.every((d) => d.date >= "2026-10-06")).toBe(true);
  });
});
