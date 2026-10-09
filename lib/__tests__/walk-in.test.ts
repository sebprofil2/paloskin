import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calendarInput, placeBooking, recordWalkIn, runMailJobs, WALK_IN_NOTE, type PlaceInput } from "../booking";
import { MockEngine, mockInternals } from "../engine/mock";
import { withPortalUrl } from "../intern";
import { terminUrl } from "../links";
import { sendRemindersIfDue } from "../reminder-list";
import { openStore, toPayload, type Store } from "../store";
import { emptySelection } from "../treatments";
import { parseWalkIn } from "../walk-in";

/*
 * Walk-in (Auftrag Dr. Vogel, 9. Oktober 2026): Kunde ohne Buchung wird vom Kundensystem nachgetragen. Bestätigter
 * Termin, Kanal walk_in, Zeit online belegt, Kalendereintrag mit Zusatz, Ereignis created, keine Mail, keine Erinnerung.
 * Nur Testnummern und Beispieladressen.
 */
const NOW = new Date("2026-10-09T12:20:00.000Z");
const CHECK_IN = "2026-10-09T14:07:31+02:00"; // 12:07:31 UTC
const body = (over: Record<string, unknown> = {}) => ({
  request_id: "5b0e6a3c-9d2f-4c41-8a77-1f2e3d4c5b6a",
  first_name: "Erika",
  last_name: "Muster",
  phone: "0151 1234567",
  email: "Erika@Example.com",
  checked_in_at: CHECK_IN,
  ...over,
});

describe("Walk-in: Eingaben prüfen", () => {
  it("vollständige Meldung: Minute abgerundet, Nummer bereinigt, E-Mail klein, Standarddauer 30", () => {
    expect(parseWalkIn(body(), NOW)).toEqual({
      requestId: "5b0e6a3c-9d2f-4c41-8a77-1f2e3d4c5b6a",
      firstName: "Erika",
      lastName: "Muster",
      phone: "+491511234567",
      email: "erika@example.com",
      checkedInAt: new Date("2026-10-09T12:07:00.000Z"),
      durationMinutes: 30,
      firstVisit: false,
    });
  });

  it("E-Mail und Nachname dürfen fehlen, Dauer und erster Besuch sind wählbar", () => {
    const w = parseWalkIn({ request_id: "5b0e6a3c-9d2f-4c41-8a77-1f2e3d4c5b6a", first_name: "Erika", phone: "+41 79 123 45 67", checked_in_at: CHECK_IN, email: null, duration_minutes: 45, first_visit: true }, NOW)!;
    expect(w).toMatchObject({ lastName: "", email: "", phone: "+41791234567", durationMinutes: 45, firstVisit: true });
    expect(parseWalkIn({ ...body(), email: undefined }, NOW)?.email).toBe("");
  });

  it("ungültig: ohne Kennung, ohne Namen, ohne Ziffer in der Nummer, falsche E-Mail, fremde Felder, Dauer außerhalb 5 bis 240", () => {
    expect(parseWalkIn(body({ request_id: "x" }), NOW)).toBeNull();
    expect(parseWalkIn(body({ first_name: " " }), NOW)).toBeNull();
    expect(parseWalkIn(body({ phone: "keine" }), NOW)).toBeNull();
    expect(parseWalkIn(body({ email: "kein-at" }), NOW)).toBeNull();
    expect(parseWalkIn(body({ note: "x" }), NOW)).toBeNull();
    expect(parseWalkIn(body({ duration_minutes: 4 }), NOW)).toBeNull();
    expect(parseWalkIn(body({ duration_minutes: 241 }), NOW)).toBeNull();
    expect(parseWalkIn(body({ duration_minutes: 30.5 }), NOW)).toBeNull();
    expect(parseWalkIn(body({ checked_in_at: "2026-10-09T12:07:00" }), NOW)).toBeNull();
    expect(parseWalkIn(null, NOW)).toBeNull();
  });

  it("Check-in höchstens 10 Minuten voraus und höchstens 7 Tage zurück", () => {
    expect(parseWalkIn(body({ checked_in_at: "2026-10-09T12:30:00Z" }), NOW)).not.toBeNull();
    expect(parseWalkIn(body({ checked_in_at: "2026-10-09T12:31:00Z" }), NOW)).toBeNull();
    expect(parseWalkIn(body({ checked_in_at: "2026-10-02T12:20:00Z" }), NOW)).not.toBeNull();
    expect(parseWalkIn(body({ checked_in_at: "2026-10-02T12:19:00Z" }), NOW)).toBeNull();
  });
});

