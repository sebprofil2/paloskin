import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { placeBooking, rescheduleBooking, type PlaceInput } from "../booking";
import { syncCalendarChanges } from "../calendar-sync";
import { MockEngine, mockInternals } from "../engine/mock";
import type { MailMessage, Mailer } from "../mail";
import { runRetention } from "../retention";
import { openStore, type Store } from "../store";
import { emptySelection } from "../treatments";
import { confirmFromFor } from "../attendance";
/* Zusage erst ab Vortag 10 Uhr: Zeitpunkt eine Minute danach */
const win = (b: { starts_at: string }) => new Date(confirmFromFor(new Date(b.starts_at)).getTime() + 60000);


class FakeMailer implements Mailer {
  readonly enabled = true;
  sent: MailMessage[] = [];
  async send(m: MailMessage): Promise<void> {
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

describe("Kalender als Werkzeug des Studios: Abgleich alle 5 Minuten", () => {
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
    delete process.env.BOOKING_MOCK_DOWN;
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

  async function booked(requestId: string, start: Date) {
    await placeBooking(input(requestId, start), deps());
    const b = store.findByRequestId(requestId)!;
    expect(b.calendar_event_id).not.toBeNull();
    // Die Anlage selbst gilt als eigene Änderung: ein Lauf danach ändert nichts
    const first = await syncCalendarChanges(deps());
    expect(first.cancelled + first.moved + first.resized).toBe(0);
    mailer.sent = [];
    return b;
  }
  const customerMails = () => mailer.sent.filter((m) => m.to === "sebastian@example.com");
  const studioMails = () => mailer.sent.filter((m) => m.to === "studio@example.com");
  const horizon = () => store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000));

  it("Eintrag gelöscht: Absage durch das Studio, Zeit frei, Ereignis cancelled, keine Kundenmail, Studio-Mail „Im Kalender abgesagt“", async () => {
    const [s1] = await freeStarts(1);
    const b = await booked("11111111-1111-4111-8111-111111111111", s1);
    mockInternals.studioDelete(b.calendar_event_id!);

    const r = await syncCalendarChanges(deps());
    expect(r.cancelled).toBe(1);
    const after = store.findById(b.id)!;
    expect(after.status).toBe("cancelled");
    expect(after.cancel_reason).toBe("studio_calendar");
    expect(after.calendar_event_id).toBeNull();
    expect(horizon().some((i) => i.start === s1.getTime())).toBe(false);
    expect(store.eventsForBooking(b.id).map((e) => e.type)).toEqual(["created", "cancelled"]);
    expect(customerMails()).toHaveLength(0);
    expect(studioMails()).toHaveLength(1);
    expect(studioMails()[0].subject).toMatch(/^Im Kalender abgesagt: /);
    expect(studioMails()[0].text).toContain("Die Zeit ist wieder frei");
    // Ein zweiter Lauf sieht dieselbe Löschung noch einmal (Überlappung) und tut nichts
    mailer.sent = [];
    const again = await syncCalendarChanges(deps());
    expect(again.cancelled).toBe(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("Beginn verschoben: Ereignis rescheduled, Mail C an den Kunden, Studio-Mail mit Bisher und Neu, Zusage zurück, auch außerhalb der Fenster", async () => {
    const [s1] = await freeStarts(1);
    const b = await booked("22222222-2222-4222-8222-222222222222", s1);
    store.confirmAttendance(b.id, win(b));
    // Das Studio zieht den Termin auf 06:05 Uhr, außerhalb jedes Fensters und abseits des Rasters
    const newStart = new Date(s1.getTime() - 4 * 3600000 + 5 * 60000);
    const newEnd = new Date(newStart.getTime() + 30 * 60000);
    mockInternals.studioMove(b.calendar_event_id!, newStart, newEnd);

    const r = await syncCalendarChanges(deps());
    expect(r.moved).toBe(1);
    const after = store.findById(b.id)!;
    expect(after.status).toBe("confirmed");
    expect(after.starts_at).toBe(newStart.toISOString());
    expect(after.ends_at).toBe(newEnd.toISOString());
    expect(after.previous_starts_at).toBe(s1.toISOString());
    expect(after.attendance_confirmed_at).toBeNull();
    expect(after.mail_reminder_sent_at).toBeNull();
    expect(after.calendar_event_id).toBe(b.calendar_event_id);
    expect(horizon().some((i) => i.start === s1.getTime())).toBe(false);
    expect(horizon().some((i) => i.start === newStart.getTime() && i.end === newEnd.getTime())).toBe(true);
    const events = store.eventsForBooking(b.id);
    expect(events.map((e) => e.type)).toEqual(["created", "attendance_confirmed", "rescheduled"]);
    expect(events.at(-1)!.payload.status).toBe("confirmed");
    expect(events.at(-1)!.payload.starts_at).toBe(newStart.toISOString());
    expect(customerMails()).toHaveLength(1);
    expect(customerMails()[0].subject).toMatch(/^🔵 Verschoben: /);
    expect(studioMails()).toHaveLength(1);
    expect(studioMails()[0].subject).toMatch(/^Im Kalender verschoben: /);
    expect(studioMails()[0].text).toContain("Bisher: ");
    expect(studioMails()[0].text).toContain("Neu: ");
    // Der Kalender wurde vom Abgleich nicht angefasst: nur die Änderung des Studios steht im Verlauf
    expect(mockInternals.changes.filter((c) => c.id === b.calendar_event_id)).toHaveLength(2);
  });

  it("nur Ende geändert: neue Dauer, Belegung angepasst, keine Mail, Ereignis rescheduled mit altem Beginn", async () => {
    const [s1] = await freeStarts(1);
    const b = await booked("33333333-3333-4333-8333-333333333333", s1);
    const newEnd = new Date(s1.getTime() + 50 * 60000);
    mockInternals.studioMove(b.calendar_event_id!, s1, newEnd);

    const r = await syncCalendarChanges(deps());
    expect(r.resized).toBe(1);
    expect(r.moved).toBe(0);
    const after = store.findById(b.id)!;
    expect(after.starts_at).toBe(s1.toISOString());
    expect(after.ends_at).toBe(newEnd.toISOString());
    expect(after.duration_minutes).toBe(50);
    expect(after.previous_starts_at).toBeNull();
    expect(after.rescheduled_at).toBeNull();
    expect(horizon().some((i) => i.start === s1.getTime() && i.end === newEnd.getTime())).toBe(true);
    expect(store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000))).toHaveLength(1);
    const last = store.eventsForBooking(b.id).at(-1)!;
    expect(last.type).toBe("rescheduled");
    expect(last.payload.starts_at).toBe(s1.toISOString());
    expect(last.payload.duration_minutes).toBe(50);
    expect(mailer.sent).toHaveLength(0);
  });

  it("nur Titel geändert oder Eintrag ohne Buchung: nichts passiert", async () => {
    const [s1] = await freeStarts(1);
    const b = await booked("44444444-4444-4444-8444-444444444444", s1);
    mockInternals.studioRetitle(b.calendar_event_id!, "Palo Skin: Anna B. (kommt mit Freundin)");
    const stray = await engine.createEvent({ reference: "PS-FREMD1", title: "Privat", description: "", start: s1, end: new Date(s1.getTime() + 600000), serviceCode: "x", reminder: false });
    mockInternals.studioDelete(stray);
    const r = await syncCalendarChanges(deps());
    expect(r.cancelled + r.moved + r.resized).toBe(0);
    expect(store.findById(b.id)!.status).toBe("confirmed");
    expect(mailer.sent).toHaveLength(0);
  });

  it("Löschlauf: die eigene Löschung des Kalendereintrags löst nichts aus", async () => {
    const [s1] = await freeStarts(1);
    const b = await booked("55555555-5555-4555-8555-555555555555", s1);
    // Buchung alt machen, dann der tägliche Löschlauf
    const old = new Date(Date.now() - 200 * 86400000).toISOString();
    (store as unknown as { db: { prepare: (sql: string) => { run: (...a: unknown[]) => unknown } } }).db
      .prepare("UPDATE bookings SET starts_at = ?, ends_at = ?, created_at = ? WHERE id = ?")
      .run(old, old, old, b.id);
    const res = await runRetention({ store, engine });
    expect(res.deleted + res.deletedForced).toBe(1);
    expect(mockInternals.events.size).toBe(0);
    const r = await syncCalendarChanges(deps());
    expect(r.cancelled + r.moved + r.resized).toBe(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("Verschieben über die Terminseite: der Abgleich sieht die eigene Verschiebung und verschickt nichts doppelt", async () => {
    const [s1, s2] = await freeStarts(2);
    const b = await booked("66666666-6666-4666-8666-666666666666", s1);
    expect((await rescheduleBooking(b.id, s2, deps())).status).toBe("rescheduled");
    expect(customerMails()).toHaveLength(1);
    expect(studioMails()).toHaveLength(1);
    mailer.sent = [];
    const r = await syncCalendarChanges(deps());
    expect(r.checked).toBeGreaterThan(0);
    expect(r.cancelled + r.moved + r.resized).toBe(0);
    expect(mailer.sent).toHaveLength(0);
    expect(store.eventsForBooking(b.id).filter((e) => e.type === "rescheduled")).toHaveLength(1);
  });

  it("vergangener Termin: Löschen oder Verschieben im Kalender ändert nichts", async () => {
    const [s1] = await freeStarts(1);
    const b = await booked("77777777-7777-4777-8777-777777777777", s1);
    mockInternals.studioDelete(b.calendar_event_id!);
    const later = new Date(s1.getTime() + 3600000);
    const r = await syncCalendarChanges(deps(), later);
    expect(r.cancelled).toBe(0);
    expect(store.findById(b.id)!.status).toBe("confirmed");
    expect(mailer.sent).toHaveLength(0);
  });

  it("Kalender nicht lesbar: nichts ändert sich, die Änderung wird beim nächsten Lauf nachgeholt", async () => {
    const [s1] = await freeStarts(1);
    const b = await booked("88888888-8888-4888-8888-888888888888", s1);
    mockInternals.studioDelete(b.calendar_event_id!);
    process.env.BOOKING_MOCK_DOWN = "true";
    const down = await syncCalendarChanges(deps());
    expect(down.unavailable).toBe(true);
    expect(store.findById(b.id)!.status).toBe("confirmed");
    expect(mailer.sent).toHaveLength(0);
    delete process.env.BOOKING_MOCK_DOWN;
    const up = await syncCalendarChanges(deps(), new Date(Date.now() + 10 * 60000));
    expect(up.cancelled).toBe(1);
    expect(store.findById(b.id)!.status).toBe("cancelled");
    expect(studioMails()).toHaveLength(1);
  });
});
