import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readEnv } from "./env";
import { logEvent } from "./log";
import { allow, clientKey, LIMITS } from "./ratelimit";

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
