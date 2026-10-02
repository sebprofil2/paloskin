import { NextResponse } from "next/server";
import { canCancelOnline, cancelBooking, confirmAttendance } from "@/lib/booking";
import { verifyTerminToken } from "@/lib/links";
import { errorClass, logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Zusage oder Absage über den signierten Link aus der Mail (Formular, POST). Antwort ist immer eine Weiterleitung
 * zurück auf die Terminseite mit einer Meldung; der Link selbst bleibt der einzige Schlüssel.
 */
export async function POST(req: Request) {
  const back = (token: string, m: string) =>
    new NextResponse(null, { status: 303, headers: { location: `/termin/${encodeURIComponent(token)}?m=${m}`, "cache-control": "no-store" } });
  if (!allow(clientKey(req), LIMITS.termin.limit, LIMITS.termin.windowMs)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? "").slice(0, 80);
  const action = String(form?.get("action") ?? "");
  const id = verifyTerminToken(token);
  if (!id || (action !== "ja" && action !== "absagen")) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const booking = getStore().findById(id);
    if (!booking || booking.deleted_at) return NextResponse.json({ error: "invalid" }, { status: 404 });
    const now = new Date();
    if (booking.status === "cancelled") return back(token, "abgesagt");
    if (Date.parse(booking.ends_at) <= now.getTime()) return back(token, "vorbei");
    if (action === "ja") {
      confirmAttendance(id, undefined, now);
      return back(token, "ja");
    }
    if (!canCancelOnline(booking, now)) return back(token, "zuspaet");
    await cancelBooking(id, "customer_link", undefined, now);
    return back(token, "absage");
  } catch (e) {
    logEvent("error", "termin_failed", { route: "termin", errorClass: errorClass(e) });
    return NextResponse.json({ error: "failed" }, { status: 503 });
  }
}
