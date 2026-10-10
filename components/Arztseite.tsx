import Image from "next/image";
import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import { BILDER } from "@/lib/bilder";
import { LANG_IDS, type Lang } from "@/lib/i18n";
import { bookHref, kopfTexte } from "@/lib/kopf";
import { arztPath } from "@/lib/seiten-pfade";
import { arztJsonLd } from "@/lib/share-meta";
import { ARZT_TEXTE, type ArztLang } from "@/lib/texts-arzt";
import { bewertungPille } from "@/lib/bewertungen";
import { HOME_TEXTS } from "@/lib/texts-home";
import "@/app/design/design.css";

/*
 * Seite über Dr. med. Sebastian Vogel (10. Oktober 2026) im Design der Startseite: Kopfzeile, Text mit dem Startfoto,
 * Werdegang, Auszeichnungen, Sprachen, darunter „Termin buchen“. Text wörtlich aus lib/texts-arzt.ts.
 * Die Sprachwahl führt auf die Arztseite der Sprache; nicht freigegebene Sprachen leitet der Proxy auf Deutsch weiter.
 */

/* **fett** und __kursiv__ aus den Texten */
function Txt({ s }: { s: string }) {
  return (
    <>
      {s.split(/(\*\*[^*]+\*\*|__[^_]+__)/).map((part, i) =>
        part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith("__") ? <em key={i}>{part.slice(2, -2)}</em> : part,
      )}
    </>
  );
}

export function Arztseite({ lang }: { lang: ArztLang }) {
  const t = ARZT_TEXTE[lang];
  const home = HOME_TEXTS[lang];
  const langHrefs = Object.fromEntries(LANG_IDS.map((l) => [l, arztPath(l)])) as Record<Lang, string>;
  const pubs = t.exp[t.exp.length - 1];
  const stationen = t.exp.slice(0, -1);
  return (
    <div className="pb" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: arztJsonLd(lang) }} />
      <Kopfzeile lang={lang} t={kopfTexte(home)} page="seite" langHrefs={langHrefs} pille={bewertungPille(lang, home.googleB)} />
      <main className="wrap arzt">
        <section className="arzt-top">
          <div>
            <h1 className="h2">Dr. med. Sebastian Vogel</h1>
            <p className="arzt-sub"><strong>{t.sub}</strong></p>
            <p className="arzt-intro">{t.intro}</p>
          </div>
          <div className="ph ph-hero">
            <Image src={BILDER.startbild} alt={t.alt} fill priority sizes="(max-width: 899px) 100vw, 440px" />
          </div>
        </section>

        <div className="arzt-txt">
          <h2 className="h2">{t.expH}</h2>
          {stationen.map((b) => (
            <section key={b.h}>
              <h3>{b.h}</h3>
              <p><Txt s={b.p} /></p>
            </section>
          ))}
          <section>
            <h3>{pubs.h}</h3>
            <p><Txt s={pubs.p} /></p>
            <ul className="arzt-pubs">
              {t.pubLinks.map(([label, url]) => (
                <li key={url}><a href={url} target="_blank" rel="noopener">{label}</a></li>
              ))}
            </ul>
            {t.afterPub.map((p) => (
              <p key={p}><Txt s={p} /></p>
            ))}
          </section>

          <h2 className="h2">{t.awardsH}</h2>
          <ul className="arzt-awards">
            {t.awards.map((a) => (
              <li key={a}><Txt s={a} /></li>
            ))}
          </ul>

          <h2 className="h2">{t.langH}</h2>
          {t.langP.map((p) => (
            <p key={p}><Txt s={p} /></p>
          ))}

          <div className="arzt-cta"><a className="btn" href={bookHref(lang)}>{home.book}</a></div>
        </div>
      </main>
      <Fusszeile lang={lang} t={kopfTexte(home)} mobileBar domain />
    </div>
  );
}
