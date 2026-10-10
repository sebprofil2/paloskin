import type { MetadataRoute } from "next";
import { indexable, site } from "@/lib/share-meta";

/*
 * robots.txt aus der Umgebung: auf www alles erlaubt außer /intern/ und /api/ (Entscheidung Dr. Vogel, 10. Oktober 2026),
 * mit Verweis auf die Sitemap; eine Gruppe für alle, auch für Such- und KI-Dienste. /termin/ bleibt bewusst lesbar, damit
 * das noindex der Terminseiten gelesen wird. Auf der Testinstanz alles gesperrt.
 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!indexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/intern/", "/api/"] }, sitemap: `${site()}/sitemap.xml` };
}
