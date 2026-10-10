import { isLang, langDir, type Lang } from "@/lib/i18n";
import { ADDRESS, MAPS_LINK, PHONE, STUDIO, WA_LINK } from "@/lib/texts-mail";
import { LogoKopf } from "@/components/LogoKopf";
import { Sprachwahl } from "@/components/Sprachwahl";

/* Rahmen der Terminseiten: Kopf mit Marke und Sprachauswahl, Überschrift, Fußkasten mit Adresse und WhatsApp. */

/** Sprache der Terminseiten: die gewählte (?lang=), sonst die Sprache der Buchung (wie die Mails) */
export function terminLang(param: string | string[] | undefined, bookingLang: Lang): Lang {
  const v = Array.isArray(param) ? param[0] : param;
  return isLang(v) ? v : bookingLang;
}

/** ?lang= an Links der Terminseiten anhängen, wenn die Seite in einer anderen Sprache als die Buchung läuft */
export function langSuffix(lang: Lang, bookingLang: Lang, sep: "?" | "&" = "?"): string {
  return lang === bookingLang ? "" : `${sep}lang=${lang}`;
}

export function Footer() {
  return (
    <div className="note">
      <strong>{STUDIO}</strong>
      <a href={MAPS_LINK} target="_blank" rel="noopener" dir="ltr">{ADDRESS}</a>
      <br />
      WhatsApp <a href={WA_LINK} target="_blank" rel="noopener" dir="ltr">{PHONE}</a>
    </div>
  );
}

export function Shell({ title, lang, children }: { title: string; lang: Lang; children: React.ReactNode }) {
  return (
    <div className="shell" lang={lang} dir={langDir(lang)}>
      <main className="app" style={{ minHeight: "auto" }}>
        <div className="band" />
        <div className="brand">
          <a href="/" aria-label="PALO SKIN by Dr. Vogel, Startseite">
            <LogoKopf />
          </a>
          <Sprachwahl lang={lang} />
        </div>
        <div className="page" style={{ gap: 20, paddingBottom: 8 }}>
          <h2 style={{ marginTop: 8 }}>{title}</h2>
        </div>
        {children}
      </main>
    </div>
  );
}
