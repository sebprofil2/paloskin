import type { Lang } from "./i18n";
import type { PreisKey } from "./preise";

/*
 * Behandlungsseiten /behandlungen/<name> (Gerüst vom 10. Oktober 2026). Vorerst Platzhaltertext; die geprüften Texte
 * kommen später je Seite und Sprache in „inhalt“. Freigabe je Seite und Sprache in lib/freigabe.ts, Prüfdatum in
 * lib/studio.ts, Preise in lib/treatments.ts. Ohne Abhängigkeiten zu Server oder Browser.
 */
export const BEHANDLUNG_SLUGS = [
  "faltenbehandlung",
  "zornesfalte",
  "stirnfalten",
  "kraehenfuesse",
  "lip-flip",
  "gummy-smile",
  "bunny-lines",
  "brow-lift",
  "nasenverschmaelerung",
  "erdbeerkinn",
  "haengende-mundwinkel",
  "lippenfaeltchen",
  "nasenspitze-anheben",
  "kaumuskel-masseter",
  "nefertiti-lift",
  "trapezius",
  "lachs-dna-polynukleotide",
  "hyperhidrose",
] as const;
export type BehandlungSlug = (typeof BEHANDLUNG_SLUGS)[number];

export function isBehandlung(v: string): v is BehandlungSlug {
  return (BEHANDLUNG_SLUGS as readonly string[]).includes(v);
}

/** Abschnitte mit Fragen als Zwischenüberschriften, in dieser Reihenfolge */
export const ABSCHNITTE = ["fuerWen", "grenzen", "ablauf", "risiken", "kosten", "danach"] as const;
export type Abschnitt = (typeof ABSCHNITTE)[number];

export type Inhalt = {
  /** Überschrift: erster Teil gerade, zweiter Teil kursiv */
  titelA: string;
  titelB: string;
  /** Beschreibung für Suchmaschinen und Linkvorschau */
  beschreibung: string;
  kurzantwort: string;
  abschnitte: Record<Abschnitt, string[]>;
  fragen: [string, string][];
  quellen: { titel: string; url?: string }[];
};

export type Behandlung = {
  /** Name auf Deutsch, auch für die strukturierten Daten (MedicalProcedure) */
  name: string;
  /** Preis aus PRICES; ab = „ab …“ (Zonen, Lachs-DNA); null = noch kein Richtwert */
  preis: { key: PreisKey; ab: boolean } | null;
  passend: BehandlungSlug[];
  /** Geprüfte Texte je Sprache; fehlt eine Sprache, gilt der Platzhalter */
  inhalt: Partial<Record<Lang, Inhalt>>;
};

const zone = { key: "zone1", ab: true } as const;

export const BEHANDLUNGEN: Record<BehandlungSlug, Behandlung> = {
  faltenbehandlung: { name: "Faltenbehandlung", preis: zone, passend: ["zornesfalte", "stirnfalten", "kraehenfuesse"], inhalt: {} },
  zornesfalte: { name: "Zornesfalte", preis: zone, passend: ["stirnfalten", "kraehenfuesse", "faltenbehandlung"], inhalt: {} },
  stirnfalten: { name: "Stirnfalten", preis: zone, passend: ["zornesfalte", "brow-lift", "faltenbehandlung"], inhalt: {} },
  kraehenfuesse: { name: "Krähenfüße", preis: zone, passend: ["zornesfalte", "stirnfalten", "faltenbehandlung"], inhalt: {} },
  "lip-flip": { name: "Lip Flip", preis: zone, passend: ["gummy-smile", "lippenfaeltchen", "faltenbehandlung"], inhalt: {} },
  "gummy-smile": { name: "Gummy Smile", preis: zone, passend: ["lip-flip", "nasenspitze-anheben", "faltenbehandlung"], inhalt: {} },
  "bunny-lines": { name: "Bunny Lines", preis: zone, passend: ["nasenverschmaelerung", "zornesfalte", "faltenbehandlung"], inhalt: {} },
  "brow-lift": { name: "Brow Lift", preis: zone, passend: ["stirnfalten", "kraehenfuesse", "faltenbehandlung"], inhalt: {} },
  nasenverschmaelerung: { name: "Nasenverschmälerung", preis: zone, passend: ["nasenspitze-anheben", "bunny-lines", "faltenbehandlung"], inhalt: {} },
  erdbeerkinn: { name: "Erdbeerkinn", preis: zone, passend: ["haengende-mundwinkel", "nefertiti-lift", "faltenbehandlung"], inhalt: {} },
  "haengende-mundwinkel": { name: "Hängende Mundwinkel", preis: zone, passend: ["erdbeerkinn", "nefertiti-lift", "faltenbehandlung"], inhalt: {} },
  lippenfaeltchen: { name: "Lippenfältchen", preis: zone, passend: ["lip-flip", "haengende-mundwinkel", "faltenbehandlung"], inhalt: {} },
  "nasenspitze-anheben": { name: "Nasenspitze anheben", preis: null, passend: ["nasenverschmaelerung", "gummy-smile", "faltenbehandlung"], inhalt: {} },
  "kaumuskel-masseter": { name: "Kaumuskel (Masseter)", preis: { key: "kaumuskel", ab: false }, passend: ["trapezius", "nefertiti-lift", "faltenbehandlung"], inhalt: {} },
  "nefertiti-lift": { name: "Nefertiti-Lift", preis: { key: "nefertiti", ab: false }, passend: ["haengende-mundwinkel", "kaumuskel-masseter", "faltenbehandlung"], inhalt: {} },
  trapezius: { name: "Trapezius", preis: null, passend: ["kaumuskel-masseter", "nefertiti-lift", "faltenbehandlung"], inhalt: {} },
  "lachs-dna-polynukleotide": { name: "Lachs-DNA (Polynukleotide)", preis: { key: "lachs", ab: true }, passend: ["faltenbehandlung", "kraehenfuesse", "lippenfaeltchen"], inhalt: {} },
  hyperhidrose: { name: "Hyperhidrose", preis: { key: "achsel", ab: false }, passend: ["kaumuskel-masseter", "trapezius", "faltenbehandlung"], inhalt: {} },
};

/** Platzhalter bis zum geprüften Text: deutlich als Platzhalter erkennbar, nur auf neu zu sehen */
function platzhalter(b: Behandlung): Inhalt {
  const p = ["Platzhalter. Der geprüfte Text folgt."];
  return {
    titelA: b.name,
    titelB: "in Berlin",
    beschreibung: `Platzhalter: ${b.name} bei PALO SKIN in Berlin Prenzlauer Berg. Der geprüfte Text folgt.`,
    kurzantwort: "Platzhalter für die Kurzantwort. Der geprüfte Text folgt.",
    abschnitte: { fuerWen: p, grenzen: p, ablauf: p, risiken: p, kosten: p, danach: p },
    fragen: [
      ["Platzhalter für eine häufige Frage?", "Platzhalter für die Antwort."],
      ["Platzhalter für eine zweite Frage?", "Platzhalter für die Antwort."],
    ],
    quellen: [{ titel: "Platzhalter für eine Quelle" }],
  };
}

/** Inhalt einer Seite in einer Sprache; ohne geprüften Text der Platzhalter */
export function inhalt(slug: BehandlungSlug, lang: Lang): Inhalt {
  const b = BEHANDLUNGEN[slug];
  return b.inhalt[lang] ?? b.inhalt.de ?? platzhalter(b);
}
