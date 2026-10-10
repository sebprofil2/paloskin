import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BookingApp } from "@/components/BookingApp";
import { cookieIsValid, TEST_COOKIE } from "@/lib/access";
import { readEnv } from "@/lib/env";
import { bookingMetadata } from "@/lib/share-meta";
import { requestLang } from "@/lib/i18n-server";
import { kopfTexte } from "@/lib/kopf";
import { LANG_IDS } from "@/lib/i18n";
import { HOME_TEXTS } from "@/lib/texts-home";
import "../design/design.css";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

/* Vorschautexte und Vorschaubild in der Sprache der Anfrage (lib/i18n.ts); Wortlaut in lib/share-meta.ts */
export async function generateMetadata(): Promise<Metadata> {
  const meta = bookingMetadata(await requestLang());
  // Testumgebung: nie in Suchmaschinen
  return readEnv().testMode ? { ...meta, robots: { index: false, follow: false } } : meta;
}

export default async function BookingPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const env = readEnv();

  /* Testbetrieb (nur neu.paloskin.de): ohne gültiges Cookie (Code über /booking/zugang) nur ein kurzer Hinweis */
  const cookieStore = await cookies();
  const access = cookieIsValid(cookieStore.get(TEST_COOKIE)?.value);
  if (!access) return <TestHinweis />;

  const checkup = sp.kontrolle !== undefined || sp.checkup !== undefined;
  // Kopf- und Fußzeile wie auf der Startseite, in allen sieben Sprachen (die Buchung wechselt die Sprache ohne Neuladen)
  const kopf = Object.fromEntries(LANG_IDS.map((l) => [l, kopfTexte(HOME_TEXTS[l])])) as Record<(typeof LANG_IDS)[number], ReturnType<typeof kopfTexte>>;
  return <BookingApp initialLang={await requestLang()} testMode={env.testMode} checkup={checkup} kopf={kopf} />;
}

function TestHinweis() {
  return (
    <div className="pb">
      <main className="wrap bk">
        <h1 className="h2">Testumgebung, <em>nicht öffentlich</em></h1>
      </main>
    </div>
  );
}
