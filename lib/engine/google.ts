import { JWT } from "google-auth-library";
import { readEnv } from "../env";
import { errorClass, logEvent } from "../log";
import { bookingRange, computeSlots, isStartFree, type Interval } from "../slots";
import { toBerlinIso } from "../time";
import { SlotsUnavailableError, type BookingEngine, type CalendarEventInput, type ExportedEvent, type SlotsResult } from "./types";

/*
 * Echter Motor: Google Calendar API über ein Dienstkonto. Alle Zugriffe nur hier, auf dem Server.
 *   Palo Skin offen (CALENDAR_OPEN_ID): Zeitfenster lesen, singleEvents, ganztägige Einträge ignorieren
 *   Belegt (CALENDAR_BUSY_IDS): nur frei/belegt über freebusy; ein Fehler gilt nie als frei
 *   Palo Skin Termine (CALENDAR_BOOKINGS_ID): Einträge anlegen, ohne Gäste, ohne Einladungen
 * Reservierung und Buchungsstand liegen in der Datenbank; der Kalender ist die Sicht des Arztes auf den Tag.
 */

const API = "https://www.googleapis.com/calendar/v3";
const READ_TIMEOUT_MS = 10000;
const WRITE_TIMEOUT_MS = 15000;

interface GEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  created?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  transparency?: string;
  extendedProperties?: { private?: Record<string, string> };
}

class GoogleError extends Error {
  constructor(message: string, readonly status?: number, readonly kind: "timeout" | "network" | "http" = "http") {
    super(message);
    this.name = "GoogleError";
  }
}

export class GoogleCalendarEngine implements BookingEngine {
  readonly name = "google" as const;
  private jwt: JWT | null = null;

  private client(): JWT {
    if (!this.jwt) {
      const g = readEnv().google;
      if (!g.serviceAccountEmail || !g.privateKey || !g.calendarOpenId || !g.calendarBookingsId || !g.calendarBusyIds.length) {
        throw new SlotsUnavailableError("Google-Zugang unvollständig konfiguriert");
      }
      this.jwt = new JWT({ email: g.serviceAccountEmail, key: g.privateKey, scopes: ["https://www.googleapis.com/auth/calendar"] });
    }
    return this.jwt;
  }

