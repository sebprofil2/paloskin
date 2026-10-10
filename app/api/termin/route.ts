import { NextResponse } from "next/server";
import { isLang } from "@/lib/i18n";
import { cancelBooking, confirmAttendance, terminWindow } from "@/lib/booking";
import { linkCancelReason } from "@/lib/cancel-reasons";
import { verifyTerminToken } from "@/lib/links";
import { errorClass, logEvent } from "@/lib/log";
import { allow, clientKey, LIMITS } from "@/lib/ratelimit";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Zusage oder Absage über den signierten Link aus der Mail (Formular, POST). Die Fristen gelten auch hier:
 * Absage bis 2 Stunden vor dem Termin (ja: jederzeit vor dem Termin). Antwort ist eine Weiterleitung auf die Terminseite.
 */
export async function POST(req: Request) {
  let lang = "";
  const back = (token: string, m: string) =>
    new NextResponse(null, { status: 303, headers: { location: `/termin/${encodeURIComponent(token)}?m=${m}${lang ? `&lang=${lang}` : ""}`, "cache-control": "no-store" } });
  if (!allow(clientKey(req), LIMITS.termin.limit, LIMITS.termin.windowMs)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? "").slice(0, 80);
  const action = String(form?.get("action") ?? "");
  // gewählte Seitensprache der Terminseite beibehalten (nur bekannte Kürzel)
  const langField = String(form?.get("lang") ?? "");
  if (isLang(langField)) lang = langField;
  const id = verifyTerminToken(token);
  if (!id || (action !== "ja" && action !== "absagen")) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const booking = getStore().findById(id);
    if (!booking || booking.deleted_at) return NextResponse.json({ error: "invalid" }, { status: 404 });
    const now = new Date();
    const w = terminWindow(booking, now);
    if (w === "cancelled") return back(token, "abgesagt");
    if (w === "past") return back(token, "vorbei");
    if (action === "ja") {
      // Vor dem Vortag 10 Uhr lehnt der Server ab; die Seite zeigt dann einfach ihren Stand ohne Bestätigung
      const done = confirmAttendance(id, undefined, now);
      return back(token, done ? "ja" : "");
    }
    if (w === "closed") return back(token, "zuspaet");
    await cancelBooking(id, linkCancelReason(w), undefined, now);
    return back(token, "absage");
  } catch (e) {
    logEvent("error", "termin_failed", { route: "termin", errorClass: errorClass(e) });
    return NextResponse.json({ error: "failed" }, { status: 503 });
  }
}
