import { randomBytes } from "node:crypto";

/*
 * ULID: 26 Zeichen, erste 10 aus der Zeit in Millisekunden, 16 zufällig (Crockford-Base32).
 * Sortierbar nach Entstehungszeit, ohne verwechselbare Zeichen I, L, O, U.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(now: number = Date.now()): string {
  let t = now;
  let time = "";
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[t % 32] + time;
    t = Math.floor(t / 32);
  }
  const bytes = randomBytes(16);
  let rand = "";
  for (let i = 0; i < 16; i++) rand += ALPHABET[bytes[i] % 32];
  return time + rand;
}

export const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
