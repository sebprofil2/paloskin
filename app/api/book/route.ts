import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { durationMinutes } from "@/lib/duration";
import { readEnv } from "@/lib/env";
import { getEngine, SlotsUnavailableError } from "@/lib/engine";
import { notifyOwner } from "@/lib/notify";
import { allow, clientKey } from "@/lib/ratelimit";
import { bookRequestSchema } from "@/lib/schema";
import { bookingRange } from "@/lib/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function POST(req: Request) {
  if (!hasAccess(req)) return NextResponse.json({ error: "no_access" }, { status: 401 });
  const parsed = bookRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: noStore });
  const body = parsed.data;
  if (body.website) return NextResponse.json({ error: "invalid" }, { status: 400, headers: noStore });
  if (!allow(clientKey(req))) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: noStore });

  const env = readEnv();
  const minutes = durationMinutes(body.selection);
  const start = new Date(body.start);
  const { from, to } = bookingRange();
  const onGrid = start.getTime() % (env.stepMinutes * 60000) === 0;
  if (!onGrid || start < from || start > to) return NextResponse.json({ status: "conflict" }, { status: 409, headers: noStore });

  try {
    const result = await getEngine().book({
      requestId: body.requestId,
      selection: body.selection,
      start,
      durationMinutes: minutes,
      customer: body.customer,
      lang: body.lang,
      consentAt: new Date(),
      testMode: env.testMode,
    });
    if (result.status === "booked") return NextResponse.json(result, { headers: noStore });
    if (result.status === "conflict") return NextResponse.json(result, { status: 409, headers: noStore });
    return NextResponse.json(result, { status: 202, headers: noStore });
  } catch (e) {
    console.error("[book]", e);
    const unavailable = e instanceof SlotsUnavailableError;
    return NextResponse.json({ error: unavailable ? "unavailable" : "failed" }, { status: 503, headers: noStore });
  }
}

/* Nachfrage nach unklarem Ausgang: gibt es zur Anfragekennung schon eine Buchung? */
export async function GET(req: Request) {
  if (!hasAccess(req)) return NextResponse.json({ error: "no_access" }, { status: 401 });
  const url = new URL(req.url);
  const requestId = url.searchParams.get("requestId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ error: "invalid" }, { status: 400, headers: noStore });
  try {
    const booking = await getEngine().findByRequestId(requestId);
    if (!booking) {
      // Der Browser hat den Ausgang nicht erfahren und die Buchung nicht gefunden: Dr. Vogel informieren
      if (url.searchParams.get("report") === "1") await notifyOwner("Unklarer Buchungsausgang (Browser)", { requestId });
      return NextResponse.json({ status: "not_found" }, { status: 404, headers: noStore });
    }
    return NextResponse.json({ status: "booked", booking }, { headers: noStore });
  } catch (e) {
    console.error("[book lookup]", e);
    return NextResponse.json({ error: "failed" }, { status: 503, headers: noStore });
  }
}
