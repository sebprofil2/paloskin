/*
 * Handynummer normalisieren (E.164, zum Beispiel +4915158872566) und für die Anzeige formatieren (+49 151 58872566).
 * Läuft im Browser und auf dem Server; keine Abhängigkeiten.
 *   Leerzeichen, Bindestriche, Klammern, Punkte und Schrägstriche werden entfernt.
 *   0151…        -> +49151…        (deutsche Nummer mit führender Null)
 *   0049… / 49…  -> +49…
 *   15…/16…/17…  -> +49…           (deutsche Mobilnummer ohne führende Null)
 *   +…           bleibt (ausländische Nummern)
 * Liefert null, wenn die Nummer offensichtlich nicht stimmt.
 */
export function normalizePhoneE164(input: string): string | null {
  let s = (input ?? "").trim().replace(/[\s\-().\/]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (!/^\+?\d+$/.test(s)) return null;
  if (s.startsWith("+")) {
    // bleibt
  } else if (s.startsWith("0")) {
    s = "+49" + s.slice(1);
  } else if (/^49\d{8,}$/.test(s)) {
    s = "+" + s;
  } else if (/^1[5-7]\d{8,9}$/.test(s)) {
    s = "+49" + s;
  } else {
    return null;
  }
  const digits = s.slice(1);
  if (!/^[1-9]\d{6,14}$/.test(digits)) return null;
  if (s.startsWith("+49")) {
    const national = digits.slice(2);
    if (national.startsWith("0")) return null;
    if (national.length < 9 || national.length > 11) return null;
  }
  return s;
}

/** Anzeige: deutsche Mobilnummern als +49 151 58872566, andere Nummern unverändert. */
export function formatPhone(e164: string): string {
  const m = /^\+49(1[5-7]\d)(\d+)$/.exec(e164);
  return m ? `+49 ${m[1]} ${m[2]}` : e164;
}
