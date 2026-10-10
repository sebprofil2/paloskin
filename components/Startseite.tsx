import type { Metadata } from "next";
import Image from "next/image";
import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import { bookHref, kopfTexte, MAPS } from "@/lib/kopf";
import { BILDER } from "@/lib/bilder";
import { STUDIO } from "@/lib/studio";
import { SprachHinweis } from "@/components/SprachHinweis";
import { homeJsonLd } from "@/lib/share-meta";
import { HOME_TEXTS, REVIEWS, type HomeTexts } from "@/lib/texts-home";
import type { Lang } from "@/lib/i18n";
import "@/app/design/design.css";

/*
 * Startseite nach Entwurf B „Persönlich“ (Vorlage vom 5. Oktober 2026): Aufbau, Texte und Gestaltung wie in der Vorlage,
 * Werte zentral in app/design/design.css, Texte in lib/texts-home.ts, Bilder in lib/bilder.ts.
 * Seit 5. Oktober 2026 mit eigener Adresse je Sprache: app/page.tsx (Deutsch auf „/“) und app/[lang]/page.tsx
 * (/en, /es, /fr, /pt, /uk, /ar) zeigen diese Seite; die Sprache kommt aus der Adresse, nie aus dem Gerät.
 */
const WA = STUDIO.whatsapp;
const TEL = STUDIO.phone.tel;
const IG = STUDIO.instagram.url;
const THOUSANDS: Record<Lang, string> = { de: ".", en: ",", es: ".", fr: " ", pt: ".", it: ".", tr: ".", uk: " ", ar: "," };
const price = (lang: Lang, n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS[lang])} €*`;

/* Zweiteilige Überschrift: zweiter Teil kursiv in Blau */
function H({ a, b, as: Tag = "h2", className = "h2", style }: { a: string; b: string; as?: "h1" | "h2"; className?: string; style?: React.CSSProperties }) {
  return (
    <Tag className={className} style={style}>
      {a} <em>{b}</em>
    </Tag>
  );
}

/* Symbole der Karten „Für wen“, wie in der Vorlage */
const ICONS = [
  <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 14l2 2 3-3" /></>,
  <><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path d="M3 11h18v6H3z" /><path d="M6 17v2M18 17v2" /></>,
  <><path d="M4 5h16v11H9l-5 4z" /></>,
  <><path d="M20 4c-6 0-11 4-13 10l-3 6" /><path d="M7 14c3 0 7-1 9-4" /></>,
  <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
];

function Google({ t }: { t: HomeTexts }) {
  return (
    <a className="gbtn" href={MAPS} target="_blank" rel="noopener">
      {t.googleA} <span className="st5" aria-hidden="true">★★★★★</span>
      <span className="sr">5 / 5</span> {t.googleB}
    </a>
  );
}

export function Startseite({ lang }: { lang: Lang }) {
  const t = HOME_TEXTS[lang];
  const book = bookHref(lang);
  const why: [string, string][] = [[t.why1H, t.why1P], [t.why2H, t.why2P], [t.why3H, t.why3P], [t.why4H, t.why4P], [t.why5H, t.why5P], [t.why6H, t.why6P]];
  const treat = [
    { h: t.t1H, d: t.t1D, alt: t.t1Alt, img: BILDER.faltenbehandlung, p: t.priceFrom(price(lang, 120)) },
    { h: t.t2H, d: t.t2D, alt: t.t2Alt, img: BILDER.kaumuskel, p: price(lang, 280) },
    { h: t.t3H, d: t.t3D, alt: t.t3Alt, img: BILDER.nefertiti, p: price(lang, 280) },
    { h: t.t4H, d: t.t4D, alt: t.t4Alt, img: BILDER.lachsDna, p: t.priceFrom(price(lang, 280)) },
  ];
  const photos = [
    { img: BILDER.beratungsraum, c: t.photoConsult },
    { img: BILDER.behandlungsraum, c: t.photoTreat },
    { img: BILDER.lamellen, c: t.photoStudio },
    { img: BILDER.eingang, c: t.photoEntrance },
  ];
  const faq: [string, string][] = [[t.q1, t.a1], [t.q2, t.a2], [t.q3, t.a3], [t.q4, t.a4]];
  return (
    <div className="pb" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homeJsonLd(lang) }} />
      <Kopfzeile lang={lang} t={kopfTexte(t)} page="home" />
      {lang === "de" ? <SprachHinweis /> : null}

      <section className="wrap hero">
        <div className="hero-text">
          <p className="eyebrow plain">{t.heroEyebrow}</p>
          <h1 className="h1">
            <bdi>{t.h1A}</bdi> <em><bdi>{t.h1B}</bdi></em>
          </h1>
          <p className="lead">{t.lead}</p>
          <div className="cta-row">
            <a className="btn" href={book}>{t.book}</a>
            <Google t={t} />
          </div>
        </div>
        <div className="arch">
          <div className="ph ph-hero">
            <Image src={BILDER.startbild} alt={t.heroAlt} fill priority sizes="(max-width: 899px) 100vw, (max-width: 1200px) 45vw, 520px" />
            <div className="nameplate">
              {/* Erste Zeile nur der Name (Entscheidung Dr. Vogel, 10. Oktober 2026), zweite Zeile die Rolle */}
              <b><bdi className="nw">Dr. med. Sebastian Vogel</bdi></b>
              <span>{t.docRole}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="studio" style={{ paddingBottom: "var(--sp-104)" }}>
        <div className="wrap">
          <div className="panel">
            <div className="panel-head">
              <H a={t.docHA} b={t.docHB} />
              <Image className="ph-hand" src={BILDER.haende} alt={t.handAlt} sizes="(max-width: 899px) 100vw, 400px" />
            </div>
            <div className="panel-txt">
              <blockquote className="quote">{t.quote}</blockquote>
              <ul className="contact">
                <li>{t.address}</li>
                <li className="links">
                  <a href={MAPS} target="_blank" rel="noopener">{t.mapL}</a>
                  {/* Telefon und WhatsApp unter derselben Nummer (Entscheidung Dr. Vogel, 10. Oktober 2026) */}
                  <span className="tel">{t.phoneWa} <a href={TEL}><bdi>{STUDIO.phone.display}</bdi></a></span>
                  <a href={WA} target="_blank" rel="noopener">WhatsApp</a>
                  <a href={IG} target="_blank" rel="noopener"><bdi>Instagram {STUDIO.instagram.handle}</bdi></a>
                </li>
              </ul>
              <details className="studio">
                <summary className="btn ghost"><span className="lbl1">{t.studioOpen}</span><span className="lbl2">{t.studioClose}</span></summary>
                <div className="studio-grid">
                  {photos.map((p) => (
                    <figure key={p.c}>
                      {/* Ohne sichtbare Beschriftung (Entscheidung Dr. Vogel, 5. Oktober 2026), der Alt-Text bleibt */}
                      <Image src={p.img} alt={p.c} sizes="(max-width: 899px) 50vw, 160px" />
                    </figure>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: "var(--sp-104)" }}>
        <div className="wrap">
          <div className="sec-head center">
            <H a={t.whyHA} b={t.whyHB} />
          </div>
          <div className="why">
            {why.map(([h, p], i) => (
              <div className="wc" key={h}>
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[i]}</svg>
                </div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="behandlungen" style={{ paddingBottom: "var(--sp-104)" }}>
        <div className="wrap">
          <div className="sec-head center">
            <H a={t.treatHA} b={t.treatHB} />
          </div>
          <div className="treat">
            {treat.map((c) => (
              <div className="tc" key={c.h}>
                <div className="ph">
                  <Image src={c.img} alt={c.alt} fill sizes="(max-width: 899px) 112px, (max-width: 1023px) 50vw, 300px" />
                </div>
                <div className="tc-b">
                  <h3>{c.h}</h3>
                  <p className="tc-d">{c.d}</p>
                  <p className="tc-p"><span className="price"><bdi>{c.p}</bdi></span></p>
                </div>
              </div>
            ))}
          </div>
          <details className="prices">
            <summary className="btn ghost">{t.allPrices}</summary>
            <div className="plist">
              <div className="prow">
                <div className="prow-l"><b>{t.pZones}</b></div>
                <div className="prow-r">
                  <span>{t.pZone1} <bdi>{price(lang, 120)}</bdi></span>
                  <span>{t.pZone2} <bdi>{price(lang, 210)}</bdi></span>
                  <span>{t.pZone3} <bdi>{price(lang, 300)}</bdi></span>
                  <span>{t.pZoneMore} <bdi>{price(lang, 80)}</bdi></span>
                </div>
              </div>
              <div className="prow"><div className="prow-l"><b>{t.t3H}</b><span>{t.pNefD}</span></div><div className="prow-r"><bdi>{price(lang, 280)}</bdi></div></div>
              <div className="prow"><div className="prow-l"><b>{t.t2H}</b><span>{t.t2D.replace(/\.$/, "")}</span></div><div className="prow-r"><bdi>{price(lang, 280)}</bdi></div></div>
              <div className="prow"><div className="prow-l"><b>{t.pAchselH}</b><span>{t.pAchselD}</span></div><div className="prow-r"><bdi>{price(lang, 480)}</bdi></div></div>
              <div className="prow">
                <div className="prow-l"><b>{t.pLachsH}</b></div>
                <div className="prow-r">
                  <span>{t.pLachs1} <bdi>{price(lang, 280)}</bdi></span>
                  <span>{t.pLachs4} <bdi>{price(lang, 1000)}</bdi></span>
                </div>
              </div>
            </div>
            <p className="fn">{t.pnote}</p>
          </details>
        </div>
      </section>

      <section id="ablauf" style={{ paddingBottom: "var(--sp-104)" }}>
        <div className="wrap">
          <div className="ablauf">
            <div className="sec-head center">
              <H a={t.howHA} b={t.howHB} />
            </div>
            <div className="steps">
              {([[t.s1H, t.s1P], [t.s2H, t.s2P], [t.s3H, t.s3P]] as [string, string][]).map(([h, p], i) => (
                <div className="sc" key={h}>
                  <span className="sn" aria-hidden="true">{i + 1}</span>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              ))}
            </div>
            <div className="ab-cta"><a className="btn" href={book}>{t.book}</a></div>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: "var(--sp-104)" }}>
        <div className="wrap">
          <div className="rev-head">
            <div className="sec-head">
              <H a={t.revHA} b={t.revHB} />
            </div>
            <Google t={t} />
          </div>
          <div className="revs">
            {REVIEWS.map((r) => (
              <div className="rc" key={r.name}>
                <blockquote lang={r.lang} dir="ltr">{r.text}</blockquote>
                <p className="by"><span className="av" aria-hidden="true">{r.initial}</span><bdi>{r.name} · Google Maps</bdi></p>
              </div>
            ))}
          </div>
          <div className="rev-foot">
            <a className="btn ghost" href={MAPS} target="_blank" rel="noopener">{t.allReviews}</a>
          </div>
        </div>
      </section>

      <section id="fragen" style={{ paddingBottom: "var(--sp-104)" }}>
        <div className="wrap">
          <div className="sec-head center">
            <H a={t.faqHA} b={t.faqHB} style={{ marginTop: 0 }} />
          </div>
          <div className="faq-list">
            {faq.map(([q, a]) => (
              <details className="fq" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="termin">
        <div className="wrap">
          <div className="cta">
            <H a={t.ctaHA} b={t.ctaHB} />
            <a className="btn light" href={book}>{t.book}</a>
          </div>
        </div>
      </section>

      <Fusszeile lang={lang} t={kopfTexte(t)} mobileBar domain />
    </div>
  );
}
