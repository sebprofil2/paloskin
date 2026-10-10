import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { getEngine } from "@/lib/engine";
import { errorClass, logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";
import { referralSchema } from "@/lib/schema";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/*
 * Empfehlung, die erst auf der Bestätigungsseite abgefragt wird: in die Datenbank schreiben und,
 * wenn der Kalendereintrag schon steht, dort anhängen. Fehlt er noch, nimmt der Nachtrag die Empfehlung mit.
 */
export async function POST(req: Request) {
  if (!hasAccess(req)) return json({ error: "no_access" }, 401);
  if (!allow(clientKey(req), LIMITS.referral.limit, LIMITS.referral.windowMs)) return json({ error: "rate_limited" }, 429);
  const parsed = referralSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    const store = getStore();
    const booking = store.findByRequestId(parsed.data.requestId);
    if (!booking) return json({ ok: false }, 404);
    store.setReferral(booking.id, parsed.data.referral);
    if (booking.calendar_event_id) {
      try {
        await getEngine().appendDescription(booking.calendar_event_id, `Empfehlung: ${parsed.data.referral}`);
      } catch (e) {
        logEvent("warn", "referral_calendar_failed", { route: "referral", bookingRef: booking.reference, errorClass: errorClass(e) });
      }
    }
    return json({ ok: true });
  } catch (e) {
    logEvent("error", "referral_failed", { route: "referral", errorClass: errorClass(e) });
    return json({ ok: false }, 503);
  }
}
