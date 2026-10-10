import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";
import { proxy } from "../../proxy";
import { hinweisSprache, homePath, homePathLang, legacyHomeRedirect } from "../home-paths";
import { LANG_HEADER, LANG_IDS, type Lang } from "../i18n";
import { rechtsseiteKopf } from "../rechtsseiten";
import { homeAlternates, homeJsonLd, homeMetadata } from "../share-meta";
import { HOME_TEXTS } from "../texts-home";

/*
 * Eigene Adresse je Sprache (Auftrag vom 5. Oktober 2026): „/“ immer Deutsch, /en, /es, /fr, /pt, /ua (Ukrainisch, seit 10. Oktober 2026 statt /uk), /ar,
 * /de und /?lang=xx dauerhaft weitergeleitet, hreflang vollständig und gegenseitig, Adressen aus der Umgebung,
 * Testinstanz komplett noindex.
 */
const WWW = "https://www.paloskin.de";
const PFAD: Record<Lang, string> = { de: "/", en: "/en", es: "/es", fr: "/fr", pt: "/pt", it: "/it", tr: "/tr", uk: "/ua", ar: "/ar" };
const TITEL_DE = "PALO SKIN by Dr. Vogel | Ärztliche Faltenbehandlung in Berlin";
const BESCHREIBUNG_DE = "PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg: ärztliche Faltenbehandlung durch Dr. med. Sebastian Vogel. Termine vor und nach der Arbeit und am Wochenende.";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

afterEach(() => {
  process.env.PUBLIC_BASE_URL = WWW;
  delete process.env.PALOSKIN_INSTANCE;
});

const anfrage = (pfad: string, headers: Record<string, string> = {}) => new NextRequest(`${WWW}${pfad}`, { headers });
const spracheVomProxy = (pfad: string, headers?: Record<string, string>) => proxy(anfrage(pfad, headers)).headers.get(`x-middleware-request-${LANG_HEADER}`);

describe("Pfade der Startseite", () => {
  it("Deutsch auf „/“, die anderen Sprachen auf eigenen Adressen", () => {
    for (const lang of LANG_IDS) {
      expect(homePath(lang)).toBe(PFAD[lang]);
      expect(homePathLang(PFAD[lang])).toBe(lang);
    }
    for (const p of ["/de", "/xx", "/booking", "/en/", "/EN", "/impressum"]) expect(homePathLang(p), p).toBeNull();
  });

  it("alte Adressen: /de auf /, /?lang=xx auf die eigene Adresse, sonst nichts", () => {
    expect(legacyHomeRedirect("/de", null)).toBe("/");
    expect(legacyHomeRedirect("/", "en")).toBe("/en");
    expect(legacyHomeRedirect("/", "ar")).toBe("/ar");
    expect(legacyHomeRedirect("/", "de")).toBe("/");
    expect(legacyHomeRedirect("/", "xx")).toBe("/");
    expect(legacyHomeRedirect("/", null)).toBeNull();
    expect(legacyHomeRedirect("/en", null)).toBeNull();
    expect(legacyHomeRedirect("/booking", "en")).toBeNull();
  });
});

