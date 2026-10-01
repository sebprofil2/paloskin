import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cookieIsValid, makeCookieValue, TEST_COOKIE_MAX_AGE } from "../access";

describe("Signiertes Zugangs-Cookie", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.TEST_MODE = "true";
    process.env.TEST_ACCESS_CODE = "testcode-1234567";
    process.env.TEST_COOKIE_SECRET = "geheim-eins";
  });
  afterEach(() => {
    process.env = { ...saved };
  });
  it("gültig bis zum Ablauf, danach nicht mehr", () => {
    const now = Date.now();
    const v = makeCookieValue(now);
    expect(cookieIsValid(v, now)).toBe(true);
    expect(cookieIsValid(v, now + (TEST_COOKIE_MAX_AGE - 1) * 1000)).toBe(true);
    expect(cookieIsValid(v, now + (TEST_COOKIE_MAX_AGE + 1) * 1000)).toBe(false);
  });
  it("manipulierter Wert und alter Code werden abgelehnt", () => {
    const v = makeCookieValue();
    expect(cookieIsValid(v.replace(/^\d+/, (d) => String(Number(d) + 86400)))).toBe(false);
    expect(cookieIsValid("testcode-1234567")).toBe(false);
    expect(cookieIsValid("")).toBe(false);
  });
  it("Wechsel des Signaturschlüssels widerruft alle Cookies", () => {
    const v = makeCookieValue();
    process.env.TEST_COOKIE_SECRET = "geheim-zwei";
    expect(cookieIsValid(v)).toBe(false);
  });
});
