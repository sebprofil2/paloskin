import type { Lang } from "./i18n";
import type { HomeTexts } from "./texts-home";

/* Gemeinsame Angaben für Kopf- und Fußzeile (components/Kopfzeile.tsx), nutzbar auf Server und im Browser */
export const MAPS = "https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8";

export type KopfTexte = Pick<HomeTexts, "rateLong" | "rateShort" | "rateAria" | "navAria" | "navStudio" | "navTreat" | "navHow" | "navFaq" | "book" | "menu" | "copyright" | "imprint" | "privacy">;

export function kopfTexte(t: HomeTexts): KopfTexte {
  const { rateLong, rateShort, rateAria, navAria, navStudio, navTreat, navHow, navFaq, book, menu, copyright, imprint, privacy } = t;
  return { rateLong, rateShort, rateAria, navAria, navStudio, navTreat, navHow, navFaq, book, menu, copyright, imprint, privacy };
}

export const bookHref = (lang: Lang) => "/booking" + (lang === "de" ? "" : `?lang=${lang}`);

