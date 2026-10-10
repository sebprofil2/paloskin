import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { placeBooking, rescheduleBooking, retryCalendar, runMailJobs, sendConfirmation, writeCalendar, type PlaceInput } from "../booking";
import { syncCalendarChanges } from "../calendar-sync";
import { MockEngine, mockInternals } from "../engine/mock";
import { configProblems } from "../instance";
import { getMailer, type MailMessage, type Mailer } from "../mail";
import { runDailyIfDue } from "../retention";
import { openStore, type Store } from "../store";
import { notifyStudio, runStudioMailQueue } from "../studio-mail";
import { emptySelection } from "../treatments";
import { terminToken } from "../links";

/* Mailer, der langsam sendet, damit sich zwei Läufe wirklich überschneiden */
class SlowMailer implements Mailer {
  readonly enabled = true;
  sent: MailMessage[] = [];
  fail = false;
  async send(m: MailMessage): Promise<void> {
    await new Promise((r) => setTimeout(r, 30));
    if (this.fail) throw Object.assign(new Error("smtp"), { responseCode: 421 });
    this.sent.push(m);
  }
}

const customer = { vorname: "Sebastian", nachname: "Vogel", handy: "0151 58872566", email: "kunde@example.com" };
const input = (requestId: string, start: Date): PlaceInput => ({
  requestId, selection: { ...emptySelection(), visit: "first", zones: ["stirn"] }, start, durationMinutes: 30, customer, lang: "de",
  consentAt: new Date(), reminder: false, device: "mobile", testMode: false, binding: true,
});

