import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { confirmFromFor } from "../attendance";
import { canConfirmAttendance, confirmAttendance } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import { listMail } from "../reminder-list";
import { openStore, type ReserveInput, type Store } from "../store";
import { emptySelection } from "../treatments";

/* Termin Mittwoch, 7. Oktober 2026, 16:30 Uhr Berlin (14:30Z); Vortag 10:00 Uhr Berlin = Dienstag 6. Oktober, 08:00Z */
const START = new Date("2026-10-07T14:30:00.000Z");
const VORTAG_10 = new Date("2026-10-06T08:00:00.000Z");
const reserveInput = (requestId: string, start: Date, now: Date): ReserveInput => ({
  requestId, reference: `PS-${requestId.slice(0, 6).toUpperCase()}`, start, durationMinutes: 30,
  selection: { ...emptySelection(), visit: "first", zones: ["stirn"] },
  customer: { vorname: "Sebastian", nachname: "Vogel", handy: "0151 58872566", email: "kunde@example.com" },
  lang: "de", consentAt: now, reminder: false, device: "mobile", testMode: false, status: "confirmed", now,
});

describe("Zusage „Ja, ich komme“ erst ab Vortag 10 Uhr (4. Oktober 2026)", () => {
  let store: Store;
  const engine = new MockEngine();
  const mailer = { enabled: false, send: async () => {} };
  const deps = () => ({ store, engine, mailer });
  beforeEach(() => {
    store = openStore(":memory:");
    mockInternals.reset();
  });
  afterEach(() => store.close());

  it("Zeitpunkt: Vortag 10:00 Uhr Berliner Zeit", () => {
    expect(confirmFromFor(START).toISOString()).toBe(VORTAG_10.toISOString());
    // Winterzeit: Termin Montag 26. Oktober 10:00 Berlin, Vortag Sonntag 25. Oktober (Umstellung) 10:00 MEZ = 09:00Z
    expect(confirmFromFor(new Date("2026-10-26T09:00:00Z")).toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });

  it("Terminseite: 3 Tage vorher kein Block, Vortag 9:59 kein Block, Vortag 10:00 Block da", () => {
    const r = store.reserve(reserveInput("11111111-1111-4111-8111-111111111111", START, new Date("2026-10-01T10:00:00Z")));
    if (r.outcome === "conflict") throw new Error("Konflikt");
    const b = r.booking;
    expect(b.attendance_confirmed_at).toBeNull();
    expect(canConfirmAttendance(b, new Date(START.getTime() - 3 * 86400000))).toBe(false);
    expect(canConfirmAttendance(b, new Date(VORTAG_10.getTime() - 60000))).toBe(false);
    expect(canConfirmAttendance(b, VORTAG_10)).toBe(true);
    // Nach dem Termin nicht mehr
    expect(canConfirmAttendance(b, new Date(START.getTime() + 3600000))).toBe(false);
  });

  it("Server lehnt eine Zusage vor dem Zeitfenster ab, ab Vortag 10 Uhr wird sie gespeichert", () => {
    const r = store.reserve(reserveInput("22222222-2222-4222-8222-222222222222", START, new Date("2026-10-01T10:00:00Z")));
    if (r.outcome === "conflict") throw new Error("Konflikt");
    expect(confirmAttendance(r.booking.id, deps(), new Date(VORTAG_10.getTime() - 60000))).toBeNull();
    expect(store.findById(r.booking.id)!.attendance_confirmed_at).toBeNull();
    expect(store.eventsForBooking(r.booking.id).map((e) => e.type)).toEqual(["created"]);
    const yes = confirmAttendance(r.booking.id, deps(), VORTAG_10);
    expect(yes?.attendance_confirmed_at).toBe(VORTAG_10.toISOString());
    expect(store.eventsForBooking(r.booking.id).map((e) => e.type)).toEqual(["created", "attendance_confirmed"]);
  });

  it("kurzfristige Buchung nach Vortag 10 Uhr gilt automatisch als bestätigt, frühere nicht", () => {
    const now = new Date(VORTAG_10.getTime() + 5 * 3600000);
    const r = store.reserve(reserveInput("33333333-3333-4333-8333-333333333333", START, now));
    if (r.outcome === "conflict") throw new Error("Konflikt");
    expect(r.booking.attendance_confirmed_at).toBe(now.toISOString());
    // Ein Ereignis created, das die Zusage schon trägt
    const ev = store.eventsForBooking(r.booking.id);
    expect(ev.map((e) => e.type)).toEqual(["created"]);
    expect(ev[0].payload.attendance_confirmed_at).toBe(now.toISOString());
    // 18-Uhr-Liste: erscheint als bestätigt
    expect(listMail([store.findById(r.booking.id)!], new Date("2026-10-06T16:00:00Z")).text).toContain("16:30 Uhr, Sebastian Vogel, bestätigt");
    const early = store.reserve(reserveInput("44444444-4444-4444-8444-444444444444", new Date(START.getTime() + 3600000), new Date(VORTAG_10.getTime() - 60000)));
    if (early.outcome === "conflict") throw new Error("Konflikt");
    expect(early.booking.attendance_confirmed_at).toBeNull();
  });

  it("Verschieben in das Zeitfenster hinein: automatisch bestätigt; Verschieben weiter weg: Zusage zurückgesetzt", () => {
    const later = new Date("2026-10-20T08:00:00.000Z");
    const r = store.reserve(reserveInput("55555555-5555-4555-8555-555555555555", later, new Date("2026-10-01T10:00:00Z")));
    if (r.outcome === "conflict") throw new Error("Konflikt");
    // Am 6. Oktober um 14 Uhr auf Mittwoch 7. Oktober 16:30 verschoben: Vortag 10 Uhr ist vorbei
    const now = new Date("2026-10-06T12:00:00.000Z");
    const moved = store.reschedule(r.booking.id, START, now);
    expect(moved.booking!.attendance_confirmed_at).toBe(now.toISOString());
    expect(store.eventsForBooking(r.booking.id).at(-1)!.payload.attendance_confirmed_at).toBe(now.toISOString());
    // Zurück auf einen späteren Termin: Zusage gilt nicht mehr
    const back = store.reschedule(r.booking.id, later, new Date("2026-10-06T13:00:00.000Z"));
    expect(back.booking!.attendance_confirmed_at).toBeNull();
  });

  it("zu früh gegebene Zusagen werden zurückgesetzt, mit Ereignis attendance_confirmed und null; zweiter Lauf ändert nichts", () => {
    const r = store.reserve(reserveInput("66666666-6666-4666-8666-666666666666", START, new Date("2026-10-01T10:00:00Z")));
    if (r.outcome === "conflict") throw new Error("Konflikt");
    // Alte Zusage vom 4. Oktober (vor der neuen Regel)
    (store as unknown as { db: { prepare: (s: string) => { run: (...a: unknown[]) => unknown } } }).db
      .prepare("UPDATE bookings SET attendance_confirmed_at = ? WHERE id = ?")
      .run("2026-10-04T12:00:00.000Z", r.booking.id);
    // Eine rechtzeitige Zusage bleibt stehen
    const ok = store.reserve(reserveInput("77777777-7777-4777-8777-777777777777", new Date(START.getTime() + 3600000), new Date("2026-10-01T10:00:00Z")));
    if (ok.outcome === "conflict") throw new Error("Konflikt");
    store.confirmAttendance(ok.booking.id, VORTAG_10);
    const reset = store.resetEarlyAttendance(new Date("2026-10-05T10:00:00Z"));
    expect(reset).toEqual([r.booking.reference]);
    expect(store.findById(r.booking.id)!.attendance_confirmed_at).toBeNull();
    const last = store.eventsForBooking(r.booking.id).at(-1)!;
    expect(last.type).toBe("attendance_confirmed");
    expect(last.payload.attendance_confirmed_at).toBeNull();
    expect(store.findById(ok.booking.id)!.attendance_confirmed_at).toBe(VORTAG_10.toISOString());
    expect(store.resetEarlyAttendance(new Date("2026-10-05T10:05:00Z"))).toEqual([]);
  });
});
