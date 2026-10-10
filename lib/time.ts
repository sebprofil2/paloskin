/*
 * Zeitrechnung ausschließlich in Europe/Berlin, nie mit festem Versatz.
 * Sommer- und Winterzeit werden über Intl ermittelt (Umstellung am 25. Oktober 2026).
 */
export const TZ = "Europe/Berlin";

export interface BerlinParts {
  year: number;
  month: number; // 1 bis 12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });

const pad = (n: number) => String(n).padStart(2, "0");

/** Wanduhrzeit in Berlin für einen Zeitpunkt. */
export function berlinParts(d: Date): BerlinParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(d)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour === 24 ? 0 : out.hour,
    minute: out.minute,
    second: out.second,
  };
}

/** Tag in Berlin als JJJJ-MM-TT. */
export function berlinDateKey(d: Date): string {
  const p = berlinParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Uhrzeit in Berlin als HH:MM. */
export function berlinTimeLabel(d: Date): string {
  const p = berlinParts(d);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Versatz von Berlin gegenüber Weltzeit in Minuten zu einem Zeitpunkt (60 im Winter, 120 im Sommer). */
export function berlinOffsetMinutes(d: Date): number {
  const p = berlinParts(d);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - d.getTime()) / 60000);
}

/** Zeitpunkt aus Berliner Wanduhrzeit. Bei der Umstellung im Herbst gilt die erste (Sommerzeit-) Lesart. */
export function fromBerlin(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const off1 = berlinOffsetMinutes(new Date(guess));
  let candidate = guess - off1 * 60000;
  const off2 = berlinOffsetMinutes(new Date(candidate));
  if (off2 !== off1) {
    const second = guess - off2 * 60000;
    // Die Lesart gewinnt, deren Wanduhrzeit wieder die gewünschte ergibt; sonst die frühere.
    const okFirst = sameWall(new Date(candidate), hour, minute);
    const okSecond = sameWall(new Date(second), hour, minute);
    if (!okFirst && okSecond) candidate = second;
    else if (okFirst && okSecond) candidate = Math.min(candidate, second);
  }
  return new Date(candidate);
}

function sameWall(d: Date, hour: number, minute: number): boolean {
  const p = berlinParts(d);
  return p.hour === hour && p.minute === minute;
}

/** Zeitpunkt aus Tagesschlüssel und HH:MM in Berlin. */
export function fromBerlinKey(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return fromBerlin(y, m, d, h, min);
}

/** ISO-Zeichenkette mit Berliner Versatz, zum Beispiel 2026-10-26T10:00:00+01:00. */
export function toBerlinIso(d: Date): string {
  const p = berlinParts(d);
  const off = berlinOffsetMinutes(d);
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Tagesschlüssel um n Tage verschieben. */
export function addDaysKey(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n, 12));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Mittag (Weltzeit) eines Tagesschlüssels, nur zum Formatieren von Tagesnamen. */
export function keyToNoonUtc(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00Z`);
}

/** Wochentag in Berlin: 0 Sonntag bis 6 Samstag. */
export function berlinWeekday(dateKey: string): number {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names.indexOf(weekdayFormatter.format(keyToNoonUtc(dateKey)));
}

/** Alle Tagesschlüssel von einschließlich a bis einschließlich b. */
export function dateKeysBetween(a: string, b: string): string[] {
  const out: string[] = [];
  let k = a;
  while (k <= b) {
    out.push(k);
    k = addDaysKey(k, 1);
  }
  return out;
}

/** Deutsche Darstellung eines Zeitpunkts für Kalenderbeschreibungen. */
export function formatBerlinDe(d: Date): string {
  const date = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
  return `${date}, ${berlinTimeLabel(d)} Uhr`;
}
