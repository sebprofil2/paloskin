import type { MetadataRoute } from "next";
import { indexable, site } from "@/lib/share-meta";

/* robots.txt aus der Umgebung: auf www alles erlaubt mit Verweis auf die Sitemap, auf der Testinstanz alles gesperrt */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!indexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${site()}/sitemap.xml` };
}
