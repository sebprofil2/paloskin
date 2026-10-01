import { NextResponse } from "next/server";
import { codeIsValid, cookieHeader } from "@/lib/access";
import { readEnv } from "@/lib/env";
import { logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Testzugang: Code per Formular (POST), nie in der Adresse. Bei Erfolg HttpOnly-Cookie und
 * Weiterleitung auf /booking. Der Code selbst wird nicht protokolliert.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const back = (ok: boolean, lang: string) => {
    const target = ok ? `/booking${lang ? `?lang=${lang}` : ""}` : `/booking/zugang?fehler=1${lang ? `&lang=${lang}` : ""}`;
    return NextResponse.redirect(new URL(target, url.origin), { status: 303, headers: { "cache-control": "no-store" } });
  };
  if (!readEnv().testMode) return back(true, "");
  if (!allow(clientKey(req), LIMITS.access.limit, LIMITS.access.windowMs)) {
    logEvent("warn", "access_rate_limited", { route: "zugang" });
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "cache-control": "no-store" } });
  }
  const form = await req.formData().catch(() => null);
  const code = String(form?.get("code") ?? "");
  const lang = String(form?.get("lang") ?? "").replace(/[^a-z]/g, "").slice(0, 2);
  if (!codeIsValid(code)) {
    logEvent("warn", "access_denied", { route: "zugang" });
    return back(false, lang);
  }
  const res = back(true, lang);
  res.headers.append("set-cookie", cookieHeader(code, url.protocol === "https:"));
  logEvent("info", "access_granted", { route: "zugang" });
  return res;
}
