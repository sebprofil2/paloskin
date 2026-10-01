import { berlinDateKey, berlinTimeLabel, dateKeysBetween, fromBerlinKey, toBerlinIso } from "./time";

/* Zeitspannen in Millisekunden seit 1970 (Weltzeit) */
export interface Interval {
  start: number;
  end: number;
}

export interface Slot {
  /** Beginn mit Berliner Versatz, zum Beispiel 2026-10-26T10:00:00+01:00 */
  start: string;
  /** Uhrzeit in Berlin, HH:MM */
  time: string;
}

export interface SlotDay {
  /** Tag in Berlin, JJJJ-MM-TT */
  date: string;
  slots: Slot[];
  /** Tag hat offene Zeiten, aber keine freie Startzeit mehr */
  full?: boolean;
  /** Geschlossen, mit Grund für die Anzeige (derzeit nur „unity“ für den 3. Oktober) */
  holiday?: "unity";
}

export const LEAD_HOURS = 12;
export const RANGE_DAYS = 42; // 6 Wochen

/** Buchbarer Zeitraum: ab jetzt plus 12 Stunden Vorlauf bis 6 Wochen voraus. Nur der Server legt das fest. */
export function bookingRange(now: Date = new Date()): { from: Date; to: Date } {
  return {
    from: new Date(now.getTime() + LEAD_HOURS * 3600000),
    to: new Date(now.getTime() + RANGE_DAYS * 86400000),
  };
}

export function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = list.filter((x) => x.end > x.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const x of sorted) {
    const last = out[out.length - 1];
    if (last && x.start <= last.end) last.end = Math.max(last.end, x.end);
    else out.push({ ...x });
  }
  return out;
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export interface SlotInput {
  windows: Interval[];
  busy: Interval[];
  durationMinutes: number;
  bufferMinutes: number;
  stepMinutes: number;
  from: Date;
  to: Date;
}

/**
 * Eine Startzeit ist frei, wenn der komplette Termin samt Puffer in ein offenes Fenster passt
 * und sich mit keiner belegten Zeit überschneidet.
 */
export function isStartFree(start: Date, input: Omit<SlotInput, "stepMinutes">): boolean {
  const s = start.getTime();
  const need = (input.durationMinutes + input.bufferMinutes) * 60000;
  const e = s + need;
  if (s < input.from.getTime() || e > input.to.getTime()) return false;
  const inWindow = mergeIntervals(input.windows).some((w) => s >= w.start && e <= w.end);
  if (!inWindow) return false;
  const block: Interval = { start: s, end: e };
  return !input.busy.some((b) => overlaps(block, b));
}

/** Startzeiten im Raster, gruppiert nach Berliner Tag. */
export function computeSlots(input: SlotInput): SlotDay[] {
  const stepMs = input.stepMinutes * 60000;
  const needMs = (input.durationMinutes + input.bufferMinutes) * 60000;
  const windows = mergeIntervals(input.windows);
  const busy = mergeIntervals(input.busy);
  const fromMs = input.from.getTime();
  const toMs = input.to.getTime();

  const byDay = new Map<string, Slot[]>();
  const daysWithWindows = new Set<string>();

  for (const w of windows) {
    const wStart = Math.max(w.start, fromMs);
    const wEnd = Math.min(w.end, toMs);
    if (wEnd <= wStart) continue;
    // Tage, an denen das Fenster liegt (auch wenn nichts frei ist)
    for (const k of dateKeysBetween(berlinDateKey(new Date(wStart)), berlinDateKey(new Date(wEnd - 1)))) daysWithWindows.add(k);
    // Raster: Berliner Versätze sind volle Stunden, daher reicht die Ausrichtung auf Weltzeit
    let t = Math.ceil(wStart / stepMs) * stepMs;
    for (; t + needMs <= wEnd; t += stepMs) {
      const block: Interval = { start: t, end: t + needMs };
      if (busy.some((b) => overlaps(block, b))) continue;
      const d = new Date(t);
      const key = berlinDateKey(d);
      const list = byDay.get(key) ?? [];
      list.push({ start: toBerlinIso(d), time: berlinTimeLabel(d) });
      byDay.set(key, list);
    }
  }

  const out: SlotDay[] = [];
  for (const date of [...daysWithWindows].sort()) {
    const slots = (byDay.get(date) ?? []).sort((a, b) => a.start.localeCompare(b.start));
    // Doppelte Startzeiten vermeiden, falls sich Fenster überschneiden
    const seen = new Set<string>();
    const unique = slots.filter((s) => (seen.has(s.start) ? false : (seen.add(s.start), true)));
    out.push(unique.length ? { date, slots: unique } : { date, slots: [], full: true });
  }
  return out;
}

/** Hilfe: Fenster aus Tagesschlüssel und Uhrzeiten in Berlin. */
export function windowFromBerlin(dateKey: string, from: string, to: string): Interval {
  return { start: fromBerlinKey(dateKey, from).getTime(), end: fromBerlinKey(dateKey, to).getTime() };
}
