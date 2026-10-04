"use client";

import { useEffect, useRef, useState } from "react";
import { LANG_LABEL, LANGS, saveLangChoice, type Lang } from "@/lib/i18n";

/*
 * Sprachauswahl oben rechts im Kopf: Aufklappliste mit den Sprachnamen in der jeweiligen Sprache, ohne Flaggen,
 * im dezenten Stil des Schalters der Startseite (gleiches Markup wie public/assets/sprachwahl.js).
 * Die Wahl wird gespeichert (Cookie und localStorage). Mit onChange wechselt die Seite selbst die Sprache
 * (Buchung, Eingaben bleiben erhalten); ohne onChange lädt die Seite mit ?lang= neu (Terminseite, Verschieben).
 */
export function Sprachwahl({ lang, onChange }: { lang: Lang; onChange?: (id: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const cur = LANGS.find((x) => x.id === lang)!;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const choose = (id: Lang) => {
    setOpen(false);
    saveLangChoice(id);
    if (onChange) {
      onChange(id);
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set("lang", id);
    location.replace(url.toString());
  };

  return (
    <div className="lang">
      <button
        ref={btn}
        type="button"
        className="lang-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={LANG_LABEL[lang]}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <span lang={cur.id}>{cur.name}</span>
        <span className="chev" aria-hidden="true" />
      </button>
      {open ? (
        <div className="lang-menu" role="menu">
          {LANGS.map((x) => (
            <button
              key={x.id}
              type="button"
              className="lang-item"
              role="menuitemradio"
              aria-checked={x.id === lang}
              lang={x.id}
              onClick={(e) => {
                e.stopPropagation();
                choose(x.id);
              }}
            >
              {x.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
