import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { readEnv } from "./env";

/*
 * Zugang im Testbetrieb: Der Testcode wird einmal über das Formular /booking/zugang eingegeben
 * (POST, nie in der Adresse). Danach trägt der Browser ein signiertes Cookie mit Ablaufzeit:
 *   <ablauf-unixsekunden>.<hmac-sha256 base64url>
 * Der Server prüft Signatur und Ablauf. Der Signaturschlüssel kommt aus TEST_COOKIE_SECRET
 * (sonst abgeleitet aus dem Testcode); ein Wechsel macht alle Cookies sofort ungültig.
 */
export const TEST_COOKIE = "palo_test";
export const TEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

function secret(): string {
  const env = readEnv();
  if (env.testCookieSecret) return env.testCookieSecret;
  return createHash("sha256").update(`palo-cookie:${env.testCode}`).digest("hex");
}

function sign(exp: number): string {
  return createHmac("sha256", secret()).update(`palo-test:${exp}`).digest("base64url");
}

export function codeIsValid(code: string | null | undefined): boolean {
  const env = readEnv();
  if (!env.testMode) return true;
  const expected = Buffer.from(env.testCode);
  const given = Buffer.from((code ?? "").trim());
  if (!expected.length || expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/** Cookie-Wert mit Ablauf in TEST_COOKIE_MAX_AGE Sekunden. */
export function makeCookieValue(now = Date.now()): string {
  const exp = Math.floor(now / 1000) + TEST_COOKIE_MAX_AGE;
  return `${exp}.${sign(exp)}`;
}

/** Signatur und Ablauf prüfen. Außerhalb des Testbetriebs ist alles erlaubt. */
export function cookieIsValid(value: string | null | undefined, now = Date.now()): boolean {
  if (!readEnv().testMode) return true;
  const m = /^(\d{1,12})\.([A-Za-z0-9_-]{20,})$/.exec((value ?? "").trim());
  if (!m) return false;
  const exp = Number(m[1]);
  if (!Number.isFinite(exp) || exp * 1000 <= now) return false;
  const expected = Buffer.from(sign(exp));
  const given = Buffer.from(m[2]);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Zugang für Serverrouten: nur über das signierte Cookie, nie über die Adresse. */
export function hasAccess(req: Request): boolean {
  if (!readEnv().testMode) return true;
  return cookieIsValid(readCookie(req, TEST_COOKIE));
}

/** HTTPS erkennen, auch hinter dem eigenen Proxy (Caddy setzt X-Forwarded-Proto). */
export function isSecureRequest(req: Request): boolean {
  if (new URL(req.url).protocol === "https:") return true;
  const proto = req.headers.get("x-forwarded-proto");
  return proto === "https" && readEnv().trustProxy;
}

export function cookieHeader(value: string, secure: boolean): string {
  return `${TEST_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${TEST_COOKIE_MAX_AGE}; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}
