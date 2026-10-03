import { z } from "zod";
import { CONSUMER_PATTERN, internGuard, internJson } from "@/lib/intern";
import { errorClass, logEvent } from "@/lib/log";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ consumer: z.string().regex(CONSUMER_PATTERN), seq: z.number().int().min(0).max(999999999999) }).strict();

/* POST /intern/v1/ack { consumer, seq }: setzt acknowledged_seq, nie rückwärts. */
export async function POST(req: Request) {
  const denied = internGuard(req);
  if (denied) return denied;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return internJson({ error: "invalid" }, 400);
  try {
    const store = getStore();
    const last = store.lastSeq();
    if (parsed.data.seq > last) return internJson({ error: "unknown_seq", last_seq: last }, 409);
    const acknowledged = store.acknowledge(parsed.data.consumer, parsed.data.seq);
    logEvent("info", "intern_ack", { route: "intern", consumer: parsed.data.consumer, seq: acknowledged });
    return internJson({ consumer: parsed.data.consumer, acknowledged_seq: acknowledged, server_time: new Date().toISOString() });
  } catch (e) {
    logEvent("error", "intern_ack_failed", { route: "intern", errorClass: errorClass(e) });
    return internJson({ error: "failed" }, 503);
  }
}
