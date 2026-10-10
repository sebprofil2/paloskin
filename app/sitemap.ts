import type { MetadataRoute } from "next";
import { LANG_IDS } from "@/lib/i18n";
import { BEHANDLUNG_SLUGS } from "@/lib/behandlungen";
import { ARZTSEITE_LIVE, ARZTSEITE_SPRACHEN, BEHANDLUNGEN_FREIGABE, BEHANDLUNGEN_SITEMAP_AKTIV } from "@/lib/freigabe";
import { arztPath } from "@/lib/seiten-pfade";
import { arztAlternates, behandlungAlternates, behandlungUrl, homeAlternates, homeUrl, hreflangLinks, indexable, langUrl, site, studioImages } from "@/lib/share-meta";

/*
 * Sitemap (5. Oktober 2026): die sieben Startseiten mit gegenseitigen hreflang-Verweisen (dazu x-default auf „/“) und die
 * Buchung mit denselben hreflang-Verweisen wie auf der Seite (?lang=). Impressum und Datenschutz bleiben draußen, sie sind
 * noindex (Entscheidung Dr. Vogel). Adressen aus der Umgebung; die Testinstanz hat keine Einträge.
 * Seit 10. Oktober 2026 mit Bildeinträgen (image:image) für die Startseiten: die festen Studiofotos unter /public/bilder/.
 * Arztseite in den freigegebenen Sprachen mit hreflang, erst mit ARZTSEITE_LIVE (lib/freigabe.ts). Behandlungsseiten
 * (vorbereitet, noch nicht aktiv): freigegebene Fassungen mit hreflang, erst mit BEHANDLUNGEN_SITEMAP_AKTIV.
 */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable()) return [];
  const languages = Object.fromEntries(homeAlternates().map((l) => [l.hreflang, l.href]));
  return [
    ...LANG_IDS.map((lang) => ({ url: homeUrl(lang), changeFrequency: "weekly" as const, priority: lang === "de" ? 1 : 0.9, alternates: { languages }, images: studioImages() })),
    ...(ARZTSEITE_LIVE
      ? ARZTSEITE_SPRACHEN.map((l) => ({ url: `${site()}${arztPath(l)}`, changeFrequency: "monthly" as const, priority: 0.8, alternates: { languages: Object.fromEntries(arztAlternates().map((a) => [a.hreflang, a.href])) }, images: [studioImages()[0]] }))
      : []),
    ...(BEHANDLUNGEN_SITEMAP_AKTIV
      ? BEHANDLUNG_SLUGS.flatMap((slug) =>
          BEHANDLUNGEN_FREIGABE[slug].map((l) => ({ url: behandlungUrl(slug, l), changeFrequency: "monthly" as const, priority: 0.7, alternates: { languages: Object.fromEntries(behandlungAlternates(slug).map((a) => [a.hreflang, a.href])) } })),
        )
      : []),
    { url: langUrl("/booking", "de"), changeFrequency: "weekly", priority: 0.9, alternates: { languages: Object.fromEntries(hreflangLinks("/booking").map((l) => [l.hreflang, l.href])) } },
  ];
}
