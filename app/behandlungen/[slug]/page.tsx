import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Behandlungsseite } from "@/components/Behandlungsseite";
import { isBehandlung, type BehandlungSlug } from "@/lib/behandlungen";
import { freigegeben } from "@/lib/freigabe";
import { isTestInstance } from "@/lib/instance";
import { behandlungMetadata } from "@/lib/share-meta";

/*
 * Behandlungsseite auf Deutsch (/behandlungen/<name>, Gerüst vom 10. Oktober 2026). Auf www nur, wenn Deutsch in
 * lib/freigabe.ts freigegeben ist; auf neu immer zu sehen (noindex). Andere Sprachen: app/[lang]/behandlungen/[slug].
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function seite(params: Props["params"]): Promise<BehandlungSlug> {
  const slug = (await params).slug;
  if (!isBehandlung(slug)) notFound();
  return slug;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return behandlungMetadata(await seite(params), "de");
}

export default async function Page({ params }: Props) {
  const slug = await seite(params);
  if (!freigegeben(slug, "de") && !isTestInstance()) notFound();
  return <Behandlungsseite slug={slug} lang="de" />;
}
