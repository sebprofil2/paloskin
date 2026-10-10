import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cancelBooking, placeBooking, type PlaceInput } from "../booking";
import { crmCancelReason } from "../cancel-reasons";
import { MockEngine, mockInternals } from "../engine/mock";
import { internEvents, internGuard, withPortalUrl } from "../intern";
import { terminUrl, verifyTerminToken } from "../links";
import { confirmationMail, reminderMail } from "../mail-content";
import { appointmentType, SERVICE_CODE_TABLE, toSharedServiceCodes, toSharedZones, ZONE_CODE_TABLE } from "../service-codes";
import { openStore, toPayload, type Store } from "../store";
import { emptySelection, ZONE_IDS } from "../treatments";

describe("Gemeinsame Codes", () => {
  it("übersetzt alle internen Codes und Zonen", () => {
    expect(toSharedServiceCodes(["BER", "BOT", "KAU", "NEF", "HYP", "LDN", "LDN4"])).toEqual(["consultation", "botulinum", "masseter", "nefertiti", "hyperhidrosis_axilla", "polynucleotides_eye", "polynucleotides_eye_4"]);
    expect(() => toSharedServiceCodes(["XYZ"])).toThrow(/ohne Entsprechung/);
    expect(toSharedZones([...ZONE_IDS])).toHaveLength(ZONE_IDS.length);
    expect(new Set(toSharedZones([...ZONE_IDS])).size).toBe(ZONE_IDS.length);
    expect(toSharedZones(["zornesfalte", "stirn", "kraehenfuesse"])).toEqual(["glabella", "forehead", "crows_feet"]);
    expect(SERVICE_CODE_TABLE.map((e) => e.shared)).toContain("botulinum");
    expect(ZONE_CODE_TABLE.map((e) => e.shared)).toEqual(["glabella", "forehead", "crows_feet", "brow_lift", "lip_flip", "bunny_lines", "mouth_corners", "chin", "gummy_smile", "upper_lip_lines", "nose"]);
    expect(appointmentType({ checkup: true, firstVisit: true })).toBe("control");
    expect(appointmentType({ checkup: false, firstVisit: true })).toBe("first");
    expect(appointmentType({ checkup: false, firstVisit: false })).toBe("follow_up");
  });
});

