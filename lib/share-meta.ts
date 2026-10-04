import type { Metadata } from "next";
import type { Lang } from "./treatments";

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
  de: { title: "Termin buchen · PALO SKIN by Dr. Vogel", description: "Termin bei PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg online buchen: Faltenbehandlung, Skin Booster oder Beratung. Sofortige Bestätigung per E-Mail.", locale: "de_DE" },
  en: { title: "Book an appointment · PALO SKIN by Dr. Vogel", description: "Book your appointment at PALO SKIN by Dr. Vogel in Berlin Prenzlauer Berg online: wrinkle treatment, skin booster or consultation. Instant confirmation by email.", locale: "en_GB" },
  es: { title: "Reservar cita · PALO SKIN by Dr. Vogel", description: "Reserve en línea su cita en PALO SKIN by Dr. Vogel en Berlín Prenzlauer Berg: tratamiento de arrugas, skin booster o consulta. Confirmación inmediata por correo electrónico.", locale: "es_ES" },
  fr: { title: "Prendre rendez-vous · PALO SKIN by Dr. Vogel", description: "Réservez en ligne votre rendez-vous chez PALO SKIN by Dr. Vogel à Berlin Prenzlauer Berg : traitement des rides, skin booster ou consultation. Confirmation immédiate par e-mail.", locale: "fr_FR" },
  pt: { title: "Agendar consulta · PALO SKIN by Dr. Vogel", description: "Agende online sua consulta na PALO SKIN by Dr. Vogel em Berlim Prenzlauer Berg: tratamento de rugas, skin booster ou avaliação. Confirmação imediata por e-mail.", locale: "pt_BR" },
};

export function bookingMetadata(lang: Lang): Metadata {
  const t = BOOKING[lang];
  const url = lang === "de" ? `${SITE}/booking` : `${SITE}/booking?lang=${lang}`;
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: `${SITE}/booking` },
    openGraph: { type: "website", siteName: "PALO SKIN by Dr. Vogel", locale: t.locale, url, title: t.title, description: t.description, images: SHARE_IMAGES },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [SHARE_IMAGES[0].url] },
  };
}
