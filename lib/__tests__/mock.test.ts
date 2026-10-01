import { beforeEach, describe, expect, it } from "vitest";
import { MockEngine, mockInternals } from "../engine/mock";
import { emptySelection } from "../treatments";

const customer = { vorname: "Erika", nachname: "Muster", handy: "0151 1234567", email: "erika@example.com" };

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

  it("bucht genau einmal je Anfragekennung und blockiert die Zeit", async () => {
    const e = new MockEngine();
    const r = await e.getSlots({ durationMinutes: 30 });
    const day = r.days.find((d) => d.slots.length)!;
    const slot = day.slots[0];
    const input = {
      requestId: "11111111-1111-4111-8111-111111111111",
      selection: { ...emptySelection(), visit: "first" as const, zones: ["stirn" as const] },
      start: new Date(slot.start),
      durationMinutes: 30,
      customer,
      lang: "de" as const,
      consentAt: new Date(),
      testMode: true,
    };
    const a = await e.book(input);
    const b = await e.book(input);
    expect(a.status).toBe("booked");
    expect(b).toEqual(a);
    const again = await e.getSlots({ durationMinutes: 30 });
    expect(again.days.find((d) => d.date === day.date)?.slots.some((s) => s.start === slot.start)).toBe(false);
    const c = await e.book({ ...input, requestId: "22222222-2222-4222-8222-222222222222" });
    expect(c.status).toBe("conflict");
    expect(await e.findByRequestId(input.requestId)).toEqual(a.status === "booked" ? a.booking : null);
    expect(await e.addReferral(input.requestId, "Anna")).toBe(true);
  });
});
