import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dbSlotInputs, placeBooking, type PlaceInput } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import { anchorStarts, computeSlots, isOfferedStart, isQuarterFill, windowFromBerlin, type Interval } from "../slots";
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
function zeiten(dauer: number, eigene: Interval[], privat: Interval[] = [], fenster: Interval = windowFromBerlin(TAG, "09:00", "20:00"), kontrolle = false): string[] {
  const days = computeSlots({
    windows: [fenster],
    busy: [...eigene, ...privat],
    anchors: anchorStarts(eigene, 30),
    ...(kontrolle ? { quarterFill: eigene } : {}),
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
    // Startzeiten auf 5 Minuten genau (seit 10. Oktober 2026): Anschlusszeit genau am Ende
    expect(k).toContain("16:15");
    expect(k).not.toContain("16:20");
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

describe("Kontrolle: Lückenfüller mit der echten Buchung", () => {
  it("Kontrolle buchen, dann direkt danach eine zweite um :15; Überschneidung bleibt gesperrt", async () => {
    const store = openStore(":memory:");
    mockInternals.reset();
    const engine = new MockEngine();
    const deps = { store, engine, mailer: { enabled: false, send: async () => {} } };
    const k = (id: string, start: Date): PlaceInput => ({ requestId: id, selection: { ...emptySelection(), checkup: true }, start, durationMinutes: 15, customer: { vorname: "Test", nachname: "Kontrolle", handy: "0151 1234567", email: "k@example.com" }, lang: "de", consentAt: new Date(), reminder: false, device: "mobile", testMode: true, binding: true });
    const frei = await engine.getSlots({ durationMinutes: 15 });
    const start = new Date(frei.days.find((d) => d.slots.length >= 4 && Date.parse(d.date) > Date.now() + 3 * 86400000)!.slots[0].start);
    expect((await placeBooking(k("7d2a8c5e-1f4b-4e63-8a99-3b4c5d6e7f81", start), deps)).status).toBe("booked");
    const viertel = start.getTime() + 15 * 60000;
    const db = dbSlotInputs(store, undefined, new Date(), true);
    const z = await engine.getSlots({ durationMinutes: 15, ...db });
    expect(z.days.flatMap((d) => d.slots).some((x) => Date.parse(x.start) === viertel)).toBe(true);
    expect((await placeBooking(k("7d2a8c5e-1f4b-4e63-8a99-3b4c5d6e7f82", new Date(viertel)), deps)).status).toBe("booked");
    expect((await placeBooking(k("7d2a8c5e-1f4b-4e63-8a99-3b4c5d6e7f83", new Date(viertel - 5 * 60000)), deps)).status).toBe("conflict");
    // Behandlungen bekommen keine Viertelstunden
    const behandlung = await engine.getSlots({ durationMinutes: 15, ...dbSlotInputs(store) });
    expect(behandlung.days.flatMap((d) => d.slots).filter((x) => /:(15|45)$/.test(x.time) && Date.parse(x.start) !== viertel + 15 * 60000)).toEqual([]);
    store.close();
  });
});

describe("Kontrolle: Lückenfüller um :15 und :45 (Auftrag Dr. Vogel, 10. Oktober 2026)", () => {
  const kontrolle = (eigene: Interval[], privat: Interval[] = []) => zeiten(15, eigene, privat, windowFromBerlin(TAG, "09:00", "20:00"), true);
  const viertel = (z: string[]) => z.filter((t) => /:(15|45)$/.test(t));

  it("Termin 10:00 bis 10:30 gebucht: Kontrolle um 10:30 wie bisher; davor 09:45 (endet genau, wenn der Termin beginnt)", () => {
    const z = kontrolle([iv("10:00", "10:30")]);
    expect(z).toContain("10:30");
    expect(viertel(z)).toEqual(["09:45"]);
  });

  it("Termin 10:00 bis 10:15 gebucht (Kontrolle): 10:15", () => {
    const z = kontrolle([iv("10:00", "10:15")]);
    expect(z).toContain("10:15");
    expect(z).toContain("10:30");
  });

  it("Termin ab 11:00 gebucht: 10:45, endet genau, wenn der nächste Termin beginnt", () => {
    const z = kontrolle([iv("11:00", "11:30")]);
    expect(z).toContain("10:45");
    expect(z).toContain("10:30");
    expect(z).not.toContain("10:15");
  });

  it("alles frei: nur volle und halbe Stunden; 10:15 zerschneidet die freie halbe Stunde nicht", () => {
    const z = kontrolle([]);
    expect(viertel(z)).toEqual([]);
    expect(z).toContain("10:00");
    expect(z.every((t) => /:(00|30)$/.test(t))).toBe(true);
  });

  it("private Einträge blockieren nur, sie sind kein Anknüpfungspunkt", () => {
    const z = kontrolle([], [iv("10:00", "10:15"), iv("11:00", "11:30")]);
    expect(z).not.toContain("10:15");
    expect(z).not.toContain("10:45");
  });

  it("gilt nur für die Kontrolle, nicht für Behandlungen", () => {
    expect(zeiten(30, [iv("11:00", "11:30")])).not.toContain("10:30".replace("30", "45"));
    expect(viertel(zeiten(15, [iv("11:00", "11:30")]))).toEqual([]);
  });

  it("Prüfung beim Absenden: Lückenfüller nur mit passendem eigenen Termin", () => {
    const eigen = [iv("11:00", "11:30")];
    expect(isOfferedStart(new Date(at("10:45")), 30, [], { own: eigen, durationMinutes: 15 })).toBe(true);
    expect(isOfferedStart(new Date(at("10:15")), 30, [], { own: eigen, durationMinutes: 15 })).toBe(false);
    expect(isOfferedStart(new Date(at("10:45")), 30, [])).toBe(false);
    expect(isQuarterFill(at("10:30"), 15 * 60000, [iv("10:00", "10:30")])).toBe(false);
  });
});
