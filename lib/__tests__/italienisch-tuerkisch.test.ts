import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "../../proxy";
import { buildTitle, initialOf, LANG_NAMES } from "../booking-description";
import { calendarInput } from "../booking";
import { CONSULT_IDS, defaultConsult, isConsultLang, LANG_HEADER, LANG_IDS, LANG_SHORT, LANGS, langButtonLabel, pickLang, type Lang } from "../i18n";
import { buildIcs, confirmationMail, reminderMail, whenLabels } from "../mail-content";
import { nurHinweis } from "../rechtsseiten";
import { bookRequestSchema } from "../schema";
import { bookingMetadata, homeAlternates, homeMetadata } from "../share-meta";
import { openStore } from "../store";
import { TEXTS } from "../texts";
import { HOME_TEXTS } from "../texts-home";
import { MAIL_TEXTS } from "../texts-mail";
import { emptySelection } from "../treatments";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * Seitensprachen Italienisch und Türkisch (Auftrag Dr. Vogel, 9. Oktober 2026): nur Seitensprache, keine Beratungssprache.
 * Nur Testnamen, Testnummern und Beispieladressen.
 */
const NEU: Lang[] = ["it", "tr"];
const WWW = "https://www.paloskin.de";

describe("Italienisch und Türkisch: Sprachen, Kürzel, Adressen", () => {
  it("neun Seitensprachen in der vorgegebenen Reihenfolge, Kürzel IT und TR, Namen in der eigenen Sprache", () => {
    expect(LANGS.map((l) => l.name)).toEqual(["Deutsch", "English", "Español", "Français", "Português", "Italiano", "Türkçe", "Українська", "العربية"]);
    expect(LANG_SHORT.it).toBe("IT");
    expect(LANG_SHORT.tr).toBe("TR");
    expect(langButtonLabel("tr")).toBe("Dil: Türkçe");
  });

  it("hreflang und eigene Adressen /it und /tr, gegenseitig, x-default bleibt „/“", () => {
    const alt = Object.fromEntries(homeAlternates().map((a) => [a.hreflang, a.href]));
    expect(alt.it).toBe(`${WWW}/it`);
    expect(alt.tr).toBe(`${WWW}/tr`);
    expect(alt["x-default"]).toBe(`${WWW}/`);
    for (const l of NEU) {
      const m = homeMetadata(l);
      expect(m.alternates?.canonical).toBe(`${WWW}/${l}`);
      expect(Object.keys(m.alternates?.languages ?? {})).toHaveLength(10);
      expect((m.openGraph as { locale: string }).locale).toBe(l === "it" ? "it_IT" : "tr_TR");
      expect(proxy(new NextRequest(`${WWW}/${l}`)).headers.get(`x-middleware-request-${LANG_HEADER}`)).toBe(l);
    }
    expect(proxy(new NextRequest(`${WWW}/?lang=tr`)).headers.get("location")).toBe(`${WWW}/tr`);
  });

  it("Startsprache aus der Telefonsprache: it und tr erkannt, sonst wie bisher", () => {
    expect(pickLang({ acceptLanguage: "it-IT,it;q=0.9,en;q=0.8" })).toBe("it");
    expect(pickLang({ acceptLanguage: "tr-TR,tr;q=0.9" })).toBe("tr");
    expect(pickLang({ acceptLanguage: "nl-NL" })).toBe("de");
    expect(pickLang({ acceptLanguage: "tr-TR", cookie: "fr" })).toBe("fr");
  });
});

