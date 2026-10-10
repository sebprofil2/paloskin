import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockEngine } from "../engine/mock";
import type { MailMessage } from "../mail";
import { isDueAt, LIST_HOUR, listMail, sendReminderListIfDue } from "../reminder-list";
import { openStore, type ReserveInput, type Store } from "../store";
import { emptySelection } from "../treatments";

function reserve(store: Store, requestId: string, start: Date, over: Partial<ReserveInput> = {}): string {
  const r = store.reserve({
    requestId,
    reference: `PS-${requestId.slice(0, 6).toUpperCase()}`,
    start,
    durationMinutes: 30,
    selection: { ...emptySelection(), visit: "first", zones: ["stirn"] },
    customer: { vorname: "Erika", nachname: "Muster", handy: "0151 1234567", email: "erika@example.com" },
    lang: "de",
    consentAt: new Date("2026-10-01T10:00:00Z"),
    reminder: true,
    device: "desktop",
    testMode: false,
    status: "confirmed",
    now: new Date("2026-10-01T10:00:00Z"),
    ...over,
  });
  if (r.outcome !== "created") throw new Error("nicht reserviert");
  return r.booking.id;
}

describe("Handliste für WhatsApp-Erinnerungen", () => {
  let store: Store;
  const sent: MailMessage[] = [];
  const mailer = { enabled: true, send: async (m: MailMessage) => void sent.push(m) };
  const engine = new MockEngine();
  beforeEach(() => {
    store = openStore(":memory:");
    sent.length = 0;
    process.env.OWNER_MAIL = "sebastian@example.com";
  });
  afterEach(() => {
    store.close();
    delete process.env.OWNER_MAIL;
  });

  it("ist ab 18:00 Uhr Berliner Zeit einmal täglich fällig", () => {
    expect(isDueAt(LIST_HOUR, new Date("2026-10-03T15:59:00Z"), null)).toBe(false); // 17:59 Berlin
    expect(isDueAt(LIST_HOUR, new Date("2026-10-03T16:00:00Z"), null)).toBe(true); // 18:00 Berlin
    expect(isDueAt(LIST_HOUR, new Date("2026-10-03T16:00:00Z"), "2026-10-03")).toBe(false);
  });

  it("listet alle Termine von morgen mit Bestätigungsstand, Nummer nur bei offenen; keine Mail ohne Termine", async () => {
    const now = new Date("2026-10-03T16:05:00Z"); // 3. Oktober 18:05 Berlin
    const a = reserve(store, "aaaaaaaa-1111-4111-8111-111111111111", new Date("2026-10-04T08:00:00Z")); // morgen 10:00
    reserve(store, "bbbbbbbb-1111-4111-8111-111111111111", new Date("2026-10-04T12:00:00Z"), { reminder: false }); // ohne Haken
    const c = reserve(store, "cccccccc-1111-4111-8111-111111111111", new Date("2026-10-04T14:30:00Z"), { customer: { vorname: "Max", nachname: "Beispiel", handy: "+49 152 7654321", email: "max@example.com" } });
    reserve(store, "dddddddd-1111-4111-8111-111111111111", new Date("2026-10-05T08:00:00Z")); // übermorgen
    const e = reserve(store, "eeeeeeee-1111-4111-8111-111111111111", new Date("2026-10-04T16:00:00Z"));
    store.cancel(e, "customer_link", now);
    expect(a && c).toBeTruthy();

    store.confirmAttendance(c, now);
    expect(await sendReminderListIfDue({ store, engine, mailer }, now)).toBe(3);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("sebastian@example.com");
    expect(sent[0].subject).toBe("Morgen: 3 Termine, davon 2 noch nicht bestätigt");
    expect(sent[0].text).toContain("10:00 Uhr, Erika Muster, noch offen, WhatsApp: https://wa.me/491511234567");
    expect(sent[0].text).toContain("14:00 Uhr, Erika Muster, noch offen, Anrufen: +49 151 1234567");
    // In der Mail Links in Klartext statt sichtbarer Technikadressen (Sprachleitfaden)
    expect(sent[0].html).toContain('<a href="https://wa.me/491511234567">Per WhatsApp schreiben</a>');
    expect(sent[0].html).toContain('<a href="tel:+491511234567">Anrufen</a>');
    expect(sent[0].text).toContain("16:30 Uhr, Max Beispiel, bestätigt\n");
    expect(sent[0].text).not.toContain("491527654321");
    expect(sent[0].text).not.toContain("Botox");
    expect(sent[0].text).not.toContain("PS-");
    // am selben Tag nicht noch einmal
    expect(await sendReminderListIfDue({ store, engine, mailer }, new Date("2026-10-03T17:00:00Z"))).toBeNull();
    expect(sent).toHaveLength(1);
    // am nächsten Tag ohne Termine keine Mail
    expect(await sendReminderListIfDue({ store, engine, mailer }, new Date("2026-10-05T16:05:00Z"))).toBe(0);
    expect(sent).toHaveLength(1);
    expect(listMail([store.findById(a)!], now).subject).toBe("Morgen: 1 Termin, davon 1 noch nicht bestätigt");
  });

  it("ohne Empfänger keine Liste; Versandfehler wird am nächsten Tick wiederholt", async () => {
    const now = new Date("2026-10-03T16:05:00Z");
    reserve(store, "ffffffff-1111-4111-8111-111111111111", new Date("2026-10-04T08:00:00Z"));
    delete process.env.OWNER_MAIL;
    expect(await sendReminderListIfDue({ store, engine, mailer }, now)).toBeNull();
    process.env.OWNER_MAIL = "sebastian@example.com";
    const failing = { enabled: true, send: async () => { throw new Error("smtp"); } };
    expect(await sendReminderListIfDue({ store, engine, mailer: failing }, now)).toBeNull();
    expect(store.getMeta("reminder_list_date")).toBeNull();
    expect(await sendReminderListIfDue({ store, engine, mailer }, now)).toBe(1);
  });
});

