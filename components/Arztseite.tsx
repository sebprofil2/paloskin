import Image from "next/image";
import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import { BILDER } from "@/lib/bilder";
import { LANG_IDS, type Lang } from "@/lib/i18n";
import { bookHref, kopfTexte } from "@/lib/kopf";
import { arztPath } from "@/lib/seiten-pfade";
import { arztJsonLd } from "@/lib/share-meta";
import { ARZT_TEXTE, type ArztLang } from "@/lib/texts-arzt";
import { HOME_TEXTS } from "@/lib/texts-home";
import "@/app/design/design.css";

/*
 * Seite über Dr. med. Sebastian Vogel (10. Oktober 2026) im Design der Startseite: Kopfzeile, Text mit dem Startfoto,
 * Werdegang, Auszeichnungen, Sprachen, darunter „Termin buchen“. Text wörtlich aus lib/texts-arzt.ts.
 * Die Sprachwahl führt auf die Arztseite der Sprache; nicht freigegebene Sprachen leitet der Proxy auf Deutsch weiter.
 */

/* __kursiv__ aus den Texten (Zeitschriften); **fett** wird nicht mehr verwendet */
function Txt({ s }: { s: string }) {
  return (
    <>
      {s.split(/(\*\*[^*]+\*\*|__[^_]+__)/).map((part, i) =>
        part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith("__") ? <em key={i}>{part.slice(2, -2)}</em> : part,
      )}
    </>
  );
}

/* Abschnittsüberschrift wie auf der Startseite: zweiter Teil blau und kursiv in der zweiten Schrift */
function H2({ h }: { h: [string, string] }) {
  return <h2 className="h2">{h[0]} <em>{h[1]}</em></h2>;
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
      <Kopfzeile lang={lang} t={kopfTexte(home)} page="seite" langHrefs={langHrefs} />
      <main className="wrap arzt">
        <section className="arzt-top">
          <div>
            <h1 className="arzt-name">Dr. med. Sebastian Vogel</h1>
            <p className="arzt-sub">{t.sub}</p>
            <p className="arzt-intro">{t.intro}</p>
          </div>
          <div className="ph ph-hero">
            <Image src={BILDER.startbild} alt={t.alt} fill priority sizes="(max-width: 899px) 100vw, 440px" />
          </div>
        </section>

        <div className="arzt-txt">
          <H2 h={t.expH} />
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

          <H2 h={t.awardsH} />
          <ul className="arzt-awards">
            {t.awards.map((a) => (
              <li key={a}><Txt s={a} /></li>
            ))}
          </ul>

          <H2 h={t.langH} />
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
