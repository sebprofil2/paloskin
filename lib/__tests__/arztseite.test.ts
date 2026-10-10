import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../../app/sitemap";
import { proxy } from "../../proxy";
import { ARZTSEITE_LIVE, ARZTSEITE_SPRACHEN } from "../freigabe";
import { LANG_HEADER } from "../i18n";
import { arztPath, pagePathLang, pageRedirect } from "../seiten-pfade";
import { arztJsonLd, arztMetadata, homeJsonLd } from "../share-meta";
import { ARZT_TEXTE } from "../texts-arzt";
import { HOME_TEXTS } from "../texts-home";

const WWW = "https://www.paloskin.de";
afterEach(() => {
  process.env.PUBLIC_BASE_URL = WWW;
  delete process.env.PALOSKIN_INSTANCE;
});
process.env.PUBLIC_BASE_URL = WWW;
const anfrage = (pfad: string) => new NextRequest(`${WWW}${pfad}`);

describe("Seite über Dr. Vogel", () => {
  it("Adressen und Sprache aus dem Pfad", () => {
    expect(arztPath("de")).toBe("/dr-sebastian-vogel");
    expect(arztPath("en")).toBe("/en/dr-sebastian-vogel");
    expect(pagePathLang("/dr-sebastian-vogel")).toBe("de");
    expect(pagePathLang("/pt/dr-sebastian-vogel")).toBe("pt");
    expect(pagePathLang("/booking")).toBeNull();
    expect(proxy(anfrage("/fr/dr-sebastian-vogel")).headers.get(`x-middleware-request-${LANG_HEADER}`)).toBe("fr");
  });

  it("nicht freigegebene Sprachen vorübergehend auf Deutsch, /de dauerhaft ohne Kürzel", () => {
    expect(ARZTSEITE_SPRACHEN).toEqual(["de", "en", "es", "fr", "pt"]);
    for (const l of ["it", "tr", "uk", "ar"]) expect(pageRedirect(`/${l}/dr-sebastian-vogel`)).toEqual({ to: "/dr-sebastian-vogel", status: 302 });
    expect(pageRedirect("/de/dr-sebastian-vogel")).toEqual({ to: "/dr-sebastian-vogel", status: 301 });
    expect(pageRedirect("/en/dr-sebastian-vogel")).toBeNull();
    const r = proxy(anfrage("/ar/dr-sebastian-vogel"));
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe(`${WWW}/dr-sebastian-vogel`);
  });

  it("Titel, Beschreibung und Alt-Text wie vorgegeben; vor dem Livegang noindex und ohne hreflang", () => {
    const m = arztMetadata("de");
    expect(m.title).toEqual({ absolute: "Dr. med. Sebastian Vogel | Ärztliche Faltenbehandlung in Berlin | PALO SKIN" });
    expect(m.description).toBe("Dr. med. Sebastian Vogel, Arzt und Gründer von PALO SKIN in Berlin Prenzlauer Berg. Werdegang, Arbeitsweise und Beratung in fünf Sprachen.");
    expect(ARZT_TEXTE.de.alt).toBe("Dr. med. Sebastian Vogel im Studio PALO SKIN");
    if (!ARZTSEITE_LIVE) {
      expect(m.robots).toEqual({ index: false, follow: false });
      expect(m.alternates).toBeUndefined();
      expect(sitemap().some((e) => e.url.includes("dr-sebastian-vogel"))).toBe(false);
    }
  });

  it("deutscher Text wörtlich", () => {
    const t = ARZT_TEXTE.de;
    expect(t.intro).toBe("Bei PALO SKIN behandle und berate ich Sie als Patientin oder Patient. Dabei bringe ich Erfahrung aus mehr als 5.000 ästhetischen Behandlungen mit. Fragen Sie mich gern alles, was Sie wissen möchten.");
    expect(t.exp.map((x) => x.h)).toEqual(["Ästhetische Medizin", "Chirurgie und Intensivmedizin", "Approbation und Promotion zum Dr. med. an der Universität Freiburg", "Plastische Chirurgie in Brasilien", "Wissenschaftliche Veröffentlichungen"]);
    expect(JSON.stringify(t)).not.toMatch(/Universtität|botox/i);
    for (const l of ["de", "en", "es", "fr", "pt"] as const) {
      expect(ARZT_TEXTE[l].exp).toHaveLength(5);
      expect(ARZT_TEXTE[l].pubLinks.map((p) => p[1])).toEqual(t.pubLinks.map((p) => p[1]));
      expect(ARZT_TEXTE[l].awards).toHaveLength(4);
      expect(JSON.stringify(ARZT_TEXTE[l]), l).not.toMatch(/[–—]|botox/i);
    }
  });

  it("strukturierte Daten: ProfilePage mit der Person; url der Person erst mit dem Livegang", () => {
    const d = JSON.parse(arztJsonLd("en"));
    expect(d["@type"]).toBe("ProfilePage");
    expect(d.url).toBe(`${WWW}/en/dr-sebastian-vogel`);
    expect(d.mainEntity).toMatchObject({ "@type": "Person", "@id": `${WWW}/#arzt`, jobTitle: "Arzt", worksFor: { "@id": `${WWW}/#studio` } });
    const person = JSON.parse(homeJsonLd("de"))["@graph"][1];
    if (ARZTSEITE_LIVE) expect(person.url).toBe(`${WWW}/dr-sebastian-vogel`);
    else expect(person.url).toBeUndefined();
  });

  it("Linktext „Mehr über Dr. Vogel“ in allen Sprachen", () => {
    expect(HOME_TEXTS.de.moreDoc).toBe("Mehr über Dr. Vogel");
    for (const t of Object.values(HOME_TEXTS)) expect(t.moreDoc).toMatch(/Vogel/);
  });
});
