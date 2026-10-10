import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cancelBooking, placeBooking, rescheduleBooking, type PlaceInput } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import type { MailMessage, Mailer } from "../mail";
import { KUGEL } from "../mail-content";
import { openStore, type Store } from "../store";
import { emptySelection, type Lang } from "../treatments";

/*
 * Absage-Bestätigung an die Kundin (10. Oktober 2026): bei Absage über die Terminseite (customer_link) und bei
 * „Leider verhindert“ (customer_short_notice) eine Mail mit Kalenderdatei zum Entfernen; bei Absagen durch das Studio keine.
 */
class FakeMailer implements Mailer {
  readonly enabled = true;
  sent: MailMessage[] = [];
  async send(m: MailMessage): Promise<void> {
    this.sent.push(m);
  }
}

const uid = (ics: string) => /UID:(.+)\r\n/.exec(ics)![1];

describe("Absage-Bestätigung an die Kundin", () => {
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

  async function freeStart(nth = 0): Promise<Date> {
    const r = await engine.getSlots({ durationMinutes: 30, extraBusy: store.lockedIntervals(new Date(), new Date(Date.now() + 60 * 86400000)) });
    const days = r.days.filter((d) => d.slots.length && Date.parse(d.date) > Date.now() + 3 * 86400000);
    return new Date(days[nth].slots[0].start);
  }

  async function book(requestId: string, lang: Lang, nth = 0) {
    const input: PlaceInput = {
      requestId,
      selection: { ...emptySelection(), visit: "first", beratung: true },
      start: await freeStart(nth),
      durationMinutes: 30,
      customer: { vorname: "Test", nachname: "Claude", handy: "0151 0000000", email: "test@example.com" },
      lang,
      consentAt: new Date(),
      reminder: false,
      device: "desktop",
      testMode: false,
      binding: true,
    };
    await placeBooking(input, deps());
    return store.findByRequestId(requestId)!;
  }

  for (const [reason, label] of [["customer_link", "über die Terminseite"], ["customer_short_notice", "Leider verhindert"]] as const) {
    it(`Deutsch, ${label}: Betreff, Satz, Link zur Buchung, Kalenderdatei mit derselben UID`, async () => {
      const row = await book(reason === "customer_link" ? "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1" : "a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2", "de");
      const bestaetigung = mailer.sent[0];
      const now = reason === "customer_short_notice" ? new Date(Date.parse(row.starts_at) - 23 * 3600000) : new Date();
      await cancelBooking(row.id, reason, deps(), now);
      const m = mailer.sent.at(-1)!;
      expect(mailer.sent).toHaveLength(2);
      expect(m.to).toBe("test@example.com");
      expect(m.subject).toMatch(new RegExp(`^${KUGEL}Abgesagt: \\S+, \\d{1,2}\\. \\S+, \\d{2}:\\d{2} Uhr$`, "u"));
      expect(m.text).toContain("Hallo Test,");
      expect(m.text).toMatch(/Ihr Termin am \S+, \d{1,2}\. \S+, um \d{2}:\d{2} Uhr ist abgesagt\./);
      expect(m.text).toContain("Wenn Sie einen neuen Termin möchten, können Sie ihn hier buchen:");
      expect(m.text).toContain("Neuen Termin buchen: https://www.paloskin.de/booking\n");
      expect(m.html).toContain('href="https://www.paloskin.de/booking"');
      expect(m.text).toContain("Bis bald!\nDr. med. Sebastian Vogel\nPALO SKIN by Dr. Vogel");
      expect(m.text + m.html).not.toMatch(/gebühr|botox|[–—]/i);
      expect(m.ics?.method).toBe("CANCEL");
      expect(m.ics?.content).toContain("METHOD:CANCEL");
      expect(m.ics?.content).toContain("STATUS:CANCELLED");
      expect(uid(m.ics!.content)).toBe(uid(bestaetigung.ics!.content));
    });

    it(`Englisch, ${label}: Mail auf Englisch, Link zur englischen Buchung`, async () => {
      const row = await book(reason === "customer_link" ? "b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b1" : "b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2", "en");
      const now = reason === "customer_short_notice" ? new Date(Date.parse(row.starts_at) - 23 * 3600000) : new Date();
      await cancelBooking(row.id, reason, deps(), now);
      const m = mailer.sent.at(-1)!;
      expect(m.subject).toMatch(new RegExp(`^${KUGEL}Cancelled: `, "u"));
      expect(m.text).toContain("Hello Test,");
      expect(m.text).toMatch(/Your appointment on \S+ \d{1,2} \S+ at \d{2}:\d{2} has been cancelled\./);
      expect(m.text).toContain("Book a new appointment: https://www.paloskin.de/booking?lang=en");
      expect(m.ics?.method).toBe("CANCEL");
    });
  }

  it("Absage durch das Studio (Kalender, Kundensystem): keine Mail an die Kundin", async () => {
    const row = await book("c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1", "de");
    await cancelBooking(row.id, "studio_calendar", deps());
    const row2 = await book("c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2", "de", 1);
    await cancelBooking(row2.id, "crm:studio_cancelled", deps());
    expect(mailer.sent.map((m) => m.subject).filter((s) => s.includes("Abgesagt"))).toEqual([]);
  });

  it("Verschieben behält die UID der Kalenderdatei", async () => {
    const row = await book("d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1", "de");
    const vorher = uid(mailer.sent[0].ics!.content);
    const r = await rescheduleBooking(row.id, await freeStart(1), deps());
    expect(r.status).toBe("rescheduled");
    expect(uid(mailer.sent.at(-1)!.ics!.content)).toBe(vorher);
  });
});
