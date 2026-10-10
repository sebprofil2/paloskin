import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Arztseite } from "@/components/Arztseite";
import { ARZTSEITE_LIVE, ARZTSEITE_SPRACHEN } from "@/lib/freigabe";
import { isLang } from "@/lib/i18n";
import { isTestInstance } from "@/lib/instance";
import { arztMetadata } from "@/lib/share-meta";
import type { ArztLang } from "@/lib/texts-arzt";

/*
 * Seite über Dr. Vogel in den freigegebenen Sprachen außer Deutsch (/en/dr-sebastian-vogel, …). Nicht freigegebene
 * Sprachen leitet schon der Proxy vorübergehend auf Deutsch weiter; alles andere ist keine Seite.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }> };

async function sprache(params: Props["params"]): Promise<ArztLang> {
  const l = (await params).lang;
  if (!isLang(l) || l === "de" || !ARZTSEITE_SPRACHEN.includes(l)) notFound();
  return l as ArztLang;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return arztMetadata(await sprache(params));
}

export default async function Page({ params }: Props) {
  const lang = await sprache(params);
  if (!ARZTSEITE_LIVE && !isTestInstance()) notFound();
  return <Arztseite lang={lang} />;
}
