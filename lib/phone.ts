/*
 * Handynummer bereinigen, auf E.164 bringen (zum Beispiel +4915158872566) und für die Anzeige formatieren.
 * Läuft im Browser und auf dem Server; keine Abhängigkeiten.
 *
 * Fehler auf www vom 5. Oktober 2026: Das iPhone setzt beim Einfügen einer Nummer aus den Kontakten unsichtbare
 * Richtungszeichen um die Nummer (U+202A … U+202C); die alte Prüfung entfernte nur Leerzeichen und Trennzeichen und
 * lehnte solche Nummern ab. Deshalb jetzt:
 *   1. Bereinigen: Unicode-Ziffern (volle Breite, arabisch-indisch und andere) werden zu 0-9, „＋“ zu „+“;
 *      danach bleibt nur ein führendes Plus und Ziffern, alles andere (unsichtbare Zeichen, Leerzeichen, Trenner) fällt weg.
 *   2. Normalisieren: 00… -> +…, 0… -> +49…, 49… -> +49…, 15…/16…/17… -> +49…; +49 0… -> +49… (überzählige Null).
 *   3. Gültig: deutsche Handynummern 015x, 016x, 017x mit 7 oder 8 Ziffern nach der Vorwahl (10 oder 11 Ziffern nach
 *      der 49) und ausländische Nummern mit + und 8 bis 15 Ziffern.
 * Eine ungewöhnliche Nummer verhindert die Buchung nicht: Der Kunde sieht nur einen freundlichen Hinweis, die Buchung
 * trägt für das Studio den Vermerk „Nummer prüfen“ (phoneUnusual). Ohne jede Ziffer gibt es keine Buchung.
 */

/* Erste Ziffer (Wert 0) der häufigen Ziffernblöcke außerhalb von ASCII; volle Breite und mathematische Ziffern erledigt NFKC */
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x07c0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66, 0x0e50, 0x0ed0, 0x0f20, 0x1040, 0x17e0, 0x1810];

function asciiDigit(ch: string): string {
  const cp = ch.codePointAt(0)!;
  for (const zero of DIGIT_ZEROS) if (cp >= zero && cp <= zero + 9) return String(cp - zero);
  return ch;
}

/** Nur Ziffern und ein führendes Plus; Unicode-Ziffern als 0-9. Leer, wenn keine Ziffer vorkommt. */
export function cleanPhone(input: string): string {
  const s = (input ?? "").normalize("NFKC").replace(/\p{Nd}/gu, asciiDigit);
  const lead = s.replace(/[^\d+]/g, "");
  const digits = lead.replace(/\D/g, "");
  if (!digits) return "";
  return (lead.startsWith("+") ? "+" : "") + digits;
}

/** Ergebnis der Prüfung: value ist immer + und Ziffern (für Datenbank und Schnittstelle), valid nach den Regeln oben. */
export interface PhoneCheck {
  value: string;
  valid: boolean;
}

export function checkPhone(input: string): PhoneCheck | null {
  let s = cleanPhone(input);
  if (!s) return null;
  if (s.startsWith("00")) s = "+" + s.slice(2);
  else if (s.startsWith("0")) s = "+49" + s.slice(1);
  else if (!s.startsWith("+") && /^49\d{8,}$/.test(s)) s = "+" + s;
  else if (!s.startsWith("+") && /^1[5-7]\d{8,9}$/.test(s)) s = "+49" + s;
  else if (!s.startsWith("+")) return { value: "+" + s, valid: false };
  // Häufiger Tippfehler: +49 0151 …
  if (/^\+490\d/.test(s)) s = "+49" + s.slice(4);
  const digits = s.slice(1);
  if (digits.startsWith("49")) return { value: s, valid: /^1[5-7]\d{8,9}$/.test(digits.slice(2)) };
  return { value: s, valid: /^[1-9]\d{7,14}$/.test(digits) };
}

/** Gültige Nummer in E.164, sonst null (Prüfung im Browser und für bestehende Aufrufer). */
export function normalizePhoneE164(input: string): string | null {
  const c = checkPhone(input);
  return c && c.valid ? c.value : null;
}

/** Gespeicherte Nummer, die nicht den Regeln entspricht: Vermerk „Nummer prüfen“ für das Studio. */
export function phoneUnusual(stored: string): boolean {
  return !(checkPhone(stored)?.valid ?? false);
}

/** Anzeige: deutsche Mobilnummern als +49 151 58872566, andere Nummern unverändert. */
export function formatPhone(e164: string): string {
  const m = /^\+49(1[5-7]\d)(\d+)$/.exec(e164);
  return m ? `+49 ${m[1]} ${m[2]}` : e164;
}
