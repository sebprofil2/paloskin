import { ZONE_IDS, ZONE_NAMES_DE, type Selection, type ZoneId } from "./treatments";

/*
 * Gemeinsame Codes mit dem Kundensystem (Fassung 4 des Bauauftrags, 2. Oktober 2026).
 * Intern bleiben BER, BOT, KAU, NEF, HYP, LDN, LDN4 und die deutschen Zonenkennungen; übersetzt wird nur beim
 * Schreiben eines Ereignisses. Einträge mit proposed: true sind Vorschläge, weil die Vorgabe keinen Code nennt;
 * sie gelten, bis das CRM-Projekt widerspricht (siehe docs/SCHNITTSTELLE-KUNDENSYSTEM.md).
 */
export interface CodeEntry {
  internal: string;
  shared: string;
  nameDe: string;
  proposed?: boolean;
}

export const SERVICE_CODE_TABLE: CodeEntry[] = [
  { internal: "BER", shared: "consultation", nameDe: "Beratung" },
  { internal: "BOT", shared: "botulinum", nameDe: "Botox-Behandlung (Zonen siehe zones)", proposed: true },
  { internal: "KAU", shared: "masseter", nameDe: "Kaumuskel" },
  { internal: "NEF", shared: "nefertiti", nameDe: "Nefertiti-Lift" },
  { internal: "HYP", shared: "hyperhidrosis_axilla", nameDe: "Übermäßiges Schwitzen (Achseln)" },
  { internal: "LDN", shared: "polynucleotides_eye", nameDe: "Lachs-DNA, eine Behandlung" },
  { internal: "LDN4", shared: "polynucleotides_eye_4", nameDe: "Lachs-DNA Viererpaket" },
  { internal: "KON", shared: "control", nameDe: "Kontrolltermin (appointment_type control)" },
];

export const ZONE_CODE_TABLE: (CodeEntry & { internal: ZoneId })[] = [
  { internal: "zornesfalte", shared: "glabella", nameDe: ZONE_NAMES_DE.zornesfalte },
  { internal: "stirn", shared: "forehead", nameDe: ZONE_NAMES_DE.stirn },
  { internal: "kraehenfuesse", shared: "crows_feet", nameDe: ZONE_NAMES_DE.kraehenfuesse },
  { internal: "browlift", shared: "brow_lift", nameDe: ZONE_NAMES_DE.browlift, proposed: true },
  { internal: "lipflip", shared: "lip_flip", nameDe: ZONE_NAMES_DE.lipflip, proposed: true },
  { internal: "bunnylines", shared: "bunny_lines", nameDe: ZONE_NAMES_DE.bunnylines, proposed: true },
  { internal: "mundwinkel", shared: "mouth_corners", nameDe: ZONE_NAMES_DE.mundwinkel, proposed: true },
  { internal: "erdbeerkinn", shared: "chin", nameDe: ZONE_NAMES_DE.erdbeerkinn, proposed: true },
  { internal: "gummysmile", shared: "gummy_smile", nameDe: ZONE_NAMES_DE.gummysmile, proposed: true },
  { internal: "oberlippe", shared: "upper_lip", nameDe: ZONE_NAMES_DE.oberlippe, proposed: true },
  { internal: "nase", shared: "nose", nameDe: ZONE_NAMES_DE.nase, proposed: true },
];

const serviceMap = new Map(SERVICE_CODE_TABLE.map((e) => [e.internal, e.shared]));
const zoneMap = new Map(ZONE_CODE_TABLE.map((e) => [e.internal, e.shared]));

// Jede Zone hat einen gemeinsamen Code; fehlt einer, bricht die Typprüfung hier
for (const z of ZONE_IDS) if (!zoneMap.has(z)) throw new Error(`Zone ohne gemeinsamen Code: ${z}`);

/** Interne Behandlungscodes (ohne Personen und Kontrolle) in gemeinsame Codes übersetzen. */
export function toSharedServiceCodes(internal: string[]): string[] {
  return internal.map((c) => {
    const s = serviceMap.get(c);
    if (!s) throw new Error(`Behandlungscode ohne Entsprechung: ${c}`);
    return s;
  });
}

export function toSharedZones(zones: Selection["zones"]): string[] {
  return zones.map((z) => zoneMap.get(z) as string);
}

export type AppointmentType = "control" | "first" | "follow_up";

export function appointmentType(input: { checkup: boolean; firstVisit: boolean }): AppointmentType {
  if (input.checkup) return "control";
  return input.firstVisit ? "first" : "follow_up";
}
