/*
 * Seitensprache an einer Stelle: Liste, Erkennung, Speicherung, Schreibrichtung.
 * Gilt für Startseite, Buchung, Terminseite und Verschieben. Die Texte selbst stehen in
 * lib/texts-home.ts (Startseite), lib/texts.ts (Buchung), lib/texts-mail.ts (Mails, Terminseite, Verschieben)
 * und lib/share-meta.ts (Titel, Beschreibung, Vorschau).
 */
export type Lang = "de" | "en" | "es" | "fr" | "pt" | "uk" | "ar";

export const LANGS: { id: Lang; name: string; loc: string }[] = [
  { id: "de", name: "Deutsch", loc: "de-DE" },
  { id: "en", name: "English", loc: "en-GB" },
  { id: "es", name: "Español", loc: "es-ES" },
  { id: "fr", name: "Français", loc: "fr-FR" },
  { id: "pt", name: "Português", loc: "pt-BR" },
  { id: "uk", name: "Українська", loc: "uk-UA" },
  // Arabisch mit lateinischen Ziffern (Uhrzeiten, Daten, Preise wie auf dem Schild und im Kalender)
  { id: "ar", name: "العربية", loc: "ar-u-nu-latn" },
];

/** Beschriftung der Sprachauswahl für Vorlesehilfen, in der Seitensprache */
export const LANG_LABEL: Record<Lang, string> = { de: "Sprache", en: "Language", es: "Idioma", fr: "Langue", pt: "Idioma", uk: "Мова", ar: "اللغة" };

/* Beratungssprachen: in diesen fünf Sprachen berät Dr. Vogel; getrennt von der Seitensprache (Entscheidung 4. Oktober 2026) */
export type ConsultLang = "de" | "en" | "es" | "fr" | "pt";
export const CONSULT_LANGS: { id: ConsultLang; name: string }[] = [
  { id: "de", name: "Deutsch" },
  { id: "en", name: "English" },
  { id: "es", name: "Español" },
  { id: "fr", name: "Français" },
  { id: "pt", name: "Português" },
];
export const CONSULT_IDS: ConsultLang[] = CONSULT_LANGS.map((x) => x.id);
export function isConsultLang(v: unknown): v is ConsultLang {
  return typeof v === "string" && (CONSULT_IDS as string[]).includes(v);
}
/** Vorauswahl der Beratungssprache: die Seitensprache, wenn sie eine der fünf ist; bei Ukrainisch und Arabisch keine */
export function defaultConsult(lang: Lang): ConsultLang | null {
  return isConsultLang(lang) ? lang : null;
}
/** Für das Studio ausgeschrieben auf Deutsch: Kalender, Mail „Neue Buchung“, 18-Uhr-Liste */
export const CONSULT_NAMES_DE: Record<ConsultLang, string> = { de: "Deutsch", en: "Englisch", es: "Spanisch", fr: "Französisch", pt: "Portugiesisch" };

export const LANG_IDS: Lang[] = LANGS.map((x) => x.id);

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANG_IDS as string[]).includes(v);
}

/** Gewählte Sprache: Cookie für den Server, dazu wie bisher localStorage „paloLang“ im Browser. */
export const LANG_COOKIE = "palo_lang";
export const LANG_STORAGE = "paloLang";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** Vom Proxy gesetzte Kopfzeile mit der erkannten Sprache der Anfrage */
export const LANG_HEADER = "x-palo-lang";

/** Arabisch von rechts nach links, alle anderen von links nach rechts */
export function langDir(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

/** Sprachen aus Accept-Language in der Reihenfolge der Gewichtung, nur die ersten zwei Buchstaben. */
function acceptLanguages(header: string): string[] {
  return header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => /^\s*q=([\d.]+)/.exec(p)?.[1]).find(Boolean);
      return { code: tag.trim().slice(0, 2).toLowerCase(), q: q === undefined ? 1 : Number(q), i };
    })
    .filter((x) => x.code && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
    .map((x) => x.code);
}

/*
 * Reihenfolge wie bisher im Browser (public/assets/lang.js): Adresse (?lang=), gespeicherte Wahl,
 * Sprache des Geräts, sonst Deutsch. Jetzt auf dem Server, damit nichts beim Laden umspringt.
 */
export function pickLang({ param, cookie, acceptLanguage }: { param?: string | null; cookie?: string | null; acceptLanguage?: string | null }): Lang {
  if (isLang(param)) return param;
  if (isLang(cookie)) return cookie;
  for (const code of acceptLanguages(acceptLanguage ?? "")) if (isLang(code)) return code;
  return "de";
}

/*
 * Einmalige Übernahme für Besucher, die ihre Sprache vor der Umstellung nur im localStorage gespeichert haben:
 * Cookie nachtragen und, falls die Seite in einer anderen Sprache kam, einmal neu laden (unsichtbar).
 * Nicht auf der Startseite: Dort bestimmt die Adresse die Sprache („/“ immer Deutsch).
 */
export const LANG_MIGRATE_SCRIPT = `(function(){try{var d=document.documentElement,c=/(?:^|; )${LANG_COOKIE}=/.test(document.cookie),s=localStorage.getItem("${LANG_STORAGE}");if(!c&&s&&/^(${LANG_IDS.join("|")})$/.test(s)){document.cookie="${LANG_COOKIE}="+s+";path=/;max-age=${LANG_COOKIE_MAX_AGE};samesite=lax";if(s!==d.lang&&!/[?&]lang=/.test(location.search)&&!/^\\/([a-z]{2})?$/.test(location.pathname)){d.style.visibility="hidden";location.reload()}}}catch(e){}})();`;

/** Im Browser: Wahl speichern (Cookie und localStorage) und Sprache des Dokuments setzen. */
export function saveLangChoice(lang: Lang): void {
  document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=${LANG_COOKIE_MAX_AGE};samesite=lax`;
  try {
    localStorage.setItem(LANG_STORAGE, lang);
  } catch {
    /* privat oder gesperrt: Cookie reicht */
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = langDir(lang);
}
