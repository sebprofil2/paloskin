"use client";

import { useRef } from "react";
import { homePath } from "@/lib/home-paths";
import { LANG_LABEL, LANG_SHORT, LANGS, langButtonLabel, saveLangChoice, type Lang } from "@/lib/i18n";
import { bookHref, MAPS, type KopfTexte } from "@/lib/kopf";
import { STUDIO } from "@/lib/studio";

/*
 * Kopfzeile und Fußzeile nach Entwurf B, gleich auf Startseite und Buchung. Sprachauswahl mit allen sieben Sprachen
 * (details und summary, per Tastatur bedienbar); auf dem Handy Menü hinter „Menü“ und kleiner Bewertungsknopf „★ 5,0“.
 * Startseite: Die Sprachwahl führt auf die eigene Adresse der Sprache („/“, /en, /es, /fr, /pt, /uk, /ar).
 * Mit onLang wechselt die Seite selbst (Buchung, Eingaben bleiben); ohne Skript dort ?lang=.
 * Sprachknopf (9. Oktober 2026): Pille mit dem Kürzel der Seitensprache (DE, EN, ES, FR, PT, UA, AR), auf dem Handy direkt
 * links neben „Menü“, im Stil des Menü-Knopfs; dieselbe Liste wie bisher. Im Menü bleibt die Auswahl zusätzlich.
 */
export function Kopfzeile({ lang, t, page, onLang }: { lang: Lang; t: KopfTexte; page: "home" | "booking"; onLang?: (id: Lang) => void }) {
  const langRef = useRef<HTMLDetailsElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const home = page === "home";
  const anchor = (id: string) => (home ? `#${id}` : `${homePath(lang)}#${id}`);
  const cur = LANGS.find((x) => x.id === lang)!;
  const close = () => {
    if (langRef.current) langRef.current.open = false;
    if (menuRef.current) menuRef.current.open = false;
  };
  // Immer nur eine Liste offen: Sprache oder Menü
  const only = (other: React.RefObject<HTMLDetailsElement | null>) => (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (e.currentTarget.open && other.current) other.current.open = false;
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
    <a href={home ? homePath(x.id) : `?lang=${x.id}`} lang={x.id} hrefLang={x.id} aria-current={x.id === lang ? "true" : undefined} onClick={(e) => pick(e, x.id)}>
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
        <a className="logo" href={home ? "#top" : homePath(lang)} aria-label="PALO SKIN by Dr. Vogel, Startseite">
          {/* Echte Logo-Datei aus dem Auftrag „Logo und Linkvorschau“ (Zeichen blau, Wortmarke anthrazit) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo/web/logo-kopf.svg" alt="PALO SKIN by Dr. Vogel" width={166} height={40} />
        </a>
        <nav className="dnav" aria-label={t.navAria}>
          <a className="rate" href={MAPS} target="_blank" rel="noopener">{t.rateLong}</a>
          {links}
        </nav>
        <details className="lang" ref={langRef} onToggle={only(menuRef)}>
          <summary className="pill" aria-label={langButtonLabel(lang)} title={cur.name}>
            <span aria-hidden="true" dir="ltr">{LANG_SHORT[lang]}</span>
          </summary>
          <ul>
            {LANGS.map((x) => (
              <li key={x.id}>{langLink(x)}</li>
            ))}
          </ul>
        </details>
        <a className="btn dbook" href={home ? bookHref(lang) : "#"} aria-current={home ? undefined : "page"}>{t.book}</a>
        <a className="rate mrate" href={MAPS} target="_blank" rel="noopener" aria-label={t.rateAria}>{t.rateShort}</a>
        <details className="mmenu" ref={menuRef} onToggle={only(langRef)}>
          <summary className="mbtn pill">{t.menu}</summary>
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

/* domain: „ · paloskin.de“ hinter dem Namen (Marke, 10. Oktober 2026); nicht auf Buchung und Verschieben */
export function Fusszeile({ lang, t, mobileBar, domain = false }: { lang: Lang; t: KopfTexte; mobileBar: boolean; domain?: boolean }) {
  return (
    <>
      <footer className="ft">
        <div className="wrap ft-in">
          <div className="ft-l">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo/web/zeichen.svg" alt="" width={20} height={28} />
            {domain ? (
              <span className="ft-name">
                <bdi>{t.copyright}</bdi>
                <span className="ft-sep" aria-hidden="true"> · </span>
                <bdi className="ft-dom">{STUDIO.domain}</bdi>
              </span>
            ) : (
              <bdi>{t.copyright}</bdi>
            )}
          </div>
          <div className="ft-r">
            <a href={bookHref(lang)}>{t.book}</a>
            <a href={legal("/impressum", lang)}>{t.imprint}</a>
            <a href={legal("/datenschutz", lang)}>{t.privacy}</a>
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

/* Impressum und Datenschutz haben keine eigenen Sprachadressen; ?lang= zeigt nur den Hinweis in der gewählten Sprache */
const legal = (path: string, lang: Lang) => (lang === "de" ? path : `${path}?lang=${lang}`);
