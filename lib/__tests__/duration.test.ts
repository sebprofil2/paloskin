import { describe, expect, it } from "vitest";
import { durationMinutes } from "../duration";
import { emptySelection } from "../treatments";

describe("Dauer", () => {
  it("Beratung immer 30 Minuten", () => {
    expect(durationMinutes({ ...emptySelection(), visit: "return", beratung: true })).toBe(30);
  });
  it("Erster Besuch 30, schon einmal da 20", () => {
    expect(durationMinutes({ ...emptySelection(), visit: "first", zones: ["stirn"] })).toBe(30);
    expect(durationMinutes({ ...emptySelection(), visit: "return", zones: ["stirn"] })).toBe(20);
  });
  it("Botulinum zusammen mit Lachs-DNA plus 20", () => {
    expect(durationMinutes({ ...emptySelection(), visit: "return", zones: ["stirn", "zornesfalte"], lachs: "single" })).toBe(40);
    expect(durationMinutes({ ...emptySelection(), visit: "return", zonesUnknown: true, lachs: "single" })).toBe(40);
    expect(durationMinutes({ ...emptySelection(), visit: "first", achsel: true, lachs: "pack" })).toBe(50);
    expect(durationMinutes({ ...emptySelection(), visit: "first", lachs: "pack" })).toBe(30);
  });
  it("Kontrolltermin 15", () => {
    expect(durationMinutes({ ...emptySelection(), checkup: true })).toBe(15);
  });
  it("Ohne Besuch keine Dauer", () => {
    expect(() => durationMinutes({ ...emptySelection(), zones: ["stirn"] })).toThrow();
  });
});
