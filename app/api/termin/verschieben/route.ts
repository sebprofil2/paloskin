import { NextResponse } from "next/server";
import { z } from "zod";
import { rescheduleBooking, summarize } from "@/lib/booking";
import { verifyTerminToken } from "@/lib/links";
import { errorClass, logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });
const schema = z.object({ token: z.string().max(80), start: z.iso.datetime({ offset: true }) }).strict();

/* Verschieben über den signierten Link: neue Zeit atomar reservieren, dann alte freigeben (lib/booking.ts). */
export async function POST(req: Request) {
  if (!allow(clientKey(req), LIMITS.termin.limit, LIMITS.termin.windowMs)) return json({ error: "rate_limited" }, 429);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const id = verifyTerminToken(parsed.data.token);
  if (!id) return json({ error: "invalid" }, 400);
  try {
    const r = await rescheduleBooking(id, new Date(parsed.data.start));
    if (r.status === "rescheduled") return json({ status: "rescheduled", booking: summarize(r.booking, "") });
    if (r.status === "conflict") return json({ status: "conflict" }, 409);
    return json({ error: r.status }, r.status === "missing" ? 404 : 409);
  } catch (e) {
    logEvent("error", "termin_reschedule_failed", { route: "termin", errorClass: errorClass(e) });
    return json({ error: "failed" }, 503);
  }
}
