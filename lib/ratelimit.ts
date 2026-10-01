/*
 * Begrenzung auf wenige Buchungen pro Stunde und Anschluss. Im Speicher der laufenden Instanz,
 * reicht für Stufe 1. Stufe 2 bekommt eine Ablage in der Datenbank.
 */
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 6;
const hits = new Map<string, number[]>();

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export function allow(key: string, now = Date.now()): boolean {
  const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= LIMIT) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return true;
}
