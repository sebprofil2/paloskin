import { beforeEach, describe, expect, it } from "vitest";
import { MockEngine, mockInternals } from "../engine/mock";

describe("Testmotor", () => {
  beforeEach(() => mockInternals.reset());

  it("liefert Tage mit erfundenen Zeiten, Sonntage fehlen, 3. Oktober geschlossen", async () => {
    const e = new MockEngine();
    const r = await e.getSlots({ durationMinutes: 30, now: new Date("2026-10-01T10:00:00Z") });
    expect(r.days.length).toBeGreaterThan(20);
    expect(r.days.some((d) => d.date === "2026-10-04")).toBe(false);
    expect(r.days.find((d) => d.date === "2026-10-03")?.holiday).toBe("unity");
    const monday = r.days.find((d) => d.date === "2026-10-05");
    expect(monday?.slots.length).toBeGreaterThan(0);
    const winter = r.days.find((d) => d.date === "2026-10-26");
    expect(winter?.slots[0].start.endsWith("+01:00")).toBe(true);
  });

  it("nimmt Reservierungen der Datenbank als belegt und prüft Fenster", async () => {
    const e = new MockEngine();
    const r = await e.getSlots({ durationMinutes: 30 });
    const day = r.days.find((d) => d.slots.length)!;
    const slot = day.slots[0];
    const start = new Date(slot.start);
    expect(await e.isStartFree({ start, durationMinutes: 30 })).toBe(true);
    const again = await e.getSlots({ durationMinutes: 30, extraBusy: [{ start: start.getTime(), end: start.getTime() + 1800000 }] });
    expect(again.days.find((d) => d.date === day.date)?.slots.some((s) => s.start === slot.start)).toBe(false);
    // Sonntag 04:00 liegt in keinem Fenster
    expect(await e.isStartFree({ start: new Date("2026-10-11T02:00:00Z"), durationMinutes: 30 })).toBe(false);
  });

  it("verwaltet Kalendereinträge im Speicher", async () => {
    const e = new MockEngine();
    const id = await e.createEvent({ reference: "PS-TEST01", title: "T", description: "D", start: new Date(), end: new Date(), serviceCode: "BOT", reminder: false });
    expect(await e.findEventIdByRef("PS-TEST01")).toBe(id);
    await e.appendDescription(id, "Empfehlung: Anna");
    expect(mockInternals.events.get(id)?.description).toContain("Anna");
    await e.deleteEvent(id);
    expect(await e.findEventIdByRef("PS-TEST01")).toBeNull();
  });
});
