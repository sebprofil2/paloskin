import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cancelBooking, confirmAttendance, placeBooking, rescheduleBooking, terminWindow, type PlaceInput } from "../booking";
import { syncCalendarChanges } from "../calendar-sync";
import { CANCEL_REASON, crmCancelReason, isCustomerCancel, linkCancelReason } from "../cancel-reasons";
import { openDatabase } from "../db";
import { MockEngine, mockInternals } from "../engine/mock";
import type { MailMessage, Mailer } from "../mail";
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
const input = (requestId: string, start: Date): PlaceInput => ({
  requestId, selection: { ...emptySelection(), visit: "first", zones: ["stirn"] }, start, durationMinutes: 30, customer, lang: "de",
  consentAt: new Date(), reminder: false, device: "mobile", testMode: false, binding: true,
});

describe("Rückfragen des Kundensystems vom 3. Oktober: cancel_reason und Zusage beim Verschieben", () => {
  let store: Store;
  let mailer: FakeMailer;
  const engine = new MockEngine();
  const deps = () => ({ store, engine, mailer });
  beforeEach(() => {
    store = openStore(":memory:");
    mailer = new FakeMailer();
    mockInternals.reset();
    process.env.OWNER_MAIL = "studio@example.com";
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
      for (const s of d.slots) { out.push(new Date(s.start)); if (out.length === n) return out; }
    }
    return out;
  }

  it("feste Werte: customer_link, customer_short_notice, studio_calendar, crm:studio_cancelled", () => {
    expect(linkCancelReason("open")).toBe("customer_link");
    expect(linkCancelReason("short")).toBe("customer_short_notice");
    expect(CANCEL_REASON.studioCalendar).toBe("studio_calendar");
    expect(crmCancelReason("studio_cancelled")).toBe("crm:studio_cancelled");
    expect(isCustomerCancel("customer_short_notice")).toBe(true);
    expect(isCustomerCancel("crm:studio_cancelled")).toBe(false);
  });

  it("„Leider verhindert“ 3 Stunden vorher: cancel_reason customer_short_notice im Ereignis, Studio-Mail „Kurzfristig abgesagt“", async () => {
    const [s1] = await freeStarts(1);
    await placeBooking(input("11111111-1111-4111-8111-111111111111", s1), deps());
    const b = store.findByRequestId("11111111-1111-4111-8111-111111111111")!;
    const at = new Date(s1.getTime() - 3 * 3600000);
    const w = terminWindow(b, at);
    expect(w).toBe("short");
    mailer.sent = [];
    await cancelBooking(b.id, linkCancelReason(w as "short"), deps(), at);
    const ev = store.eventsAfter(0, 50).filter((e) => e.booking.id === b.id).at(-1)!;
    expect(ev.type).toBe("cancelled");
    expect((ev.booking as { cancel_reason?: string | null }).cancel_reason).toBe("customer_short_notice");
    expect(mailer.sent.find((m) => m.to === "studio@example.com")!.subject).toMatch(/^Kurzfristig abgesagt: /);
  });

  it("Absage mehr als 24 Stunden vorher bleibt customer_link", async () => {
    const [s1] = await freeStarts(1);
    await placeBooking(input("22222222-2222-4222-8222-222222222222", s1), deps());
    const b = store.findByRequestId("22222222-2222-4222-8222-222222222222")!;
    const at = new Date(s1.getTime() - 30 * 3600000);
    await cancelBooking(b.id, linkCancelReason(terminWindow(b, at) as "open"), deps(), at);
    expect(store.findById(b.id)!.cancel_reason).toBe("customer_link");
  });

  it("Verschieben durch den Kunden und im Kalender: attendance_confirmed_at steht als null im Ereignis, nicht weggelassen", async () => {
    const [s1, s2] = await freeStarts(2);
    await placeBooking(input("33333333-3333-4333-8333-333333333333", s1), deps());
    const b = store.findByRequestId("33333333-3333-4333-8333-333333333333")!;
    await syncCalendarChanges(deps()); // eigene Anlage, ändert nichts
    confirmAttendance(b.id, deps(), win(b));
    expect((await rescheduleBooking(b.id, s2, deps())).status).toBe("rescheduled");
    let raw = JSON.stringify(store.eventsAfter(0, 50).at(-1));
    expect(raw).toContain('"type":"rescheduled"');
    expect(raw).toContain('"attendance_confirmed_at":null');

    const moved = store.findById(b.id)!;
    expect(confirmAttendance(b.id, deps(), win(moved))).not.toBeNull();
    mockInternals.studioMove(moved.calendar_event_id!, new Date(s2.getTime() + 3600000), new Date(s2.getTime() + 5400000));
    expect((await syncCalendarChanges(deps(), new Date(Date.now() + 60000))).moved).toBe(1);
    raw = JSON.stringify(store.eventsAfter(0, 50).at(-1));
    expect(raw).toContain('"type":"rescheduled"');
    expect(raw).toContain('"attendance_confirmed_at":null');
  });

  it("Umstellung alter Daten: customer_link_short wird customer_short_notice, auch in den Ereignissen", async () => {
    const [s1] = await freeStarts(1);
    const path = `/tmp/palo-migration-${process.pid}.sqlite`;
    const s = openStore(path);
    await placeBooking(input("44444444-4444-4444-8444-444444444444", s1), { store: s, engine, mailer });
    const b = s.findByRequestId("44444444-4444-4444-8444-444444444444")!;
    await cancelBooking(b.id, "customer_link_short", { store: s, engine, mailer }, new Date(s1.getTime() - 3 * 3600000));
    s.close();
    openDatabase(path).close(); // Start mit Umstellung
    const again = openStore(path);
    expect(again.findById(b.id)!.cancel_reason).toBe("customer_short_notice");
    expect((again.eventsAfter(0, 50).at(-1)!.booking as { cancel_reason?: string | null }).cancel_reason).toBe("customer_short_notice");
    again.close();
    const fs = await import("node:fs");
    for (const f of [path, `${path}-wal`, `${path}-shm`]) fs.rmSync(f, { force: true });
  });
});