describe("Walk-in: Termin, Kalender, Ereignis, keine Mail", () => {
  let store: Store;
  const engine = new MockEngine();
  const sent: string[] = [];
  const mailer = { enabled: true, send: async (m: { to: string }) => void sent.push(m.to) };
  const deps = () => ({ store, engine, mailer });
  const walkIn = (over: Partial<Parameters<typeof recordWalkIn>[0]> = {}) =>
    recordWalkIn({ ...parseWalkIn(body(), NOW)!, testMode: false, ...over }, deps());

  beforeEach(() => {
    store = openStore(":memory:");
    mockInternals.reset();
    sent.length = 0;
    process.env.OWNER_MAIL = "studio@example.com";
  });
  afterEach(() => {
    store.close();
    delete process.env.OWNER_MAIL;
  });

  it("legt einen bestätigten Termin an: Kanal walk_in, vor Ort, zugesagt zur Check-in-Zeit, ohne Erinnerung", async () => {
    const r = await walkIn();
    expect(r.created).toBe(true);
    expect(r.overlaps).toEqual([]);
    const p = toPayload(r.booking);
    expect(p).toMatchObject({
      status: "confirmed",
      channel: "walk_in",
      device: "on_site",
      starts_at: "2026-10-09T12:07:00.000Z",
      ends_at: "2026-10-09T12:37:00.000Z",
      duration_minutes: 30,
      persons: 1,
      appointment_type: "follow_up",
      service_codes: [],
      zones: [],
      first_name: "Erika",
      last_name: "Muster",
      phone_e164: "+491511234567",
      email: "erika@example.com",
      language: "de",
      consultation_language: null,
      reminder_whatsapp: { consented: false, consented_at: null },
      attendance_confirmed_at: "2026-10-09T12:07:00.000Z",
      consent_at: "2026-10-09T12:07:00.000Z",
      note: "",
      test: false,
      calendar_state: "written",
    });
    expect(r.booking.reference).toMatch(/^PS-[A-Z2-9]{6}$/);
    expect(withPortalUrl(p).customer_portal_url).toBe(terminUrl(r.booking.id));
  });

  it("Ereignis created im Strom mit vollständigem Stand", async () => {
    const r = await walkIn();
    const ev = store.eventsAfter(0, 10);
    expect(ev.map((e) => e.type)).toEqual(["created"]);
    expect(ev[0].booking).toMatchObject({ id: r.booking.id, channel: "walk_in", status: "confirmed" });
  });

  it("Kalendereintrag wie bei allen Terminen, mit Zusatz „Walk-in, Check-in vor Ort“ in Titel und Beschreibung", async () => {
    const r = await walkIn({ firstVisit: true });
    const ev = [...mockInternals.events.values()];
    expect(ev).toHaveLength(1);
    expect(ev[0].title).toBe("Palo Skin: Erika M. (Walk-in, Check-in vor Ort)");
    expect(ev[0].description.split("\n")).toEqual([WALK_IN_NOTE, `Buchungsnummer: ${r.booking.reference}`, "Besuch: Erster Besuch"]);
    expect(ev[0].start).toEqual(new Date("2026-10-09T12:07:00.000Z"));
    expect(ev[0].end).toEqual(new Date("2026-10-09T12:37:00.000Z"));
    expect(calendarInput(store.findById(r.booking.id)!).reminder).toBe(false);
    expect(ev[0].description).not.toContain("1511234567");
  });

  it("belegt die Zeit für Online-Buchungen", async () => {
    await walkIn();
    expect(store.lockedIntervals(new Date("2026-10-09T11:00:00Z"), new Date("2026-10-09T14:00:00Z"))).toEqual([
      { start: Date.parse("2026-10-09T12:07:00.000Z"), end: Date.parse("2026-10-09T12:37:00.000Z") },
    ]);
    for (const start of ["2026-10-09T12:00:00Z", "2026-10-09T12:30:00Z"]) {
      const r = store.reserve({ requestId: crypto.randomUUID(), reference: "PS-TEST01", start: new Date(start), durationMinutes: 10, selection: { ...emptySelection(), visit: "return", beratung: true }, customer: { vorname: "A", nachname: "B", handy: "0151 7654321", email: "a@example.com" }, lang: "de", consentAt: NOW, reminder: false, device: "mobile", testMode: false, status: "confirmed" });
      expect(r.outcome, start).toBe("conflict");
    }
  });

  it("keine Mail an den Kunden, keine Studio-Mail, auch nicht aus den Hintergrundläufen", async () => {
    const r = await walkIn();
    expect(sent).toEqual([]);
    expect(store.studioMailsPending(new Date(NOW.getTime() + 3600000))).toEqual([]);
    // Selbst wenn das Studio den Eintrag im Kalender in die Zukunft zieht: keine Bestätigungsmail
    store.applyCalendarTimes(r.booking.id, new Date(Date.now() + 3 * 86400000), new Date(Date.now() + 3 * 86400000 + 1800000), "moved");
    expect(await runMailJobs(deps(), new Date(Date.now() + 10 * 60000))).toEqual({ confirmations: 0, overdue: 0 });
    expect(store.confirmationMailBacklog(new Date(Date.now() + 10 * 60000))).toEqual([]);
    expect(sent).toEqual([]);
  });

  it("keine Erinnerung, auch wenn der Termin am nächsten Tag liegt", async () => {
    store.reserveWalkIn({ requestId: crypto.randomUUID(), reference: "PS-WALK01", start: new Date("2026-10-10T08:00:00Z"), durationMinutes: 30, firstName: "Erika", lastName: "Muster", phone: "+491511234567", email: "erika@example.com", firstVisit: false, testMode: false });
    expect(await sendRemindersIfDue(deps(), new Date("2026-10-09T08:05:00Z"))).toEqual({ sent: 0, skipped: 0, failed: 0 });
    expect(sent).toEqual([]);
  });

  it("dieselbe request_id liefert dieselbe Buchung, kein zweiter Eintrag", async () => {
    const a = await walkIn();
    const b = await walkIn();
    expect(b.created).toBe(false);
    expect(b.booking.id).toBe(a.booking.id);
    expect(store.eventsAfter(0, 10)).toHaveLength(1);
    expect(mockInternals.events.size).toBe(1);
  });

  it("überschneidet sich der Walk-in mit einer Buchung, wird er trotzdem angelegt und die Buchung gemeldet", async () => {
    const start = new Date(Date.now() + 5 * 86400000);
    const slots = await engine.getSlots({ durationMinutes: 30 });
    const free = slots.days.flatMap((d) => d.slots).map((s) => new Date(s.start)).find((d) => d > start)!;
    const input: PlaceInput = { requestId: "6c1f7b4d-0e3a-4d52-9b88-2a3f4e5d6c7b", selection: { ...emptySelection(), visit: "return", beratung: true }, start: free, durationMinutes: 30, customer: { vorname: "Max", nachname: "Beispiel", handy: "0151 7654321", email: "max@example.com" }, lang: "de", consentAt: new Date(), reminder: false, device: "mobile", testMode: false, binding: true };
    await placeBooking(input, deps());
    const online = store.findByRequestId(input.requestId)!;
    sent.length = 0;
    const r = store.reserveWalkIn({ requestId: crypto.randomUUID(), reference: "PS-WALK02", start: new Date(free.getTime() + 13 * 60000), durationMinutes: 30, firstName: "Erika", lastName: "Muster", phone: "+491511234567", email: "", firstVisit: false, testMode: false });
    expect(r.outcome).toBe("created");
    expect(r.overlaps).toEqual([{ id: online.id, reference: online.reference }]);
    expect(store.findById(online.id)!.status).toBe("confirmed");
  });
});
