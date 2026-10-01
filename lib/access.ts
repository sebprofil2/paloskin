import { timingSafeEqual } from "node:crypto";
import { readEnv } from "./env";

/*
 * Zugang im Testbetrieb: Der Testcode wird einmal über das Formular /booking/zugang eingegeben
 * (POST, nie in der Adresse) und bleibt als HttpOnly-Cookie. Serverrouten prüfen nur das Cookie.
 */
export const TEST_COOKIE = "palo_test";
export const TEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 Tage, danach neu eingeben

export function codeIsValid(code: string | null | undefined): boolean {
  const env = readEnv();
  if (!env.testMode) return true;
  const expected = Buffer.from(env.testCode);
  const given = Buffer.from((code ?? "").trim());
  if (!expected.length || expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Zugang für Serverrouten: nur über das Cookie, nie über die Adresse. */
export function hasAccess(req: Request): boolean {
  if (!readEnv().testMode) return true;
  return codeIsValid(readCookie(req, TEST_COOKIE));
}

export function cookieHeader(code: string, secure: boolean): string {
  return `${TEST_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${TEST_COOKIE_MAX_AGE}; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}
