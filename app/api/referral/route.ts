import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { getEngine } from "@/lib/engine";
import { referralSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Empfehlung, die erst auf der Bestätigungsseite abgefragt wird, nachträglich in dasselbe Ereignis schreiben */
export async function POST(req: Request) {
  if (!hasAccess(req)) return NextResponse.json({ error: "no_access" }, { status: 401 });
  const parsed = referralSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const ok = await getEngine().addReferral(parsed.data.requestId, parsed.data.referral);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("[referral]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
