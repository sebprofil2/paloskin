import { EVENTS_LIMIT_DEFAULT, EVENTS_LIMIT_MAX, internGuard, internJson } from "@/lib/intern";
import { errorClass, logEvent } from "@/lib/log";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /intern/v1/events?after=<seq>&limit=<n>: Ereignisse mit seq größer als after, aufsteigend. Ohne after ab 0. */
export async function GET(req: Request) {
  const denied = internGuard(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const afterRaw = url.searchParams.get("after") ?? "0";
  const limitRaw = url.searchParams.get("limit") ?? String(EVENTS_LIMIT_DEFAULT);
  if (!/^\d{1,12}$/.test(afterRaw) || !/^\d{1,4}$/.test(limitRaw)) return internJson({ error: "invalid" }, 400);
  const after = Number(afterRaw);
  const limit = Math.min(Math.max(Number(limitRaw), 1), EVENTS_LIMIT_MAX);
  try {
    const events = getStore().eventsAfter(after, limit);
    const nextAfter = events.length ? events[events.length - 1].seq : after;
    return internJson({ events, next_after: nextAfter, server_time: new Date().toISOString() });
  } catch (e) {
    logEvent("error", "intern_events_failed", { route: "intern", errorClass: errorClass(e) });
    return internJson({ error: "failed" }, 503);
  }
}
