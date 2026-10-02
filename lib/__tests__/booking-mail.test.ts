import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { canCancelOnline, cancelBooking, confirmAttendance, placeBooking, runMailJobs, type PlaceInput } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import type { MailMessage, Mailer } from "../mail";
import { openStore, type Store } from "../store";
import { emptySelection } from "../treatments";

class FakeMailer implements Mailer {
  readonly enabled = true;
  sent: MailMessage[] = [];
  fail = false;
  async send(m: MailMessage): Promise<void> {
    if (this.fail) {
      const e = new Error("smtp") as Error & { responseCode?: number };
      e.responseCode = 421;
      throw e;
    }
    this.sent.push(m);
  }
}

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
    testMode: false,
    binding: false,
    ...over,
  };
}

describe("Bestätigungsmail, Zusage, Absage, Erinnerung", () => {
  let store: Store;
  let mailer: FakeMailer;
  const engine = new MockEngine();
  const deps = () => ({ store, engine, mailer });

  beforeEach(() => {
    store = openStore(":memory:");
    mailer = new FakeMailer();
    mockInternals.reset();
    process.env.LINK_SECRET = "test-schluessel";
    process.env.PUBLIC_BASE_URL = "https://www.paloskin.de";
  });
  afterEach(() => {
    store.close();
    delete process.env.LINK_SECRET;
    delete process.env.PUBLIC_BASE_URL;
  });

  async function freeStart(): Promise<Date> {
    const r = await engine.getSlots({ durationMinutes: 30, extraBusy: store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000)) });
    // eine Zeit mindestens drei Tage voraus, damit die Absage über den Link erlaubt ist
    const day = r.days.find((d) => d.slots.length && Date.parse(d.date) > Date.now() + 3 * 86400000)!;
    return new Date(day.slots[0].start);
  }

  it("schickt die Bestätigung sofort nach dem Commit, mit Links und Kalenderdatei", async () => {
    const start = await freeStart();
    const a = await placeBooking(input("11111111-1111-4111-8111-111111111111", start), deps());
    expect(a.status).toBe("booked");
    expect(a.status === "booked" && a.booking.binding).toBe(false);
    expect(mailer.sent).toHaveLength(1);
    const m = mailer.sent[0];
    expect(m.to).toBe("erika@example.com");
    expect(m.subject).toContain("Terminanfrage bei PALO SKIN");
    expect(m.ics?.content).toContain("BEGIN:VEVENT");
    expect(m.text).not.toContain("Nur für die Datenbank");
    const row = store.findByRequestId("11111111-1111-4111-8111-111111111111")!;
    expect(row.mail_confirmation_sent_at).not.toBeNull();
    expect(row.mail_confirmation_attempts).toBe(1);
    expect(m.text).toContain(`/termin/${row.id}.`);
    // Wiederholung schickt nichts noch einmal
    await placeBooking(input("11111111-1111-4111-8111-111111111111", start), deps());
    expect(mailer.sent).toHaveLength(1);
  });

  it("verbindlich: Betreff „Ihr Termin“ und binding in der Antwort", async () => {
    const start = await freeStart();
    const a = await placeBooking(input("22222222-2222-4222-8222-222222222222", start, { binding: true }), deps());
    expect(a.status === "booked" && a.booking.binding).toBe(true);
    expect(mailer.sent[0].subject).toMatch(/^Ihr Termin bei PALO SKIN am /);
  });

  it("Versand scheitert: Buchung bleibt, Hintergrundlauf holt die Mail nach, Protokoll nur mit Nummer", async () => {
    const start = await freeStart();
    mailer.fail = true;
    const a = await placeBooking(input("33333333-3333-4333-8333-333333333333", start), deps());
    expect(a.status).toBe("booked");
    const row = store.findByRequestId("33333333-3333-4333-8333-333333333333")!;
    expect(row.mail_confirmation_sent_at).toBeNull();
    expect(row.mail_confirmation_attempts).toBe(1);
    expect(mailer.sent).toHaveLength(0);
    let r = await runMailJobs(deps());
    expect(r.confirmations).toBe(0);
    expect(store.findById(row.id)!.mail_confirmation_attempts).toBe(2);
    r = await runMailJobs(deps(), new Date(Date.now() + 25 * 3600000));
    expect(r.overdue).toBe(1);
    mailer.fail = false;
    r = await runMailJobs(deps());
    expect(r).toEqual({ confirmations: 1, reminders: 0, overdue: 0 });
    expect(mailer.sent).toHaveLength(1);
    expect(store.findById(row.id)!.mail_confirmation_sent_at).not.toBeNull();
    // ein weiterer Lauf schickt nichts doppelt
    expect((await runMailJobs(deps())).confirmations).toBe(0);
    expect(mailer.sent).toHaveLength(1);
  });

  it("Zusage und Absage über den Link: Belegung frei, Ereignisse, Kalendereintrag weg, 48-Stunden-Regel", async () => {
    const start = await freeStart();
    await placeBooking(input("44444444-4444-4444-8444-444444444444", start), deps());
    const row = store.findByRequestId("44444444-4444-4444-8444-444444444444")!;
    expect(mockInternals.events.size).toBe(1);

    const yes = confirmAttendance(row.id, deps());
    expect(yes?.attendance_confirmed_at).not.toBeNull();
    expect(confirmAttendance(row.id, deps())?.attendance_confirmed_at).toBe(yes?.attendance_confirmed_at);
    expect(store.eventsForBooking(row.id).map((e) => e.type)).toEqual(["created", "attendance_confirmed"]);

    expect(canCancelOnline(row, new Date(Date.parse(row.starts_at) - 49 * 3600000))).toBe(true);
    expect(canCancelOnline(row, new Date(Date.parse(row.starts_at) - 47 * 3600000))).toBe(false);

    const cancelled = await cancelBooking(row.id, "customer_link", deps());
    expect(cancelled?.status).toBe("cancelled");
    expect(cancelled?.cancel_reason).toBe("customer_link");
    expect(store.db.prepare("SELECT COUNT(*) AS n FROM slot_locks WHERE booking_id = ?").get(row.id)).toEqual({ n: 0 });
    expect(store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000))).toHaveLength(0);
    expect(mockInternals.events.size).toBe(0);
    expect(store.findById(row.id)!.calendar_event_id).toBeNull();
    expect(store.eventsForBooking(row.id).map((e) => e.type)).toEqual(["created", "attendance_confirmed", "cancelled"]);
    expect(store.eventsForBooking(row.id).at(-1)!.payload.status).toBe("cancelled");
    // zweite Absage ändert nichts
    expect(await cancelBooking(row.id, "customer_link", deps())).toBeNull();
    expect(confirmAttendance(row.id, deps())).toBeNull();
    // Die Zeit ist wieder buchbar
    const again = await placeBooking(input("55555555-5555-4555-8555-555555555555", start), deps());
    expect(again.status).toBe("booked");
  });

  it("Absage bei nicht erreichbarem Kalender: Eintrag wird vom Hintergrundlauf entfernt", async () => {
    const start = await freeStart();
    await placeBooking(input("66666666-6666-4666-8666-666666666666", start), deps());
    const row = store.findByRequestId("66666666-6666-4666-8666-666666666666")!;
    process.env.BOOKING_MOCK_DOWN = "true";
    const cancelled = await cancelBooking(row.id, "customer_link", deps());
    expect(cancelled?.status).toBe("cancelled");
    expect(store.findById(row.id)!.calendar_event_id).not.toBeNull();
    delete process.env.BOOKING_MOCK_DOWN;
    const { retryCalendar } = await import("../booking");
    await retryCalendar(deps());
    expect(store.findById(row.id)!.calendar_event_id).toBeNull();
    expect(mockInternals.events.size).toBe(0);
  });

  it("Erinnerung etwa 24 Stunden vorher, nicht bei kurzfristiger Buchung, nicht doppelt", async () => {
    const start = await freeStart();
    await placeBooking(input("77777777-7777-4777-8777-777777777777", start), deps());
    const row = store.findByRequestId("77777777-7777-4777-8777-777777777777")!;
    mailer.sent = [];
    const startMs = Date.parse(row.starts_at);
    // 30 Stunden vorher: noch nichts
    expect((await runMailJobs(deps(), new Date(startMs - 30 * 3600000))).reminders).toBe(0);
    // 23 Stunden vorher: Erinnerung
    expect((await runMailJobs(deps(), new Date(startMs - 23 * 3600000))).reminders).toBe(1);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].subject).toMatch(/^Morgen um /);
    expect(mailer.sent[0].ics).toBeUndefined();
    expect((await runMailJobs(deps(), new Date(startMs - 22 * 3600000))).reminders).toBe(0);
    expect(mailer.sent).toHaveLength(1);

    // Kurzfristig gebucht (Buchung weniger als 30 Stunden vor dem Termin): keine Erinnerung
    store.db.prepare("UPDATE bookings SET created_at = ? WHERE id = ?").run(new Date(startMs - 20 * 3600000).toISOString(), row.id);
    store.db.prepare("UPDATE bookings SET mail_reminder_sent_at = NULL WHERE id = ?").run(row.id);
    expect((await runMailJobs(deps(), new Date(startMs - 10 * 3600000))).reminders).toBe(0);
    expect(store.findById(row.id)!.mail_reminder_skipped).toBe(1);
    expect(mailer.sent).toHaveLength(1);
  });
});
