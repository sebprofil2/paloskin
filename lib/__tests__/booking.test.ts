import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { placeBooking, retryCalendar, type PlaceInput } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import { openStore, type Store } from "../store";
import { emptySelection } from "../treatments";

const customer = { vorname: "Erika", nachname: "Muster", handy: "0151 1234567", email: "erika@example.com" };

function input(requestId: string, start: Date, over: Partial<PlaceInput> = {}): PlaceInput {
  return {
    requestId,
    selection: { ...emptySelection(), visit: "first", zones: ["stirn"], note: "Nur für die Datenbank" },
    start,
    durationMinutes: 30,
    customer,
    lang: "de",
    consentAt: new Date(),
    reminder: false,
    device: "desktop",
    testMode: true,
    binding: false,
    ...over,
  };
}

describe("Buchungsablauf mit Datenbank und Kalender", () => {
  let store: Store;
  const engine = new MockEngine();
  const mailer = { enabled: false, send: async () => {} };
  beforeEach(() => {
    store = openStore(":memory:");
    mockInternals.reset();
    delete process.env.BOOKING_MOCK_DOWN;
  });
  afterEach(() => {
    delete process.env.BOOKING_MOCK_DOWN;
    store.close();
  });

  async function freeStart(): Promise<Date> {
    const r = await engine.getSlots({ durationMinutes: 30, extraBusy: store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000)) });
    return new Date(r.days.find((d) => d.slots.length)!.slots[0].start);
  }

  it("bucht, schreibt den Kalender und ist idempotent", async () => {
    const start = await freeStart();
    const a = await placeBooking(input("11111111-1111-4111-8111-111111111111", start), { store, engine, mailer });
    expect(a.status).toBe("booked");
    if (a.status !== "booked") return;
    expect(a.booking.ref).toMatch(/^PS-[A-Z2-9]{6}$/);
    expect(a.booking.durationMinutes).toBe(30);
    const row = store.findByRequestId("11111111-1111-4111-8111-111111111111")!;
    expect(row.calendar_state).toBe("written");
    expect(row.status).toBe("requested");
    const ev = mockInternals.events.get(row.calendar_event_id!)!;
    expect(ev.description).toContain(`Buchungsnummer: ${a.booking.ref}`);
    expect(ev.description).not.toContain("Nur für die Datenbank"); // Notiz nie im Kalender
    expect(ev.title).toBe("TEST Palo Skin: Erika M.");

    const b = await placeBooking(input("11111111-1111-4111-8111-111111111111", start), { store, engine, mailer });
    expect(b).toEqual(a);
    expect(mockInternals.events.size).toBe(1);

    // Dieselbe Zeit für eine andere Anfrage: „Da war jemand schneller“
    const c = await placeBooking(input("22222222-2222-4222-8222-222222222222", start), { store, engine, mailer });
    expect(c.status).toBe("conflict");
    // Die freien Zeiten kennen die Reservierung
    const slots = await engine.getSlots({ durationMinutes: 30, extraBusy: store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000)) });
    expect(slots.days.flatMap((d) => d.slots).some((s) => new Date(s.start).getTime() === start.getTime())).toBe(false);
  });

  it("verbindlich: Status confirmed", async () => {
    const start = await freeStart();
    const a = await placeBooking(input("33333333-3333-4333-8333-333333333333", start, { binding: true }), { store, engine, mailer });
    expect(a.status).toBe("booked");
    expect(store.findByRequestId("33333333-3333-4333-8333-333333333333")?.status).toBe("confirmed");
  });

  it("lehnt eine Zeit außerhalb der Fenster ab", async () => {
    const a = await placeBooking(input("44444444-4444-4444-8444-444444444444", new Date("2026-10-11T02:00:00Z")), { store, engine, mailer });
    expect(a.status).toBe("conflict");
    expect(store.findByRequestId("44444444-4444-4444-8444-444444444444")).toBeNull();
  });

  it("Verfügbarkeit nicht prüfbar: keine Buchung, keine Belegung, kein Kalendereintrag", async () => {
    const start = await freeStart();
    process.env.BOOKING_MOCK_DOWN = "true";
    const a = await placeBooking(input("55555555-5555-4555-8555-555555555556", start), { store, engine, mailer });
    expect(a.status).toBe("unavailable");
    expect(store.findByRequestId("55555555-5555-4555-8555-555555555556")).toBeNull();
    expect(store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000))).toHaveLength(0);
    expect(mockInternals.events.size).toBe(0);
    delete process.env.BOOKING_MOCK_DOWN;
    // Derselbe Versuch klappt, sobald der Kalender wieder lesbar ist
    expect((await placeBooking(input("55555555-5555-4555-8555-555555555556", start), { store, engine, mailer })).status).toBe("booked");
  });

  it("Prüfung gelungen, Kalendereintrag scheitert danach: Buchung gespeichert, calendar_state failed, Nachtrag holt sie nach", async () => {
    const start = await freeStart();
    mockInternals.writeState.down = true;
    const a = await placeBooking(input("55555555-5555-4555-8555-555555555555", start), { store, engine, mailer });
    expect(a.status).toBe("booked");
    const row = store.findByRequestId("55555555-5555-4555-8555-555555555555")!;
    expect(row.calendar_state).toBe("failed");
    expect(row.calendar_attempts).toBe(1);
    // Solange der Kalender aus ist, bleibt es bei failed
    let r = await retryCalendar({ store, engine, mailer });
    expect(r).toEqual({ retried: 1, written: 0, overdue: 0 });
    expect(store.findById(row.id)!.calendar_attempts).toBe(2);
    // Nach 24 Stunden Alarm
    r = await retryCalendar({ store, engine, mailer }, new Date(Date.now() + 25 * 3600000));
    expect(r.overdue).toBe(1);
    // Kalender wieder da: nachgetragen, genau ein Eintrag
    mockInternals.writeState.down = false;
    r = await retryCalendar({ store, engine, mailer });
    expect(r).toEqual({ retried: 1, written: 1, overdue: 0 });
    expect(store.findById(row.id)!.calendar_state).toBe("written");
    expect(mockInternals.events.size).toBe(1);
    // Ein zweiter Lauf findet nichts mehr und legt keinen zweiten Eintrag an
    r = await retryCalendar({ store, engine, mailer });
    expect(r.retried).toBe(0);
    expect(mockInternals.events.size).toBe(1);
  });

  it("Nachtrag nach unklarem Ausgang legt keinen zweiten Eintrag an", async () => {
    const start = await freeStart();
    const a = await placeBooking(input("66666666-6666-4666-8666-666666666666", start), { store, engine, mailer });
    if (a.status !== "booked") throw new Error("nicht gebucht");
    const row = store.findByRequestId("66666666-6666-4666-8666-666666666666")!;
    // So als wäre der Eintrag geschrieben, die Antwort aber verloren gegangen
    store.calendarFailed(row.id);
    const r = await retryCalendar({ store, engine, mailer });
    expect(r.written).toBe(1);
    expect(mockInternals.events.size).toBe(1);
    expect(store.findById(row.id)!.calendar_event_id).toBe(row.calendar_event_id);
  });
});
