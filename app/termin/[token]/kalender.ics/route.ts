import { verifyTerminToken } from "@/lib/links";
import { buildIcs } from "@/lib/mail-content";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Kalenderdatei für den iPhone-Knopf in der Bestätigungsmail: gleicher Inhalt wie der Anhang, nur über den signierten Link. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!allow(clientKey(req), LIMITS.termin.limit, LIMITS.termin.windowMs)) return new Response("rate_limited", { status: 429 });
  const { token } = await ctx.params;
  const id = verifyTerminToken(token);
  const booking = id ? getStore().findById(id) : null;
  if (!booking || booking.deleted_at || booking.status === "cancelled") return new Response("not_found", { status: 404 });
  return new Response(buildIcs(booking, booking.language), {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="termin.ics"',
      "cache-control": "no-store",
    },
  });
}
