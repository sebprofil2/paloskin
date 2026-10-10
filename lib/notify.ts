import { readEnv } from "./env";
import { logEvent, type LogFields } from "./log";

/*
 * Meldung an Dr. Vogel bei unklarem Buchungsausgang. Stufe 1: Protokoll des Hostings
 * (deutlich markiert) und, falls OWNER_WEBHOOK_URL gesetzt ist, ein POST mit JSON.
 * Nie mit Namen, Nummern oder Adressen: nur Kennungen, Status und Fehlerklasse.
 */
export async function notifyOwner(subject: string, fields: LogFields): Promise<void> {
  logEvent("error", `Meldung: ${subject}`, fields);
  const url = readEnv().ownerWebhookUrl;
  if (!url) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, ...fields, at: new Date().toISOString() }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch (e) {
    logEvent("error", "webhook_failed", { errorClass: e instanceof Error ? e.name : "unknown" });
  }
}
