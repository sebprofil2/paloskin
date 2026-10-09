import { describe, expect, it } from "vitest";
import { calendarInput } from "../booking";
import { CONSULT_IDS, defaultConsult, LANG_IDS, langDir, pickLang } from "../i18n";
import { confirmationMail, reminderMail } from "../mail-content";
import { listMail } from "../reminder-list";
import { bookRequestSchema } from "../schema";
import { hreflangLinks, STUDIO_JSONLD } from "../share-meta";
import { openStore, type ReserveInput } from "../store";
import { studioMailFor } from "../studio-mail";
import { TEXTS } from "../texts";
import { emptySelection, type Lang } from "../treatments";

/* Beratungssprache und sieben Seitensprachen (Entscheidung Dr. Vogel, 4. Oktober 2026) */
const grid = (d: Date) => new Date(Math.floor(d.getTime() / 600000) * 600000);
const input = (n: number, lang: Lang, consultLang: ReserveInput["consultLang"]): ReserveInput => {
  const now = new Date();
  return {
    requestId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    reference: `PS-B${String(n).padStart(5, "0")}`,
    start: grid(new Date(now.getTime() + (3 + n) * 86400000)),
    durationMinutes: 30,
    selection: { ...emptySelection(), visit: "first", zones: ["stirn"] },
    customer: { vorname: "Olena", nachname: "Muster", handy: "0151 58872566", email: "olena@example.com" },
    lang,
    consultLang,
    consentAt: now,
    reminder: false,
    device: "mobile",
    testMode: false,
    status: "confirmed",
    now,
  };
};
const request = (over: Record<string, unknown> = {}) => ({
  requestId: "11111111-1111-4111-8111-111111111111",
  selection: { ...emptySelection(), visit: "first", beratung: true },
  start: "2026-10-26T10:00:00+01:00",
  lang: "uk",
  consultationLanguage: "en",
  customer: { vorname: "Olena", nachname: "Muster", handy: "0151 1234567", email: "olena@example.com" },
  consent: true,
  ...over,
});

