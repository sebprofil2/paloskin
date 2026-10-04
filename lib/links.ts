import { createHmac, timingSafeEqual } from "node:crypto";
import { readEnv } from "./env";
import { ULID_PATTERN } from "./ulid";

/*
 * Signierte Terminlinks für „Ja, ich komme“ und „Termin absagen“:
 *   /termin/<buchungskennung>.<hmac-sha256 base64url, 27 Zeichen>
 * Der Link verrät nichts über den Termin; die Seite liest alles aus der Datenbank. Gültig, solange die Buchung
 * existiert (Löschung 90 Tage nach dem Termin). Schlüssel nur aus LINK_SECRET. Der frühere Rückfall auf TEST_COOKIE_SECRET
 * oder TEST_ACCESS_CODE ist entfernt (4. Oktober 2026): auf www war LINK_SECRET seit dem 2. Oktober gesetzt, die erste
 * Bestätigungsmail ging am 3. Oktober hinaus, alle verschickten Links sind mit LINK_SECRET signiert und bleiben gültig.
 */
const SIG_LENGTH = 27;

function secret(): string {
  const env = readEnv();
  if (!env.linkSecret) throw new Error("LINK_SECRET fehlt");
  return env.linkSecret;
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