describe("Tagesliste: Hinweis zur Handynummer (Sprachleitfaden, Freigabe 10. Oktober 2026)", () => {
  it("ungewöhnliche Nummer: eigener Satz unter dem Termin, wie in Kalender und Studio-Mail; sonst kein Hinweis", () => {
    const store = openStore(":memory:");
    const base = { durationMinutes: 30, selection: { ...emptySelection(), visit: "first" as const, beratung: true }, lang: "de" as const, consultLang: "de" as const, consentAt: new Date(), reminder: false, device: "mobile" as const, testMode: false, status: "confirmed" as const };
    const a = store.reserve({ ...base, requestId: crypto.randomUUID(), reference: "PS-LISTE1", start: new Date("2026-10-13T08:00:00Z"), customer: { vorname: "Erika", nachname: "Muster", handy: "030 12345678", email: "a@example.com" } });
    const b = store.reserve({ ...base, requestId: crypto.randomUUID(), reference: "PS-LISTE2", start: new Date("2026-10-13T09:00:00Z"), customer: { vorname: "Max", nachname: "Beispiel", handy: "0151 7654321", email: "b@example.com" } });
    if (a.outcome === "conflict" || b.outcome === "conflict") throw new Error("Konflikt");
    const m = listMail([a.booking, b.booking], new Date("2026-10-12T16:00:00Z"));
    expect(m.text).toContain("Anrufen: +493012345678\nDie Handynummer sieht ungewöhnlich aus. Bitte vor dem Termin kurz prüfen.");
    expect(m.html).toContain("<br>Die Handynummer sieht ungewöhnlich aus. Bitte vor dem Termin kurz prüfen.</li>");
    expect(m.text.match(/Die Handynummer sieht ungewöhnlich aus/g)).toHaveLength(1);
    expect(m.text).not.toContain("Nummer prüfen");
    store.close();
  });
});
