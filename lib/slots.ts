import { addDaysKey, berlinDateKey, berlinParts, berlinTimeLabel, dateKeysBetween, fromBerlinKey, toBerlinIso } from "./time";

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

export const LEAD_HOURS = 2;
export const RANGE_DAYS = 42; // 6 Wochen
/** Nachtregel: Termine vor dieser Uhrzeit sind nur bis zum Abend davor buchbar */
export const EARLY_HOUR = 10;
export const EVENING_CUTOFF = "23:00";

/** Buchbarer Zeitraum: ab jetzt plus 2 Stunden Vorlauf bis 6 Wochen voraus. Nur der Server legt das fest. */
export function bookingRange(now: Date = new Date()): { from: Date; to: Date } {
  return {
    from: new Date(now.getTime() + LEAD_HOURS * 3600000),
    to: new Date(now.getTime() + RANGE_DAYS * 86400000),
  };
}

/**
 * Darf ein Termin mit diesem Beginn jetzt noch gebucht werden? Vorlauf 2 Stunden, Horizont 6 Wochen, Nachtregel:
 * Beginn vor 10:00 Uhr Berliner Zeit nur bis 23:00 Uhr am Vorabend, danach nicht mehr, auch nicht am selben Morgen.
 * Alles in Europe/Berlin, auch über die Zeitumstellung.
 */
export function isBookableStart(start: Date, now: Date = new Date()): boolean {
  const { from, to } = bookingRange(now);
  if (start.getTime() < from.getTime() || start.getTime() > to.getTime()) return false;
  if (berlinParts(start).hour < EARLY_HOUR) {
    const cutoff = fromBerlinKey(addDaysKey(berlinDateKey(start), -1), EVENING_CUTOFF);
    if (now.getTime() >= cutoff.getTime()) return false;
  }
  return true;
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

/*
 * Anschlusszeiten (Auftrag Dr. Vogel, 9. Oktober 2026): Zusätzlich zum Raster der vollen und halben Stunden wird direkt am
 * Ende jedes eigenen Termins aus der Buchungsdatenbank eine Startzeit angeboten (online gebucht, Walk-in, vom Studio
 * verschoben), wenn dieses Ende nicht ohnehin im Raster liegt. Private Kalendereinträge blockieren nur, sie sind nie
 * Anknüpfungspunkt. Kein Puffer, keine Lückenregel, keine Zeiten vor einem Termin. Enden außerhalb des
 * 10-Minuten-Rasters der Belegung (zum Beispiel ein Walk-in bis 14:37) werden auf die nächste Einheit aufgerundet (14:40).
 */
export const ANCHOR_UNIT_MINUTES = 10;

/** Anschlusszeiten aus den Enden eigener Termine, ohne Zeiten, die im Raster liegen; aufsteigend, ohne Doppelte. */
export function anchorStarts(booked: Interval[], stepMinutes: number): number[] {
  const unit = ANCHOR_UNIT_MINUTES * 60000;
  const step = stepMinutes * 60000;
  const out = new Set<number>();
  for (const b of booked) {
    const t = Math.ceil(b.end / unit) * unit;
    if (t % step !== 0) out.add(t);
  }
  return [...out].sort((a, b) => a - b);
}

/** Darf eine Startzeit gewählt werden: im Raster oder eine Anschlusszeit? (Prüfung beim Absenden; frei prüft die Buchung danach) */
export function isOfferedStart(start: Date, stepMinutes: number, anchors: number[]): boolean {
  const t = start.getTime();
  return t % (stepMinutes * 60000) === 0 || anchors.includes(t);
}

export interface SlotInput {
  windows: Interval[];
  busy: Interval[];
  /** Anschlusszeiten (anchorStarts); werden zusätzlich zum Raster angeboten, wenn frei */
  anchors?: number[];
  durationMinutes: number;
  bufferMinutes: number;
  stepMinutes: number;
  from: Date;
  to: Date;
  /** Jetzt, für Vorlauf und Nachtregel; ohne Angabe die Systemzeit */
  now?: Date;
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
  if (!isBookableStart(start, input.now ?? new Date(input.from.getTime() - LEAD_HOURS * 3600000))) return false;
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
  const now = input.now ?? new Date(fromMs - LEAD_HOURS * 3600000);

  const byDay = new Map<string, Slot[]>();
  const daysWithWindows = new Set<string>();

  for (const w of windows) {
    const wStart = Math.max(w.start, fromMs);
    const wEnd = Math.min(w.end, toMs);
    if (wEnd <= wStart) continue;
    // Tage, an denen das Fenster liegt (auch wenn nichts frei ist)
    for (const k of dateKeysBetween(berlinDateKey(new Date(wStart)), berlinDateKey(new Date(wEnd - 1)))) daysWithWindows.add(k);
    // Raster: Berliner Versätze sind volle Stunden, daher reicht die Ausrichtung auf Weltzeit
    const add = (t: number) => {
      const block: Interval = { start: t, end: t + needMs };
      if (busy.some((b) => overlaps(block, b))) return;
      const d = new Date(t);
      if (!isBookableStart(d, now)) return;
      const key = berlinDateKey(d);
      const list = byDay.get(key) ?? [];
      list.push({ start: toBerlinIso(d), time: berlinTimeLabel(d) });
      byDay.set(key, list);
    };
    for (let t = Math.ceil(wStart / stepMs) * stepMs; t + needMs <= wEnd; t += stepMs) add(t);
    // Anschlusszeiten im selben Fenster, nach denselben Regeln
    for (const a of input.anchors ?? []) if (a >= wStart && a + needMs <= wEnd && a % stepMs !== 0) add(a);
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
