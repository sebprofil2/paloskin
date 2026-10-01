import { readEnv } from "./env";

export const TEST_COOKIE = "palo_test";

function sameCode(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Testcode gültig? Außerhalb des Testbetriebs ist alles erlaubt. */
export function codeIsValid(code: string | null | undefined): boolean {
  const env = readEnv();
  if (!env.testMode) return true;
  return sameCode(env.testCode, (code ?? "").trim());
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Zugang für Serverrouten: Testcode aus Cookie oder Adresse. */
export function hasAccess(req: Request): boolean {
  if (!readEnv().testMode) return true;
  const url = new URL(req.url);
  return codeIsValid(readCookie(req, TEST_COOKIE)) || codeIsValid(url.searchParams.get("test"));
}
