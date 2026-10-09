import { recordWalkIn } from "@/lib/booking";
import { readEnv } from "@/lib/env";
import { internGuard, internJson, withPortalUrl } from "@/lib/intern";
import { errorClass, logEvent } from "@/lib/log";
import { toPayload } from "@/lib/store";
import { parseWalkIn } from "@/lib/walk-in";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * POST /intern/v1/walk-ins: Das Kundensystem meldet einen Kunden, der ohne Buchung gekommen ist (Auftrag Dr. Vogel,
 * 9. Oktober 2026). Die Buchung legt einen bestätigten Termin an (Kanal walk_in), belegt die Zeit für Online-Buchungen,
 * schreibt den Kalendereintrag mit „ohne Termin gekommen, vor Ort eingetragen“ und das Ereignis created. Keine Mail, keine Erinnerung.
 * request_id schützt vor doppelten Einträgen: dieselbe Kennung liefert die bestehende Buchung (200 statt 201).
 * Eingaben: lib/walk-in.ts.
 */
export async function POST(req: Request) {
  const denied = internGuard(req);
  if (denied) return denied;
  const w = parseWalkIn(await req.json().catch(() => null));
  if (!w) return internJson({ error: "invalid" }, 400);
  try {
    const r = await recordWalkIn({ ...w, testMode: readEnv().testMode });
    return internJson({ booking: withPortalUrl(toPayload(r.booking)), created: r.created, overlaps: r.overlaps }, r.created ? 201 : 200);
  } catch (e) {
    logEvent("error", "intern_walk_in_failed", { route: "intern", errorClass: errorClass(e) });
    return internJson({ error: "failed" }, 503);
  }
}
