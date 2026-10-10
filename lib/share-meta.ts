import type { Metadata } from "next";
import { readEnv } from "./env";
import { homePath } from "./home-paths";
import { LANG_IDS, type Lang } from "./i18n";
import { isTestInstance } from "./instance";
import { ARZTSEITE_LIVE, ARZTSEITE_SPRACHEN } from "./freigabe";
import { arztPath } from "./seiten-pfade";
import { ARZT, LANGUAGE_NAMES_EN, STUDIO } from "./studio";
import { ARZT_TEXTE, type ArztLang } from "./texts-arzt";
import { HOME_TEXTS } from "./texts-home";

/*
 * Vorschautexte und Vorschaubilder beim Teilen (Instagram, WhatsApp, iMessage) und für Suchmaschinen.
 * Wortlaut Deutsch von Dr. Vogel (4. Oktober 2026), übrige Sprachen übersetzt. Nie „Botox“ (Heilmittelwerbegesetz).
 */
/* Öffentliche Adresse aus der Umgebung (PUBLIC_BASE_URL, auf www https://www.paloskin.de), nie fest eingetragen */
export function site(): string {
  return readEnv().publicBaseUrl;
}

/* Testinstanz (neu.paloskin.de): komplett noindex, keine kanonischen Angaben, kein hreflang, keine Sitemap-Einträge */
export function indexable(): boolean {
  return !isTestInstance();
}

export function shareImages() {
  return [
    { url: `${site()}/assets/og-1200x630.png`, width: 1200, height: 630, alt: "PALO SKIN by Dr. Vogel, Goodbye wrinkles." },
    { url: `${site()}/assets/og-1200x1200.png`, width: 1200, height: 1200, alt: "PALO SKIN by Dr. Vogel, Goodbye wrinkles." },
  ];
}

/*
 * Linkvorschau der Startseite (10. Oktober 2026): echtes Studiofoto statt Logo auf Blau, Beratungsbereich mit dem blauen
 * Wandobjekt, 1200 mal 630 Pixel. Dieselbe Datei für og:image und twitter:image, Alt-Text je Sprache. Die Buchung behält
 * ihre bisherige Vorschau (shareImages).
 */
export function homeShareImage(lang: Lang) {
  return { url: `${site()}/bilder/palo-skin-berlin-studio-linkvorschau.jpg`, width: 1200, height: 630, alt: HOME_TEXTS[lang].photoConsult };
}

/* Feste Studiofotos unter /public/bilder/ für strukturierte Daten und Sitemap; die Startseite zeigt weiter app/bilder */
export function studioImages(): string[] {
  return ["dr-sebastian-vogel", "beratungsbereich", "behandlungsraum", "eingang"].map((n) => `${site()}/bilder/palo-skin-berlin-${n}.jpg`);
}

const BOOKING: Record<Lang, { title: string; description: string; locale: string }> = {
  de: { title: "Termin buchen · PALO SKIN by Dr. Vogel", description: "Termin bei PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg buchen: Faltenbehandlung, Skin Booster oder Beratung. Sofortige Bestätigung per E-Mail.", locale: "de_DE" },
  en: { title: "Book an appointment · PALO SKIN by Dr. Vogel", description: "Book your appointment at PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg online: wrinkle treatment, skin booster or consultation. Instant confirmation by email.", locale: "en_GB" },
  es: { title: "Reservar cita · PALO SKIN by Dr. Vogel", description: "Reserve en línea su cita en PALO SKIN by Dr. Vogel en Berlín Prenzlauer Berg: tratamiento de arrugas, skin booster o consulta. Confirmación inmediata por correo electrónico.", locale: "es_ES" },
  fr: { title: "Prendre rendez-vous · PALO SKIN by Dr. Vogel", description: "Réservez en ligne votre rendez-vous chez PALO SKIN by Dr. Vogel à Berlin Prenzlauer Berg : traitement des rides, skin booster ou consultation. Confirmation immédiate par e-mail.", locale: "fr_FR" },
  pt: { title: "Agendar consulta · PALO SKIN by Dr. Vogel", description: "Agende online sua consulta na PALO SKIN by Dr. Vogel em Berlim Prenzlauer Berg: tratamento de rugas, skin booster ou avaliação. Confirmação imediata por e-mail.", locale: "pt_BR" },
  it: { title: "Prenotazione appuntamento · PALO SKIN by Dr. Vogel", description: "Prenoti l’appuntamento da PALO SKIN by Dr. Vogel a Berlino Prenzlauer Berg: trattamento delle rughe, Skin Booster o consulenza. Conferma immediata via e-mail.", locale: "it_IT" },
  tr: { title: "Randevu al · PALO SKIN by Dr. Vogel", description: "Berlin Prenzlauer Berg’deki PALO SKIN by Dr. Vogel’den randevu alın: kırışıklık tedavisi, Skin Booster veya danışma. E-posta ile anında onay.", locale: "tr_TR" },
  uk: { title: "Записатися на прийом · PALO SKIN by Dr. Vogel", description: "Запишіться онлайн до PALO SKIN by Dr. Vogel у Берліні, Prenzlauer Berg: корекція зморшок, Skin Booster або консультація. Миттєве підтвердження електронною поштою.", locale: "uk_UA" },
  ar: { title: "حجز موعد · PALO SKIN by Dr. Vogel", description: "حجز موعد عبر الإنترنت في PALO SKIN by Dr. Vogel في Prenzlauer Berg ببرلين: علاج التجاعيد، أو سكين بوستر، أو استشارة. تأكيد فوري بالبريد الإلكتروني.", locale: "ar_AR" },

};

