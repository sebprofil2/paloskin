import { readEnv } from "../env";
import { bookingRange, computeSlots, isStartFree, windowFromBerlin, type Interval, type SlotDay } from "../slots";
import { addDaysKey, berlinDateKey, berlinWeekday, dateKeysBetween, fromBerlinKey, toBerlinIso } from "../time";
import { ulid } from "../ulid";
import { SlotsUnavailableError, type BookingEngine, type CalendarEventInput, type ExportedEvent, type SlotsResult } from "./types";

/*
 * Testmotor mit erfundenen freien Zeiten. Nichts wird in Google eingetragen.
 * Kalendereinträge leben im Speicher der laufenden Instanz; Reservierungen liegen wie im Echtbetrieb in der Datenbank.
 * BOOKING_MOCK_DOWN=true simuliert einen Ausfall des Kalenders.
 */

/* Öffnungsfenster je Wochentag in Berliner Zeit, 0 Sonntag bis 6 Samstag */
const OPEN: Record<number, [string, string][]> = {
  0: [],
  1: [["10:00", "13:00"], ["16:00", "19:00"]],
  2: [["12:00", "15:30"]],
  3: [["17:00", "19:30"]],
  4: [["10:00", "13:00"]],
  5: [["14:00", "17:00"]],
  6: [["10:00", "13:00"]],
};

const CLOSED_DAYS: Record<string, "unity" | "other"> = {
  "2026-10-03": "unity",
  "2026-12-24": "other",
  "2026-12-25": "other",
  "2026-12-26": "other",
  "2026-12-31": "other",
  "2027-01-01": "other",
};

interface MockEvent {
  reference: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
}

const events = new Map<string, MockEvent>();

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* Erfundene belegte Zeiten: ein oder zwei halbe Stunden je Tag, deterministisch aus dem Datum */
function invented(dateKey: string, windows: Interval[]): Interval[] {
  const out: Interval[] = [];
  if (!windows.length) return out;
  const h = hash(dateKey);
  const n = 1 + (h % 2);
  for (let i = 0; i < n; i++) {
    const w = windows[(h >>> (3 + i * 4)) % windows.length];
    const halfHours = Math.max(1, Math.floor((w.end - w.start) / 1800000));
    const pick = (h >>> (7 + i * 5)) % halfHours;
    const start = w.start + pick * 1800000;
    out.push({ start, end: start + 1800000 });
  }
  return out;
}

function windowsFor(from: Date, to: Date): { windows: Interval[]; busy: Interval[]; holidays: Map<string, "unity"> } {
  const windows: Interval[] = [];
  const busy: Interval[] = [];
  const holidays = new Map<string, "unity">();
  const first = addDaysKey(berlinDateKey(from), -1);
  const last = addDaysKey(berlinDateKey(to), 1);
  for (const key of dateKeysBetween(first, last)) {
    const closed = CLOSED_DAYS[key];
    if (closed) {
      if (closed === "unity") holidays.set(key, "unity");
      continue;
    }
    const dayWindows = OPEN[berlinWeekday(key)].map(([a, b]) => windowFromBerlin(key, a, b));
    windows.push(...dayWindows);
    busy.push(...invented(key, dayWindows));
  }
  return { windows, busy, holidays };
}

function failIfDown(): void {
  if (readEnv().mockDown) throw new SlotsUnavailableError("Testmotor: Ausfall simuliert");
}

export class MockEngine implements BookingEngine {
  readonly name = "mock" as const;

  async getSlots(input: { durationMinutes: number; now?: Date; extraBusy?: Interval[] }): Promise<SlotsResult> {
    const env = readEnv();
    failIfDown();
    const { from, to } = bookingRange(input.now);
    const { windows, busy, holidays } = windowsFor(from, to);
    const days: SlotDay[] = computeSlots({
      windows,
      busy: [...busy, ...(input.extraBusy ?? [])],
      durationMinutes: input.durationMinutes,
      bufferMinutes: env.bufferMinutes,
      stepMinutes: env.stepMinutes,
      from,
      to,
      now: input.now ?? new Date(),
    });
    // Der 3. Oktober erscheint wie im Entwurf als geschlossener Tag
    const toKey = berlinDateKey(to);
    for (const [key, why] of holidays) {
      if (key >= berlinDateKey(from) && key <= toKey && !days.some((d) => d.date === key)) days.push({ date: key, slots: [], holiday: why });
    }
    days.sort((a, b) => a.date.localeCompare(b.date));
    return { days, from: toBerlinIso(from), to: toBerlinIso(to) };
  }

  async isStartFree(input: { start: Date; durationMinutes: number; now?: Date }): Promise<boolean> {
    const env = readEnv();
    failIfDown();
    const { from, to } = bookingRange(input.now);
    const { windows, busy } = windowsFor(from, to);
    return isStartFree(input.start, { windows, busy, durationMinutes: input.durationMinutes, bufferMinutes: env.bufferMinutes, from, to, now: input.now ?? new Date() });
  }

  async createEvent(input: CalendarEventInput): Promise<string> {
    failIfDown();
    const id = `mock-${ulid()}`;
    events.set(id, { reference: input.reference, title: input.title, description: input.description, start: input.start, end: input.end });
    return id;
  }

  async findEventIdByRef(reference: string): Promise<string | null> {
    failIfDown();
    for (const [id, e] of events) if (e.reference === reference) return id;
    return null;
  }

  async deleteEvent(eventId: string): Promise<void> {
    failIfDown();
    events.delete(eventId);
  }

  async exportEvents(from: Date, to: Date): Promise<ExportedEvent[]> {
    failIfDown();
    return [...events.entries()]
      .filter(([, e]) => e.end > from && e.start < to)
      .map(([id, e]) => ({ id, summary: e.title, description: e.description, start: e.start, end: e.end }));
  }

  async moveEvent(eventId: string, start: Date, end: Date): Promise<void> {
    failIfDown();
    const e = events.get(eventId);
    if (!e) throw new Error("Eintrag nicht gefunden");
    e.start = start;
    e.end = end;
  }

  async appendDescription(eventId: string, line: string): Promise<void> {
    failIfDown();
    const e = events.get(eventId);
    if (!e) throw new Error("Eintrag nicht gefunden");
    e.description = `${e.description}\n${line}`;
  }
}

/** Nur für Tests: Speicher leeren und Zeitpunkt für Fenster prüfen. */
export const mockInternals = {
  reset: () => events.clear(),
  events,
  windowsFor,
  fromBerlinKey,
};
