"use client";

import { useRef } from "react";
import { LANG_LABEL, LANGS, saveLangChoice, type Lang } from "@/lib/i18n";
import { bookHref, MAPS, type KopfTexte } from "@/lib/kopf";

/*
 * Kopfzeile und Fußzeile nach Entwurf B, gleich auf Startseite und Buchung. Sprachauswahl mit allen sieben Sprachen
 * (details und summary, per Tastatur bedienbar); auf dem Handy Menü hinter „Menü“ und kleiner Bewertungsknopf „★ 5,0“.
 * Ohne onLang lädt die Seite in der gewählten Sprache neu (?lang=); mit onLang wechselt die Seite selbst (Buchung, Eingaben bleiben).
 */
export function Kopfzeile({ lang, t, page, onLang }: { lang: Lang; t: KopfTexte; page: "home" | "booking"; onLang?: (id: Lang) => void }) {
  const langRef = useRef<HTMLDetailsElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const home = page === "home";
  const anchor = (id: string) => (home ? `#${id}` : `/#${id}`);
  const cur = LANGS.find((x) => x.id === lang)!;
  const close = () => {
    if (langRef.current) langRef.current.open = false;
    if (menuRef.current) menuRef.current.open = false;
  };
  const pick = (e: React.MouseEvent, id: Lang) => {
    saveLangChoice(id);
    close();
    if (onLang) {
      e.preventDefault();
      onLang(id);
    }
  };
  const langLink = (x: (typeof LANGS)[number]) => (
    <a href={`?lang=${x.id}`} lang={x.id} hrefLang={x.id} aria-current={x.id === lang ? "true" : undefined} onClick={(e) => pick(e, x.id)}>
      {x.name}
    </a>
  );
  const links = (
    <>
      <a href={anchor("studio")} onClick={close}>{t.navStudio}</a>
      <a href={anchor("behandlungen")} onClick={close}>{t.navTreat}</a>
      <a href={anchor("ablauf")} onClick={close}>{t.navHow}</a>
      <a href={anchor("fragen")} onClick={close}>{t.navFaq}</a>
    </>
  );
  return (
    <header className="hd">
      <div className="wrap hd-in">
        <a className="logo" href={home ? "#top" : "/"} aria-label="PALO SKIN by Dr. Vogel, Startseite">
          {/* Echte Logo-Datei aus dem Auftrag „Logo und Linkvorschau“ (Zeichen blau, Wortmarke anthrazit) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo/logo-kopf.svg" alt="PALO SKIN by Dr. Vogel" width={166} height={40} />
        </a>
        <nav className="dnav" aria-label={t.navAria}>
          <a className="rate" href={MAPS} target="_blank" rel="noopener">{t.rateLong}</a>
          {links}
        </nav>
        <details className="lang" ref={langRef}>
          <summary aria-label={`${LANG_LABEL[lang]}: ${cur.name}`}>
            <span lang={cur.id}>{cur.name}</span>
            <span aria-hidden="true">▾</span>
          </summary>
          <ul>
            {LANGS.map((x) => (
              <li key={x.id}>{langLink(x)}</li>
            ))}
          </ul>
        </details>
        <a className="btn dbook" href={home ? bookHref(lang) : "#"} aria-current={home ? undefined : "page"}>{t.book}</a>
        <a className="rate mrate" href={MAPS} target="_blank" rel="noopener" aria-label={t.rateAria}>{t.rateShort}</a>
        <details className="mmenu" ref={menuRef}>
          <summary className="mbtn">{t.menu}</summary>
          <div className="mpanel">
            <a className="rate" href={MAPS} target="_blank" rel="noopener">{t.rateLong}</a>
            {links}
            <div className="mlang" role="group" aria-label={LANG_LABEL[lang]}>
              {LANGS.map((x) => (
                <span key={x.id}>{langLink(x)}</span>
              ))}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export function Fusszeile({ lang, t, mobileBar }: { lang: Lang; t: KopfTexte; mobileBar: boolean }) {
  return (
    <>
      <footer className="ft">
        <div className="wrap ft-in">
          <div className="ft-l">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo/zeichen.svg" alt="" width={20} height={28} />
            <span>{t.copyright}</span>
          </div>
          <div className="ft-r">
            <a href={bookHref(lang)}>{t.book}</a>
            <a href="/impressum">{t.imprint}</a>
            <a href="/datenschutz">{t.privacy}</a>
          </div>
        </div>
      </footer>
      {mobileBar ? (
        <div className="bar">
          <a className="btn" href={bookHref(lang)}>{t.book}</a>
        </div>
      ) : null}
    </>
  );
}