describe("Reparaturauftrag 4. Oktober 2026: Ausfälle, Abbrüche, parallele Läufe, Testinstanz", () => {
  let store: Store;
  let mailer: SlowMailer;
  const engine = new MockEngine();
  const deps = () => ({ store, engine, mailer });
  beforeEach(() => {
    store = openStore(":memory:");
    mailer = new SlowMailer();
    mockInternals.reset();
    process.env.OWNER_MAIL = "studio@example.com";
    delete process.env.BOOKING_MOCK_DOWN;
  });
  afterEach(() => {
    store.close();
    delete process.env.OWNER_MAIL;
    delete process.env.BOOKING_MOCK_DOWN;
    delete process.env.PALOSKIN_INSTANCE;
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
  const customerMails = () => mailer.sent.filter((m) => m.to === "kunde@example.com");

  /* ---------- 1. Kalenderausfall ---------- */
  it("1: Verschieben bei nicht prüfbarer Verfügbarkeit lässt den bisherigen Termin unverändert", async () => {
    const [s1, s2] = await freeStarts(2);
    await placeBooking(input("11111111-1111-4111-8111-111111111111", s1), deps());
    const before = store.findByRequestId("11111111-1111-4111-8111-111111111111")!;
    mailer.sent = [];
    process.env.BOOKING_MOCK_DOWN = "true";
    expect((await rescheduleBooking(before.id, s2, deps())).status).toBe("unavailable");
    delete process.env.BOOKING_MOCK_DOWN;
    const after = store.findById(before.id)!;
    expect(after.starts_at).toBe(before.starts_at);
    expect(after.calendar_rev).toBe(before.calendar_rev);
    expect(store.eventsForBooking(before.id).map((e) => e.type)).toEqual(["created"]);
    expect(mockInternals.events.get(before.calendar_event_id!)!.start.getTime()).toBe(s1.getTime());
    expect(mailer.sent).toHaveLength(0);
  });

  /* ---------- 2. Abbruch beim Verschieben ---------- */
  it("2: Abbruch nach der Datenbankänderung und vor dem Kalenderzugriff: nach Wiederanlauf stimmen Datenbank und Kalender, kein zweiter Eintrag, keine Mail aus Abgleich oder Nachtrag", async () => {
    const [s1, s2] = await freeStarts(2);
    await placeBooking(input("22222222-2222-4222-8222-222222222222", s1), deps());
    const b = store.findByRequestId("22222222-2222-4222-8222-222222222222")!;
    mailer.sent = [];
    // Nur die Datenbank wird geändert, dann „stürzt der Prozess ab“
    expect(store.reschedule(b.id, s2).outcome).toBe("rescheduled");
    const pending = store.findById(b.id)!;
    expect(pending.calendar_state).toBe("pending");
    expect(pending.calendar_rev).toBe(b.calendar_rev + 1);
    // Der Kalenderabgleich sieht den alten Eintrag (gerade angelegt) und darf nichts zurücksetzen
    const sync = await syncCalendarChanges(deps());
    expect(sync.moved + sync.resized + sync.cancelled).toBe(0);
    expect(store.findById(b.id)!.starts_at).toBe(s2.toISOString());
    // Wiederanlauf: der Hintergrundlauf zieht den Kalender nach (frühestens nach zwei Minuten)
    const r = await retryCalendar(deps(), new Date(Date.now() + 3 * 60000));
    expect(r.written).toBe(1);
    const done = store.findById(b.id)!;
    expect(done.calendar_state).toBe("written");
    expect(mockInternals.events.size).toBe(1);
    expect(mockInternals.events.get(b.calendar_event_id!)!.start.getTime()).toBe(s2.getTime());
    // Der Abgleich danach sieht die eigene Verschiebung und verschickt nichts
    const again = await syncCalendarChanges(deps(), new Date(Date.now() + 4 * 60000));
    expect(again.moved + again.resized + again.cancelled).toBe(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("2: eine ältere Kalenderantwort überschreibt nie eine neuere Terminänderung", async () => {
    const [s1, s2, s3] = await freeStarts(3);
    await placeBooking(input("33333333-3333-4333-8333-333333333333", s1), deps());
    const b = store.findByRequestId("33333333-3333-4333-8333-333333333333")!;
    store.reschedule(b.id, s2);
    const stale = store.findById(b.id)!; // Lauf A liest Version für s2
    store.reschedule(b.id, s3); // inzwischen neue Zeit (Version +1)
    // Antwort von Lauf A kommt an: darf nicht „written“ setzen
    expect(store.calendarWritten(b.id, b.calendar_event_id!, new Date(), stale.calendar_rev)).toBe(false);
    expect(store.findById(b.id)!.calendar_state).toBe("pending");
    // Der Nachtrag gleicht mit der neuesten Zeit ab
    await writeCalendar(store.findById(b.id)!, deps(), true);
    expect(store.findById(b.id)!.calendar_state).toBe("written");
    expect(mockInternals.events.get(b.calendar_event_id!)!.start.getTime()).toBe(s3.getTime());
    expect(mockInternals.events.size).toBe(1);
  });

  /* ---------- 3. Parallele Läufe ---------- */
  it("3: zwei gleichzeitig gestartete Versandläufe senden dieselbe Studio-Mail nicht doppelt", async () => {
    store.enqueueStudioMail("Neue Buchung: Test", "Text");
    const [a, b] = await Promise.all([runStudioMailQueue(deps()), runStudioMailQueue(deps())]);
    expect(a.sent + b.sent).toBe(1);
    expect(mailer.sent).toHaveLength(1);
  });

  it("3: Sofortversand und Hintergrundlauf senden dieselbe Bestätigungsmail nicht doppelt", async () => {
    const [s1] = await freeStarts(1);
    mailer.fail = true;
    await placeBooking(input("44444444-4444-4444-8444-444444444444", s1), deps());
    mailer.fail = false;
    const b = store.findByRequestId("44444444-4444-4444-8444-444444444444")!;
    mailer.sent = [];
    await Promise.all([runMailJobs(deps()), sendConfirmation(b, deps()), runMailJobs(deps())]);
    expect(customerMails()).toHaveLength(1);
  });

  it("3: fehlgeschlagene Studio-Mail bleibt wiederholbar, auch nach Abbruch während des Sendens", async () => {
    const [s1] = await freeStarts(1);
    await placeBooking(input("55555555-5555-4555-8555-555555555555", s1), deps());
    const b = store.findByRequestId("55555555-5555-4555-8555-555555555555")!;
    mailer.sent = [];
    mailer.fail = true;
    await notifyStudio("cancelled", b, deps());
    mailer.fail = false;
    // Nach der Wartezeit holt der Hintergrundlauf sie nach
    expect((await runStudioMailQueue(deps(), new Date(Date.now() + 5 * 60000))).sent).toBe(1);
    // Abbruch während des Sendens: beansprucht, aber nie freigegeben; nach zehn Minuten wieder frei
    const id = store.enqueueStudioMail("Abbruch", "Text");
    expect(store.claimStudioMail(id)).toBe(true);
    expect((await runStudioMailQueue(deps())).sent).toBe(0);
    expect((await runStudioMailQueue(deps(), new Date(Date.now() + 11 * 60000))).sent).toBe(1);
  });

  it("3: täglicher Lauf: ein fehlgeschlagener Export wird am selben Tag erneut versucht, der Löschlauf nicht doppelt", async () => {
    const dir = mkdtempSync(join(tmpdir(), "palo-export-"));
    process.env.CALENDAR_EXPORT_DIR = dir;
    const now = new Date("2026-10-03T02:00:00Z"); // 04:00 Uhr Berlin
    process.env.BOOKING_MOCK_DOWN = "true";
    expect(await runDailyIfDue(deps(), now)).toBe(true);
    expect(store.getMeta("retention_run_date")).toBe("2026-10-03");
    expect(store.getMeta("export_run_date")).toBeNull();
    delete process.env.BOOKING_MOCK_DOWN;
    const later = new Date("2026-10-03T02:05:00Z");
    expect(await runDailyIfDue(deps(), later)).toBe(true);
    expect(store.getMeta("export_run_date")).toBe("2026-10-03");
    expect(readdirSync(dir)).toEqual(["palo-skin-termine-2026-10-03.ics"]);
    expect(await runDailyIfDue(deps(), new Date("2026-10-03T02:10:00Z"))).toBe(false);
    rmSync(dir, { recursive: true, force: true });
    delete process.env.CALENDAR_EXPORT_DIR;
  });

  /* ---------- 4. Testinstanz ---------- */
  it("4: Testinstanz liest nie die Kalender der Produktion und verlangt eine Mailumleitung", async () => {
    const saved = { ...process.env };
    try {
      process.env.PALOSKIN_INSTANCE = "test";
      process.env.BOOKING_ENGINE = "google";
      process.env.CALENDAR_BOOKINGS_ID = "produktion@group.calendar.google.com";
      process.env.CALENDAR_OPEN_ID = "produktion-offen@group.calendar.google.com";
      process.env.CALENDAR_BUSY_IDS = "produktion-belegt@group.calendar.google.com";
      delete process.env.TEST_CALENDAR_ID;
      process.env.MAIL_MODE = "relay";
      delete process.env.MAIL_REDIRECT_TO;
      const { readEnv } = await import("../env");
      const env = readEnv();
      expect(env.google.calendarBookingsId).toBe("");
      expect(env.google.calendarOpenId).toBe("");
      expect(env.google.calendarBusyIds).toEqual([]);
      expect(configProblems()).toEqual([
        "Testinstanz: MAIL_REDIRECT_TO fehlt, ohne Umleitung wird nichts gesendet",
        "Testinstanz: TEST_CALENDAR_ID fehlt, ohne Testkalender keine Buchung",
      ]);
      // Ohne Umleitung verweigert der Mailer jeden Versand
      process.env.MAIL_MODE = "file";
      await expect(getMailer().send({ to: "echt@example.com", subject: "Gebucht", text: "", html: "" })).rejects.toThrow("Testinstanz ohne MAIL_REDIRECT_TO");
      // Mit Testkalender und Umleitung: nur der Testkalender, keine Probleme
      process.env.TEST_CALENDAR_ID = "test@group.calendar.google.com";
      process.env.MAIL_REDIRECT_TO = "umleitung@example.com";
      const env2 = readEnv();
      expect([env2.google.calendarBookingsId, env2.google.calendarOpenId, env2.google.calendarBusyIds]).toEqual(["test@group.calendar.google.com", "test@group.calendar.google.com", ["test@group.calendar.google.com"]]);
      expect(configProblems()).toEqual([]);
      // Öffnungsfenster aus dem echten „PALO SKIN offen“ (nur lesen); Belegung und Einträge bleiben im Testkalender (4. Oktober 2026)
      process.env.TEST_OPEN_CALENDAR_ID = "offen-echt@group.calendar.google.com";
      const env3 = readEnv();
      expect(env3.google.calendarOpenId).toBe("offen-echt@group.calendar.google.com");
      expect(env3.google.calendarBookingsId).toBe("test@group.calendar.google.com");
      expect(env3.google.calendarBusyIds).toEqual(["test@group.calendar.google.com"]);
      expect(JSON.stringify(env3.google)).not.toContain("produktion");
      delete process.env.TEST_OPEN_CALENDAR_ID;
      // Jede Mail der Testinstanz, auch Studio-Mail und Handliste, geht nur an die Umleitung und trägt [TEST] im Betreff
      const dbDir = mkdtempSync(join(tmpdir(), "palo-mail-"));
      process.env.BOOKING_DB_PATH = join(dbDir, "buchung.sqlite");
      await getMailer().send({ to: "studio@example.com", subject: "Morgen: 2 Termine, davon 1 noch nicht bestätigt", text: "x", html: "x" });
      const { readFileSync } = await import("node:fs");
      const files = readdirSync(join(dbDir, "mail"));
      const written = readFileSync(join(dbDir, "mail", files[0]), "utf8");
      expect(written).toContain("To: umleitung@example.com");
      expect(written).toContain("Subject: [TEST] Morgen: 2 Termine");
      expect(written).not.toContain("studio@example.com");
      // Studio-Mail einer Testbuchung trägt schon „Testbuchung:“ (Sprachleitfaden): kein zweiter Vermerk
      await getMailer().send({ to: "studio@example.com", subject: "Testbuchung: Neue Buchung: Dienstag, 13.10., 10:00 Uhr", text: "x", html: "x" });
      const alle = readdirSync(join(dbDir, "mail")).map((f) => readFileSync(join(dbDir, "mail", f), "utf8")).join("\n");
      expect(alle).toContain("Subject: Testbuchung: Neue Buchung: Dienstag, 13.10., 10:00 Uhr");
      expect(alle).not.toContain("[TEST] Testbuchung");
      rmSync(dbDir, { recursive: true, force: true });
    } finally {
      for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
      Object.assign(process.env, saved);
    }
  });

  /* ---------- 6. Link-Schlüssel ---------- */
  it("6: Terminlinks nur mit LINK_SECRET, kein Rückfall auf Testschlüssel; bestehende Links bleiben gleich", () => {
    const id = "01M41VEM03MRBGC1P8FEZNZJKT";
    const before = terminToken(id);
    const saved = process.env.LINK_SECRET;
    process.env.TEST_COOKIE_SECRET = "irgendwas";
    expect(terminToken(id)).toBe(before);
    delete process.env.LINK_SECRET;
    expect(() => terminToken(id)).toThrow("LINK_SECRET fehlt");
    process.env.LINK_SECRET = saved;
    delete process.env.TEST_COOKIE_SECRET;
  });
});
