/* Behandlungen, Preise (brutto) und Auswahl. Preise aus dem Entwurf Version 26, Zonenlogik vom 1. Oktober 2026. */
export const PRICES = {
  zone1: 120,
  zone2: 210,
  zone3: 300,
  zoneMore: 80,
  kaumuskel: 280,
  nefertiti: 280,
  achsel: 480,
  lachs: 280,
  lachsPack: 1000,
} as const;

/* Alle Zonen gleichwertig, Reihenfolge wie in der Oberfläche */
export const ZONE_IDS = [
  "zornesfalte",
  "stirn",
  "kraehenfuesse",
  "browlift",
  "lipflip",
  "bunnylines",
  "mundwinkel",
  "erdbeerkinn",
  "gummysmile",
  "oberlippe",
  "nase",
] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

/* Namen auf Deutsch, für Kalenderbeschreibung und WhatsApp-Nachricht an das Studio */
export const ZONE_NAMES_DE: Record<ZoneId, string> = {
  zornesfalte: "Zornesfalte",
  stirn: "Stirn",
  kraehenfuesse: "Krähenfüße",
  browlift: "Brow Lift",
  lipflip: "Lip Flip",
  bunnylines: "Bunny Lines",
  mundwinkel: "Mundwinkel",
  erdbeerkinn: "Erdbeerkinn",
  gummysmile: "Gummy Smile",
  oberlippe: "Oberlippenfältchen",
  nase: "Nasenverschmälerung",
};

export type Lachs = "single" | "pack";
export type Visit = "first" | "return";
export type Lang = "de" | "en" | "es" | "fr" | "pt";

export interface Selection {
  visit: Visit | null;
  checkup: boolean;
  beratung: boolean;
  /** angetippte Zonen */
  zones: ZoneId[];
  /** „Sonstiges“: null = nicht gewählt, sonst der Freitext (darf leer sein) */
  otherZone: string | null;
  /** „Weiß ich noch nicht“: Botulinum gewünscht, Zonen offen */
  zonesUnknown: boolean;
  kaumuskel: boolean;
  nefertiti: boolean;
  achsel: boolean;
  lachs: Lachs | null;
  note: string;
}

export const emptySelection = (): Selection => ({
  visit: null,
  checkup: false,
  beratung: false,
  zones: [],
  otherZone: null,
  zonesUnknown: false,
  kaumuskel: false,
  nefertiti: false,
  achsel: false,
  lachs: null,
  note: "",
});

/** Anzahl gewählter Zonen einschließlich „Sonstiges“. */
export function zoneCount(s: Pick<Selection, "zones" | "otherZone">): number {
  return s.zones.length + (s.otherZone !== null ? 1 : 0);
}

/** Staffel: 1 Zone 120, 2 Zonen 210, 3 Zonen 300, jede weitere 80. */
export function zonePrice(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return PRICES.zone1;
  if (n === 2) return PRICES.zone2;
  return PRICES.zone3 + (n - 3) * PRICES.zoneMore;
}

/** Botulinum im weiteren Sinn: Zonen, Zonen offen, Kaumuskel, Nefertiti-Lift, Schwitzen. */
export function hasBotulinum(s: Selection): boolean {
  return zoneCount(s) > 0 || s.zonesUnknown || s.kaumuskel || s.nefertiti || s.achsel;
}

export function hasTreatment(s: Selection): boolean {
  return hasBotulinum(s) || !!s.lachs;
}

export interface LineItem {
  label: string;
  price: number;
}

/** Deutsche Zonenliste, zum Beispiel „Zornesfalte, Stirn, Sonstiges: Hals“. */
export function zoneListDe(s: Pick<Selection, "zones" | "otherZone">): string {
  const names = s.zones.map((z) => ZONE_NAMES_DE[z]);
  if (s.otherZone !== null) names.push(s.otherZone.trim() ? `Sonstiges: ${s.otherZone.trim()}` : "Sonstiges");
  return names.join(", ");
}

/** Deutsche Positionen für Studio und Kalender. */
export function lineItemsDe(s: Selection): LineItem[] {
  const out: LineItem[] = [];
  const n = zoneCount(s);
  if (n > 0) out.push({ label: `Botulinum, ${n} ${n === 1 ? "Zone" : "Zonen"}: ${zoneListDe(s)}`, price: zonePrice(n) });
  else if (s.zonesUnknown) out.push({ label: "Botulinum, Zonen noch offen", price: 0 });
  if (s.kaumuskel) out.push({ label: "Kaumuskel", price: PRICES.kaumuskel });
  if (s.nefertiti) out.push({ label: "Nefertiti-Lift", price: PRICES.nefertiti });
  if (s.achsel) out.push({ label: "Übermäßiges Schwitzen (Hyperhidrose)", price: PRICES.achsel });
  if (s.lachs === "single") out.push({ label: "Lachs-DNA, eine Behandlung", price: PRICES.lachs });
  if (s.lachs === "pack") out.push({ label: "Lachs-DNA Viererpaket", price: PRICES.lachsPack });
  return out;
}

export function totalPrice(s: Selection): number {
  return lineItemsDe(s).reduce((a, x) => a + x.price, 0);
}
