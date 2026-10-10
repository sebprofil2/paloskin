import type { Metadata } from "next";
import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import { RescheduleApp } from "@/components/RescheduleApp";
import { langSuffix, terminLang } from "@/components/TerminShell";
import { terminWindow } from "@/lib/booking";
import { langDir, type Lang } from "@/lib/i18n";
import { requestLang } from "@/lib/i18n-server";
import { kopfTexte } from "@/lib/kopf";
import { verifyTerminToken } from "@/lib/links";
import { whenLabels } from "@/lib/mail-content";
import { getStore } from "@/lib/store";
import { HOME_TEXTS } from "@/lib/texts-home";
import { MAIL_TEXTS, WA_LINK } from "@/lib/texts-mail";
import "../../../design/design.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Neue Zeit wählen · PALO SKIN by Dr. Vogel", robots: { index: false, follow: false } };

/*
 * Verschieben über den persönlichen Link, seit 10. Oktober 2026 im Design der Buchung (Entwurf B): Kopfzeile mit
 * Sprachkürzel, Tageskarten und Zeitknöpfe wie in Schritt 2 (components/RescheduleApp.tsx), Fußzeile. Die Sprachwahl lädt
 * die Seite mit ?lang= neu. Regeln unverändert auf dem Server (lib/booking.ts, rescheduleBooking).
 */
function Rahmen({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const kopf = kopfTexte(HOME_TEXTS[lang]);
  return (
    <div className="pb rs" lang={lang} dir={langDir(lang)}>
      <Kopfzeile lang={lang} t={kopf} page="booking" />
      <main className="wrap bk" id="app" aria-live="polite">
        {children}
      </main>
      <Fusszeile lang={lang} t={kopf} mobileBar={false} />
    </div>
  );
}

/* Hinweis statt Zeitauswahl (Link ungültig, Termin vorbei oder abgesagt), im selben Rahmen */
function Hinweis({ lang, text, action }: { lang: Lang; text: string; action: React.ReactNode }) {
  const l = MAIL_TEXTS[lang];
  return (
    <Rahmen lang={lang}>
      <h1 className="h2">{l.rsHA} <em>{l.rsHB}</em></h1>
      <div className="bk-grid rs-single">
        <section className="fcard">
          <div className="alert" style={{ marginTop: 0 }}>{text}</div>
          <p style={{ paddingBottom: "var(--sp-24)" }}>{action}</p>
        </section>
      </div>
    </Rahmen>
  );
}

export default async function VerschiebenPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await params;
  const sp = await searchParams;
  const id = verifyTerminToken(token);
  const booking = id ? getStore().findById(id) : null;
  if (!booking || booking.deleted_at) {
    const lang = await requestLang();
    const l = MAIL_TEXTS[lang];
    return <Hinweis lang={lang} text={l.invalid} action={<a className="btn ghost" href={WA_LINK} target="_blank" rel="noopener">{l.waButton}</a>} />;
  }
  const lang = terminLang(sp.lang, booking.language);
  const q = langSuffix(lang, booking.language);
  const l = MAIL_TEXTS[lang];
  const w = terminWindow(booking);
  const when = whenLabels(new Date(booking.starts_at), lang);
  if (w !== "open" && w !== "short") {
    // Nicht mehr verschiebbar: zurück zur Terminseite mit dem passenden Zustand
    const text = w === "cancelled" ? l.cancelledInfo : w === "past" ? l.past(when.dateIn, when.time) : l.punctualShort;
    return <Hinweis lang={lang} text={text} action={<a className="btn ghost" href={`/termin/${token}${q}`}>{l.pageTitle}</a>} />;
  }
  return (
    <Rahmen lang={lang}>
      <RescheduleApp token={token} lang={lang} langQuery={q} currentDate={when.date} currentTime={when.time} />
    </Rahmen>
  );
}
