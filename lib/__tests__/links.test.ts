import { afterEach, describe, expect, it } from "vitest";
import { terminToken, terminUrl, verifyTerminToken } from "../links";

describe("Signierte Terminlinks", () => {
  afterEach(() => {
    delete process.env.LINK_SECRET;
    delete process.env.PUBLIC_BASE_URL;
  });

  it("erkennt eigene Token wieder und weist veränderte zurück", () => {
    process.env.LINK_SECRET = "test-schluessel";
    const id = "01M3YWQ51D0EPJ4VSS2B2MQT7H";
    const token = terminToken(id);
    expect(token).toMatch(/^01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}$/);
    expect(verifyTerminToken(token)).toBe(id);
    expect(verifyTerminToken(token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"))).toBeNull();
    expect(verifyTerminToken("01M3YWQ51D0EPJ4VSS2B2MQT7X." + token.split(".")[1])).toBeNull();
    expect(verifyTerminToken("")).toBeNull();
    expect(verifyTerminToken(null)).toBeNull();
    process.env.LINK_SECRET = "anderer-schluessel";
    expect(verifyTerminToken(token)).toBeNull();
  });

  it("baut Links auf die öffentliche Adresse", () => {
    process.env.LINK_SECRET = "test-schluessel";
    process.env.PUBLIC_BASE_URL = "https://neu.paloskin.de/";
    expect(terminUrl("01M3YWQ51D0EPJ4VSS2B2MQT7H", "ja")).toMatch(/^https:\/\/neu\.paloskin\.de\/termin\/01M3YWQ51D0EPJ4VSS2B2MQT7H\.[A-Za-z0-9_-]{27}\?a=ja$/);
  });
});
