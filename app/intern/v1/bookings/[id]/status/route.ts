import { z } from "zod";
import { cancelBooking } from "@/lib/booking";
import { crmCancelReason } from "@/lib/cancel-reasons";
import { internGuard, internJson } from "@/lib/intern";
import { errorClass, logEvent } from "@/lib/log";
import { getStore, toPayload } from "@/lib/store";
import { ULID_PATTERN } from "@/lib/ulid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(["confirmed", "cancelled"]), reason: z.enum(["studio_confirmed", "studio_cancelled"]) }).strict();

/*
 * POST /intern/v1/bookings/{id}/status { status, reason }: einziger Rückweg des Kundensystems. reason ist ein fester
 * Bezeichner (studio_confirmed, studio_cancelled); bei Absage wird cancel_reason „crm:studio_cancelled“ (lib/cancel-reasons.ts).
 * confirmed: requested wird confirmed (Ereignis confirmed, Kalendereintrag unverändert).
 * cancelled: Belegung frei, Ereignis cancelled, Kalendereintrag gelöscht. Beides mehrfach aufrufbar.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = internGuard(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ULID_PATTERN.test(id)) return internJson({ error: "invalid" }, 400);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return internJson({ error: "invalid" }, 400);
  try {
    const store = getStore();
    const current = store.findById(id);
    if (!current || current.deleted_at) return internJson({ error: "not_found" }, 404);
    if (parsed.data.status === "confirmed") {
      const r = store.confirmByCrm(id);
      if (r.outcome === "cancelled") return internJson({ error: "already_cancelled", booking: toPayload(r.booking!) }, 409);
      if (r.outcome === "confirmed") logEvent("info", "intern_confirmed", { route: "intern", bookingRef: r.booking!.reference, reason: parsed.data.reason });
      return internJson({ booking: toPayload(r.booking!), changed: r.outcome === "confirmed" });
    }
    const cancelled = await cancelBooking(id, crmCancelReason(parsed.data.reason as "studio_cancelled"));
    const row = cancelled ?? store.findById(id)!;
    return internJson({ booking: toPayload(row), changed: cancelled !== null });
  } catch (e) {
    logEvent("error", "intern_status_failed", { route: "intern", errorClass: errorClass(e) });
    return internJson({ error: "failed" }, 503);
  }
}
