import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { durationMinutes } from "@/lib/duration";
import { getEngine, SlotsUnavailableError } from "@/lib/engine";
import { errorClass, logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";
import { slotsRequestSchema } from "@/lib/schema";
import { bookingRange } from "@/lib/slots";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/*
 * Nur buchbare Startzeiten verlassen den Server, nie Google-Rohdaten.
 * Frei = Fenster in „Palo Skin offen“ minus belegt laut Kalender minus Reservierungen der Datenbank.
 */
export async function POST(req: Request) {
  if (!hasAccess(req)) return json({ error: "no_access" }, 401);
  if (!allow(clientKey(req), LIMITS.slots.limit, LIMITS.slots.windowMs)) return json({ error: "rate_limited" }, 429);
  const parsed = slotsRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const minutes = durationMinutes(parsed.data.selection);
  try {
    const { from, to } = bookingRange();
    const extraBusy = getStore().lockedIntervals(from, to);
    const result = await getEngine().getSlots({ durationMinutes: minutes, extraBusy });
    return json({ ...result, durationMinutes: minutes });
  } catch (e) {
    if (!(e instanceof SlotsUnavailableError)) logEvent("error", "slots_failed", { route: "slots", errorClass: errorClass(e) });
    // Nie eine leere Liste, die wie „ausgebucht“ aussieht: der Browser zeigt den Zustand „laden gerade nicht“
    return json({ error: "unavailable" }, 503);
  }
}
