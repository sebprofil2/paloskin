import { readFile } from "node:fs/promises";
import path from "node:path";

/*
 * Zwischenlösung (Anfrage per WhatsApp) aus content/booking-interim.html.
 * Wird gezeigt, solange der Testbetrieb läuft und kein Testcode vorliegt.
 */
export interface InterimParts {
  style: string;
  body: string;
}

let cached: InterimParts | null = null;

export async function loadInterim(): Promise<InterimParts> {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const html = await readFile(path.join(process.cwd(), "content", "booking-interim.html"), "utf8");
  const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? "";
  cached = { style, body };
  return cached;
}