export function bookingMetadata(lang: Lang): Metadata {
  const t = BOOKING[lang];
  const url = langUrl("/booking", lang);
  const images = shareImages();
  return {
    title: t.title,
    description: t.description,
    ...(indexable()
      ? { alternates: { canonical: url, languages: Object.fromEntries(hreflangLinks("/booking").map((l) => [l.hreflang, l.href])) } }
      : { robots: { index: false, follow: false } }),
    openGraph: { type: "website", siteName: "PALO SKIN by Dr. Vogel", locale: t.locale, url, title: t.title, description: t.description, images },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [images[0].url] },
  };
}

export const LOCALE: Record<Lang, string> = { de: "de_DE", en: "en_GB", es: "es_ES", fr: "fr_FR", pt: "pt_BR", it: "it_IT", tr: "tr_TR", uk: "uk_UA", ar: "ar_AR" };

/* Adresse einer Seite in einer Sprache (Buchung): Deutsch ohne Angabe, sonst ?lang= */
export function langUrl(path: string, lang: Lang): string {
  return lang === "de" ? `${site()}${path}` : `${site()}${path}?lang=${lang}`;
}

/* ---------- Startseite: eigene Adresse je Sprache (5. Oktober 2026) ---------- */
export function homeUrl(lang: Lang): string {
  return `${site()}${homePath(lang)}`;
}

/** hreflang der Startseite: alle neun Fassungen, absolute Adressen, x-default auf „/“ */
export function homeAlternates(): { hreflang: string; href: string }[] {
  return [...LANG_IDS.map((l) => ({ hreflang: l, href: homeUrl(l) })), { hreflang: "x-default", href: homeUrl("de") }];
}

/** Metadaten der Startseite in einer Sprache: Titel, Beschreibung, kanonisch auf sich selbst, hreflang, Linkvorschau */
export function homeMetadata(lang: Lang): Metadata {
  const t = HOME_TEXTS[lang];
  const url = homeUrl(lang);
  const image = homeShareImage(lang);
  return {
    title: t.title,
    description: t.metaDesc,
    ...(indexable()
      ? { alternates: { canonical: url, languages: Object.fromEntries(homeAlternates().map((l) => [l.hreflang, l.href])) } }
      : { robots: { index: false, follow: false } }),
    openGraph: { type: "website", siteName: "PALO SKIN by Dr. Vogel", locale: LOCALE[lang], url, title: t.title, description: t.metaDesc, images: [image] },
    twitter: { card: "summary_large_image", title: t.title, description: t.metaDesc, images: [{ url: image.url, alt: image.alt }] },
  };
}

/** Strukturierte Daten je Sprache: Studio, Arzt und die Seite selbst mit ihrer Sprache (inLanguage) */
export function homeJsonLd(lang: Lang): string {
  return JSON.stringify(studioJsonLd(lang));
}

/*
 * Strukturierte Daten der Startseite (überarbeitet 10. Oktober 2026, Angaben aus lib/studio.ts): Studio als MedicalBusiness,
 * Dr. med. Sebastian Vogel als Person, dazu die Seite. Telefonnummer ja (sichtbar im Abschnitt Studio), keine Öffnungszeiten
 * und keine E-Mail-Adresse. Nie „Botox“, keine Bewertungen; als Preisangabe nur die Spanne priceRange. Beschreibung je
 * Sprache aus metaDesc und dem Satz selfTreat. Die Person bekommt eine url erst, wenn die Arztseite live ist.
 */