  private async call<T>(method: string, path: string, body?: unknown, timeout = READ_TIMEOUT_MS): Promise<T> {
    const token = await this.client().getAccessToken();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    let res: Response;
    try {
      res = await fetch(`${API}${path}`, {
        method,
        headers: { authorization: `Bearer ${token.token}`, "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
        cache: "no-store",
      });
    } catch (e) {
      clearTimeout(timer);
      const aborted = e instanceof Error && e.name === "AbortError";
      throw new GoogleError(aborted ? "Zeitüberschreitung" : "Keine Verbindung", undefined, aborted ? "timeout" : "network");
    }
    clearTimeout(timer);
    if (res.status === 204) return undefined as T;
    if (!res.ok) {
      throw new GoogleError(`Google ${res.status}`, res.status);
    }
    return (await res.json()) as T;
  }

  private bookingsPath(suffix = ""): string {
    return `/calendars/${encodeURIComponent(readEnv().google.calendarBookingsId)}/events${suffix}`;
  }

  private async listEvents(calendarId: string, from: Date, to: Date, extra: Record<string, string> = {}): Promise<GEvent[]> {
    const items: GEvent[] = [];
    let pageToken: string | undefined;
    do {
      const q = new URLSearchParams({
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "2500",
        ...extra,
      });
      if (pageToken) q.set("pageToken", pageToken);
      const page = await this.call<{ items?: GEvent[]; nextPageToken?: string }>("GET", `/calendars/${encodeURIComponent(calendarId)}/events?${q}`);
      items.push(...(page.items ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return items.filter((e) => e.status !== "cancelled");
  }

  /** Zeitfenster aus „Palo Skin offen“. Ganztägige Einträge schalten nie etwas frei. */
  private async openWindows(from: Date, to: Date): Promise<Interval[]> {
    const g = readEnv().google;
    const events = await this.listEvents(g.calendarOpenId, from, to);
    const out: Interval[] = [];
    for (const e of events) {
      if (!e.start?.dateTime || !e.end?.dateTime) continue; // ganztägig oder unvollständig
      const s = Date.parse(e.start.dateTime);
      const en = Date.parse(e.end.dateTime);
      if (Number.isFinite(s) && Number.isFinite(en) && en > s) out.push({ start: s, end: en });
    }
    return out;
  }

  /** Belegte Zeiten aller Kalender in CALENDAR_BUSY_IDS. Jeder Fehler gilt als nicht verfügbar. */
  private async busyTimes(from: Date, to: Date): Promise<Interval[]> {
    const g = readEnv().google;
    const res = await this.call<{ calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }> }>(
      "POST",
      "/freeBusy",
      { timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: "Europe/Berlin", items: g.calendarBusyIds.map((id) => ({ id })) },
    );
    const out: Interval[] = [];
    for (const id of g.calendarBusyIds) {
      const cal = res.calendars?.[id];
      if (!cal || (cal.errors && cal.errors.length)) {
        throw new SlotsUnavailableError(`Frei/belegt für Kalender nicht lesbar: ${id}`);
      }
      for (const b of cal.busy ?? []) out.push({ start: Date.parse(b.start), end: Date.parse(b.end) });
    }
    return out;
  }

  async getSlots(input: { durationMinutes: number; now?: Date; extraBusy?: Interval[] }): Promise<SlotsResult> {
    const env = readEnv();
    const { from, to } = bookingRange(input.now);
    try {
      const [windows, busy] = await Promise.all([this.openWindows(from, to), this.busyTimes(from, to)]);
      const days = computeSlots({
        windows,
        busy: [...busy, ...(input.extraBusy ?? [])],
        durationMinutes: input.durationMinutes,
        bufferMinutes: env.bufferMinutes,
        stepMinutes: env.stepMinutes,
        from,
        to,
        now: input.now ?? new Date(),
      });
      return { days, from: toBerlinIso(from), to: toBerlinIso(to) };
    } catch (e) {
      logEvent("error", "google_slots_failed", { engine: "google", errorClass: errorClass(e), httpStatus: e instanceof GoogleError ? (e.status ?? 0) : 0 });
      throw new SlotsUnavailableError("Freie Zeiten nicht lesbar");
    }
  }

  /** Unmittelbar vor dem Reservieren: offenes Fenster und frei laut freebusy. Nicht lesbar heißt nie „frei“, sondern Fehler. */
  async isStartFree(input: { start: Date; durationMinutes: number; now?: Date }): Promise<boolean> {
    const env = readEnv();
    const { from, to } = bookingRange(input.now);
    const endMs = input.start.getTime() + input.durationMinutes * 60000;
    const dayBefore = new Date(input.start.getTime() - 86400000);
    const dayAfter = new Date(endMs + 86400000);
    try {
      const [windows, busy] = await Promise.all([this.openWindows(dayBefore, dayAfter), this.busyTimes(dayBefore, dayAfter)]);
      return isStartFree(input.start, { windows, busy, durationMinutes: input.durationMinutes, bufferMinutes: env.bufferMinutes, from, to, now: input.now ?? new Date() });
    } catch (e) {
      logEvent("error", "google_check_failed", { engine: "google", errorClass: errorClass(e), httpStatus: e instanceof GoogleError ? (e.status ?? 0) : 0 });
      throw new SlotsUnavailableError("Kalender nicht lesbar");
    }
  }

  /** Eintragen, als belegt, ohne Gäste. Fehler gehen an den Aufrufer, der den Eintrag später nachholt. */
  async createEvent(i: CalendarEventInput): Promise<string> {
    const body = {
      summary: i.title,
      description: i.description,
      start: { dateTime: toBerlinIso(i.start), timeZone: "Europe/Berlin" },
      end: { dateTime: toBerlinIso(i.end), timeZone: "Europe/Berlin" },
      transparency: "opaque",
      extendedProperties: { private: { bookingRef: i.reference, status: "confirmed", service: i.serviceCode, reminder: i.reminder ? "ja" : "nein" } },
      reminders: { useDefault: true },
    };
    const created = await this.call<GEvent>("POST", this.bookingsPath("?sendUpdates=none"), body, WRITE_TIMEOUT_MS);
    return created.id;
  }

  async findEventIdByRef(reference: string): Promise<string | null> {
    const q = new URLSearchParams({ privateExtendedProperty: `bookingRef=${reference}`, singleEvents: "true", maxResults: "5", showDeleted: "false" });
    const page = await this.call<{ items?: GEvent[] }>("GET", this.bookingsPath(`?${q}`));
    return (page.items ?? []).find((e) => e.status !== "cancelled")?.id ?? null;
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.call<void>("DELETE", this.bookingsPath(`/${encodeURIComponent(eventId)}?sendUpdates=none`), undefined, WRITE_TIMEOUT_MS);
    } catch (e) {
      // Schon gelöscht oder nie geschrieben: Ziel erreicht
      if (e instanceof GoogleError && (e.status === 404 || e.status === 410)) return;
      throw e;
    }
  }

  async exportEvents(from: Date, to: Date): Promise<ExportedEvent[]> {
    const events = await this.listEvents(readEnv().google.calendarBookingsId, from, to);
    return events
      .filter((e) => e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({ id: e.id, summary: e.summary ?? "", description: e.description ?? "", start: new Date(e.start!.dateTime!), end: new Date(e.end!.dateTime!) }));
  }

  async appendDescription(eventId: string, line: string): Promise<void> {
    const ev = await this.call<GEvent>("GET", this.bookingsPath(`/${encodeURIComponent(eventId)}`));
    const description = `${ev.description ?? ""}\n${line}`.trim();
    await this.call<GEvent>("PATCH", this.bookingsPath(`/${encodeURIComponent(eventId)}?sendUpdates=none`), { description }, WRITE_TIMEOUT_MS);
  }
}
