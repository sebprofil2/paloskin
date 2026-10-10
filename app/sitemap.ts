import type { MetadataRoute } from "next";
import { LANG_IDS } from "@/lib/i18n";
import { homeAlternates, homeUrl, hreflangLinks, indexable, langUrl, studioImages } from "@/lib/share-meta";

/*
 * Sitemap (5. Oktober 2026): die sieben Startseiten mit gegenseitigen hreflang-Verweisen (dazu x-default auf „/“) und die
 * Buchung mit denselben hreflang-Verweisen wie auf der Seite (?lang=). Impressum und Datenschutz bleiben draußen, sie sind
 * noindex (Entscheidung Dr. Vogel). Adressen aus der Umgebung; die Testinstanz hat keine Einträge.
 * Seit 10. Oktober 2026 mit Bildeinträgen (image:image) für die Startseiten: die festen Studiofotos unter /public/bilder/.
 */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable()) return [];
  const languages = Object.fromEntries(homeAlternates().map((l) => [l.hreflang, l.href]));
  return [
    ...LANG_IDS.map((lang) => ({ url: homeUrl(lang), changeFrequency: "weekly" as const, priority: lang === "de" ? 1 : 0.9, alternates: { languages }, images: studioImages() })),
    { url: langUrl("/booking", "de"), changeFrequency: "weekly", priority: 0.9, alternates: { languages: Object.fromEntries(hreflangLinks("/booking").map((l) => [l.hreflang, l.href])) } },
  ];
}
