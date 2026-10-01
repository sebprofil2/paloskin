import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { getEngine } from "@/lib/engine";
import { errorClass, logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";
import { referralSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/* Empfehlung, die erst auf der Bestätigungsseite abgefragt wird, nachträglich in dasselbe Ereignis schreiben */
export async function POST(req: Request) {
  if (!hasAccess(req)) return json({ error: "no_access" }, 401);
  if (!allow(clientKey(req), LIMITS.referral.limit, LIMITS.referral.windowMs)) return json({ error: "rate_limited" }, 429);
  const parsed = referralSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    const ok = await getEngine().addReferral(parsed.data.requestId, parsed.data.referral);
    return json({ ok }, ok ? 200 : 404);
  } catch (e) {
    logEvent("error", "referral_failed", { route: "referral", errorClass: errorClass(e) });
    return json({ ok: false }, 503);
  }
}
