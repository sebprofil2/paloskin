import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dbSlotInputs, placeBooking, type PlaceInput } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import { anchorStarts, computeSlots, isOfferedStart, windowFromBerlin, type Interval } from "../slots";
import { openStore, type Store } from "../store";
import { fromBerlinKey } from "../time";
import { emptySelection } from "../treatments";

/*
 * Anschlusszeiten (Auftrag Dr. Vogel, 9. Oktober 2026): volle und halbe Stunden wie bisher, dazu eine Startzeit direkt am
 * Ende jedes eigenen Termins aus der Buchungsdatenbank. Private Kalendereinträge blockieren nur. Keine Lückenregel,
 * kein Puffer, keine Zeiten vor einem Termin, kein Termin nach Ladenschluss.
 */
const TAG = "2026-10-20"; // Dienstag
const NOW = new Date("2026-10-09T08:00:00Z");
const at = (hhmm: string) => fromBerlinKey(TAG, hhmm).getTime();
const iv = (a: string, b: string): Interval => ({ start: at(a), end: at(b) });

/** Startzeiten am Testtag; eigene Termine blockieren und sind Anknüpfungspunkt, private Einträge blockieren nur */
function zeiten(dauer: number, eigene: Interval[], privat: Interval[] = [], fenster: Interval = windowFromBerlin(TAG, "09:00", "20:00")): string[] {
  const days = computeSlots({
    windows: [fenster],
    busy: [...eigene, ...privat],
    anchors: anchorStarts(eigene, 30),
    durationMinutes: dauer,
    bufferMinutes: 0,
    stepMinutes: 30,
    from: new Date(NOW.getTime() + 2 * 3600000),
    to: new Date(NOW.getTime() + 42 * 86400000),
    now: NOW,
  });
  return days.find((d) => d.date === TAG)?.slots.map((s) => s.time) ?? [];
}

describe("Anschlusszeiten in der Zeitauswahl", () => {
  it("15:00 bis 15:50 belegt: 15:50, 16:00, 16:30 und so weiter", () => {
    const z = zeiten(30, [iv("15:00", "15:50")]);
    expect(z).toContain("15:50");
    expect(z).toContain("16:00");
    expect(z).toContain("16:30");
    expect(z).toContain("17:00");
    expect(z).not.toContain("15:00");
    expect(z).not.toContain("15:30");
    expect(z.filter((t) => !/:(00|30)$/.test(t))).toEqual(["15:50"]);
  });

  it("zusätzlich 15:50 zu zweit gebucht (bis 16:40): 16:40 und 17:00, nicht mehr 16:00 und 16:30", () => {
    const z = zeiten(50, [iv("15:00", "15:50"), iv("15:50", "16:40")]);
    expect(z).toContain("16:40");
    expect(z).toContain("17:00");
    for (const t of ["15:50", "16:00", "16:30"]) expect(z).not.toContain(t);
  });

  it("Termin endet zur vollen oder halben Stunde: alles wie heute, keine zusätzliche Zeit", () => {
    const ohne = zeiten(30, []);
    const mit = zeiten(30, [iv("15:00", "15:30")]);
    expect(mit).toEqual(ohne.filter((t) => t !== "15:00"));
    expect(mit.every((t) => /:(00|30)$/.test(t))).toBe(true);
  });

  it("privater Kalendereintrag endet 15:50: keine Anschlusszeit 15:50", () => {
    const z = zeiten(30, [], [iv("15:00", "15:50")]);
    expect(z).not.toContain("15:50");
    expect(z).toContain("16:00");
  });

  it("Kontrolle mit 15 Minuten funktioniert genauso, auch als Anknüpfungspunkt", () => {
    const z = zeiten(15, [iv("15:00", "15:50")]);
    expect(z).toContain("15:50");
    expect(z).toContain("16:00");
    const k = zeiten(15, [iv("16:00", "16:15")]);
    expect(k).toContain("16:30");
    expect(k).toContain("15:30");
    // 16:15 liegt im 10-Minuten-Raster der Belegung auf 16:20
    expect(k).toContain("16:20");
  });

  it("keine Zeiten vor einem Termin, keine Lückenregel: halbe Stunden bleiben, kurze Lücken sind in Ordnung", () => {
    const z = zeiten(30, [iv("16:10", "16:40")]);
    expect(z).toContain("15:30");
    expect(z).not.toContain("15:40");
    expect(z).toContain("16:40");
    expect(z).toContain("17:00");
  });

  it("kein Termin nach Ladenschluss: Anschlusszeit entfällt, wenn die Dauer nicht mehr passt", () => {
    expect(zeiten(30, [iv("19:00", "19:50")])).not.toContain("19:50");
    expect(zeiten(15, [iv("19:00", "19:40")])).toContain("19:40");
  });

  it("Walk-in bis 14:37: Anschlusszeit 14:40 (10-Minuten-Raster der Belegung)", () => {
    expect(anchorStarts([iv("14:07", "14:37")], 30)).toEqual([at("14:40")]);
    expect(zeiten(30, [iv("14:07", "14:37")])).toContain("14:40");
  });

  it("Prüfung beim Absenden: Raster oder Anschlusszeit", () => {
    const anchors = anchorStarts([iv("15:00", "15:50")], 30);
    expect(isOfferedStart(new Date(at("16:00")), 30, anchors)).toBe(true);
    expect(isOfferedStart(new Date(at("15:50")), 30, anchors)).toBe(true);
    expect(isOfferedStart(new Date(at("15:40")), 30, anchors)).toBe(false);
    expect(isOfferedStart(new Date(at("15:50")), 30, [])).toBe(false);
  });
});

