import { JWT } from "google-auth-library";
import { readEnv } from "../env";
import { bookingRefFor } from "../ref";
import { buildDescription, buildTitle, serviceCode } from "../booking-description";
import { errorClass, logEvent } from "../log";
import { notifyOwner } from "../notify";
import { bookingRange, computeSlots, isStartFree, type Interval } from "../slots";
import { toBerlinIso } from "../time";
import { NotImplementedError, SlotsUnavailableError, type BookInput, type BookResult, type BookingEngine, type BookingSummary, type SlotsResult } from "./types";

/*
 * Echter Motor: Google Calendar API über ein Dienstkonto. Alle Zugriffe nur hier, auf dem Server.
 *   Palo Skin offen (CALENDAR_OPEN_ID): Zeitfenster lesen, singleEvents, ganztägige Einträge ignorieren
 *   Belegt (CALENDAR_BUSY_IDS): nur frei/belegt über freebusy; ein Fehler gilt nie als frei
 *   Palo Skin Termine (CALENDAR_BOOKINGS_ID): Einträge anlegen, ohne Gäste, ohne Einladungen
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

  async getSlots(input: { durationMinutes: number; now?: Date }): Promise<SlotsResult> {
    const env = readEnv();
    const { from, to } = bookingRange(input.now);
    try {
      const [windows, busy] = await Promise.all([this.openWindows(from, to), this.busyTimes(from, to)]);
      const days = computeSlots({ windows, busy, durationMinutes: input.durationMinutes, bufferMinutes: env.bufferMinutes, stepMinutes: env.stepMinutes, from, to });
      return { days, from: toBerlinIso(from), to: toBerlinIso(to) };
    } catch (e) {
      logEvent("error", "google_slots_failed", { engine: "google", errorClass: errorClass(e), httpStatus: e instanceof GoogleError ? (e.status ?? 0) : 0 });
      throw new SlotsUnavailableError("Freie Zeiten nicht lesbar");
    }
  }

  /** Suche über die aus der Anfragekennung abgeleitete Buchungsnummer; die Kennung selbst steht nicht im Kalender */
  async findByRequestId(requestId: string): Promise<BookingSummary | null> {
    const ev = await this.findEventByRef(bookingRefFor(requestId));
    return ev ? toSummary(ev, requestId) : null;
  }

  private async findEventByRef(ref: string): Promise<GEvent | null> {
    const g = readEnv().google;
    const q = new URLSearchParams({ privateExtendedProperty: `bookingRef=${ref}`, singleEvents: "true", maxResults: "5", showDeleted: "false" });
    const page = await this.call<{ items?: GEvent[] }>("GET", `/calendars/${encodeURIComponent(g.calendarBookingsId)}/events?${q}`);
    return (page.items ?? []).find((e) => e.status !== "cancelled") ?? null;
  }

  private async findWithRetries(requestId: string, tries: number): Promise<BookingSummary | null> {
    for (let i = 0; i < tries; i++) {
      try {
        const found = await this.findByRequestId(requestId);
        if (found) return found;
      } catch (e) {
        logEvent("warn", "google_lookup_failed", { engine: "google", errorClass: errorClass(e) });
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return null;
  }

  async book(i: BookInput): Promise<BookResult> {
    const env = readEnv();
    const g = env.google;

    // 1. Gleiche Anfragekennung: vorhandene Buchung zurückgeben, kein zweites Ereignis
    const existing = await this.findByRequestId(i.requestId).catch(() => null);
    if (existing) return { status: "booked", booking: existing };

    // 2. Unmittelbar vor dem Eintragen: offenes Fenster und frei laut freebusy
    const { from, to } = bookingRange();
    const endMs = i.start.getTime() + i.durationMinutes * 60000;
    const dayBefore = new Date(i.start.getTime() - 86400000);
    const dayAfter = new Date(endMs + 86400000);
    const [windows, busy] = await Promise.all([this.openWindows(dayBefore, dayAfter), this.busyTimes(dayBefore, dayAfter)]);
    const free = isStartFree(i.start, { windows, busy, durationMinutes: i.durationMinutes, bufferMinutes: env.bufferMinutes, from, to });
    if (!free) return { status: "conflict" };

    // 3. Eintragen, als belegt, ohne Gäste. Buchungsnummer aus der Anfragekennung abgeleitet (Idempotenz)
    const ref = bookingRefFor(i.requestId);
    const end = new Date(endMs);
    const body = {
      summary: buildTitle(i.customer, i.testMode),
      description: buildDescription({ bookingRef: ref, selection: i.selection, durationMinutes: i.durationMinutes, customer: i.customer, lang: i.lang, consentAt: i.consentAt, reminder: i.reminder }),
      start: { dateTime: toBerlinIso(i.start), timeZone: "Europe/Berlin" },
      end: { dateTime: toBerlinIso(end), timeZone: "Europe/Berlin" },
      transparency: "opaque",
      extendedProperties: { private: { bookingRef: ref, status: "confirmed", service: serviceCode(i.selection), reminder: i.reminder ? "ja" : "nein" } },
      reminders: { useDefault: true },
    };
    let created: GEvent;
    try {
      created = await this.call<GEvent>("POST", `/calendars/${encodeURIComponent(g.calendarBookingsId)}/events?sendUpdates=none`, body, WRITE_TIMEOUT_MS);
    } catch (e) {
      const ge = e instanceof GoogleError ? e : null;
      if (ge && (ge.kind === "timeout" || ge.kind === "network")) {
        // Unklarer Ausgang: nicht neu buchen, sondern die Anfragekennung erneut abfragen
        const found = await this.findWithRetries(i.requestId, 2);
        if (found) return { status: "booked", booking: found };
        await notifyOwner("Unklarer Buchungsausgang", { bookingRef: ref, status: "pending", errorClass: ge.kind, engine: "google" });
        return { status: "pending" };
      }
      throw e;
    }

    // 4. Direkt danach im selben Zeitfenster nachsehen: zwei Einträge, eigener jünger, dann eigenen löschen
    try {
      const overlapping = (await this.listEvents(g.calendarBookingsId, i.start, end)).filter((e) => e.id !== created.id && overlapsEvent(e, i.start.getTime(), endMs));
      if (overlapping.length) {
        const ownCreated = created.created ?? new Date().toISOString();
        const younger = overlapping.every((o) => isYounger(created.id, ownCreated, o));
        if (younger) {
          await this.call<void>("DELETE", `/calendars/${encodeURIComponent(g.calendarBookingsId)}/events/${encodeURIComponent(created.id)}?sendUpdates=none`, undefined, WRITE_TIMEOUT_MS);
          return { status: "conflict" };
        }
        await notifyOwner("Überschneidung im Buchungskalender", { bookingRef: ref, status: "overlap", engine: "google" });
      }
    } catch (e) {
      logEvent("warn", "google_overlap_check_failed", { bookingRef: ref, engine: "google", errorClass: errorClass(e) });
    }

    return { status: "booked", booking: { ref, requestId: i.requestId, start: toBerlinIso(i.start), end: toBerlinIso(end), durationMinutes: i.durationMinutes } };
  }

  async addReferral(requestId: string, referral: string): Promise<boolean> {
    const g = readEnv().google;
    const ev = await this.findEventByRef(bookingRefFor(requestId));
    if (!ev) return false;
    const description = `${ev.description ?? ""}\nEmpfehlung: ${referral}`.trim();
    await this.call<GEvent>("PATCH", `/calendars/${encodeURIComponent(g.calendarBookingsId)}/events/${encodeURIComponent(ev.id)}?sendUpdates=none`, { description }, WRITE_TIMEOUT_MS);
    return true;
  }

  async cancel(): Promise<void> {
    throw new NotImplementedError("Absagen");
  }

  async reschedule(): Promise<void> {
    throw new NotImplementedError("Verschieben");
  }
}

function overlapsEvent(e: GEvent, startMs: number, endMs: number): boolean {
  if (!e.start?.dateTime || !e.end?.dateTime) return false;
  const s = Date.parse(e.start.dateTime);
  const en = Date.parse(e.end.dateTime);
  return s < endMs && startMs < en;
}

/** Eigener Eintrag jünger als der andere? Bei gleicher Erstellungszeit entscheidet die Kennung, damit genau einer weicht. */
function isYounger(ownId: string, ownCreated: string, other: GEvent): boolean {
  const a = Date.parse(ownCreated);
  const b = Date.parse(other.created ?? "");
  if (Number.isFinite(a) && Number.isFinite(b) && a !== b) return a > b;
  return ownId > other.id;
}

function toSummary(e: GEvent, requestId: string): BookingSummary {
  const start = new Date(e.start?.dateTime ?? 0);
  const end = new Date(e.end?.dateTime ?? 0);
  return {
    ref: e.extendedProperties?.private?.bookingRef ?? "PS-?",
    requestId,
    start: toBerlinIso(start),
    end: toBerlinIso(end),
    durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
  };
}
