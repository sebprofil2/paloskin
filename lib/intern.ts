import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readEnv } from "./env";
import { terminUrl } from "./links";
import { logEvent } from "./log";
import { allow, clientKey, LIMITS } from "./ratelimit";
import type { BookingPayload, EventEnvelope } from "./store";

/*
 * Endpunkt für das Kundensystem, nur im privaten Hetzner-Netz: Caddy lauscht an 10.0.0.2:8443 (tls internal) und setzt
 * die Kopfzeile X-Palo-Intern; die öffentlichen Blöcke beantworten /intern mit 404 und entfernen die Kopfzeile.
 * Zusätzlich Bearer-Token aus INTERN_TOKEN, Vergleich in konstanter Zeit, 120 Anfragen pro Minute, keine Weiterleitungen.
 */
export const INTERN_HEADER = "x-palo-intern";

const noStore = { "cache-control": "no-store" };
export const internJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/** Null bei Erfolg, sonst die fertige Fehlerantwort. */
export function internGuard(req: Request): NextResponse | null {
  if (req.headers.get(INTERN_HEADER) !== "1") return internJson({ error: "not_found" }, 404);
  if (!allow(clientKey(req), LIMITS.intern.limit, LIMITS.intern.windowMs)) return internJson({ error: "rate_limited" }, 429);
  const token = readEnv().internToken;
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!token || !m) {
    logEvent("warn", "intern_denied", { route: "intern", reason: token ? "no_token" : "not_configured" });
    return internJson({ error: "unauthorized" }, 401);
  }
  const expected = Buffer.from(token);
  const given = Buffer.from(m[1]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    logEvent("warn", "intern_denied", { route: "intern", reason: "bad_token" });
    return internJson({ error: "unauthorized" }, 401);
  }
  return null;
}

export const CONSUMER_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const EVENTS_LIMIT_DEFAULT = 100;
export const EVENTS_LIMIT_MAX = 500;

/*
 * Persönlicher Link der Buchung (Auftrag Dr. Vogel, 6. Oktober 2026): customer_portal_url, genau der Link zur Terminseite
 * aus Bestätigungs- und Erinnerungsmail (lib/links.ts, terminUrl). Er wird erst bei der Auslieferung über diese interne
 * Verbindung angehängt und nie in der Ereignistabelle gespeichert; er hängt nur von Buchungskennung und LINK_SECRET ab,
 * ist also für jedes Ereignis derselbe. Nie protokollieren.
 */
export function withPortalUrl(booking: BookingPayload): BookingPayload & { customer_portal_url: string } {
  return { ...booking, customer_portal_url: terminUrl(booking.id) };
}

/** Ereignisse für den Endpunkt: jedes außer deleted mit customer_portal_url; deleted bleibt bei id und reference. */
export function internEvents(events: EventEnvelope[]): EventEnvelope[] {
  return events.map((e) => (e.type === "deleted" ? e : { ...e, booking: withPortalUrl(e.booking as BookingPayload) }));
}