describe("Endpunkt: Ereignisse, Bestätigung, Rückweg", () => {
  let store: Store;
  const engine = new MockEngine();
  const mailer = { enabled: false, send: async () => {} };
  const deps = () => ({ store, engine, mailer });
  const customer = { vorname: "Erika", nachname: "Muster", handy: "0151 1234567", email: "erika@example.com" };
  const input = (requestId: string, start: Date, over: Partial<PlaceInput> = {}): PlaceInput => ({
    requestId,
    selection: { ...emptySelection(), visit: "return", zones: ["stirn"], kaumuskel: true, note: "Notiz" },
    start,
    durationMinutes: 30,
    customer,
    lang: "de",
    consentAt: new Date(),
    reminder: true,
    device: "desktop",
    testMode: true,
    binding: false,
    ...over,
  });
  beforeEach(() => {
    store = openStore(":memory:");
    mockInternals.reset();
  });
  afterEach(() => store.close());

  async function freeStarts(n: number): Promise<Date[]> {
    const r = await engine.getSlots({ durationMinutes: 30 });
    return r.days.filter((d) => d.slots.length && Date.parse(d.date) > Date.now() + 3 * 86400000).slice(0, n).map((d) => new Date(d.slots[0].start));
  }

  it("liefert Ereignisse in Reihenfolge mit Umschlag, after und limit, Bestätigung nie rückwärts", async () => {
    const [s1, s2] = await freeStarts(2);
    await placeBooking(input("11111111-1111-4111-8111-111111111111", s1), deps());
    await placeBooking(input("22222222-2222-4222-8222-222222222222", s2, { selection: { ...emptySelection(), checkup: true } }), deps());
    const all = store.eventsAfter(0, 100);
    expect(all.map((e) => e.seq)).toEqual([1, 2]);
    expect(all[0]).toMatchObject({ seq: 1, type: "created" });
    expect(all[0].event_id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    const b = all[0].booking as ReturnType<typeof toPayload>;
    expect(b.appointment_type).toBe("follow_up");
    expect(b.service_codes).toEqual(["botulinum", "masseter"]);
    expect(b.zones).toEqual(["forehead"]);
    expect(b.reminder_whatsapp.consented).toBe(true);
    expect(b.test).toBe(true);
    expect(b.note).toBe("Notiz");
    expect("booking_id" in all[0]).toBe(false);
    expect("deleted_at" in b).toBe(false);
    expect((all[1].booking as ReturnType<typeof toPayload>).appointment_type).toBe("control");
    expect(store.eventsAfter(1, 100).map((e) => e.seq)).toEqual([2]);
    expect(store.eventsAfter(0, 1).map((e) => e.seq)).toEqual([1]);
    expect(store.eventsAfter(2, 100)).toEqual([]);
    expect(store.lastSeq()).toBe(2);
    expect(store.acknowledge("studio-os", 1)).toBe(1);
    expect(store.acknowledge("studio-os", 2)).toBe(2);
    expect(store.acknowledge("studio-os", 1)).toBe(2);
    expect(store.consumers()[0]).toMatchObject({ name: "studio-os", acknowledged_seq: 2 });
  });

  it("Rückweg: confirmed einmalig, cancelled gibt frei und löscht den Kalendereintrag", async () => {
    const [s1] = await freeStarts(1);
    await placeBooking(input("33333333-3333-4333-8333-333333333333", s1), deps());
    const row = store.findByRequestId("33333333-3333-4333-8333-333333333333")!;
    expect(store.confirmByCrm(row.id).outcome).toBe("confirmed");
    expect(store.confirmByCrm(row.id).outcome).toBe("unchanged");
    expect(store.findById(row.id)!.status).toBe("confirmed");
    expect(store.eventsForBooking(row.id).map((e) => e.type)).toEqual(["created", "confirmed"]);
    const cancelled = await cancelBooking(row.id, crmCancelReason("studio_cancelled"), deps());
    expect(cancelled?.cancel_reason).toBe("crm:studio_cancelled");
    expect((store.eventsAfter(0, 10).at(-1)!.booking as { cancel_reason?: string | null }).cancel_reason).toBe("crm:studio_cancelled");
    expect(cancelled?.status).toBe("cancelled");
    expect(store.confirmByCrm(row.id).outcome).toBe("cancelled");
    expect(mockInternals.events.size).toBe(0);
    expect(store.eventsAfter(0, 10).map((e) => e.type)).toEqual(["created", "confirmed", "cancelled"]);
    expect(store.confirmByCrm("01M3YWQ51D0EPJ4VSS2B2MQT7H").outcome).toBe("missing");
  });

  it("customer_portal_url: derselbe Link wie in den Mails, in jedem Ereignis außer deleted, nie gespeichert", async () => {
    const [s1] = await freeStarts(1);
    await placeBooking(input("44444444-4444-4444-8444-444444444444", s1), deps());
    const row = store.findByRequestId("44444444-4444-4444-8444-444444444444")!;
    store.confirmByCrm(row.id);
    await cancelBooking(row.id, crmCancelReason("studio_cancelled"), deps());
    const roh = store.eventsAfter(0, 10);
    const ausgeliefert = internEvents([...roh, { seq: 99, event_id: "01M3YWQ51D0EPJ4VSS2B2MQT7X", type: "deleted", occurred_at: "2027-01-05T02:30:00.000Z", booking: { id: row.id, reference: row.reference } }]);
    const link = `https://www.paloskin.de/termin/${row.id}.`;
    for (const e of ausgeliefert.slice(0, 3)) {
      const url = (e.booking as unknown as { customer_portal_url: string }).customer_portal_url;
      expect(url).toBe(terminUrl(row.id));
      expect(url.startsWith(link)).toBe(true);
      expect(verifyTerminToken(url.split("/termin/")[1])).toBe(row.id);
    }
    expect(ausgeliefert.map((e) => e.type)).toEqual(["created", "confirmed", "cancelled", "deleted"]);
    expect(ausgeliefert[3].booking).toEqual({ id: row.id, reference: row.reference });
    // Bestätigungsmail enthält genau diesen Link, die Erinnerung baut ihre Knöpfe darauf auf (?a=ja, /verschieben)
    const fresh = store.findById(row.id)!;
    expect(confirmationMail(fresh).text).toContain(terminUrl(row.id));
    expect(reminderMail(fresh).text).toContain(`${terminUrl(row.id)}?a=ja`);
    expect(reminderMail(fresh).text).toContain(`${terminUrl(row.id)}/verschieben`);
    // In der Ereignistabelle steht der Link nicht
    for (const e of roh) expect("customer_portal_url" in e.booking).toBe(false);
    expect(JSON.stringify(store.eventsForBooking(row.id))).not.toContain("/termin/");
    // Statusantwort: vollständiger Stand plus Link
    expect(withPortalUrl(toPayload(fresh))).toEqual({ ...toPayload(fresh), customer_portal_url: terminUrl(row.id) });
  });
});

describe("Zugangsprüfung des Endpunkts", () => {
  beforeEach(() => {
    process.env.INTERN_TOKEN = "geheimes-token-nur-im-test";
    process.env.TRUST_PROXY = "false";
  });
  afterEach(() => {
    delete process.env.INTERN_TOKEN;
    delete process.env.TRUST_PROXY;
  });
  const req = (headers: Record<string, string>) => new Request("http://x/intern/v1/health", { headers });

  it("verlangt die Kopfzeile des internen Blocks und das richtige Token", async () => {
    expect((await internGuard(req({})))?.status).toBe(404);
    expect((await internGuard(req({ "x-palo-intern": "1" })))?.status).toBe(401);
    expect((await internGuard(req({ "x-palo-intern": "1", authorization: "Bearer falsch" })))?.status).toBe(401);
    expect(internGuard(req({ "x-palo-intern": "1", authorization: "Bearer geheimes-token-nur-im-test" }))).toBeNull();
    delete process.env.INTERN_TOKEN;
    expect((await internGuard(req({ "x-palo-intern": "1", authorization: "Bearer geheimes-token-nur-im-test" })))?.status).toBe(401);
  });
});
