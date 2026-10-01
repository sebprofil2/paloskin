import { randomInt } from "node:crypto";

/* Kurze Buchungsnummer ohne verwechselbare Zeichen, zum Beispiel PS-7K3M9 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeBookingRef(): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `PS-${s}`;
}
