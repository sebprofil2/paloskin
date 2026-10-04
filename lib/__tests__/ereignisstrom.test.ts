import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../db";
import { MockEngine, mockInternals } from "../engine/mock";
import { runRetention } from "../retention";
import { openStore, type ReserveInput, type Store } from "../store";
import { emptySelection } from "../treatments";

/* Beginn auf das 10-Minuten-Raster runden */
const grid = (d: Date) => new Date(Math.floor(d.getTime() / 600000) * 600000);
const input = (n: number, start: Date, now: Date): ReserveInput => ({
  requestId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, reference: `PS-T${String(n).padStart(5, "0")}`, start: grid(start), durationMinutes: 30,
  selection: { ...emptySelection(), visit: "first", zones: ["stirn"] },
  customer: { vorname: "Erika", nachname: "Muster", handy: "0151 58872566", email: "erika@example.com" },
  lang: "de", consentAt: now, reminder: false, device: "mobile", testMode: false, status: "confirmed", now,
});
/* Ereignisse künstlich altern lassen */
const age = (store: Store, days: number) =>
  (store as unknown as { db: { prepare: (s: string) => { run: (...a: unknown[]) => unknown } } }).db
    .prepare("UPDATE booking_events SET occurred_at = ?")
    .run(new Date(Date.now() - days * 86400000).toISOString());

describe("Ereignisstrom ohne Lücke: oldest_seq, stream_generation, Löschlauf, Alarm (4. Oktober 2026)", () => {
  let dir: string;
  const engine = new MockEngine();
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "palo-strom-"));
    mockInternals.reset();
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("stream_generation: Bezeichnerform, höchstens 40 Zeichen, bleibt beim erneuten Öffnen gleich, neue Datenbank bekommt eine neue", () => {
    const path = join(dir, "buchung.sqlite");
    const a = openStore(path);
    const gen = a.streamGeneration();
    expect(gen).toMatch(/^[A-Za-z0-9_-]{1,40}$/);
    a.close();
    const b = openStore(path);
    expect(b.streamGeneration()).toBe(gen);
    b.close();
    const c = openStore(join(dir, "andere.sqlite"));
    expect(c.streamGeneration()).not.toBe(gen);
    c.close();
    openDatabase(":memory:").close();
  });

  it("oldest_seq: 0 solange nichts gelöscht ist, danach die kleinste vorhandene Nummer; last_seq bleibt auch nach dem Löschen", async () => {
    const store = openStore(":memory:");
    const t0 = new Date(Date.now() - 200 * 86400000);
    store.reserve(input(1, new Date(t0.getTime() + 86400000), t0));
    store.reserve(input(2, new Date(t0.getTime() + 2 * 86400000), t0));
    expect(store.oldestSeq()).toBe(0);
    expect(store.lastSeq()).toBe(2);
    // Ohne angemeldeten Verbraucher wie bisher: alte Buchungen gelöscht (Ereignis deleted), alte Ereignisse nach 120 Tagen gelöscht
    age(store, 150);
    await runRetention({ store, engine });
    expect(store.oldestSeq()).toBeGreaterThan(2);
    expect(store.lastSeq()).toBeGreaterThanOrEqual(store.oldestSeq());
    const ev = store.eventsAfter(0, 50);
    expect(ev.map((e) => e.type)).toEqual(["deleted", "deleted"]);
    expect(store.oldestSeq()).toBe(ev[0].seq);
    store.close();
  });

  it("oldest_seq erkennt auch Löschungen aus der Zeit vor dem Vermerk (Nummern beginnen bei 1)", () => {
    const store = openStore(":memory:");
    const t0 = new Date(Date.now() + 86400000);
    for (let n = 1; n <= 3; n++) store.reserve(input(n, new Date(t0.getTime() + n * 3600000), new Date()));
    const db = (store as unknown as { db: { prepare: (s: string) => { run: (...a: unknown[]) => unknown } } }).db;
    db.prepare("DELETE FROM booking_events WHERE seq <= 2").run();
    expect(store.oldestSeq()).toBe(3);
    db.prepare("DELETE FROM booking_events").run();
    expect(store.oldestSeq()).toBe(4);
    expect(store.lastSeq()).toBe(3);
    store.close();
  });

  it("mit angemeldetem Verbraucher: unbestätigte Ereignisse werden nie gelöscht, bestätigte nach 90 Tagen schon", async () => {
    const store = openStore(":memory:");
    const t0 = new Date(Date.now() - 200 * 86400000);
    store.reserve(input(1, new Date(t0.getTime() + 86400000), t0)); // seq 1
    store.reserve(input(2, new Date(t0.getTime() + 2 * 86400000), t0)); // seq 2
    store.acknowledge("studio-os", 1);
    age(store, 150);
    const r = await runRetention({ store, engine });
    expect(r.eventsPurgedForced).toBe(0);
    const left = store.eventsAfter(0, 50).map((e) => e.seq);
    expect(left).not.toContain(1); // bestätigt und alt: gelöscht
    expect(left).toContain(2); // unbestätigt: bleibt, auch nach 150 Tagen
    expect(store.oldestSeq()).toBe(2);
    store.close();
  });

  it("Alarm: Ereignis länger als 3 Tage unbestätigt, nur wenn ein Verbraucher angemeldet ist", () => {
    const store = openStore(":memory:");
    const now = new Date();
    store.reserve(input(1, new Date(now.getTime() + 10 * 86400000), now));
    age(store, 4);
    expect(store.countUnacknowledgedOlderThan(now, 3)).toBe(0); // kein Verbraucher
    store.touchConsumer("studio-os");
    expect(store.countUnacknowledgedOlderThan(now, 3)).toBe(1);
    store.acknowledge("studio-os", store.lastSeq());
    expect(store.countUnacknowledgedOlderThan(now, 3)).toBe(0);
    store.close();
  });

  it("GET /intern/v1/events und /health liefern oldest_seq und stream_generation", async () => {
    process.env.BOOKING_DB_PATH = join(dir, "route.sqlite");
    process.env.INTERN_TOKEN = "token-nur-im-test";
    process.env.TRUST_PROXY = "false";
    try {
      const headers = { "x-palo-intern": "1", authorization: "Bearer token-nur-im-test" };
      const { GET: events } = await import("../../app/intern/v1/events/route");
      const { GET: health } = await import("../../app/intern/v1/health/route");
      const e = await (await events(new Request("http://x/intern/v1/events?after=0", { headers }))).json();
      const h = await (await health(new Request("http://x/intern/v1/health", { headers }))).json();
      expect(e.oldest_seq).toBe(0);
      expect(e.stream_generation).toMatch(/^gen-\d{8}-[a-z0-9]{10}$/);
      expect(h.oldest_seq).toBe(0);
      expect(h.stream_generation).toBe(e.stream_generation);
    } finally {
      delete process.env.BOOKING_DB_PATH;
      delete process.env.INTERN_TOKEN;
      delete process.env.TRUST_PROXY;
    }
  });
});
