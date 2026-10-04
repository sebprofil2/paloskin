import { internGuard, internJson } from "@/lib/intern";
import { errorClass, logEvent } from "@/lib/log";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /intern/v1/health: Zeit, offene Ereignisse je Abnehmer, Kalender- und Mailrückstand. Keine Kundendaten. */
export async function GET(req: Request) {
  const denied = internGuard(req);
  if (denied) return denied;
  try {
    const store = getStore();
    const now = new Date();
    const last = store.lastSeq();
    const consumers = store.consumers().map((c) => ({ ...c, pending_events: Math.max(0, last - c.acknowledged_seq) }));
    return internJson({
      server_time: now.toISOString(),
      last_seq: last,
      oldest_seq: store.oldestSeq(),
      stream_generation: store.streamGeneration(),
      consumers,
      pending_events: consumers.length ? Math.max(...consumers.map((c) => c.pending_events)) : last,
      calendar_failed: store.countCalendarFailed(),
      mail_unsent: store.countMailUnsent(now),
    });
  } catch (e) {
    logEvent("error", "intern_health_failed", { route: "intern", errorClass: errorClass(e) });
    return internJson({ error: "failed" }, 503);
  }
}
