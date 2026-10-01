import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { durationMinutes } from "@/lib/duration";
import { getEngine, SlotsUnavailableError } from "@/lib/engine";
import { slotsRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasAccess(req)) return NextResponse.json({ error: "no_access" }, { status: 401 });
  const parsed = slotsRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const minutes = durationMinutes(parsed.data.selection);
  try {
    const result = await getEngine().getSlots({ durationMinutes: minutes });
    return NextResponse.json({ ...result, durationMinutes: minutes }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (!(e instanceof SlotsUnavailableError)) console.error("[slots]", e);
    // Nie eine leere Liste, die wie „ausgebucht“ aussieht: der Browser zeigt den Zustand „laden gerade nicht“
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
