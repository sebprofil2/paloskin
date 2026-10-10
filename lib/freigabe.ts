import type { BehandlungSlug } from "./behandlungen";
import type { Lang } from "./i18n";

/*
 * Freigaben für neue Seiten (10. Oktober 2026). Hier und nur hier wird je Seite und Sprache freigegeben.
 * Nicht freigegebene Sprachen leiten vorübergehend (302) auf die deutsche Fassung weiter, haben keine hreflang-Verweise
 * und stehen nicht in der Sitemap. Ohne Abhängigkeiten, damit Proxy, Server und Browser dieselbe Liste lesen.
 */

/* ---------- Seite über Dr. Vogel (/dr-sebastian-vogel) ---------- */

/** Freigegebene Sprachen der Arztseite */
export const ARZTSEITE_SPRACHEN: readonly Lang[] = ["de", "en", "es", "fr", "pt"];

/**
 * Livegang der Arztseite auf www. Erst wenn true: Seite auf www erreichbar, Links aus Startseite und Fußzeile,
 * Einträge in der Sitemap, url der Person in den strukturierten Daten. Auf neu ist die Seite immer zu sehen (noindex).
 */
export const ARZTSEITE_LIVE = false;

/* ---------- Behandlungsseiten (/behandlungen/<name>) ---------- */

/**
 * Freigegebene Sprachen je Behandlungsseite. Hier „freigegeben“ setzen, indem die Sprache eingetragen wird, zum Beispiel
 * zornesfalte: ["de", "en"]. Leere Liste: nur auf neu zu sehen (noindex), auf www nicht erreichbar, nicht verlinkt,
 * nicht in der Sitemap. Nicht freigegebene Sprachen leiten vorübergehend auf die deutsche Fassung weiter.
 */
export const BEHANDLUNGEN_FREIGABE: Record<BehandlungSlug, readonly Lang[]> = {
  faltenbehandlung: [],
  zornesfalte: [],
  stirnfalten: [],
  kraehenfuesse: [],
  "lip-flip": [],
  "gummy-smile": [],
  "bunny-lines": [],
  "brow-lift": [],
  nasenverschmaelerung: [],
  erdbeerkinn: [],
  "haengende-mundwinkel": [],
  lippenfaeltchen: [],
  "nasenspitze-anheben": [],
  "kaumuskel-masseter": [],
  "nefertiti-lift": [],
  trapezius: [],
  "lachs-dna-polynukleotide": [],
  hyperhidrose: [],
};

/** Vorbereitet, noch nicht aktiv: Links von den Karten der Startseite auf die freigegebenen Behandlungsseiten */
export const BEHANDLUNGEN_KARTEN_AKTIV = false;

/** Vorbereitet, noch nicht aktiv: freigegebene Behandlungsseiten in der Sitemap */
export const BEHANDLUNGEN_SITEMAP_AKTIV = false;

export function freigegeben(slug: BehandlungSlug, lang: Lang): boolean {
  return BEHANDLUNGEN_FREIGABE[slug].includes(lang);
}
