import { z } from "zod";
import { checkPhone } from "./phone";

/*
 * Walk-in-Meldung des Kundensystems (POST /intern/v1/walk-ins, Auftrag Dr. Vogel, 9. Oktober 2026): Eingaben prüfen.
 * Check-in-Zeit höchstens 10 Minuten voraus (Uhrabweichung) und höchstens 7 Tage zurück, auf die Minute abgerundet.
 * Dauer 5 bis 240 Minuten, ohne Angabe 30. Handynummer bereinigt wie bei der Online-Buchung (lib/phone.ts).
 */
export const WALK_IN_AHEAD_MS = 10 * 60000;
export const WALK_IN_BACK_MS = 7 * 86400000;
export const WALK_IN_DEFAULT_MINUTES = 30;

const schema = z
  .object({
    request_id: z.uuid(),
    first_name: z.string().trim().min(1).max(60),
    last_name: z.string().trim().max(60).default(""),
    phone: z.string().trim().max(80),
    email: z.email().max(120).nullable().default(null),
    checked_in_at: z.iso.datetime({ offset: true }),
    duration_minutes: z.number().int().min(5).max(240).default(WALK_IN_DEFAULT_MINUTES),
    first_visit: z.boolean().default(false),
  })
  .strict();

export interface WalkInFields {
  requestId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  checkedInAt: Date;
  durationMinutes: number;
  firstVisit: boolean;
}

/** Geprüfte Meldung oder null (Antwort 400 invalid). */
export function parseWalkIn(body: unknown, now = new Date()): WalkInFields | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) return null;
  const d = parsed.data;
  const phone = checkPhone(d.phone);
  if (!phone) return null;
  const checkedInAt = new Date(Math.floor(Date.parse(d.checked_in_at) / 60000) * 60000);
  const t = checkedInAt.getTime();
  if (t > now.getTime() + WALK_IN_AHEAD_MS || t < now.getTime() - WALK_IN_BACK_MS) return null;
  return {
    requestId: d.request_id,
    firstName: d.first_name,
    lastName: d.last_name,
    phone: phone.value,
    email: (d.email ?? "").trim().toLowerCase(),
    checkedInAt,
    durationMinutes: d.duration_minutes,
    firstVisit: d.first_visit,
  };
}
