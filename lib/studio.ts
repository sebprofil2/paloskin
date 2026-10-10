import type { BehandlungSlug } from "./behandlungen";
import type { Lang } from "./i18n";

/*
 * Zentrale Angaben zu Studio und Arzt (10. Oktober 2026): an dieser einen Stelle pflegen. Startseite, Behandlungsseiten,
 * Arztseite und strukturierte Daten lesen von hier. Preise stehen weiter in lib/treatments.ts (PRICES, brutto), dort liest
 * auch die Buchung. Ohne Abhängigkeiten, nutzbar auf Server und im Browser.
 */
export const STUDIO = {
  name: "PALO SKIN by Dr. Vogel",
  /** Schreibweisen, unter denen das Studio gesucht wird (Google korrigiert „Paloskin“ sonst zu „pale skin“) */
  alternateNames: ["PALO SKIN", "Palo Skin", "Paloskin", "paloskin.de"],
  domain: "paloskin.de",
  operator: "Nidus Skin Berlin GmbH",
  address: { street: "Hagenauer Straße 14", postalCode: "10435", city: "Berlin", country: "DE" },
  /** Genaue Ortsangabe des Google-Eintrags (nicht der Kartenmittelpunkt), abgelesen am 10. Oktober 2026 */
  geo: { latitude: 52.5393548, longitude: 13.416081 },
  /** Dieselbe Nummer für Anrufe und WhatsApp */
  phone: { display: "+49 151 58872566", tel: "tel:+4915158872566" },
  whatsapp: "https://wa.me/4915158872566",
  instagram: { url: "https://www.instagram.com/palo.skin", handle: "@palo.skin" },
  maps: "https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8",
  /** Sprachen, in denen beraten und behandelt wird */
  consultationLanguages: ["de", "en", "es", "fr", "pt"] as const satisfies readonly Lang[],
  priceRange: "€€",
} as const;

/* Englische Namen der Beratungssprachen für die strukturierten Daten */
export const LANGUAGE_NAMES_EN: Record<(typeof STUDIO.consultationLanguages)[number], string> = {
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
};

export const ARZT = {
  name: "Dr. med. Sebastian Vogel",
  givenName: "Sebastian",
  familyName: "Vogel",
  honorificPrefix: "Dr. med.",
  jobTitle: "Arzt",
  linkedin: "https://www.linkedin.com/in/dr-sebastian-vogel/",
  knowsAbout: ["Ärztliche Faltenbehandlung", "Ästhetische Medizin", "Skin Booster"],
  alumniOf: "Albert-Ludwigs-Universität Freiburg",
  awards: [
    "Stipendiat der Studienstiftung des deutschen Volkes",
    "Stipendiat des Deutschen Akademischen Austauschdienstes",
    "Promotion magna cum laude",
    "Erster Bundespreis Jugend musiziert",
  ],
} as const;

/**
 * Datum der medizinischen Prüfung je Behandlungsseite durch Dr. med. Sebastian Vogel (JJJJ-MM-TT). Nur echte Prüfdaten
 * eintragen: Davon hängen der sichtbare Vermerk „Medizinisch geprüft … Stand:“ und lastReviewed ab. null = noch nicht geprüft.
 */
export const PRUEFDATUM: Record<BehandlungSlug, string | null> = {
  faltenbehandlung: null,
  zornesfalte: null,
  stirnfalten: null,
  kraehenfuesse: null,
  "lip-flip": null,
  "gummy-smile": null,
  "bunny-lines": null,
  "brow-lift": null,
  nasenverschmaelerung: null,
  erdbeerkinn: null,
  "haengende-mundwinkel": null,
  lippenfaeltchen: null,
  "nasenspitze-anheben": null,
  "kaumuskel-masseter": null,
  "nefertiti-lift": null,
  trapezius: null,
  "lachs-dna-polynukleotide": null,
  hyperhidrose: null,
};
