import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, LANG_LABEL, LANG_MIGRATE_SCRIPT, LANG_STORAGE, LANGS, langDir, type Lang } from "./i18n";
import { hreflangLinks, homeShare, SHARE_IMAGES, STUDIO_JSONLD } from "./share-meta";
import { HOME_TEXTS } from "./texts-home";

/*
 * Startseite als fertiges HTML vom Server (app/route.ts). Bis 4. Oktober 2026 lag sie als public/index.html mit
 * Übersetzung im Browser (lang.js, home-text.js). Aufbau und Klassen sind unverändert (public/assets/site.css),
 * die Texte kommen aus lib/texts-home.ts, Titel und Vorschau aus lib/share-meta.ts, die Sprache vom Server.
 * Bewusst ohne React-Laufzeit: Die Seite lädt so schnell wie die frühere statische Fassung.
 * Sprachmenü und Zonen-Link: public/assets/sprachwahl.js.
 */

/** Text und Attributwerte maskieren */
export function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Daten für public/assets/sprachwahl.js; „<“ maskiert, damit nichts das Skript-Element schließen kann */
function menuData(lang: Lang): string {
  const data = {
    label: LANG_LABEL[lang],
    cookie: LANG_COOKIE,
    storage: LANG_STORAGE,
    maxAge: LANG_COOKIE_MAX_AGE,
    langs: LANGS.map((x) => ({ id: x.id, name: x.name })),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function head(lang: Lang): string {
  const s = homeShare(lang);
  const img = SHARE_IMAGES.map(
    (i) => `<meta property="og:image" content="${esc(i.url)}">
<meta property="og:image:width" content="${i.width}">
<meta property="og:image:height" content="${i.height}">
<meta property="og:image:alt" content="${esc(i.alt)}">`,
  ).join("\n");
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script>${LANG_MIGRATE_SCRIPT}</script>
<title>${esc(s.title)}</title>
<meta name="description" content="${esc(s.description)}">
<link rel="canonical" href="${esc(s.canonical)}">
${hreflangLinks("/").map((l) => `<link rel="alternate" hreflang="${l.hreflang}" href="${esc(l.href)}">`).join("\n")}
<meta property="og:title" content="${esc(s.title)}">
<meta property="og:description" content="${esc(s.description)}">
<meta property="og:url" content="${esc(s.url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PALO SKIN by Dr. Vogel">
<meta property="og:locale" content="${s.locale}">
${img}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(s.title)}">
<meta name="twitter:description" content="${esc(s.description)}">
<meta name="twitter:image" content="${esc(SHARE_IMAGES[0].url)}">
<meta name="theme-color" content="#002FA7">
<!-- Nur ICO: 16 Pixel als eigene, größere Fassung, 32 und 48 Pixel wie das SVG; ein SVG-Favicon würde die 16-Pixel-Fassung verdrängen -->
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">
${STUDIO_JSONLD}
</script>`;
}

/* Sprachschalter geschlossen, ohne Flaggen; Aufbau wie in public/assets/sprachwahl.js und components/Sprachwahl.tsx */
function langButton(lang: Lang): string {
  const cur = LANGS.find((x) => x.id === lang)!;
  return `<button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="${esc(LANG_LABEL[lang])}"><span lang="${cur.id}">${esc(cur.name)}</span><span class="chev" aria-hidden="true"></span></button>`;
}

export function startseiteHtml(lang: Lang): string {
  const t = Object.fromEntries(Object.entries(HOME_TEXTS[lang]).map(([k, v]) => [k, esc(v)])) as unknown as typeof HOME_TEXTS.de;
  const book = "/booking" + (lang === "de" ? "" : `?lang=${lang}`);
  return `<!doctype html>
<html lang="${lang}" dir="${langDir(lang)}">
<head>
${head(lang)}
</head>
<body>
<div class="band"></div>
<header class="wrap top">
  <a class="wm" href="/" aria-label="PALO SKIN by Dr. Vogel, Startseite"><img class="logo" src="/assets/logo/logo-kopf.svg" alt="PALO SKIN by Dr. Vogel" width="166" height="40"></a>
  <nav class="nav" aria-label="Hauptnavigation">
    <div class="links">
      <a href="#preise">${t.navPrices}</a>
      <a href="#ablauf">${t.navHow}</a>
      <a href="#studio">${t.navStudio}</a>
      <a href="#fragen">${t.navFaq}</a>
    </div>
    <div class="lang" id="lang">${langButton(lang)}</div>
    <a class="btn primary small" href="${book}">${t.book}</a>
  </nav>
</header>

<main>
  <section class="hero wrap">
    <div class="grid">
      <div class="hero-main">
        <h1><bdi>${t.h1}</bdi></h1>
        <p class="lead" style="margin-top:22px">${t.lead}</p>
        <div class="actions">
          <a class="btn primary" href="${book}">${t.bookNow}</a>
          <a class="tlink" href="https://wa.me/4915158872566" target="_blank" rel="noopener">${t.whatsapp}</a>
        </div>
      </div>
      <!-- Platz für ein Porträt von Dr. Vogel oder ein Studiofoto: Bild als erstes Kind von .hero-side, die Infozeilen bleiben darunter -->
      <div class="hero-side">
      <dl class="facts">
        <div><dt>${t.fAddress}</dt><dd><a href="https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8" target="_blank" rel="noopener" dir="ltr">Hagenauer Straße 14, 10435 Berlin</a></dd></div>
        <div><dt>${t.fDoctor}</dt><dd><bdi>Dr. med. Sebastian Vogel</bdi></dd></div>
        <div><dt>${t.fLang}</dt><dd>${t.langs}</dd></div>
        <div><dt>${t.fHours}</dt><dd>${t.hours}</dd></div>
      </dl>
      </div>
    </div>
  </section>

  <section id="preise" class="wrap">
    <div class="sechead">
      <h2>${t.pricesH}</h2>
      <p>${t.pricesP}</p>
    </div>
    <div class="pricegrid">
      <div class="pricecol">
        <div class="pgroup">
          <h3>${t.botH}</h3>
          <div class="prow"><span class="n">${t.z1}</span><span class="p" dir="ltr">120 €*</span></div>
          <div class="prow"><span class="n">${t.z2}</span><span class="p" dir="ltr">210 €*</span></div>
          <div class="prow"><span class="n">${t.z3}</span><span class="p" dir="ltr">300 €*</span></div>
          <div class="prow"><span class="n">${t.zx}</span><span class="p" dir="ltr">80 €*</span></div>
          <a class="zlink" href="#fragen" id="zoneLink">${t.zoneLink}</a>
        </div>
        <div class="pgroup">
          <h3>${t.kauH}</h3>
          <div class="prow"><span class="n">${t.kauR}</span><span class="p" dir="ltr">280 €*</span></div>
        </div>
      </div>
      <div class="pricecol">
        <div class="pgroup">
          <h3>${t.nefH}</h3>
          <div class="prow"><span class="n">${t.nefR}</span><span class="p" dir="ltr">280 €*</span></div>
        </div>
        <div class="pgroup">
          <h3>${t.achselH}</h3>
          <div class="prow"><span class="n">${t.achselR}</span><span class="p" dir="ltr">480 €*</span></div>
        </div>
        <div class="pgroup">
          <h3>${t.boostH}</h3>
          <div class="prow"><span class="n"><span>${t.lachs}</span><small>${t.lachsS}</small></span><span class="p" dir="ltr">280 €*</span></div>
          <div class="prow"><span class="n"><span>${t.lachs4}</span><small>${t.lachs4S}</small></span><span class="p" dir="ltr">${t.pLachs4}</span></div>
        </div>
      </div>
    </div>
    <p class="small pnote">${t.pnote}</p>
  </section>

  <section id="ablauf" class="blue">
    <div class="wrap">
      <h2>${t.howH}</h2>
      <div class="steps3">
        <div><h3>${t.s1H}</h3><p>${t.s1P}</p></div>
        <div><h3>${t.s2H}</h3><p>${t.s2P}</p></div>
        <div><h3>${t.s3H}</h3><p>${t.s3P}</p></div>
      </div>
      <div class="after-steps"><a class="btn primary" href="${book}">${t.bookNow}</a></div>
    </div>
  </section>

  <section id="studio" class="dark studio">
    <div class="wrap">
      <div class="sechead">
        <h2>${t.studioH}</h2>
      </div>
      <div class="studio-grid">
        <!-- Platz für ein Porträt von Dr. Vogel: als erstes Kind von .studio-grid mit class="portrait"; Zitat und Angaben rücken dann nach rechts -->
        <blockquote class="quote">
          <p>${t.quote1}</p>
          <!-- Platz für einen persönlichen Satz von Dr. Vogel: <p>…</p> -->
          <p>${t.quote3}</p>
          <p class="by"><bdi>Dr. med. Sebastian Vogel</bdi></p>
        </blockquote>
        <div class="where">
          <p class="muted">${t.studioLangs}</p>
          <p>${t.studioAddr}</p>
          <p><a href="https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8" target="_blank" rel="noopener">${t.mapL}</a></p>
          <p class="contact"><a href="https://wa.me/4915158872566" target="_blank" rel="noopener" dir="ltr">WhatsApp +49 151 58872566</a> · <a href="https://www.instagram.com/palo.skin" target="_blank" rel="noopener" dir="ltr">Instagram @palo.skin</a></p>
        </div>
      </div>
    </div>
  </section>

  <!-- Platz für den späteren Abschnitt „Für wen ich PALO SKIN gegründet habe“ (noch nicht freigegeben): eigene section wie Studio, Texte in lib/texts-home.ts -->

  <section id="fragen" class="wrap">
    <div class="cols">
      <div class="intro"><h2>${t.faqH}</h2></div>
      <div class="faq">
        <details><summary>${t.q1}</summary><div class="a">${t.a1}</div></details>
        <details><summary>${t.q2}</summary><div class="a">${t.a2}</div></details>
        <details><summary>${t.q3}</summary><div class="a">${t.a3}</div></details>
        <details><summary>${t.q4}</summary><div class="a">${t.a4}</div></details>
      </div>
    </div>
  </section>
</main>

<footer class="wrap">
  <div class="row">
    <div><bdi>© 2026 Nidus Skin Berlin GmbH · PALO SKIN by Dr. Vogel</bdi></div>
    <div class="fl">
      <a href="${book}">${t.book}</a>
      <a href="/impressum">${t.imprint}</a>
      <a href="/datenschutz">${t.privacy}</a>
    </div>
  </div>
</footer>
<div class="mbar"><a class="btn primary" href="${book}">${t.bookNow}</a></div>

<script type="application/json" id="sprachwahl-daten">${menuData(lang)}</script>
<script src="/assets/sprachwahl.js"></script>
</body>
</html>
`;
}
