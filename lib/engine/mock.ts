import { readEnv } from "../env";
import { bookingRefFor } from "../ref";
import { buildDescription } from "../booking-description";
import { logEvent } from "../log";
import { bookingRange, computeSlots, isStartFree, windowFromBerlin, type Interval, type SlotDay } from "../slots";
import { addDaysKey, berlinDateKey, berlinWeekday, dateKeysBetween, fromBerlinKey, toBerlinIso } from "../time";
import { NotImplementedError, SlotsUnavailableError, type BookInput, type BookResult, type BookingEngine, type BookingSummary, type SlotsResult } from "./types";

/*
 * Testmotor mit erfundenen freien Zeiten. Nichts wird in Google eingetragen.
 * Buchungen leben im Speicher der laufenden Instanz und blockieren dort weitere Buchungen.
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

interface StoredBooking extends BookingSummary {
  startMs: number;
  endMs: number;
  description: string;
}

const byRequest = new Map<string, StoredBooking>();

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
  for (const b of byRequest.values()) busy.push({ start: b.startMs, end: b.endMs });
  return { windows, busy, holidays };
}

export class MockEngine implements BookingEngine {
  readonly name = "mock" as const;

  async getSlots(input: { durationMinutes: number; now?: Date }): Promise<SlotsResult> {
    const env = readEnv();
    if (env.mockDown) throw new SlotsUnavailableError("Testmotor: Ausfall simuliert");
    const { from, to } = bookingRange(input.now);
    const { windows, busy, holidays } = windowsFor(from, to);
    const days: SlotDay[] = computeSlots({
      windows,
      busy,
      durationMinutes: input.durationMinutes,
      bufferMinutes: env.bufferMinutes,
      stepMinutes: env.stepMinutes,
      from,
      to,
    });
    // Der 3. Oktober erscheint wie im Entwurf als geschlossener Tag
    const toKey = berlinDateKey(to);
    for (const [key, why] of holidays) {
      if (key >= berlinDateKey(from) && key <= toKey && !days.some((d) => d.date === key)) days.push({ date: key, slots: [], holiday: why });
    }
    days.sort((a, b) => a.date.localeCompare(b.date));
    return { days, from: toBerlinIso(from), to: toBerlinIso(to) };
  }

  async book(i: BookInput): Promise<BookResult> {
    const env = readEnv();
    const existing = byRequest.get(i.requestId);
    if (existing) return { status: "booked", booking: strip(existing) };
    const { from, to } = bookingRange();
    const { windows, busy } = windowsFor(from, to);
    const free = isStartFree(i.start, { windows, busy, durationMinutes: i.durationMinutes, bufferMinutes: env.bufferMinutes, from, to });
    if (!free) return { status: "conflict" };
    const ref = bookingRefFor(i.requestId);
    const endMs = i.start.getTime() + i.durationMinutes * 60000;
    const description = buildDescription({ bookingRef: ref, selection: i.selection, durationMinutes: i.durationMinutes, customer: i.customer, lang: i.lang, consentAt: i.consentAt, reminder: i.reminder });
    const stored: StoredBooking = {
      ref,
      requestId: i.requestId,
      start: toBerlinIso(i.start),
      end: toBerlinIso(new Date(endMs)),
      durationMinutes: i.durationMinutes,
      startMs: i.start.getTime(),
      endMs,
      description,
    };
    byRequest.set(i.requestId, stored);
    logEvent("info", "mock_booked", { engine: "mock", bookingRef: ref, ms: i.durationMinutes });
    return { status: "booked", booking: strip(stored) };
  }

  async findByRequestId(requestId: string): Promise<BookingSummary | null> {
    const b = byRequest.get(requestId);
    return b ? strip(b) : null;
  }

  async addReferral(requestId: string, referral: string): Promise<boolean> {
    const b = byRequest.get(requestId);
    if (!b) return false;
    b.description += `\nEmpfehlung: ${referral}`;
    logEvent("info", "mock_referral_added", { engine: "mock", bookingRef: b.ref });
    return true;
  }

  async cancel(): Promise<void> {
    throw new NotImplementedError("Absagen");
  }

  async reschedule(): Promise<void> {
    throw new NotImplementedError("Verschieben");
  }
}

function strip(b: StoredBooking): BookingSummary {
  return { ref: b.ref, requestId: b.requestId, start: b.start, end: b.end, durationMinutes: b.durationMinutes };
}

/** Nur für Tests: Speicher leeren und Zeitpunkt für Fenster prüfen. */
export const mockInternals = {
  reset: () => byRequest.clear(),
  windowsFor,
  fromBerlinKey,
};
