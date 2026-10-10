import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Behandlungsseite } from "@/components/Behandlungsseite";
import { isBehandlung, type BehandlungSlug } from "@/lib/behandlungen";
import { freigegeben } from "@/lib/freigabe";
import { segmentLang } from "@/lib/home-paths";
import type { Lang } from "@/lib/i18n";
import { behandlungMetadata } from "@/lib/share-meta";

/*
 * Behandlungsseite in einer anderen Sprache (/en/behandlungen/<name>, …). Nur freigegebene Fassungen; alle anderen
 * leitet schon der Proxy vorübergehend auf die deutsche Fassung weiter.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; slug: string }> };

async function seite(params: Props["params"]): Promise<{ slug: BehandlungSlug; lang: Lang }> {
  const p = await params;
  const lang = segmentLang(p.lang);
  const slug = p.slug;
  if (!lang || lang === "de" || !isBehandlung(slug) || !freigegeben(slug, lang)) notFound();
  return { slug, lang };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await seite(params);
  return behandlungMetadata(slug, lang);
}

export default async function Page({ params }: Props) {
  const { slug, lang } = await seite(params);
  return <Behandlungsseite slug={slug} lang={lang} />;
}
