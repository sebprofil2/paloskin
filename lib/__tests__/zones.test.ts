import { describe, expect, it } from "vitest";
import { emptySelection, lineItemsDe, totalPrice, zoneCount, zonePrice } from "../treatments";

describe("Zonen gleichwertig, Preis nach Anzahl", () => {
  it("Staffel 120, 210, 300, dann je 80", () => {
    expect([0, 1, 2, 3, 4, 5].map(zonePrice)).toEqual([0, 120, 210, 300, 380, 460]);
  });
  it("Lip Flip, Brow Lift und Mundwinkel sind 3 Zonen für 300", () => {
    const s = { ...emptySelection(), visit: "first" as const, zones: ["lipflip" as const, "browlift" as const, "mundwinkel" as const] };
    expect(zoneCount(s)).toBe(3);
    expect(lineItemsDe(s)[0]).toEqual({ label: "Botox: 3 Zonen: Lip Flip, Brow Lift, Mundwinkel", price: 300 });
  });
  it("Sonstiges zählt als Zone und erscheint mit Text", () => {
    const s = { ...emptySelection(), visit: "first" as const, zones: ["stirn" as const], otherZone: "Hals" };
    expect(zoneCount(s)).toBe(2);
    expect(lineItemsDe(s)[0].label).toBe("Botox: 2 Zonen: Stirn, Sonstiges: Hals");
    expect(totalPrice({ ...s, achsel: true })).toBe(210 + 480);
  });
  it("Zonen noch offen ohne Preis", () => {
    const s = { ...emptySelection(), visit: "first" as const, zonesUnknown: true };
    expect(lineItemsDe(s)).toEqual([{ label: "Botox: Zonen noch offen", price: 0 }]);
  });
});
