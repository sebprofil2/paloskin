import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BookingApp } from "@/components/BookingApp";
import { cookieIsValid, TEST_COOKIE } from "@/lib/access";
import { readEnv } from "@/lib/env";
import { bookingMetadata } from "@/lib/share-meta";
import { requestLang } from "@/lib/i18n-server";
import { LogoKopf } from "@/components/LogoKopf";
import "./booking.css";

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
  return <BookingApp initialLang={await requestLang()} testMode={env.testMode} checkup={checkup} />;
}

function TestHinweis() {
  return (
    <div className="shell">
      <main className="app" style={{ minHeight: "auto" }}>
        <div className="band" />
        <header className="brand">
          <a href="/" aria-label="PALO SKIN by Dr. Vogel, Startseite">
            <LogoKopf />
          </a>
        </header>
        <div className="page">
          <section className="sec">
            <h2>Testumgebung, nicht öffentlich</h2>
          </section>
        </div>
      </main>
    </div>
  );
}
