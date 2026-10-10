import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Arztseite } from "@/components/Arztseite";
import { ARZTSEITE_LIVE } from "@/lib/freigabe";
import { isTestInstance } from "@/lib/instance";
import { arztMetadata } from "@/lib/share-meta";

/*
 * Seite über Dr. Vogel auf Deutsch (10. Oktober 2026). Auf www erst mit ARZTSEITE_LIVE (lib/freigabe.ts), auf neu immer.
 * Die anderen freigegebenen Sprachen: app/[lang]/dr-sebastian-vogel/page.tsx.
 */
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return arztMetadata("de");
}

export default function Page() {
  if (!ARZTSEITE_LIVE && !isTestInstance()) notFound();
  return <Arztseite lang="de" />;
}
