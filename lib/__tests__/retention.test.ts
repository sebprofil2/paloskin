import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockEngine, mockInternals } from "../engine/mock";
import { exportCalendar, isDailyDue, runDailyIfDue, runRetention } from "../retention";
import { openStore, type ReserveInput, type Store } from "../store";
import { emptySelection } from "../treatments";

const customer = { vorname: "Erika", nachname: "Muster", handy: "0151 1234567", email: "erika@example.com" };
const DAY = 86400000;

function reserve(store: Store, requestId: string, start: Date, now: Date): string {
  const input: ReserveInput = {
    requestId,
    reference: `PS-${requestId.slice(0, 6).toUpperCase()}`,
    start,
    durationMinutes: 30,
    selection: { ...emptySelection(), visit: "first", zones: ["stirn"] },
    customer,
    lang: "de",
    consentAt: now,
    reminder: false,
    device: "desktop",
    testMode: false,
    status: "confirmed",
    now,
  };
  const r = store.reserve(input);
  if (r.outcome !== "created") throw new Error("nicht reserviert");
  return r.booking.id;
}

describe("Löschlauf", () => {
  let store: Store;
  const engine = new MockEngine();
  beforeEach(() => {
    store = openStore(":memory:");
    mockInternals.reset();
    delete process.env.BOOKING_MOCK_DOWN;
  });
  afterEach(() => store.close());

  it("löscht bestätigte Buchungen nach 90 Tagen, unbestätigte erst nach 120, Ereignis deleted nur mit Kennung, Kalendereintrag mit", async () => {
    const now = new Date("2027-02-01T10:00:00Z");
    const grid = (d: Date) => new Date(Math.floor(d.getTime() / 600000) * 600000);
    const old = reserve(store, "aaaaaaaa-1111-4111-8111-111111111111", grid(new Date(now.getTime() - 100 * DAY)), new Date(now.getTime() - 110 * DAY));
    const veryOld = reserve(store, "bbbbbbbb-1111-4111-8111-111111111111", grid(new Date(now.getTime() - 130 * DAY)), new Date(now.getTime() - 140 * DAY));
    const fresh = reserve(store, "cccccccc-1111-4111-8111-111111111111", grid(new Date(now.getTime() - 10 * DAY)), new Date(now.getTime() - 20 * DAY));
    // Kalendereinträge wie im Betrieb; einer fehlt schon (von Hand gelöscht), das darf kein Fehler sein
    const evOld = await engine.createEvent({ reference: "PS-AAAAAA", title: "t", description: "d", start: now, end: now, serviceCode: "BOT", reminder: false });
    store.calendarWritten(old, evOld);
    store.calendarWritten(veryOld, "mock-schon-weg");
    // Noch kein Kundensystem angemeldet: nur die 120-Tage-Regel greift
    let r = await runRetention({ store, engine }, now);
    expect(r).toMatchObject({ deleted: 0, deletedForced: 1, calendarRemoved: 1 });
    expect(store.findById(veryOld)).toBeNull();
    expect(store.findById(old)).not.toBeNull();
    const deletedEvent = store.eventsAfter(0, 100).find((e) => e.type === "deleted")!;
    expect(deletedEvent.booking).toEqual({ id: veryOld, reference: "PS-BBBBBB" });
    expect(store.db.prepare("SELECT COUNT(*) AS n FROM slot_locks WHERE booking_id = ?").get(veryOld)).toEqual({ n: 0 });
    expect(store.db.prepare("SELECT COUNT(*) AS n FROM idempotency WHERE booking_id = ?").get(veryOld)).toEqual({ n: 0 });
    // Kundensystem bestätigt alles: jetzt auch die 100 Tage alte Buchung
    store.acknowledge("studio-os", store.lastSeq());
    // Kalender nicht erreichbar: die Buchung bleibt bis zum nächsten Lauf
    process.env.BOOKING_MOCK_DOWN = "true";
    r = await runRetention({ store, engine }, now);
    expect(r).toMatchObject({ deleted: 0 });
    expect(store.findById(old)).not.toBeNull();
    delete process.env.BOOKING_MOCK_DOWN;
    r = await runRetention({ store, engine }, now);
    expect(r).toMatchObject({ deleted: 1, deletedForced: 0, calendarRemoved: 1 });
    expect(mockInternals.events.has(evOld)).toBe(false);
    expect(store.findById(old)).toBeNull();
    expect(store.findById(fresh)).not.toBeNull();
    // Das neue Ereignis deleted ist noch nicht bestätigt und bleibt; ein nochmaliger Lauf löscht nichts mehr
    expect(await runRetention({ store, engine }, now)).toMatchObject({ deleted: 0, deletedForced: 0 });
    expect(store.eventsAfter(0, 100).filter((e) => e.type === "deleted")).toHaveLength(2);
  });

  it("löscht Ereignisse nach 90 Tagen nur bestätigt, nach 120 Tagen auch unbestätigt", async () => {
    const now = new Date("2027-02-01T10:00:00Z");
    const grid = (d: Date) => new Date(Math.floor(d.getTime() / 600000) * 600000);
    reserve(store, "dddddddd-1111-4111-8111-111111111111", grid(new Date(now.getTime() + 5 * DAY)), new Date(now.getTime() - 100 * DAY));
    reserve(store, "eeeeeeee-1111-4111-8111-111111111111", grid(new Date(now.getTime() + 6 * DAY)), new Date(now.getTime() - 130 * DAY));
    reserve(store, "ffffffff-1111-4111-8111-111111111111", grid(new Date(now.getTime() + 7 * DAY)), new Date(now.getTime() - 1 * DAY));
    let r = await runRetention({ store, engine }, now);
    expect(r).toMatchObject({ eventsPurged: 0, eventsPurgedForced: 1 });
    store.acknowledge("studio-os", 1);
    r = await runRetention({ store, engine }, now);
    expect(r).toMatchObject({ eventsPurged: 1, eventsPurgedForced: 0 });
    expect(store.eventsAfter(0, 100).map((e) => e.seq)).toEqual([3]);
    expect(store.lastSeq()).toBe(3);
  });

  it("ist täglich ab 03:30 Uhr Berliner Zeit fällig, einmal je Tag", () => {
    expect(isDailyDue(new Date("2026-10-03T01:29:00Z"), null)).toBe(false); // 03:29 Berlin
    expect(isDailyDue(new Date("2026-10-03T01:30:00Z"), null)).toBe(true); // 03:30 Berlin
    expect(isDailyDue(new Date("2026-10-03T01:30:00Z"), "2026-10-03")).toBe(false);
    expect(isDailyDue(new Date("2026-10-03T12:00:00Z"), "2026-10-02")).toBe(true); // verpasster Lauf wird nachgeholt
    expect(isDailyDue(new Date("2026-11-03T02:29:00Z"), null)).toBe(false); // Winterzeit: 03:29 Berlin
    expect(isDailyDue(new Date("2026-11-03T02:30:00Z"), null)).toBe(true);
  });
});

