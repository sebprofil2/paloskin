import type { Metadata } from "next";
import { LANG_IDS, type Lang } from "./i18n";
import { HOME_TEXTS } from "./texts-home";

/*
 * Vorschautexte und Vorschaubilder beim Teilen (Instagram, WhatsApp, iMessage) und für Suchmaschinen.
 * Wortlaut Deutsch von Dr. Vogel (4. Oktober 2026), übrige Sprachen übersetzt. Nie „Botox“ (Heilmittelwerbegesetz).
 */
export const SITE = "https://www.paloskin.de";
export const SHARE_IMAGES = [
  { url: `${SITE}/assets/og-1200x630.png`, width: 1200, height: 630, alt: "PALO SKIN by Dr. Vogel, Goodbye wrinkles." },
  { url: `${SITE}/assets/og-1200x1200.png`, width: 1200, height: 1200, alt: "PALO SKIN by Dr. Vogel, Goodbye wrinkles." },
];

const BOOKING: Record<Lang, { title: string; description: string; locale: string }> = {
  de: { title: "Termin buchen · PALO SKIN by Dr. Vogel", description: "Termin bei PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg buchen: Faltenbehandlung, Skin Booster oder Beratung. Sofortige Bestätigung per E-Mail.", locale: "de_DE" },
  en: { title: "Book an appointment · PALO SKIN by Dr. Vogel", description: "Book your appointment at PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg online: wrinkle treatment, skin booster or consultation. Instant confirmation by email.", locale: "en_GB" },
  es: { title: "Reservar cita · PALO SKIN by Dr. Vogel", description: "Reserve en línea su cita en PALO SKIN by Dr. Vogel en Berlín Prenzlauer Berg: tratamiento de arrugas, skin booster o consulta. Confirmación inmediata por correo electrónico.", locale: "es_ES" },
  fr: { title: "Prendre rendez-vous · PALO SKIN by Dr. Vogel", description: "Réservez en ligne votre rendez-vous chez PALO SKIN by Dr. Vogel à Berlin Prenzlauer Berg : traitement des rides, skin booster ou consultation. Confirmation immédiate par e-mail.", locale: "fr_FR" },
  pt: { title: "Agendar consulta · PALO SKIN by Dr. Vogel", description: "Agende online sua consulta na PALO SKIN by Dr. Vogel em Berlim Prenzlauer Berg: tratamento de rugas, skin booster ou avaliação. Confirmação imediata por e-mail.", locale: "pt_BR" },
  uk: { title: "Записатися на прийом · PALO SKIN by Dr. Vogel", description: "Запишіться онлайн до PALO SKIN by Dr. Vogel у Берліні, Prenzlauer Berg: корекція зморшок, Skin Booster або консультація. Миттєве підтвердження електронною поштою.", locale: "uk_UA" },
  ar: { title: "حجز موعد · PALO SKIN by Dr. Vogel", description: "حجز موعد عبر الإنترنت في PALO SKIN by Dr. Vogel في Prenzlauer Berg ببرلين: علاج التجاعيد، أو سكين بوستر، أو استشارة. تأكيد فوري بالبريد الإلكتروني.", locale: "ar_AR" },

};

export function bookingMetadata(lang: Lang): Metadata {
  const t = BOOKING[lang];
  const url = langUrl("/booking", lang);
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: url, languages: Object.fromEntries(hreflangLinks("/booking").map((l) => [l.hreflang, l.href])) },
    openGraph: { type: "website", siteName: "PALO SKIN by Dr. Vogel", locale: t.locale, url, title: t.title, description: t.description, images: SHARE_IMAGES },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [SHARE_IMAGES[0].url] },
  };
}

export const LOCALE: Record<Lang, string> = { de: "de_DE", en: "en_GB", es: "es_ES", fr: "fr_FR", pt: "pt_BR", uk: "uk_UA", ar: "ar_AR" };

/* Adresse einer Seite in einer Sprache: Deutsch ohne Angabe, sonst ?lang= */
export function langUrl(path: string, lang: Lang): string {
  return lang === "de" ? `${SITE}${path}` : `${SITE}${path}?lang=${lang}`;
}

/* hreflang für alle sieben Sprachen, dazu x-default (Deutsch) */
export function hreflangLinks(path: string): { hreflang: string; href: string }[] {
  return [...LANG_IDS.map((l) => ({ hreflang: l, href: langUrl(path, l) })), { hreflang: "x-default", href: langUrl(path, "de") }];
}

/* Startseite: Titel und Beschreibung aus lib/texts-home.ts, Vorschaubilder wie oben */
export function homeShare(lang: Lang) {
  const t = HOME_TEXTS[lang];
  // Jede Sprachfassung ist ihre eigene kanonische Adresse; die Fassungen verweisen über hreflang aufeinander
  return { title: t.title, description: t.metaDesc, locale: LOCALE[lang], url: langUrl("/", lang), canonical: langUrl("/", lang) };
}

/* Strukturierte Daten der Startseite (MedicalBusiness und Arzt), Zeichen für Zeichen wie bisher in public/index.html */
export const STUDIO_JSONLD = `{"@context": "https://schema.org", "@graph": [{"@type": "MedicalBusiness", "@id": "https://www.paloskin.de/#studio", "name": "PALO SKIN by Dr. Vogel", "alternateName": "PALO SKIN", "url": "https://www.paloskin.de/", "telephone": "+4915158872566", "email": "info@paloskin.de", "address": {"@type": "PostalAddress", "streetAddress": "Hagenauer Straße 14", "postalCode": "10435", "addressLocality": "Berlin", "addressCountry": "DE"}, "parentOrganization": {"@type": "Organization", "name": "Nidus Skin Berlin GmbH"}, "founder": {"@id": "https://www.paloskin.de/#arzt"}, "employee": {"@id": "https://www.paloskin.de/#arzt"}, "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"], "opens": "07:30", "closes": "20:00"}, {"@type": "OpeningHoursSpecification", "dayOfWeek": "Friday", "opens": "07:30", "closes": "19:00"}, {"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "09:00", "closes": "17:00"}, {"@type": "OpeningHoursSpecification", "dayOfWeek": "Sunday", "opens": "11:00", "closes": "17:00"}], "availableLanguage": ["de", "en", "es", "fr", "pt"], "sameAs": ["https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8", "https://www.instagram.com/palo.skin"]}, {"@type": "Physician", "@id": "https://www.paloskin.de/#arzt", "name": "Dr. med. Sebastian Vogel", "givenName": "Sebastian", "familyName": "Vogel", "honorificPrefix": "Dr. med.", "jobTitle": "Arzt", "worksFor": {"@id": "https://www.paloskin.de/#studio"}, "url": "https://www.paloskin.de/"}]}`;