describe("Proxy: „/“ immer Deutsch, Weiterleitungen mit 301", () => {
  it("„/“ ohne Accept-Language, mit Englisch, mit gespeicherter Wahl und als Googlebot: Deutsch", () => {
    expect(spracheVomProxy("/")).toBe("de");
    expect(spracheVomProxy("/", { "accept-language": "en-US,en;q=0.9" })).toBe("de");
    expect(spracheVomProxy("/", { "accept-language": "ar", cookie: "palo_lang=uk" })).toBe("de");
    expect(spracheVomProxy("/", { "user-agent": GOOGLEBOT })).toBe("de");
  });

  it("jede Sprachadresse in ihrer Sprache, auch bei anderer Gerätesprache", () => {
    for (const lang of LANG_IDS) expect(spracheVomProxy(PFAD[lang], { "accept-language": "de-DE", cookie: "palo_lang=fr" })).toBe(lang);
  });

  it("übrige Seiten wie bisher (Buchung nach ?lang, Cookie, Gerät)", () => {
    expect(spracheVomProxy("/booking?lang=es")).toBe("es");
    expect(spracheVomProxy("/booking", { "accept-language": "pt-BR" })).toBe("pt");
  });

  it("/de und /?lang=en leiten dauerhaft (301) weiter, weitere Angaben bleiben", () => {
    const de = proxy(anfrage("/de"));
    expect(de.status).toBe(301);
    expect(de.headers.get("location")).toBe(`${WWW}/`);
    const en = proxy(anfrage("/?lang=en"));
    expect(en.status).toBe(301);
    expect(en.headers.get("location")).toBe(`${WWW}/en`);
    expect(proxy(anfrage("/?lang=uk&utm_source=x")).headers.get("location")).toBe(`${WWW}/ua?utm_source=x`);
    // Alte ukrainische Adressen dauerhaft auf /ua (10. Oktober 2026)
    for (const [alt, neu] of [["/uk", "/ua"], ["/uk/dr-sebastian-vogel", "/ua/dr-sebastian-vogel"], ["/uk/behandlungen/zornesfalte", "/ua/behandlungen/zornesfalte"]]) {
      const r = proxy(anfrage(alt));
      expect(r.status, alt).toBe(301);
      expect(r.headers.get("location"), alt).toBe(`${WWW}${neu}`);
    }
    expect(proxy(anfrage("/?lang=de")).headers.get("location")).toBe(`${WWW}/`);
  });

  it("Testinstanz: X-Robots-Tag noindex auf jeder Seite, www ohne", () => {
    expect(proxy(anfrage("/")).headers.get("x-robots-tag")).toBeNull();
    process.env.PALOSKIN_INSTANCE = "test";
    expect(proxy(anfrage("/")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(proxy(anfrage("/de")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("Terminseiten: X-Robots-Tag noindex, nofollow auch auf www", () => {
    expect(proxy(anfrage("/termin/abc")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(proxy(anfrage("/termin/abc/verschieben")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(proxy(anfrage("/booking")).headers.get("x-robots-tag")).toBeNull();
  });
});

describe("Kopfangaben je Sprache", () => {
  it("Deutsch: Titel und Beschreibung im Wortlaut von Dr. Vogel", () => {
    const m = homeMetadata("de");
    expect(m.title).toBe(TITEL_DE);
    expect(m.description).toBe(BESCHREIBUNG_DE);
  });

  it("jede Sprache: eigener Titel, kanonisch auf sich selbst, hreflang vollständig und gegenseitig, Linkvorschau, nie „Botox“", () => {
    const erwartet = { ...Object.fromEntries(LANG_IDS.map((l) => [l, `${WWW}${PFAD[l]}`])), "x-default": `${WWW}/` };
    for (const lang of LANG_IDS) {
      const m = homeMetadata(lang);
      const og = m.openGraph as { url: string; locale: string; title: string; description: string; images: { url: string }[] };
      expect(m.title).toBe(HOME_TEXTS[lang].title);
      expect(m.description).toBe(HOME_TEXTS[lang].metaDesc);
      expect(m.alternates?.canonical).toBe(`${WWW}${PFAD[lang]}`);
      expect(m.alternates?.languages).toEqual(erwartet);
      expect(og.url).toBe(`${WWW}${PFAD[lang]}`);
      expect(og.title).toBe(HOME_TEXTS[lang].title);
      expect(og.description).toBe(HOME_TEXTS[lang].metaDesc);
      expect(og.locale).toMatch(new RegExp(`^${lang}_`));
      expect(og.images).toEqual([{ url: `${WWW}/bilder/palo-skin-berlin-studio-linkvorschau.jpg`, width: 1200, height: 630, alt: HOME_TEXTS[lang].photoConsult }]);
      expect(m.twitter).toMatchObject({ card: "summary_large_image", images: [{ url: og.images[0].url, alt: HOME_TEXTS[lang].photoConsult }] });
      expect(m.robots).toBeUndefined();
      expect(JSON.stringify(m)).not.toMatch(/botox/i);
    }
    expect(new Set(LANG_IDS.map((l) => homeMetadata(l).title)).size).toBe(9);
  });

  it("strukturierte Daten: Studio, Arzt als Person, Seite mit passender Sprache; nur sichtbare Angaben, nie „Botox“", () => {
    const bilder = ["beratungsbereich", "behandlungsraum", "eingang", "dr-sebastian-vogel"].map((n) => `${WWW}/bilder/palo-skin-berlin-${n}.jpg`);
    for (const lang of LANG_IDS) {
      const text = homeJsonLd(lang);
      const graph = JSON.parse(text)["@graph"];
      expect(graph.map((n: { "@type": string }) => n["@type"])).toEqual(["MedicalBusiness", "Person", "WebPage"]);
      expect(graph[0]).toMatchObject({
        name: "PALO SKIN by Dr. Vogel",
        alternateName: ["PALO SKIN", "Palo Skin", "Paloskin", "paloskin.de"],
        url: `${WWW}/`,
        geo: { "@type": "GeoCoordinates", latitude: 52.5393548, longitude: 13.416081 },
        priceRange: "€€",
        logo: `${WWW}/assets/icon-512.png`,
        image: bilder,
        description: `${HOME_TEXTS[lang].metaDesc} ${HOME_TEXTS[lang].selfTreat}`,
        telephone: "+49 151 58872566",
        address: { streetAddress: "Hagenauer Straße 14", postalCode: "10435", addressLocality: "Berlin", addressCountry: "DE" },
        areaServed: { "@type": "City", name: "Berlin" },
        parentOrganization: { name: "Nidus Skin Berlin GmbH" },
        sameAs: ["https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8", "https://www.instagram.com/palo.skin"],
      });
      expect(graph[1]).toMatchObject({
        name: "Dr. med. Sebastian Vogel",
        honorificPrefix: "Dr. med.",
        jobTitle: "Arzt",
        worksFor: { "@id": `${WWW}/#studio` },
        image: `${WWW}/bilder/palo-skin-berlin-dr-sebastian-vogel.jpg`,
        sameAs: ["https://www.linkedin.com/in/dr-sebastian-vogel/"],
        knowsLanguage: ["de", "en", "es", "fr", "pt"],
        alumniOf: { name: "Albert-Ludwigs-Universität Freiburg" },
      });
      expect(graph[1].award).toHaveLength(4);
      // url der Person: die Arztseite (live seit 10. Oktober 2026)
      expect(graph[1].url).toBe(`${WWW}/dr-sebastian-vogel`);
      expect(graph[2]).toMatchObject({ url: `${WWW}${PFAD[lang]}`, inLanguage: lang, name: HOME_TEXTS[lang].title });
      expect(text).not.toMatch(/botox|openingHours|aggregateRating|"price"|offers|email/i);
    }
  });

  it("Adressen kommen aus der Umgebung", () => {
    process.env.PUBLIC_BASE_URL = "https://beispiel.example/";
    expect(homeMetadata("fr").alternates?.canonical).toBe("https://beispiel.example/fr");
    expect(homeAlternates().every((l) => l.href.startsWith("https://beispiel.example/"))).toBe(true);
  });

  it("Testinstanz: noindex, keine kanonische Adresse, kein hreflang", () => {
    process.env.PALOSKIN_INSTANCE = "test";
    process.env.PUBLIC_BASE_URL = "https://neu.paloskin.de";
    for (const lang of LANG_IDS) {
      const m = homeMetadata(lang);
      expect(m.robots).toEqual({ index: false, follow: false });
      expect(m.alternates).toBeUndefined();
    }
  });
});

describe("Sitemap und robots.txt", () => {
  it("alle Startseiten (neun Sprachen) mit gegenseitigem hreflang und die Buchung; Impressum und Datenschutz nicht (noindex)", () => {
    const s = sitemap();
    const arzt = ["/dr-sebastian-vogel", "/en/dr-sebastian-vogel", "/es/dr-sebastian-vogel", "/fr/dr-sebastian-vogel", "/pt/dr-sebastian-vogel"].map((p) => `${WWW}${p}`);
    expect(s.map((e) => e.url)).toEqual([...LANG_IDS.map((l) => `${WWW}${PFAD[l]}`), ...arzt, `${WWW}/booking`]);
    const buchungsEintrag = s[s.length - 1];
    const alle = { ...Object.fromEntries(LANG_IDS.map((l) => [l, `${WWW}${PFAD[l]}`])), "x-default": `${WWW}/` };
    for (const e of s.slice(0, LANG_IDS.length)) expect(e.alternates?.languages).toEqual(alle);
    const buchung = { ...Object.fromEntries(LANG_IDS.map((l) => [l, l === "de" ? `${WWW}/booking` : `${WWW}/booking?lang=${l}`])), "x-default": `${WWW}/booking` };
    expect(buchungsEintrag.alternates?.languages).toEqual(buchung);
    // Bildeinträge nur für die Startseiten, mit den festen Studiofotos
    const bilder = ["dr-sebastian-vogel", "beratungsbereich", "behandlungsraum", "eingang"].map((n) => `${WWW}/bilder/palo-skin-berlin-${n}.jpg`);
    for (const e of s.slice(0, LANG_IDS.length)) expect(e.images).toEqual(bilder);
    expect(buchungsEintrag.images).toBeUndefined();
    // Arztseite: hreflang nur zwischen den fünf freigegebenen Sprachen, x-default Deutsch
    expect(Object.keys(s[LANG_IDS.length].alternates?.languages ?? {})).toEqual(["de", "en", "es", "fr", "pt", "x-default"]);
    expect(JSON.stringify(s)).not.toMatch(/impressum|datenschutz/);
  });

  it("robots.txt verweist auf die Sitemap", () => {
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/", disallow: ["/intern/", "/api/"] }, sitemap: `${WWW}/sitemap.xml` });
  });

  it("Testinstanz: keine Einträge, alles gesperrt, keine Adresse von neu", () => {
    process.env.PALOSKIN_INSTANCE = "test";
    process.env.PUBLIC_BASE_URL = "https://neu.paloskin.de";
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});

describe("Hinweis auf die eigene Sprachadresse (nur im Browser)", () => {
  it("erste angebotene Browsersprache; Deutsch oder fremde Sprachen ohne Hinweis", () => {
    expect(hinweisSprache(["en-US", "en"])).toBe("en");
    expect(hinweisSprache(["nl-NL", "uk-UA"])).toBe("uk");
    expect(hinweisSprache(["it-IT", "uk-UA"])).toBe("it");
    expect(hinweisSprache(["tr-TR"])).toBe("tr");
    expect(hinweisSprache(["de-DE", "en"])).toBeNull();
    expect(hinweisSprache(["nl", "ja"])).toBeNull();
    expect(hinweisSprache([])).toBeNull();
  });
});

describe("Impressum und Datenschutz: Kopf nach Umgebung", () => {
  const html = '<meta name="robots" content="noindex,follow">\n<link rel="canonical" href="https://www.paloskin.de/impressum">\n<title>x</title>';
  it("kanonische Adresse aus der Umgebung, keine Sprachadressen", () => {
    expect(rechtsseiteKopf(html, "impressum", WWW, false)).toBe(html);
    expect(rechtsseiteKopf(html, "impressum", "https://beispiel.example", false)).toContain('<link rel="canonical" href="https://beispiel.example/impressum">');
  });
  it("Testinstanz: noindex,nofollow und keine kanonische Adresse", () => {
    const out = rechtsseiteKopf(html, "impressum", "https://neu.paloskin.de", true);
    expect(out).toBe('<meta name="robots" content="noindex,nofollow">\n<title>x</title>');
  });
});
