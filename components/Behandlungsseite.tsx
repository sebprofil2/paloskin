import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import { ABSCHNITTE, BEHANDLUNGEN, inhalt, type BehandlungSlug } from "@/lib/behandlungen";
import { ARZTSEITE_LIVE, freigegeben } from "@/lib/freigabe";
import { LANG_IDS, type Lang } from "@/lib/i18n";
import { isTestInstance } from "@/lib/instance";
import { bookHref, kopfTexte } from "@/lib/kopf";
import { price } from "@/lib/preise";
import { arztPath, behandlungPath } from "@/lib/seiten-pfade";
import { behandlungJsonLd } from "@/lib/share-meta";
import { ARZT, PRUEFDATUM, STUDIO } from "@/lib/studio";
import { BEHANDLUNG_TEXTE } from "@/lib/texts-behandlung";
import { bewertungPille } from "@/lib/bewertungen";
import { HOME_TEXTS } from "@/lib/texts-home";
import { homePath } from "@/lib/home-paths";
import "@/app/design/design.css";

/*
 * Vorlage der Behandlungsseiten (Gerüst vom 10. Oktober 2026) im Design der Startseite: Brotkrumen, Überschrift mit
 * kursivem zweiten Teil, Kurzantwort, Abschnitte mit Fragen als Zwischenüberschriften, häufige Fragen zum Aufklappen,
 * Quellen, Hinweis zur Beratungssprache, passende Behandlungen, „Termin buchen“, Prüfvermerk mit Link zur Arztseite.
 * Preise, Sprachen und Prüfdatum aus den zentralen Angaben. Passende Behandlungen nur verlinkt, wenn freigegeben
 * (auf neu zur Ansicht alle).
 */

/** Text mit Platzhalter {name} für ein Element */
function mitName(text: string, name: React.ReactNode) {
  const [a, b] = text.split("{name}");
  return <>{a}{name}{b}</>;
}

export function Behandlungsseite({ slug, lang }: { slug: BehandlungSlug; lang: Lang }) {
  const t = BEHANDLUNG_TEXTE[lang];
  const home = HOME_TEXTS[lang];
  const c = inhalt(slug, lang);
  const b = BEHANDLUNGEN[slug];
  const test = isTestInstance();
  const langHrefs = Object.fromEntries(LANG_IDS.map((l) => [l, behandlungPath(slug, l)])) as Record<Lang, string>;
  const sprachen = new Intl.ListFormat(lang, { type: "conjunction" }).format(
    STUDIO.consultationLanguages.map((l) => new Intl.DisplayNames([lang], { type: "language" }).of(l) ?? l),
  );
  const datum = PRUEFDATUM[slug];
  const arztName = ARZTSEITE_LIVE || test ? <a href={arztPath(lang)}>{ARZT.name}</a> : <>{ARZT.name}</>;
  const passend = b.passend.filter((s) => test || freigegeben(s, lang) || freigegeben(s, "de"));
  const preis = b.preis ? (b.preis.ab ? home.priceFrom(price(lang, b.preis.key)) : price(lang, b.preis.key)) : null;
  return (
    <div className="pb" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: behandlungJsonLd(slug, lang) }} />
      <Kopfzeile lang={lang} t={kopfTexte(home)} page="seite" langHrefs={langHrefs} pille={bewertungPille(lang, home.googleB)} />
      <main className="wrap bh">
        <nav className="krumen" aria-label={t.krumenAria}>
          <ol>
            <li><a href={homePath(lang)}>{t.startseite}</a></li>
            <li><a href={`${homePath(lang)}#behandlungen`}>{t.behandlungen}</a></li>
            <li aria-current="page">{c.titelA} {c.titelB}</li>
          </ol>
        </nav>
        <h1 className="h2">{c.titelA} <em>{c.titelB}</em></h1>

        <div className="bh-kurz">
          <h2>{t.kurz}</h2>
          <p>{c.kurzantwort}</p>
        </div>

        <div className="bh-txt">
          {ABSCHNITTE.map((a) => (
            <section key={a}>
              <h2>{t.abschnitt[a]}</h2>
              {a === "kosten" && preis ? <p className="bh-preis"><strong>{t.richtwert}: <bdi>{preis}</bdi></strong></p> : null}
              {c.abschnitte[a].map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {a === "kosten" && preis ? <p className="fn">{home.pnote}</p> : null}
            </section>
          ))}
        </div>

        <section className="bh-fragen">
          <h2 className="h2">{t.fragen}</h2>
          <div className="faq-list">
            {c.fragen.map(([q, a]) => (
              <details className="fq" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="bh-txt">
          <section>
            <h2>{t.quellen}</h2>
            <ol className="bh-quellen">
              {c.quellen.map((q) => (
                <li key={q.titel}>{q.url ? <a href={q.url} target="_blank" rel="noopener">{q.titel}</a> : q.titel}</li>
              ))}
            </ol>
          </section>
          <p className="bh-sprache">{t.sprachen.replace("{sprachen}", sprachen)}</p>
          {passend.length ? (
            <section>
              <h2>{t.passend}</h2>
              <ul className="bh-passend">
                {passend.map((s) => (
                  <li key={s}>
                    <a href={behandlungPath(s, freigegeben(s, lang) ? lang : "de")}>
                      {inhalt(s, lang).titelA}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="bh-cta"><a className="btn" href={bookHref(lang)}>{home.book}</a></div>
          <p className="bh-geprueft">
            {datum
              ? mitName(t.geprueft.replace("{datum}", new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "Europe/Berlin" }).format(new Date(`${datum}T12:00:00Z`))), arztName)
              : mitName(t.pruefungOffen, arztName)}
          </p>
        </div>
      </main>
      <Fusszeile lang={lang} t={kopfTexte(home)} mobileBar domain />
    </div>
  );
}