describe("Beratungssprache und Seitensprachen Ukrainisch und Arabisch", () => {
  it("Pflichtfeld: ohne Beratungssprache, mit Ukrainisch oder Arabisch als Beratungssprache keine Buchung; Seitensprache uk und ar erlaubt", () => {
    expect(bookRequestSchema.safeParse(request()).success).toBe(true);
    expect(bookRequestSchema.safeParse(request({ lang: "ar", consultationLanguage: "de" })).success).toBe(true);
    const { consultationLanguage: _weg, ...ohne } = request();
    expect(bookRequestSchema.safeParse(ohne).success).toBe(false);
    expect(bookRequestSchema.safeParse(request({ consultationLanguage: "uk" })).success).toBe(false);
    expect(bookRequestSchema.safeParse(request({ consultationLanguage: "ar" })).success).toBe(false);
    expect(bookRequestSchema.safeParse(request({ lang: "ru" })).success).toBe(false);
  });

  it("Vorauswahl: die Seitensprache, wenn sie eine der fünf ist; bei Ukrainisch und Arabisch keine (dann mit Hinweis)", () => {
    for (const l of CONSULT_IDS) expect(defaultConsult(l)).toBe(l);
    expect(defaultConsult("uk")).toBeNull();
    expect(defaultConsult("ar")).toBeNull();
    expect(TEXTS.uk.consultHint).toBeTruthy();
    expect(TEXTS.ar.consultHint).toBeTruthy();
    // Startsprache aus der Telefonsprache, auch Ukrainisch und Arabisch
    expect(pickLang({ acceptLanguage: "uk-UA,uk;q=0.9,ru;q=0.8" })).toBe("uk");
    expect(pickLang({ acceptLanguage: "ar-SA,ar;q=0.9,en;q=0.8" })).toBe("ar");
  });

  it("Speicherung und Ereignis: consultation_language getrennt von language; ältere Buchungen null", () => {
    const store = openStore(":memory:");
    const a = store.reserve(input(1, "uk", "en"));
    const b = store.reserve(input(2, "de", undefined));
    expect(a.outcome).toBe("created");
    if (a.outcome !== "created" || b.outcome !== "created") throw new Error("nicht angelegt");
    expect(a.booking.language).toBe("uk");
    expect(a.booking.consultation_language).toBe("en");
    expect(b.booking.consultation_language).toBeNull();
    const ev = store.eventsAfter(0, 10);
    const pa = ev.find((e) => e.booking.reference === "PS-B00001")!.booking as unknown as Record<string, unknown>;
    expect(pa.language).toBe("uk");
    expect(pa.consultation_language).toBe("en");
    const pb = ev.find((e) => e.booking.reference === "PS-B00002")!.booking as unknown as Record<string, unknown>;
    expect(pb).toHaveProperty("consultation_language", null);
    store.close();
  });

  it("Studio: Kalender „Beratung: Englisch“, Sofort-Mail und 18-Uhr-Liste „Beratung auf Englisch“, alles Deutsch", () => {
    const store = openStore(":memory:");
    const r = store.reserve(input(3, "ar", "en"));
    if (r.outcome !== "created") throw new Error("nicht angelegt");
    const desc = calendarInput(r.booking).description;
    expect(desc).toContain("Beratung: Englisch");
    expect(desc).toContain("Seitensprache und Mails: Arabisch");
    expect(studioMailFor("booked", r.booking).body).toContain("Beratung auf Englisch");
    const list = listMail([r.booking], new Date(Date.parse(r.booking.starts_at) - 86400000));
    expect(list.text).toContain("Beratung auf Englisch");
    expect(list.html).toContain("Beratung auf Englisch");
    const same = store.reserve(input(4, "de", "de"));
    if (same.outcome !== "created") throw new Error("nicht angelegt");
    expect(calendarInput(same.booking).description).toContain("Beratung: Deutsch");
    expect(calendarInput(same.booking).description).not.toContain("Seitensprache");
    store.close();
  });

  it("Mails auf Ukrainisch und Arabisch: Betreff mit blauer Kugel, Arabisch von rechts nach links", () => {
    const store = openStore(":memory:");
    for (const [n, lang] of [[5, "uk"], [6, "ar"]] as [number, Lang][]) {
      const r = store.reserve(input(n, lang, "de"));
      if (r.outcome !== "created") throw new Error("nicht angelegt");
      const m = confirmationMail(r.booking);
      expect(m.subject.startsWith("\u{1F535} ")).toBe(true);
      expect([...m.subject].length).toBeLessThanOrEqual(42);
      expect(m.html).toContain(`<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">`);
      expect(m.text).toContain("PALO SKIN by Dr. Vogel");
      const rem = reminderMail(r.booking);
      expect(rem.subject.startsWith("\u{1F535} ")).toBe(true);
      for (const t of [m.text, rem.text]) {
        expect(t).not.toMatch(/[–—]/);
        expect(t).not.toMatch(/[٠-٩]/); // keine arabisch-indischen Ziffern
      }
      if (lang === "ar") expect(m.html).toContain('dir="rtl" style="max-width:560px;margin:0 auto;text-align:right;direction:rtl;"');
    }
    store.close();
  });

  it("Rechts nach links: nur Arabisch; Startseite mit dir=rtl, hreflang für alle Seitensprachen (seit 9. Oktober 2026 neun), Beratung in fünf Sprachen", () => {
    expect(LANG_IDS).toEqual(["de", "en", "es", "fr", "pt", "it", "tr", "uk", "ar"]);
    for (const l of LANG_IDS) expect(langDir(l)).toBe(l === "ar" ? "rtl" : "ltr");
    const links = hreflangLinks("/");
    expect(links.map((x) => x.hreflang)).toEqual(["de", "en", "es", "fr", "pt", "it", "tr", "uk", "ar", "x-default"]);
    // Strukturierte Daten: beraten wird weiterhin in fünf Sprachen
    expect(STUDIO_JSONLD).toContain('"availableLanguage": ["de", "en", "es", "fr", "pt"]');
  });
});