export function studioJsonLd(lang: Lang) {
  const base = site();
  const studio = `${base}/#studio`;
  const arzt = `${base}/#arzt`;
  const [vogel, ...raeume] = studioImages();
  const a = STUDIO.address;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalBusiness",
        "@id": studio,
        name: STUDIO.name,
        alternateName: [...STUDIO.alternateNames],
        description: `${HOME_TEXTS[lang].metaDesc} ${HOME_TEXTS[lang].selfTreat}`,
        url: `${base}/`,
        logo: `${base}/assets/icon-512.png`,
        image: [...raeume, vogel],
        telephone: STUDIO.phone.display,
        address: { "@type": "PostalAddress", streetAddress: a.street, postalCode: a.postalCode, addressLocality: a.city, addressCountry: a.country },
        geo: { "@type": "GeoCoordinates", latitude: STUDIO.geo.latitude, longitude: STUDIO.geo.longitude },
        areaServed: { "@type": "City", name: "Berlin" },
        priceRange: STUDIO.priceRange,
        parentOrganization: { "@type": "Organization", name: STUDIO.operator },
        founder: { "@id": arzt },
        employee: { "@id": arzt },
        // Beratungssprachen am Kontaktpunkt (availableLanguage gehört laut schema.org nicht direkt an MedicalBusiness)
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: STUDIO.phone.display,
          availableLanguage: STUDIO.consultationLanguages.map((code) => ({ "@type": "Language", name: LANGUAGE_NAMES_EN[code], alternateName: code })),
        },
        sameAs: [STUDIO.maps, STUDIO.instagram.url],
      },
      personJsonLd(base, vogel, ARZTSEITE_LIVE ? `${base}${arztPath("de")}` : undefined),
      { "@type": "WebPage", "@id": `${homeUrl(lang)}#seite`, url: homeUrl(lang), name: HOME_TEXTS[lang].title, inLanguage: lang, primaryImageOfPage: vogel, about: { "@id": studio } },
    ],
  };
}

/** Dr. med. Sebastian Vogel als Person (nicht Physician, das wäre eine Einrichtung) */
export function personJsonLd(base: string, image: string, url?: string) {
  return {
    "@type": "Person",
    "@id": `${base}/#arzt`,
    name: ARZT.name,
    givenName: ARZT.givenName,
    familyName: ARZT.familyName,
    honorificPrefix: ARZT.honorificPrefix,
    jobTitle: ARZT.jobTitle,
    image,
    worksFor: { "@id": `${base}/#studio` },
    sameAs: [ARZT.linkedin],
    knowsLanguage: [...STUDIO.consultationLanguages],
    knowsAbout: [...ARZT.knowsAbout],
    alumniOf: { "@type": "CollegeOrUniversity", name: ARZT.alumniOf },
    award: [...ARZT.awards],
    ...(url ? { url } : {}),
  };
}

/* hreflang für alle neun Sprachen, dazu x-default (Deutsch) */
export function hreflangLinks(path: string): { hreflang: string; href: string }[] {
  return [...LANG_IDS.map((l) => ({ hreflang: l, href: langUrl(path, l) })), { hreflang: "x-default", href: langUrl(path, "de") }];
}

/* Startseite: Titel und Beschreibung aus lib/texts-home.ts */
export function homeShare(lang: Lang) {
  const t = HOME_TEXTS[lang];
  return { title: t.title, description: t.metaDesc, locale: LOCALE[lang], url: homeUrl(lang), canonical: homeUrl(lang) };
}

/* ---------- Seite über Dr. Vogel (10. Oktober 2026) ---------- */

/** Sprache der Arztseite: freigegebene Sprachen, sonst Deutsch */
export function arztLang(lang: Lang): ArztLang {
  return (ARZTSEITE_SPRACHEN.includes(lang) ? lang : "de") as ArztLang;
}

/** hreflang der Arztseite: nur freigegebene Sprachen, x-default Deutsch */
export function arztAlternates(): { hreflang: string; href: string }[] {
  return [...ARZTSEITE_SPRACHEN.map((l) => ({ hreflang: l, href: `${site()}${arztPath(l)}` })), { hreflang: "x-default", href: `${site()}${arztPath("de")}` }];
}

export function arztMetadata(lang: ArztLang): Metadata {
  const t = ARZT_TEXTE[lang];
  const url = `${site()}${arztPath(lang)}`;
  const image = { url: studioImages()[0], width: 1080, height: 1350, alt: t.alt };
  return {
    title: { absolute: t.title },
    description: t.description,
    ...(indexable() && ARZTSEITE_LIVE
      ? { alternates: { canonical: url, languages: Object.fromEntries(arztAlternates().map((l) => [l.hreflang, l.href])) } }
      : { robots: { index: false, follow: false } }),
    openGraph: { type: "profile", siteName: STUDIO.name, locale: LOCALE[lang], url, title: t.title, description: t.description, images: [image] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [{ url: image.url, alt: image.alt }] },
  };
}

/** Strukturierte Daten der Arztseite: ProfilePage mit der Person aus personJsonLd als mainEntity */
export function arztJsonLd(lang: ArztLang): string {
  const base = site();
  const url = `${base}${arztPath(lang)}`;
  const vogel = studioImages()[0];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#seite`,
    url,
    name: ARZT_TEXTE[lang].title,
    inLanguage: lang,
    primaryImageOfPage: vogel,
    mainEntity: personJsonLd(base, vogel, ARZTSEITE_LIVE ? `${base}${arztPath("de")}` : undefined),
  });
}
