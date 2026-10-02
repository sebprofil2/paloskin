import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readEnv } from "./env";
import { ULID_PATTERN } from "./ulid";

/*
 * Signierte Terminlinks für „Ja, ich komme“ und „Termin absagen“:
 *   /termin/<buchungskennung>.<hmac-sha256 base64url, 27 Zeichen>
 * Der Link verrät nichts über den Termin; die Seite liest alles aus der Datenbank. Gültig, solange die Buchung
 * existiert (Löschung 90 Tage nach dem Termin). Schlüssel aus LINK_SECRET, sonst aus dem Cookie-Schlüssel abgeleitet.
 */
const SIG_LENGTH = 27;

function secret(): string {
  const env = readEnv();
  if (env.linkSecret) return env.linkSecret;
  const base = env.testCookieSecret || env.testCode;
  if (!base) throw new Error("LINK_SECRET fehlt");
  return createHash("sha256").update(`palo-link:${base}`).digest("hex");
}

function sign(id: string): string {
  return createHmac("sha256", secret()).update(`palo-termin:${id}`).digest("base64url").slice(0, SIG_LENGTH);
}

export function terminToken(bookingId: string): string {
  return `${bookingId}.${sign(bookingId)}`;
}

/** Buchungskennung aus einem Token, null bei ungültiger Signatur. */
export function verifyTerminToken(token: string | null | undefined): string | null {
  const m = /^([0-9A-HJKMNP-TV-Z]{26})\.([A-Za-z0-9_-]{27})$/.exec((token ?? "").trim());
  if (!m || !ULID_PATTERN.test(m[1])) return null;
  const expected = Buffer.from(sign(m[1]));
  const given = Buffer.from(m[2]);
  return expected.length === given.length && timingSafeEqual(expected, given) ? m[1] : null;
}

export function terminUrl(bookingId: string, action?: "ja" | "absagen"): string {
  const url = `${readEnv().publicBaseUrl}/termin/${terminToken(bookingId)}`;
  return action ? `${url}?a=${action}` : url;
}
