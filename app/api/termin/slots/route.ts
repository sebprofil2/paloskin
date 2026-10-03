import { NextResponse } from "next/server";
import { terminWindow } from "@/lib/booking";
import { getEngine, SlotsUnavailableError } from "@/lib/engine";
import { verifyTerminToken } from "@/lib/links";
import { errorClass, logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";
import { bookingRange } from "@/lib/slots";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/* Freie Zeiten zum Verschieben: dieselbe Dauer und dieselben Regeln wie bei der Buchung, nur über den signierten Link. */
export async function GET(req: Request) {
  if (!allow(clientKey(req), LIMITS.slots.limit, LIMITS.slots.windowMs)) return json({ error: "rate_limited" }, 429);
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const id = verifyTerminToken(token);
  if (!id) return json({ error: "invalid" }, 400);
  try {
    const store = getStore();
    const booking = store.findById(id);
    if (!booking || booking.deleted_at) return json({ error: "invalid" }, 404);
    const w = terminWindow(booking);
    if (w !== "open" && w !== "short") return json({ error: "closed" }, 409);
    const { from, to } = bookingRange();
    const result = await getEngine().getSlots({ durationMinutes: booking.duration_minutes, extraBusy: store.lockedIntervals(from, to) });
    return json({ ...result, durationMinutes: booking.duration_minutes });
  } catch (e) {
    if (!(e instanceof SlotsUnavailableError)) logEvent("error", "termin_slots_failed", { route: "termin", errorClass: errorClass(e) });
    return json({ error: "unavailable" }, 503);
  }
}
