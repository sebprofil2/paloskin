import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openStore, requestKey, serviceCodesOf, type ReserveInput } from "../store";
import { emptySelection } from "../treatments";
import { ULID_PATTERN } from "../ulid";

const customer = { vorname: "Erika", nachname: "Muster", handy: "0151 1234567", email: "Erika@Example.com" };
const start = new Date("2026-10-05T08:00:00Z"); // Montag 10:00 Berlin

function input(requestId: string, over: Partial<ReserveInput> = {}): ReserveInput {
  return {
    requestId,
    reference: `PS-${requestId.slice(0, 6).toUpperCase()}`,
    start,
    durationMinutes: 30,
    selection: { ...emptySelection(), visit: "first", zones: ["stirn", "zornesfalte"], note: "Bitte leise" },
    customer,
    lang: "de",
    consentAt: new Date("2026-10-02T10:00:00Z"),
    reminder: true,
    device: "mobile",
    testMode: true,
    status: "requested",
    now: new Date("2026-10-02T10:00:01Z"),
    ...over,
  };
}

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("Reservierung in der Datenbank", () => {
  it("reserviert einmal, erkennt die Anfragekennung wieder und schreibt ein Ereignis", () => {
    const s = openStore(":memory:");
    const a = s.reserve(input("aaaaaaaa-1111-4111-8111-111111111111"));
    expect(a.outcome).toBe("created");
    if (a.outcome !== "created") return;
    expect(a.booking.id).toMatch(ULID_PATTERN);
    expect(a.booking.status).toBe("requested");
    expect(a.booking.calendar_state).toBe("pending");
    expect(a.booking.phone_e164).toBe("+491511234567");
    expect(a.booking.email).toBe("erika@example.com");
    expect(a.booking.first_visit).toBe(1);
    expect(a.booking.persons).toBe(1);
    expect(JSON.parse(a.booking.service_codes)).toEqual(["BOT"]);
    expect(JSON.parse(a.booking.zones)).toEqual(["stirn", "zornesfalte"]);
    expect(a.booking.note).toBe("Bitte leise");
    expect(a.booking.starts_at).toBe("2026-10-05T08:00:00.000Z");
    expect(a.booking.ends_at).toBe("2026-10-05T08:30:00.000Z");

    const b = s.reserve(input("aaaaaaaa-1111-4111-8111-111111111111"));
    expect(b.outcome).toBe("existing");
    expect(b.outcome === "existing" && b.booking.id).toBe(a.booking.id);
    expect(s.findByRequestId("aaaaaaaa-1111-4111-8111-111111111111")?.id).toBe(a.booking.id);
    expect(s.findByReference(a.booking.reference)?.id).toBe(a.booking.id);

    const ev = s.eventsForBooking(a.booking.id);
    expect(ev).toHaveLength(1);
    expect(ev[0].seq).toBe(1);
    expect(ev[0].type).toBe("created");
    expect(ev[0].payload.note).toBe("Bitte leise");
    expect(ev[0].payload.reminder_whatsapp).toEqual({ consented: true, consented_at: "2026-10-02T10:00:00.000Z" });
    expect(ev[0].payload.appointment_type).toBe("first");
    expect(ev[0].payload.service_codes).toEqual(["botulinum"]);
    expect(ev[0].payload.zones).toEqual(["forehead", "glabella"]);
    expect(ev[0].payload.test).toBe(true);
    // Die Anfragekennung selbst steht nirgends
    const raw = JSON.stringify(s.db.prepare("SELECT * FROM idempotency").all());
    expect(raw).not.toContain("aaaaaaaa-1111");
    expect(raw).toContain(requestKey("aaaaaaaa-1111-4111-8111-111111111111"));
  });

  it("gibt bei derselben Zeit genau einem die Reservierung, auch über zwei Verbindungen", () => {
    const dir = mkdtempSync(join(tmpdir(), "paloskin-store-"));
    dirs.push(dir);
    const path = join(dir, "buchung.sqlite");
    const s1 = openStore(path);
    const s2 = openStore(path);
    const a = s1.reserve(input("bbbbbbbb-1111-4111-8111-111111111111"));
    const b = s2.reserve(input("cccccccc-1111-4111-8111-111111111111"));
    expect([a.outcome, b.outcome].sort()).toEqual(["conflict", "created"]);
    // Überlappung um 10 Minuten reicht für den Konflikt
    const c = s2.reserve(input("dddddddd-1111-4111-8111-111111111111", { start: new Date("2026-10-05T08:20:00Z") }));
    expect(c.outcome).toBe("conflict");
    // Direkt anschließend ist frei
    const d = s2.reserve(input("eeeeeeee-1111-4111-8111-111111111111", { start: new Date("2026-10-05T08:30:00Z"), durationMinutes: 50 }));
    expect(d.outcome).toBe("created");
    expect(s1.db.prepare("SELECT COUNT(*) AS n FROM slot_locks").get()).toEqual({ n: 8 });
    expect(s1.db.prepare("SELECT COUNT(*) AS n FROM bookings").get()).toEqual({ n: 2 });
    // Nach dem Konflikt ist nichts halb geschrieben
    expect(s1.db.prepare("SELECT COUNT(*) AS n FROM booking_events").get()).toEqual({ n: 2 });
    const locked = s1.lockedIntervals(new Date("2026-10-05T00:00:00Z"), new Date("2026-10-06T00:00:00Z"));
    expect(locked).toEqual([
      { start: Date.parse("2026-10-05T08:00:00Z"), end: Date.parse("2026-10-05T08:30:00Z") },
      { start: Date.parse("2026-10-05T08:30:00Z"), end: Date.parse("2026-10-05T09:20:00Z") },
    ]);
    s1.close();
    s2.close();
  });

  it("vermerkt den Kalenderzustand und findet Nachzügler", () => {
    const s = openStore(":memory:");
    const a = s.reserve(input("ffffffff-1111-4111-8111-111111111111"));
    if (a.outcome !== "created") throw new Error("nicht reserviert");
    const t0 = new Date("2026-10-02T10:00:01Z");
    expect(s.calendarBacklog(t0)).toHaveLength(0); // frisch, noch im Schreibvorgang
    expect(s.calendarBacklog(new Date(t0.getTime() + 3 * 60000))).toHaveLength(1); // nach zwei Minuten offen: nachholen
    s.calendarFailed(a.booking.id, t0);
    expect(s.calendarBacklog(t0)).toHaveLength(1);
    expect(s.countCalendarFailed()).toBe(1);
    expect(s.countCalendarOverdue(t0)).toBe(0);
    expect(s.countCalendarOverdue(new Date(t0.getTime() + 25 * 3600000))).toBe(1);
    s.calendarWritten(a.booking.id, "ev-1", t0);
    const row = s.findById(a.booking.id)!;
    expect(row.calendar_state).toBe("written");
    expect(row.calendar_event_id).toBe("ev-1");
    expect(row.calendar_attempts).toBe(2);
    expect(s.calendarBacklog(new Date(t0.getTime() + 3 * 60000))).toHaveLength(0);
    // Kalenderzustand erzeugt kein eigenes Ereignis
    expect(s.eventsForBooking(a.booking.id)).toHaveLength(1);
    // Idempotenz bleibt 7 Tage
    expect(s.purgeIdempotency(new Date(t0.getTime() + 6 * 86400000))).toBe(0);
    expect(s.purgeIdempotency(new Date(t0.getTime() + 8 * 86400000))).toBe(1);
  });

  it("weist Zeiten außerhalb des Rasters zurück", () => {
    const s = openStore(":memory:");
    expect(() => s.reserve(input("99999999-1111-4111-8111-111111111111", { start: new Date("2026-10-05T08:05:00Z") }))).toThrow(/Raster/);
  });

  it("leitet Leistungscodes ohne Personen und Kontrolle ab", () => {
    expect(serviceCodesOf({ ...emptySelection(), visit: "first", zones: ["stirn"], persons: 2, lachs: "pack" })).toEqual(["BOT", "LDN4"]);
    expect(serviceCodesOf({ ...emptySelection(), checkup: true })).toEqual([]);
  });
});