describe("Italienisch und Türkisch: keine Beratungssprache", () => {
  it("Beratung bleibt bei fünf Sprachen, ohne Vorauswahl, Buchung mit it oder tr als Beratung abgelehnt", () => {
    expect(CONSULT_IDS).toEqual(["de", "en", "es", "fr", "pt"]);
    for (const l of NEU) {
      expect(isConsultLang(l)).toBe(false);
      expect(defaultConsult(l)).toBeNull();
    }
    const base = { requestId: "5b0e6a3c-9d2f-4c41-8a77-1f2e3d4c5b6a", selection: { ...emptySelection(), visit: "first", beratung: true }, start: "2026-10-20T10:00:00+02:00", customer: { vorname: "Test", nachname: "Muster", handy: "0151 1234567", email: "test@example.com" }, consent: true };
    expect(bookRequestSchema.safeParse({ ...base, lang: "tr", consultationLanguage: "de" }).success).toBe(true);
    expect(bookRequestSchema.safeParse({ ...base, lang: "it", consultationLanguage: "it" }).success).toBe(false);
    expect(bookRequestSchema.safeParse({ ...base, lang: "tr", consultationLanguage: "tr" }).success).toBe(false);
  });

  it("Hinweis unter der Frage nennt die fünf Beratungssprachen; Startseite sagt dasselbe", () => {
    expect(TEXTS.it.consultHint).toMatch(/tedesco.*inglese.*spagnolo.*francese.*portoghese/);
    expect(TEXTS.tr.consultHint).toMatch(/Almanca.*İngilizce.*İspanyolca.*Fransızca.*Portekizce/);
    expect(HOME_TEXTS.it.why4P).toMatch(/tedesco.*inglese.*spagnolo.*francese.*portoghese/);
    expect(HOME_TEXTS.tr.why4P).toMatch(/Almanca.*İngilizce.*İspanyolca.*Fransızca.*Portekizce/);
  });
});

describe("Italienisch und Türkisch: Texte", () => {
  const leer = (o: object) => Object.entries(o).filter(([, v]) => v === "").map(([k]) => k).sort();
  it("jeder Textschlüssel vorhanden; leer nur, wo Deutsch auch leer ist", () => {
    for (const l of NEU) {
      for (const [quelle, ziel] of [[TEXTS.de, TEXTS[l]], [HOME_TEXTS.de, HOME_TEXTS[l]], [MAIL_TEXTS.de, MAIL_TEXTS[l]]] as [object, object][]) {
        expect(Object.keys(ziel).sort(), l).toEqual(Object.keys(quelle).sort());
        expect(leer(ziel), l).toEqual(leer(quelle));
      }
    }
  });

  it("nie „Botox“ auf der Startseite und in Vorschautexten, keine Werbewörter, keine langen Gedankenstriche", () => {
    for (const l of NEU) {
      const home = JSON.stringify(HOME_TEXTS[l]) + JSON.stringify(homeMetadata(l)) + JSON.stringify(bookingMetadata(l));
      expect(home, l).not.toMatch(/botox/i);
      const alles = home + JSON.stringify(TEXTS[l]) + JSON.stringify(MAIL_TEXTS[l]);
      expect(alles, l).not.toMatch(/sconto|promozione|gratis|gratuit|omaggio|indirim|kampanya|ücretsiz|bedava|hediye/i);
      expect(alles, l).not.toMatch(/[–—]/);
      expect(alles, l).not.toMatch(/pazient|hasta(?!lık)|muayenehane/i);
    }
    expect([...HOME_TEXTS.it.metaDesc].length).toBeLessThanOrEqual(160);
    expect([...HOME_TEXTS.tr.metaDesc].length).toBeLessThanOrEqual(160);
  });

  it("Impressum und Datenschutz: kurzer Hinweis, dass der deutsche Text verbindlich ist", () => {
    for (const seite of ["impressum", "datenschutz"]) {
      const html = readFileSync(join(process.cwd(), "public", seite, "index.html"), "utf8");
      expect(nurHinweis(html, "it")).toContain('data-hinweis="it">Solo il testo in lingua tedesca è giuridicamente vincolante.</p>');
      expect(nurHinweis(html, "tr")).toContain('data-hinweis="tr">Bu metin yalnızca Almanca hâliyle hukuken bağlayıcıdır.</p>');
    }
  });
});