describe("Kalenderexport", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
    delete process.env.CALENDAR_EXPORT_DIR;
    mockInternals.reset();
  });

  it("schreibt eine Kalenderdatei mit den Einträgen und räumt alte Exporte weg", async () => {
    const dir = mkdtempSync(join(tmpdir(), "paloskin-export-"));
    dirs.push(dir);
    process.env.CALENDAR_EXPORT_DIR = dir;
    const engine = new MockEngine();
    const now = new Date("2026-10-03T01:35:00Z");
    await engine.createEvent({ reference: "PS-AAAAAA", title: "Palo Skin: Erika M.", description: "Buchungsnummer: PS-AAAAAA", start: new Date("2026-10-05T08:00:00Z"), end: new Date("2026-10-05T08:30:00Z"), serviceCode: "BOT", reminder: false });
    const { writeFileSync } = await import("node:fs");
    writeFileSync(join(dir, "palo-skin-termine-2026-08-01.ics"), "alt");
    writeFileSync(join(dir, "palo-skin-termine-2026-09-20.ics"), "neu genug");
    const file = await exportCalendar({ engine }, now);
    const ics = readFileSync(file, "utf8");
    expect(file.endsWith("palo-skin-termine-2026-10-03.ics")).toBe(true);
    expect(ics).toContain("SUMMARY:Palo Skin: Erika M.");
    expect(ics).toContain("DTSTART:20261005T080000Z");
    expect(readdirSync(dir).sort()).toEqual(["palo-skin-termine-2026-09-20.ics", "palo-skin-termine-2026-10-03.ics"]);

    const store = openStore(":memory:");
    const mailer = { enabled: false, send: async () => {} };
    expect(await runDailyIfDue({ store, engine, mailer }, now)).toBe(true);
    expect(await runDailyIfDue({ store, engine, mailer }, now)).toBe(false);
    expect(store.getMeta("retention_run_date")).toBe("2026-10-03");
    expect(store.getMeta("export_run_date")).toBe("2026-10-03");
    store.close();
  });
});
