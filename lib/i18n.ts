/*
 * Seitensprache an einer Stelle: Liste, Erkennung, Speicherung, Schreibrichtung.
 * Gilt für Startseite, Buchung, Terminseite und Verschieben. Die Texte selbst stehen in
 * lib/texts-home.ts (Startseite), lib/texts.ts (Buchung), lib/texts-mail.ts (Mails, Terminseite, Verschieben)
 * und lib/share-meta.ts (Titel, Beschreibung, Vorschau).
 */
export type Lang = "de" | "en" | "es" | "fr" | "pt";

export const LANGS: { id: Lang; name: string; loc: string }[] = [
  { id: "de", name: "Deutsch", loc: "de-DE" },
  { id: "en", name: "English", loc: "en-GB" },
  { id: "es", name: "Español", loc: "es-ES" },
  { id: "fr", name: "Français", loc: "fr-FR" },
  { id: "pt", name: "Português", loc: "pt-BR" },
];

/* Fahnen der Sprachauswahl */
export const FLAGS: Record<Lang, string> = {
  de:'<svg viewBox="0 0 5 3" aria-hidden="true"><rect width="5" height="3" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
  en:'<svg viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true"><clipPath id="ukS"><path d="M0,0v30h60V0z"/></clipPath><clipPath id="ukT"><path d="M30,15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#ukS)"><path d="M0,0v30h60V0z" fill="#012169"/><path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0L60,30M60,0L0,30" clip-path="url(#ukT)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
  es:'<svg viewBox="0 0 3 2" preserveAspectRatio="none" aria-hidden="true"><rect width="3" height="2" fill="#AA151B"/><rect y=".5" width="3" height="1" fill="#F1BF00"/></svg>',
  fr:'<svg viewBox="0 0 3 2" preserveAspectRatio="none" aria-hidden="true"><rect width="1" height="2" fill="#002654"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE1126"/></svg>',
  pt:'<svg viewBox="0 0 20 14" preserveAspectRatio="none" aria-hidden="true"><rect width="20" height="14" fill="#009C3B"/><path d="M10 1.6L18.2 7 10 12.4 1.8 7z" fill="#FFDF00"/><circle cx="10" cy="7" r="3.4" fill="#002776"/><path d="M6.7 6.3a7.6 7.6 0 0 1 6.6 1.6" stroke="#fff" stroke-width=".55" fill="none"/></svg>'
};

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

export function langDir(_lang: Lang): "ltr" | "rtl" {
  return "ltr";
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
 */
export const LANG_MIGRATE_SCRIPT = `(function(){try{var d=document.documentElement,c=/(?:^|; )${LANG_COOKIE}=/.test(document.cookie),s=localStorage.getItem("${LANG_STORAGE}");if(!c&&s&&/^(${LANG_IDS.join("|")})$/.test(s)){document.cookie="${LANG_COOKIE}="+s+";path=/;max-age=${LANG_COOKIE_MAX_AGE};samesite=lax";if(s!==d.lang&&!/[?&]lang=/.test(location.search)){d.style.visibility="hidden";location.reload()}}}catch(e){}})();`;

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
