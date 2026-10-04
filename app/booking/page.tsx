import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BookingApp } from "@/components/BookingApp";
import { InterimBooking } from "@/components/InterimBooking";
import { cookieIsValid, TEST_COOKIE } from "@/lib/access";
import { readEnv } from "@/lib/env";
import { bookingMetadata } from "@/lib/share-meta";
import { isLang } from "@/lib/texts";
import "./booking.css";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/* Vorschautexte und Vorschaubild je Sprache (?lang=), Deutsch ohne Angabe; Wortlaut in lib/share-meta.ts */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const lang = one((await searchParams).lang);
  return bookingMetadata(isLang(lang) ? lang : "de");
}

export default async function BookingPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const env = readEnv();

  /* Testbetrieb: ohne gültiges Cookie (Code über /booking/zugang) die Zwischenlösung, nie eine leere Seite */
  const cookieStore = await cookies();
  const access = cookieIsValid(cookieStore.get(TEST_COOKIE)?.value);
  if (!access) return <InterimBooking />;

  const langParam = one(sp.lang);
  const checkup = sp.kontrolle !== undefined || sp.checkup !== undefined;
  return <BookingApp initialLang={isLang(langParam) ? langParam : null} testMode={env.testMode} checkup={checkup} />;
}