describe("Italienisch und Türkisch: Mails, Kalender, Sonderzeichen", () => {
  const buchung = (lang: Lang, nachname = "Muster") => {
    const store = openStore(":memory:");
    const r = store.reserve({ requestId: crypto.randomUUID(), reference: "PS-TEST02", start: new Date("2026-10-07T06:00:00.000Z"), durationMinutes: 30, selection: { ...emptySelection(), visit: "first", beratung: true }, customer: { vorname: "Şule", nachname, handy: "0151 1234567", email: "test@example.com" }, lang, consultLang: "en", consentAt: new Date("2026-10-01T10:00:00Z"), reminder: false, device: "mobile", testMode: false, status: "confirmed", now: new Date("2026-10-01T10:00:00Z") });
    if (r.outcome === "conflict") throw new Error("Konflikt");
    store.close();
    return r.booking;
  };

  it("Bestätigungs- und Erinnerungsmail auf Italienisch und Türkisch, mit blauer Kugel und Sonderzeichen", () => {
    const it = buchung("it");
    expect(confirmationMail(it, new Date("2026-10-01T10:00:00Z")).subject).toBe("🔵 Prenotato: mercoledì 7/10, ore 08:00");
    expect(reminderMail(it).subject).toBe("🔵 Confermi, per favore: domani, ore 08:00");
    const tr = buchung("tr");
    const m = confirmationMail(tr, new Date("2026-10-01T10:00:00Z"));
    expect(m.subject).toBe("🔵 Randevu alındı: 7.10 Çarşamba, 08:00");
    expect(m.text).toContain("Şule");
    expect(m.html).toContain('lang="tr"');
    expect(reminderMail(tr).subject).toBe("🔵 Lütfen onaylayın: yarın, 08:00");
    for (const b of [it, tr]) for (const mail of [confirmationMail(b, new Date("2026-10-01T10:00:00Z")), reminderMail(b)]) {
      expect(mail.text).not.toMatch(/botox/i);
      expect([...mail.subject].length).toBeLessThanOrEqual(42);
    }
  });

  it("Kalendereintrag für den Kunden (ics) auf Türkisch mit korrekten Sonderzeichen", () => {
    const ics = buildIcs(buchung("tr"), "tr", new Date("2026-10-01T10:00:00Z"));
    expect(ics).toContain(MAIL_TEXTS.tr.icsManage.slice(0, 10));
    expect(ics).toMatch(/[çğıİöşüÇĞÖŞÜ]/);
  });

  it("Großschreibung: Türkisch i wird İ, ı wird I; Datum beginnt mit Großbuchstaben", () => {
    expect(initialOf("işler", "tr")).toBe("İ");
    expect(initialOf("ışık", "tr")).toBe("I");
    expect(initialOf("işler", "de")).toBe("I");
    expect(buildTitle({ vorname: "Şule", nachname: "işler", handy: "", email: "" }, false, "tr")).toBe("Palo Skin: Şule İ.");
    expect(calendarInput(buchung("tr", "ılık")).title).toBe("Palo Skin: Şule I.");
    expect(whenLabels(new Date("2026-10-07T06:00:00.000Z"), "tr").date).toBe("7 Ekim Çarşamba");
    expect(whenLabels(new Date("2026-10-07T06:00:00.000Z"), "it").date).toBe("Mercoledì 7 ottobre");
  });

  it("Studio bleibt Deutsch: Kalenderbeschreibung nennt die Seitensprache auf Deutsch", () => {
    expect(LANG_NAMES.it).toBe("Italienisch");
    expect(LANG_NAMES.tr).toBe("Türkisch");
    expect(calendarInput(buchung("tr")).description).toContain("Seitensprache und Mails: Türkisch");
  });

  it("alle Sprachen links nach rechts außer Arabisch", () => {
    expect(LANG_IDS.filter((l) => l !== "ar")).toContain("tr");
  });
});
