import type { Metadata } from "next";
import { Startseite } from "@/components/Startseite";
import { homeMetadata } from "@/lib/share-meta";

/*
 * Startseite auf Deutsch. „/“ ist immer Deutsch, unabhängig von Gerätesprache und gespeicherter Wahl (5. Oktober 2026);
 * die anderen Sprachen haben eigene Adressen (app/[lang]/page.tsx).
 */
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return homeMetadata("de");
}

export default function Page() {
  return <Startseite lang="de" />;
}
