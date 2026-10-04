import { createHash } from "node:crypto";
import { readEnv } from "./env";

/*
 * Begrenzung pro Anschluss und pro Kontakt. Im Speicher der laufenden Instanz,
 * reicht für Stufe 1; Stufe 2 bekommt eine Ablage in der Datenbank.
 */
const hits = new Map<string, number[]>();

export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 10000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}

/**
 * Anschluss des Aufrufers. X-Forwarded-For nur, wenn der eigene Proxy davor steht und die Kopfzeile setzt
 * (TRUST_PROXY=true hinter Caddy). Sonst ein fester Schlüssel.
 */
export function clientKey(req: Request): string {
  const trusted = readEnv().trustProxy;
  if (trusted) {
    const fwd = req.headers.get("x-forwarded-for");
    const ip = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip") ?? "").trim();
    if (ip) return `ip:${hashKey(ip)}`;
  }
  return "ip:direct";
}

/** Kontakt (E-Mail und Handynummer) nur als Hash, nie im Klartext im Speicher. */
export function contactKey(email: string, phone: string): string {
  return `contact:${hashKey(`${email.trim().toLowerCase()}|${phone.replace(/\D/g, "")}`)}`;
}

function hashKey(v: string): string {
  return createHash("sha256").update(v).digest("base64url").slice(0, 24);
}

export const LIMITS = {
  book: { limit: 6, windowMs: 60 * 60 * 1000 },
  bookPerContact: { limit: 3, windowMs: 60 * 60 * 1000 },
  slots: { limit: 60, windowMs: 60 * 1000 },
  referral: { limit: 10, windowMs: 60 * 60 * 1000 },
  access: { limit: 5, windowMs: 15 * 60 * 1000 },
  termin: { limit: 20, windowMs: 15 * 60 * 1000 },
  intern: { limit: 120, windowMs: 60 * 1000 },
} as const;
