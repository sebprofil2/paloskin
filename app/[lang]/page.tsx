import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Startseite } from "@/components/Startseite";
import { homePathLang } from "@/lib/home-paths";
import { homeMetadata } from "@/lib/share-meta";

/*
 * Startseite in den anderen Sprachen: /en, /es, /fr, /pt, /it, /tr, /ua, /ar, vollständig auf dem Server in der Sprache der Adresse.
 * /de leitet der Proxy dauerhaft auf „/“ weiter; jede andere Angabe ist keine Seite.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }> };

async function sprache(params: Props["params"]) {
  const lang = homePathLang(`/${(await params).lang}`);
  if (!lang || lang === "de") notFound();
  return lang;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return homeMetadata(await sprache(params));
}

export default async function Page({ params }: Props) {
  return <Startseite lang={await sprache(params)} />;
}
