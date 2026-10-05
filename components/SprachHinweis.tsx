"use client";

import { useEffect, useState } from "react";
import { hinweisSprache, homePath } from "@/lib/home-paths";
import { langDir, type Lang } from "@/lib/i18n";

/*
 * Kleiner Hinweis auf der deutschen Startseite (5. Oktober 2026): Ist die Sprache des Browsers eine unserer anderen
 * Sprachen, steht unter der Kopfzeile ein schließbarer Hinweis mit Link auf die eigene Adresse (zum Beispiel /en).
 * Keine automatische Weiterleitung. Nur im Browser: Der Server liefert ihn nie aus, Suchmaschinen sehen ihn nicht.
 * Geschlossen bleibt geschlossen (localStorage).
 */
const TEXT: Record<Exclude<Lang, "de">, { text: string; link: string; close: string }> = {
  en: { text: "This page is also available in", link: "English", close: "Close" },
  es: { text: "Esta página también está disponible en", link: "español", close: "Cerrar" },
  fr: { text: "Cette page est aussi disponible en", link: "français", close: "Fermer" },
  pt: { text: "Esta página também está disponível em", link: "português", close: "Fechar" },
  uk: { text: "Ця сторінка також доступна", link: "українською", close: "Закрити" },
  ar: { text: "هذه الصفحة متوفرة أيضًا", link: "باللغة العربية", close: "إغلاق" },
};
const STORE = "paloSprachHinweis";

export function SprachHinweis() {
  const [lang, setLang] = useState<Exclude<Lang, "de"> | null>(null);
  useEffect(() => {
    try {
      if (localStorage.getItem(STORE)) return;
    } catch {
      /* gesperrt: Hinweis trotzdem zeigen */
    }
    const l = hinweisSprache(navigator.languages?.length ? navigator.languages : [navigator.language]);
    // Erst nach dem Laden im Browser setzen; der Server kennt die Browsersprache nicht und rendert nichts
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l) setLang(l);
  }, []);
  if (!lang) return null;
  const t = TEXT[lang];
  const zu = () => {
    setLang(null);
    try {
      localStorage.setItem(STORE, "1");
    } catch {
      /* gesperrt: nur für diesen Besuch geschlossen */
    }
  };
  return (
    <div className="shint" lang={lang} dir={langDir(lang)} role="note">
      <div className="wrap shint-in">
        <p>
          {t.text} <a href={homePath(lang)} hrefLang={lang}>{t.link}</a>
        </p>
        <button type="button" onClick={zu} aria-label={t.close}>×</button>
      </div>
    </div>
  );
}
