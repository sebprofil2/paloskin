/* Behandlungen, Preise (brutto) und Auswahl. Preise aus dem Entwurf Version 26. */
export const PRICES = {
  z1: 120,
  z2: 210,
  z3: 300,
  extra: 80,
  kaumuskel: 280,
  nefertiti: 280,
  achsel: 480,
  lachs: 280,
  lachsPack: 1000,
} as const;

export const EXTRA_ZONE_COUNT = 8;

/* Namen der zusätzlichen Zonen auf Deutsch, für die Kalenderbeschreibung */
export const EXTRA_ZONES_DE = [
  "Lip Flip",
  "Brow Lift",
  "Mundwinkel",
  "Erdbeerkinn",
  "Gummy Smile",
  "Oberlippenfältchen",
  "Bunny Lines",
  "Nasenverschmälerung",
] as const;

export type Zones = "z1" | "z2" | "z3";
export type Lachs = "single" | "pack";
export type Visit = "first" | "return";
export type Lang = "de" | "en" | "es" | "fr" | "pt";

export interface Selection {
  visit: Visit | null;
  checkup: boolean;
  beratung: boolean;
  zones: Zones | null;
  extras: number[];
  otherZone: string | null;
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
  zones: null,
  extras: [],
  otherZone: null,
  kaumuskel: false,
  nefertiti: false,
  achsel: false,
  lachs: null,
  note: "",
});

/** Botulinum im weiteren Sinn: Zonen, andere Zone, Kaumuskel, Nefertiti-Lift, Schwitzen. */
export function hasBotulinum(s: Selection): boolean {
  return !!s.zones || s.extras.length > 0 || s.otherZone !== null || s.kaumuskel || s.nefertiti || s.achsel;
}

export function hasTreatment(s: Selection): boolean {
  return hasBotulinum(s) || !!s.lachs;
}

export interface LineItem {
  label: string;
  price: number;
}

const ZONE_LABEL_DE: Record<Zones, string> = { z1: "1 Zone", z2: "2 Zonen", z3: "3 Zonen" };

/** Deutsche Positionen für Studio und Kalender. */
export function lineItemsDe(s: Selection): LineItem[] {
  const out: LineItem[] = [];
  if (s.zones) out.push({ label: `Botulinum, ${ZONE_LABEL_DE[s.zones]}`, price: PRICES[s.zones] });
  for (const i of s.extras) {
    const name = EXTRA_ZONES_DE[i];
    if (name) out.push({ label: `Zusätzliche Zone: ${name}`, price: PRICES.extra });
  }
  if (s.otherZone !== null) out.push({ label: `Zusätzliche Zone: ${s.otherZone.trim() || "Andere Zone, noch nicht benannt"}`, price: PRICES.extra });
  if (s.kaumuskel) out.push({ label: "Kaumuskel", price: PRICES.kaumuskel });
  if (s.nefertiti) out.push({ label: "Nefertiti-Lift", price: PRICES.nefertiti });
  if (s.achsel) out.push({ label: "Übermäßiges Schwitzen, Hyperhidrose unter den Achseln", price: PRICES.achsel });
  if (s.lachs === "single") out.push({ label: "Lachs-DNA, eine Behandlung", price: PRICES.lachs });
  if (s.lachs === "pack") out.push({ label: "Lachs-DNA Viererpaket", price: PRICES.lachsPack });
  return out;
}

export function totalPrice(s: Selection): number {
  return lineItemsDe(s).reduce((a, x) => a + x.price, 0);
}
