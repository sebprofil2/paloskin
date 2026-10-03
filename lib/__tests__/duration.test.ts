import { describe, expect, it } from "vitest";
import { durationMinutes } from "../duration";
import { emptySelection } from "../treatments";

describe("Dauer", () => {
  it("Beratung immer 30 Minuten", () => {
    expect(durationMinutes({ ...emptySelection(), visit: "return", beratung: true })).toBe(30);
  });
  it("Erster Besuch und Folgebesuch je 30", () => {
    expect(durationMinutes({ ...emptySelection(), visit: "first", zones: ["stirn"] })).toBe(30);
    expect(durationMinutes({ ...emptySelection(), visit: "return", zones: ["stirn"] })).toBe(30);
  });
  it("Botulinum zusammen mit Lachs-DNA plus 20", () => {
    expect(durationMinutes({ ...emptySelection(), visit: "return", zones: ["stirn", "zornesfalte"], lachs: "single" })).toBe(50);
    expect(durationMinutes({ ...emptySelection(), visit: "return", zonesUnknown: true, lachs: "single" })).toBe(50);
    expect(durationMinutes({ ...emptySelection(), visit: "first", achsel: true, lachs: "pack" })).toBe(50);
    expect(durationMinutes({ ...emptySelection(), visit: "first", lachs: "pack" })).toBe(30);
  });
  it("Jede weitere Person plus 20", () => {
    expect(durationMinutes({ ...emptySelection(), persons: 2, visit: "first", zones: ["stirn"] })).toBe(50);
    expect(durationMinutes({ ...emptySelection(), persons: 2, visit: "return", zones: ["stirn"] })).toBe(50);
    expect(durationMinutes({ ...emptySelection(), persons: 2, visit: "return", zones: ["stirn"], lachs: "single" })).toBe(70);
    expect(durationMinutes({ ...emptySelection(), persons: 2, visit: "first", beratung: true })).toBe(50);
  });
  it("Kontrolltermin 15", () => {
    expect(durationMinutes({ ...emptySelection(), checkup: true })).toBe(15);
  });
  it("Ohne Besuch keine Dauer", () => {
    expect(() => durationMinutes({ ...emptySelection(), zones: ["stirn"] })).toThrow();
  });
});

/* Dauertabelle aller Kombinationen (Entscheidung 3. Oktober 2026): erster und Folgebesuch 30, zu zweit plus 20, Lachs-DNA mit Botox plus 20, Kontrolle 15 nur allein */
import { durationMinutes as dur } from "../duration";
import { emptySelection as empty } from "../treatments";

export const DURATION_TABLE: { fall: string; minuten: number }[] = [];
describe("Dauertabelle", () => {
  const rows: [string, Parameters<typeof dur>[0], number][] = [
    ["Kontrolltermin", { ...empty(), checkup: true }, 15],
    ["Kontrolltermin, Angabe zu zweit wird ignoriert", { ...empty(), checkup: true, persons: 2 }, 15],
    ["Beratung, allein", { ...empty(), visit: "first", beratung: true }, 30],
    ["Beratung, zu zweit", { ...empty(), visit: "first", beratung: true, persons: 2 }, 50],
    ["Erster Besuch, Botox, allein", { ...empty(), visit: "first", zones: ["stirn"] }, 30],
    ["Erster Besuch, Botox, zu zweit", { ...empty(), visit: "first", zones: ["stirn"], persons: 2 }, 50],
    ["Erster Besuch, nur Lachs-DNA, allein", { ...empty(), visit: "first", lachs: "single" }, 30],
    ["Erster Besuch, nur Lachs-DNA, zu zweit", { ...empty(), visit: "first", lachs: "single", persons: 2 }, 50],
    ["Erster Besuch, Botox und Lachs-DNA, allein", { ...empty(), visit: "first", zones: ["stirn"], lachs: "single" }, 50],
    ["Erster Besuch, Botox und Lachs-DNA, zu zweit", { ...empty(), visit: "first", zones: ["stirn"], lachs: "pack", persons: 2 }, 70],
    ["Folgebesuch, Botox, allein", { ...empty(), visit: "return", zones: ["stirn"] }, 30],
    ["Folgebesuch, Botox, zu zweit", { ...empty(), visit: "return", zones: ["stirn"], persons: 2 }, 50],
    ["Folgebesuch, nur Lachs-DNA, allein", { ...empty(), visit: "return", lachs: "single" }, 30],
    ["Folgebesuch, nur Lachs-DNA, zu zweit", { ...empty(), visit: "return", lachs: "single", persons: 2 }, 50],
    ["Folgebesuch, Botox und Lachs-DNA, allein", { ...empty(), visit: "return", zones: ["stirn"], lachs: "single" }, 50],
    ["Folgebesuch, Botox und Lachs-DNA, zu zweit", { ...empty(), visit: "return", zones: ["stirn"], lachs: "pack", persons: 2 }, 70],
    ["Folgebesuch, Kaumuskel und Lachs-DNA, allein (Kaumuskel zählt als Botox)", { ...empty(), visit: "return", kaumuskel: true, lachs: "single" }, 50],
    ["Folgebesuch, Schwitzen, allein", { ...empty(), visit: "return", achsel: true }, 30],
  ];
  for (const [fall, sel, minuten] of rows) {
    it(`${fall}: ${minuten} Minuten`, () => {
      expect(dur(sel)).toBe(minuten);
      DURATION_TABLE.push({ fall, minuten });
    });
  }
});
