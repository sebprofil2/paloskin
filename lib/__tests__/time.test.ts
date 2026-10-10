import { describe, expect, it } from "vitest";
import { berlinOffsetMinutes, berlinTimeLabel, fromBerlinKey, toBerlinIso, berlinDateKey, berlinWeekday } from "../time";

describe("Berliner Zeit, Umstellung am 25. Oktober 2026", () => {
  it("Sommerzeit am 24. Oktober, Winterzeit am 26. Oktober", () => {
    expect(toBerlinIso(fromBerlinKey("2026-10-24", "10:00"))).toBe("2026-10-24T10:00:00+02:00");
    expect(toBerlinIso(fromBerlinKey("2026-10-26", "10:00"))).toBe("2026-10-26T10:00:00+01:00");
  });
  it("Am Umstellungstag selbst stimmt die Wanduhr", () => {
    expect(toBerlinIso(fromBerlinKey("2026-10-25", "10:00"))).toBe("2026-10-25T10:00:00+01:00");
    expect(toBerlinIso(fromBerlinKey("2026-10-25", "01:30"))).toBe("2026-10-25T01:30:00+02:00");
    expect(berlinOffsetMinutes(new Date("2026-10-25T00:00:00Z"))).toBe(120);
    expect(berlinOffsetMinutes(new Date("2026-10-25T02:00:00Z"))).toBe(60);
  });
  it("Uhrzeit und Tag aus Weltzeit", () => {
    expect(berlinTimeLabel(new Date("2026-10-26T09:00:00Z"))).toBe("10:00");
    expect(berlinTimeLabel(new Date("2026-10-20T09:00:00Z"))).toBe("11:00");
    expect(berlinDateKey(new Date("2026-10-20T22:30:00Z"))).toBe("2026-10-21");
    expect(berlinWeekday("2026-10-03")).toBe(6);
    expect(berlinWeekday("2026-10-26")).toBe(1);
  });
});
