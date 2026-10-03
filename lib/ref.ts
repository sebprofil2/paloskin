import { createHash, randomInt } from "node:crypto";

/*
 * Kurze Buchungsnummer ohne verwechselbare Zeichen, zum Beispiel PS-7K3M9.
 * Aus der Anfragekennung des Browsers abgeleitet: dieselbe Anfrage ergibt dieselbe Nummer,
 * dadurch dient die Nummer als Idempotenzschlüssel im Kalender, die Anfragekennung selbst
 * wird nirgends gespeichert.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function bookingRefFor(requestId: string): string {
  const h = createHash("sha256").update(`paloskin-booking:${requestId}`).digest();
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[h[i] % ALPHABET.length];
  return `PS-${s}`;
}

/** Zufällige Nummer, nur für Zwecke ohne Anfragekennung. */
export function makeBookingRef(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `PS-${s}`;
}
