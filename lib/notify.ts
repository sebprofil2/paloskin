import { readEnv } from "./env";

/*
 * Meldung an Dr. Vogel bei unklarem Buchungsausgang. Stufe 1: Protokoll des Hostings
 * (deutlich markiert) und, falls OWNER_WEBHOOK_URL gesetzt ist, ein POST mit JSON.
 */
export async function notifyOwner(subject: string, details: Record<string, unknown>): Promise<void> {
  const line = `[PALO SKIN MELDUNG] ${subject} ${JSON.stringify(details)}`;
  console.error(line);
  const url = readEnv().ownerWebhookUrl;
  if (!url) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, details, at: new Date().toISOString() }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch (e) {
    console.error("[PALO SKIN MELDUNG] Webhook nicht erreichbar", e);
  }
}
