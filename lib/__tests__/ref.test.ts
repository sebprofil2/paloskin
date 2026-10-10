import { describe, expect, it } from "vitest";
import { bookingRefFor } from "../ref";
import { buildTitle, serviceCode } from "../booking-description";
import { emptySelection } from "../treatments";

describe("Buchungsnummer und Kalendereintrag", () => {
  it("dieselbe Anfragekennung ergibt dieselbe Nummer", () => {
    const a = bookingRefFor("11111111-1111-4111-8111-111111111111");
    expect(a).toBe(bookingRefFor("11111111-1111-4111-8111-111111111111"));
    expect(a).toMatch(/^PS-[A-Z2-9]{6}$/);
    expect(a).not.toBe(bookingRefFor("22222222-2222-4222-8222-222222222222"));
  });
  it("Titel mit Initiale, Leistungscode ohne Namen", () => {
    expect(buildTitle({ vorname: "Erika", nachname: "Musterfrau", handy: "0", email: "e@x.de" }, true)).toBe("Testbuchung, PALO SKIN: Erika M.");
    expect(serviceCode({ ...emptySelection(), visit: "first", zones: ["stirn"], lachs: "single", persons: 2 })).toBe("BOT+LDN+P2");
  });
});
