import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { placeBooking, summarize } from "@/lib/booking";
import { deviceFrom } from "@/lib/device";
import { durationMinutes } from "@/lib/duration";
import { readEnv } from "@/lib/env";
import { errorClass, logEvent } from "@/lib/log";
import { notifyOwner } from "@/lib/notify";
import { allow, clientKey, contactKey, LIMITS } from "@/lib/ratelimit";
import { bookingRefFor } from "@/lib/ref";
import { bookRequestSchema } from "@/lib/schema";
import { bookingRange } from "@/lib/slots";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/*
 * Buchen. Der Browser liefert nur Auswahl, Startzeit, Kontakt, Sprache und Anfragekennung.
 * Dauer, Fenster, Vorlauf, Horizont, Endzeit, Kalender und Buchungsnummer bestimmt der Server.
 * Maßgeblich ist die Reservierung in der Datenbank; der Kalendereintrag folgt (lib/booking.ts).
 */
export async function POST(req: Request) {
  if (!hasAccess(req)) return json({ error: "no_access" }, 401);
  const parsed = bookRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const body = parsed.data;
  if (body.website) return json({ error: "invalid" }, 400);
  if (!allow(clientKey(req), LIMITS.book.limit, LIMITS.book.windowMs)) return json({ error: "rate_limited" }, 429);
  if (!allow(contactKey(body.customer.email, body.customer.handy), LIMITS.bookPerContact.limit, LIMITS.bookPerContact.windowMs)) return json({ error: "rate_limited" }, 429);

  const env = readEnv();
  const minutes = durationMinutes(body.selection);
  const start = new Date(body.start);
  const { from, to } = bookingRange();
  const onGrid = start.getTime() % (env.stepMinutes * 60000) === 0;
  if (!onGrid || start < from || start > to) return json({ status: "conflict" }, 409);

  const ref = bookingRefFor(body.requestId);
  try {
    const result = await placeBooking({
      requestId: body.requestId,
      selection: body.selection,
      start,
      durationMinutes: minutes,
      customer: body.customer,
      lang: body.lang,
      consentAt: new Date(),
      reminder: body.reminder,
      device: deviceFrom(req.headers.get("user-agent")),
      testMode: env.testMode,
      binding: env.bookingBinding,
    });
    logEvent("info", "book_result", { route: "book", bookingRef: ref, status: result.status, engine: env.engine });
    if (result.status === "booked") return json(result);
    return json(result, 409);
  } catch (e) {
    logEvent("error", "book_failed", { route: "book", bookingRef: ref, errorClass: errorClass(e), engine: env.engine });
    return json({ error: "failed" }, 503);
  }
}

/* Nachfrage nach unklarem Ausgang: gibt es zur Anfragekennung schon eine Buchung? */
export async function GET(req: Request) {
  if (!hasAccess(req)) return json({ error: "no_access" }, 401);
  if (!allow(clientKey(req), LIMITS.slots.limit, LIMITS.slots.windowMs)) return json({ error: "rate_limited" }, 429);
  const url = new URL(req.url);
  const requestId = url.searchParams.get("requestId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return json({ error: "invalid" }, 400);
  try {
    const booking = getStore().findByRequestId(requestId);
    if (!booking) {
      // Der Browser hat den Ausgang nicht erfahren und die Buchung nicht gefunden: Dr. Vogel informieren
      if (url.searchParams.get("report") === "1") await notifyOwner("Unklarer Buchungsausgang (Browser)", { bookingRef: bookingRefFor(requestId), status: "not_found" });
      return json({ status: "not_found" }, 404);
    }
    return json({ status: "booked", booking: summarize(booking, requestId) });
  } catch (e) {
    logEvent("error", "book_lookup_failed", { route: "book", errorClass: errorClass(e) });
    return json({ error: "failed" }, 503);
  }
}
