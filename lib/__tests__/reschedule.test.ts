import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cancelBooking, confirmAttendance, placeBooking, rescheduleBooking, terminWindow, type PlaceInput } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import type { MailMessage, Mailer } from "../mail";
import { openStore, type Store } from "../store";
import { runStudioMailQueue, studioMailFor } from "../studio-mail";
import { emptySelection } from "../treatments";

class FakeMailer implements Mailer {
  readonly enabled = true;
  sent: MailMessage[] = [];
  fail = false;
  async send(m: MailMessage): Promise<void> {
    if (this.fail) throw Object.assign(new Error("smtp"), { responseCode: 421 });
    this.sent.push(m);
  }
}

const customer = { vorname: "Sebastian", nachname: "Vogel", handy: "0151 58872566", email: "sebastian@example.com" };
const input = (requestId: string, start: Date, over: Partial<PlaceInput> = {}): PlaceInput => ({
  requestId,
  selection: { ...emptySelection(), visit: "first", zones: ["stirn"] },
  start,
  durationMinutes: 30,
  customer,
  lang: "de",
  consentAt: new Date(),
  reminder: true,
  device: "mobile",
  testMode: false,
  binding: true,
  ...over,
});

describe("Verschieben, Fristen, Studio-Mails (Block 6 und 8)", () => {
  let store: Store;
  let mailer: FakeMailer;
  const engine = new MockEngine();
  const deps = () => ({ store, engine, mailer });
  beforeEach(() => {
    store = openStore(":memory:");
    mailer = new FakeMailer();
    mockInternals.reset();
    process.env.OWNER_MAIL = "studio@example.com";
    delete process.env.BOOKING_MOCK_DOWN;
  });
  afterEach(() => {
    store.close();
    delete process.env.OWNER_MAIL;
  });

  async function freeStarts(n: number): Promise<Date[]> {
    const r = await engine.getSlots({ durationMinutes: 30 });
    const out: Date[] = [];
    for (const d of r.days) {
      if (Date.parse(d.date) < Date.now() + 3 * 86400000) continue;
      for (const s of d.slots) {
        out.push(new Date(s.start));
        if (out.length === n) return out;
      }
    }
    return out;
  }

  it("Terminseite: Fenster bei 25, 23, 9 und 7 Stunden vor dem Termin", async () => {
    const [s1] = await freeStarts(1);
    await placeBooking(input("11111111-1111-4111-8111-111111111111", s1), deps());
    const b = store.findByRequestId("11111111-1111-4111-8111-111111111111")!;
    const at = (h: number) => new Date(Date.parse(b.starts_at) - h * 3600000);
    expect(terminWindow(b, at(25))).toBe("open");
    expect(terminWindow(b, at(23))).toBe("short");
    expect(terminWindow(b, at(9))).toBe("short");
    expect(terminWindow(b, at(7))).toBe("closed");
    expect(terminWindow(b, new Date(Date.parse(b.ends_at) + 1))).toBe("past");
    // Serverseitig: Verschieben bei 7 Stunden abgelehnt
    const [s2] = (await freeStarts(2)).slice(1);
    expect((await rescheduleBooking(b.id, s2, deps(), at(7))).status).toBe("invalid");
    expect((await cancelBooking(b.id, "customer_link", deps(), at(7)))).not.toBeNull(); // die Datenbank selbst verbietet nichts, die Route prüft das Fenster
  });

  it("verschiebt atomar: alte Zeit bleibt, bis die neue sicher ist; Kalender verschoben, nicht doppelt; alter Link zeigt neuen Termin", async () => {
    const [s1, s2, s3] = await freeStarts(3);
    await placeBooking(input("22222222-2222-4222-8222-222222222222", s1), deps());
    const b = store.findByRequestId("22222222-2222-4222-8222-222222222222")!;
    confirmAttendance(b.id, deps());
    mailer.sent = [];
    const eventId = b.calendar_event_id!;

    // Jemand anderes besetzt s2: Verschieben darauf scheitert, alte Zeit bleibt belegt
    await placeBooking(input("33333333-3333-4333-8333-333333333333", s2, { customer: { ...customer, email: "x@example.com", handy: "0152 1111111" } }), deps());
    mailer.sent = [];
    expect((await rescheduleBooking(b.id, s2, deps())).status).toBe("conflict");
    const same = store.findById(b.id)!;
    expect(same.starts_at).toBe(b.starts_at);
    expect(store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000)).some((i) => i.start === s1.getTime())).toBe(true);
    expect(mailer.sent).toHaveLength(0);

    // Auf s3 verschieben
    const r = await rescheduleBooking(b.id, s3, deps());
    expect(r.status).toBe("rescheduled");
    const moved = store.findById(b.id)!;
    expect(moved.starts_at).toBe(s3.toISOString());
    expect(moved.previous_starts_at).toBe(s1.toISOString());
    expect(moved.status).toBe("confirmed");
    expect(moved.attendance_confirmed_at).toBeNull(); // Zusage gilt nur für den alten Termin
    expect(moved.mail_reminder_sent_at).toBeNull();
    const locked = store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000));
    expect(locked.some((i) => i.start === s1.getTime())).toBe(false);
    expect(locked.some((i) => i.start === s3.getTime())).toBe(true);
    // Kalender: derselbe Eintrag, neue Zeit, kein zweiter
    expect(mockInternals.events.size).toBe(2);
    expect(mockInternals.events.get(eventId)!.start.getTime()).toBe(s3.getTime());
    expect(moved.calendar_event_id).toBe(eventId);
    // Ereignis rescheduled mit neuen Zeiten, Status bleibt confirmed
    const ev = store.eventsForBooking(b.id).map((e) => e.type);
    expect(ev).toEqual(["created", "attendance_confirmed", "rescheduled"]);
    expect(store.eventsForBooking(b.id).at(-1)!.payload.starts_at).toBe(s3.toISOString());
    // Mails: neue Bestätigung „Verschoben“ an den Kunden, Studio-Mail „Verschoben“
    const customerMail = mailer.sent.find((m) => m.to === "sebastian@example.com")!;
    expect(customerMail.subject).toMatch(/^Verschoben: /);
    expect(customerMail.text).toContain("Ihr Termin ist verschoben.");
    const studio = mailer.sent.find((m) => m.to === "studio@example.com")!;
    expect(studio.subject).toMatch(/^Verschoben: /);
    expect(studio.text).toContain("Sebastian V., allein\nBisher: ");
    expect(studio.text).not.toContain("PS-");
    expect(studio.text).not.toContain("58872566");
    // Mehrfach verschieben geht; zurück auf s1 ist wieder frei
    expect((await rescheduleBooking(b.id, s1, deps())).status).toBe("rescheduled");
    expect(store.findById(b.id)!.starts_at).toBe(s1.toISOString());
  });

  it("zwei verschieben gleichzeitig auf dieselbe Zeit: nur einer bekommt sie", async () => {
    const [s1, s2, s3] = await freeStarts(3);
    await placeBooking(input("44444444-4444-4444-8444-444444444444", s1), deps());
    await placeBooking(input("55555555-5555-4555-8555-555555555555", s2, { customer: { ...customer, email: "y@example.com", handy: "0152 2222222" } }), deps());
    const a = store.findByRequestId("44444444-4444-4444-8444-444444444444")!;
    const b = store.findByRequestId("55555555-5555-4555-8555-555555555555")!;
    const results = await Promise.all([rescheduleBooking(a.id, s3, deps()), rescheduleBooking(b.id, s3, deps())]);
    expect(results.map((r) => r.status).sort()).toEqual(["conflict", "rescheduled"]);
    const winners = [a, b].filter((x) => store.findById(x.id)!.starts_at === s3.toISOString());
    expect(winners).toHaveLength(1);
  });

  it("Studio-Mails: richtiger Betreff je Fall, nichts Vertrauliches, Versandfehler bricht nichts ab", async () => {
    const [s1] = await freeStarts(1);
    mailer.fail = true;
    const a = await placeBooking(input("66666666-6666-4666-8666-666666666666", s1, { testMode: true, selection: { ...emptySelection(), visit: "first", zones: ["stirn"], persons: 2 } }), deps());
    expect(a.status).toBe("booked"); // trotz Mailfehler gebucht
    const b = store.findByRequestId("66666666-6666-4666-8666-666666666666")!;
    expect(store.studioMailsPending(new Date(Date.now() + 5 * 60000))).toHaveLength(1);
    mailer.fail = false;
    const r = await runStudioMailQueue(deps(), new Date(Date.now() + 5 * 60000));
    expect(r.sent).toBe(1);
    const m = mailer.sent.find((x) => x.to === "studio@example.com")!;
    expect(m.subject).toMatch(/^\[TEST\] Neue Buchung: /);
    expect(m.text).toContain("Sebastian V., zu zweit\nDetails im Kalender „Palo Skin Termine“.");
    for (const f of ["PS-", "58872566", "example.com", "Botox", "Stirn"]) expect(m.text, f).not.toContain(f);
    // Absage-Betreffe
    const w = studioMailFor("cancelled", b);
    expect(w.subject).toMatch(/^\[TEST\] Abgesagt: /);
    expect(w.body).toContain("Die Zeit ist wieder frei.");
    expect(studioMailFor("cancelled_short", b).subject).toMatch(/^\[TEST\] Kurzfristig abgesagt: /);
    // Absage über die Route 24 bis 8 Stunden vorher ergibt „Kurzfristig abgesagt“
    mailer.sent = [];
    await cancelBooking(b.id, "customer_link_short", deps(), new Date(Date.parse(b.starts_at) - 10 * 3600000));
    expect(mailer.sent.find((x) => x.to === "studio@example.com")!.subject).toMatch(/^\[TEST\] Kurzfristig abgesagt: /);
  });
});
