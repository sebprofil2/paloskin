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
