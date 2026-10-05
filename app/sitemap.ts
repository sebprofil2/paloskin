import type { MetadataRoute } from "next";
import { LANG_IDS } from "@/lib/i18n";
import { homeAlternates, homeUrl, indexable, site } from "@/lib/share-meta";

/*
 * Sitemap (5. Oktober 2026): die sieben Startseiten mit gegenseitigen hreflang-Verweisen (dazu x-default auf „/“),
 * Impressum und Datenschutz nur auf Deutsch ohne hreflang. Adressen aus der Umgebung; die Testinstanz hat keine Einträge.
 */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable()) return [];
  const languages = Object.fromEntries(homeAlternates().map((l) => [l.hreflang, l.href]));
  return [
    ...LANG_IDS.map((lang) => ({ url: homeUrl(lang), changeFrequency: "weekly" as const, priority: lang === "de" ? 1 : 0.9, alternates: { languages } })),
    { url: `${site()}/impressum`, priority: 0.2 },
    { url: `${site()}/datenschutz`, priority: 0.2 },
  ];
}
