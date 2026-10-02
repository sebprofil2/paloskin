/*
 * Protokoll ohne personenbezogene Daten: nur Ereignis, Fehlerklasse, Zeit, Kennungen.
 * Erlaubt sind ausschließlich die Felder unten; alles andere wird verworfen.
 */
const ALLOWED = new Set(["requestId", "bookingRef", "status", "errorClass", "httpStatus", "engine", "route", "ms", "calendar", "reason", "count", "mail", "consumer", "seq"]);

export type LogFields = Partial<Record<"requestId" | "bookingRef" | "status" | "errorClass" | "httpStatus" | "engine" | "route" | "ms" | "calendar" | "reason" | "count" | "mail" | "consumer" | "seq", string | number | boolean>>;

export function logEvent(level: "info" | "warn" | "error", event: string, fields: LogFields = {}): void {
  const safe: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(fields)) if (ALLOWED.has(k) && v !== undefined) safe[k] = v;
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...safe });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Fehlerklasse ohne Nachricht, damit keine Eingaben oder Antworten mitgeschrieben werden. */
export function errorClass(e: unknown): string {
  if (e instanceof Error) return e.name || "Error";
  return typeof e;
}