describe("Anschlusszeiten aus der Buchungsdatenbank", () => {
  let store: Store;
  const engine = new MockEngine();
  const mailer = { enabled: false, send: async () => {} };
  const deps = () => ({ store, engine, mailer });
  beforeEach(() => {
    store = openStore(":memory:");
    mockInternals.reset();
  });
  afterEach(() => store.close());

  const input = (requestId: string, start: Date, persons: 1 | 2): PlaceInput => ({
    requestId,
    selection: { ...emptySelection(), visit: "return", zones: ["stirn"], persons },
    start,
    durationMinutes: persons === 2 ? 50 : 30,
    customer: { vorname: "Test", nachname: "Muster", handy: "0151 1234567", email: "test@example.com" },
    lang: "de",
    consentAt: new Date(),
    reminder: false,
    device: "mobile",
    testMode: true,
    binding: true,
  });

  it("Buchung zu zweit, dann Buchung genau zur Anschlusszeit; beim Verschieben zählt der eigene Termin nicht", async () => {
    const slots = await engine.getSlots({ durationMinutes: 50 });
    const tag = slots.days.find((d) => d.slots.length >= 4 && Date.parse(d.date) > Date.now() + 3 * 86400000)!;
    const start = new Date(tag.slots[0].start);
    const a = await placeBooking(input("6c1f7b4d-0e3a-4d52-9b88-2a3f4e5d6c71", start, 2), deps());
    expect(a.status).toBe("booked");
    const ende = start.getTime() + 50 * 60000;
    const db = dbSlotInputs(store);
    expect(db.anchors).toContain(ende);
    const frei = await engine.getSlots({ durationMinutes: 30, ...db });
    expect(frei.days.flatMap((d) => d.slots).some((s) => Date.parse(s.start) === ende)).toBe(true);
    const b = await placeBooking(input("6c1f7b4d-0e3a-4d52-9b88-2a3f4e5d6c72", new Date(ende), 1), deps());
    expect(b.status).toBe("booked");
    const erste = store.findByRequestId("6c1f7b4d-0e3a-4d52-9b88-2a3f4e5d6c71")!;
    expect(dbSlotInputs(store, erste.id).anchors).not.toContain(ende);
    // Das Ende der zweiten Buchung (Beginn :20 oder :50 plus 30 Minuten) liegt nie im Raster und bleibt Anknüpfungspunkt
    expect(dbSlotInputs(store, erste.id).anchors).toContain(ende + 30 * 60000);
  });
});
