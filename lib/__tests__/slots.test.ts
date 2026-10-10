import { describe, expect, it } from "vitest";
import { computeSlots, isStartFree, windowFromBerlin } from "../slots";
import { fromBerlinKey } from "../time";

const base = { bufferMinutes: 0, stepMinutes: 30, from: new Date("2026-10-01T00:00:00Z"), to: new Date("2026-12-01T00:00:00Z") };

describe("Freie Startzeiten", () => {
  it("30-Minuten-Raster, belegte Zeit ausgespart", () => {
    const windows = [windowFromBerlin("2026-10-26", "10:00", "13:00")];
    const busy = [{ start: fromBerlinKey("2026-10-26", "11:00").getTime(), end: fromBerlinKey("2026-10-26", "11:30").getTime() }];
    const days = computeSlots({ ...base, windows, busy, durationMinutes: 30 });
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe("2026-10-26");
    expect(days[0].slots.map((s) => s.time)).toEqual(["10:00", "10:30", "11:30", "12:00", "12:30"]);
    expect(days[0].slots[0].start).toBe("2026-10-26T10:00:00+01:00");
  });
  it("Längere Termine brauchen zusammenhängend freie Zeit", () => {
    const windows = [windowFromBerlin("2026-10-26", "10:00", "13:00")];
    const busy = [{ start: fromBerlinKey("2026-10-26", "11:00").getTime(), end: fromBerlinKey("2026-10-26", "11:30").getTime() }];
    const days = computeSlots({ ...base, windows, busy, durationMinutes: 50 });
    expect(days[0].slots.map((s) => s.time)).toEqual(["10:00", "11:30", "12:00"]);
  });
  it("Puffer zählt mit", () => {
    const windows = [windowFromBerlin("2026-10-20", "10:00", "11:00")];
    const days = computeSlots({ ...base, windows, busy: [], durationMinutes: 30, bufferMinutes: 10 });
    expect(days[0].slots.map((s) => s.time)).toEqual(["10:00"]);
  });
  it("Am Umstellungstag stehen die Zeiten richtig", () => {
    const windows = [windowFromBerlin("2026-10-25", "10:00", "11:00"), windowFromBerlin("2026-10-24", "10:00", "11:00")];
    const days = computeSlots({ ...base, windows, busy: [], durationMinutes: 30 });
    expect(days.map((d) => d.date)).toEqual(["2026-10-24", "2026-10-25"]);
    expect(days[0].slots[0].start).toBe("2026-10-24T10:00:00+02:00");
    expect(days[1].slots[0].start).toBe("2026-10-25T10:00:00+01:00");
    expect(days[1].slots.map((s) => s.time)).toEqual(["10:00", "10:30"]);
  });
  it("Voller Tag bleibt als voll sichtbar, Vorlauf und Zeitraum gelten", () => {
    const windows = [windowFromBerlin("2026-10-20", "10:00", "11:00")];
    const busy = [{ start: fromBerlinKey("2026-10-20", "09:00").getTime(), end: fromBerlinKey("2026-10-20", "12:00").getTime() }];
    const days = computeSlots({ ...base, windows, busy, durationMinutes: 30 });
    expect(days).toEqual([{ date: "2026-10-20", slots: [], full: true }]);
    const late = computeSlots({ ...base, windows, busy: [], durationMinutes: 30, from: fromBerlinKey("2026-10-20", "10:15") });
    expect(late[0].slots.map((s) => s.time)).toEqual(["10:30"]);
  });
  it("Prüfung einer einzelnen Startzeit vor dem Eintragen", () => {
    const windows = [windowFromBerlin("2026-10-26", "10:00", "12:00")];
    const busy = [{ start: fromBerlinKey("2026-10-26", "11:00").getTime(), end: fromBerlinKey("2026-10-26", "11:30").getTime() }];
    const input = { ...base, windows, busy, durationMinutes: 30 };
    expect(isStartFree(fromBerlinKey("2026-10-26", "10:30"), input)).toBe(true);
    expect(isStartFree(fromBerlinKey("2026-10-26", "11:00"), input)).toBe(false);
    expect(isStartFree(fromBerlinKey("2026-10-26", "11:45"), input)).toBe(false);
    expect(isStartFree(fromBerlinKey("2026-10-26", "09:30"), input)).toBe(false);
  });
});
