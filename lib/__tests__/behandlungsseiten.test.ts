import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../../app/sitemap";
import { proxy } from "../../proxy";
import { BEHANDLUNG_SLUGS, BEHANDLUNGEN, inhalt } from "../behandlungen";
import { BEHANDLUNGEN_FREIGABE, BEHANDLUNGEN_KARTEN_AKTIV, BEHANDLUNGEN_SITEMAP_AKTIV } from "../freigabe";
import { LANG_HEADER, LANG_IDS } from "../i18n";
import { formatPrice, price } from "../preise";
import { behandlungPath, pagePathLang, pageRedirect } from "../seiten-pfade";
import { behandlungJsonLd, behandlungMetadata } from "../share-meta";
import { PRUEFDATUM } from "../studio";
import { BEHANDLUNG_TEXTE } from "../texts-behandlung";

const WWW = "https://www.paloskin.de";
afterEach(() => {
  process.env.PUBLIC_BASE_URL = WWW;
  delete process.env.PALOSKIN_INSTANCE;
});
process.env.PUBLIC_BASE_URL = WWW;

describe("Behandlungsseiten (Gerüst)", () => {
  it("achtzehn Seiten mit den vereinbarten Adressen", () => {
    expect(BEHANDLUNG_SLUGS).toHaveLength(18);
    expect(behandlungPath("zornesfalte", "de")).toBe("/behandlungen/zornesfalte");
    expect(behandlungPath("zornesfalte", "en")).toBe("/en/behandlungen/zornesfalte");
    expect(pagePathLang("/behandlungen/lip-flip")).toBe("de");
    expect(pagePathLang("/behandlungen/gibt-es-nicht")).toBeNull();
    expect(proxy(new NextRequest(`${WWW}/behandlungen/trapezius`)).headers.get(`x-middleware-request-${LANG_HEADER}`)).toBe("de");
  });

  it("noch nichts freigegeben, nichts verlinkt, nichts in der Sitemap", () => {
    for (const slug of BEHANDLUNG_SLUGS) expect(BEHANDLUNGEN_FREIGABE[slug]).toEqual([]);
    expect(BEHANDLUNGEN_KARTEN_AKTIV).toBe(false);
    expect(BEHANDLUNGEN_SITEMAP_AKTIV).toBe(false);
    expect(sitemap().some((e) => e.url.includes("/behandlungen/"))).toBe(false);
  });

  it("nicht freigegebene Sprachen vorübergehend auf die deutsche Fassung", () => {
    expect(pageRedirect("/en/behandlungen/zornesfalte")).toEqual({ to: "/behandlungen/zornesfalte", status: 302 });
    expect(pageRedirect("/de/behandlungen/zornesfalte")).toEqual({ to: "/behandlungen/zornesfalte", status: 301 });
    expect(pageRedirect("/behandlungen/zornesfalte")).toBeNull();
  });

  it("nicht freigegeben: noindex, keine kanonische Angabe, kein hreflang", () => {
    const m = behandlungMetadata("zornesfalte", "de");
    expect(m.robots).toEqual({ index: false, follow: false });
    expect(m.alternates).toBeUndefined();
  });

  it("strukturierte Daten: MedicalWebPage, MedicalProcedure, reviewedBy, Brotkrumen; lastReviewed nur mit Prüfdatum", () => {
    for (const slug of BEHANDLUNG_SLUGS) {
      const g = JSON.parse(behandlungJsonLd(slug, "de"))["@graph"];
      expect(g[0]).toMatchObject({ "@type": "MedicalWebPage", about: { "@type": "MedicalProcedure", name: BEHANDLUNGEN[slug].name }, reviewedBy: { "@id": `${WWW}/#arzt` } });
      expect("lastReviewed" in g[0]).toBe(PRUEFDATUM[slug] !== null);
      expect(g[1]["@type"]).toBe("BreadcrumbList");
      expect(g[1].itemListElement.map((x: { name: string }) => x.name)).toEqual(["Startseite", "Behandlungen", `${inhalt(slug, "de").titelA} ${inhalt(slug, "de").titelB} | PALO SKIN`]);
      expect(JSON.stringify(g)).not.toMatch(/botox/i);
    }
  });

  it("Beschriftungen in allen neun Sprachen, ohne lange Gedankenstriche", () => {
    for (const l of LANG_IDS) {
      const t = BEHANDLUNG_TEXTE[l];
      expect(Object.keys(t.abschnitt)).toEqual(["fuerWen", "grenzen", "ablauf", "risiken", "kosten", "danach"]);
      expect(t.geprueft).toContain("{name}");
      expect(t.geprueft).toContain("{datum}");
      expect(JSON.stringify(t), l).not.toMatch(/[–—]|botox|praxis|patient/i);
    }
  });

  it("Preise aus der einen Quelle, Schreibweise wie bisher", () => {
    expect(price("de", "zone1")).toBe("120\u00a0€*");
    expect(price("de", "lachsPack")).toBe("1.000\u00a0€*");
    expect(formatPrice("fr", 1000)).toBe("1\u00a0000\u00a0€*");
  });
});
