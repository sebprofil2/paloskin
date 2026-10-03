import type { Metadata } from "next";
import { headers } from "next/headers";
import { terminWindow } from "@/lib/booking";
import { verifyTerminToken } from "@/lib/links";
import { whenLabels } from "@/lib/mail-content";
import { getStore } from "@/lib/store";
import { MAIL_TEXTS, WA_LINK } from "@/lib/texts-mail";
import { RescheduleApp } from "@/components/RescheduleApp";
import { Footer, langFromHint, Shell } from "@/components/TerminShell";
import "../../../booking/booking.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Neue Zeit wählen · PALO SKIN by Dr. Vogel", robots: { index: false, follow: false } };

/* Verschieben: Tagesleiste und Uhrzeiten wie bei der Buchung (Client), Regeln wie bei der Buchung (Server). */
export default async function VerschiebenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const h = await headers();
  const id = verifyTerminToken(token);
  const booking = id ? getStore().findById(id) : null;
  if (!booking || booking.deleted_at) {
    const l = MAIL_TEXTS[langFromHint((h.get("accept-language") ?? "").slice(0, 2).toLowerCase())];
    return (
      <Shell title={l.pageTitle}>
        <div className="after" style={{ gap: 16 }}>
          <p style={{ margin: 0, fontSize: 17 }}>{l.invalid}</p>
          <a className="btn-ghost" href={WA_LINK} target="_blank" rel="noopener" style={{ textAlign: "center" }}>{l.waButton}</a>
          <Footer />
        </div>
      </Shell>
    );
  }
  const lang = booking.language;
  const l = MAIL_TEXTS[lang];
  const w = terminWindow(booking);
  const when = whenLabels(new Date(booking.starts_at), lang);
  if (w !== "open" && w !== "short") {
    // Nicht mehr verschiebbar: zurück zur Terminseite mit dem passenden Zustand
    return (
      <Shell title={l.pageTitle}>
        <div className="after" style={{ gap: 16 }}>
          <p style={{ margin: 0, fontSize: 17 }}>{w === "cancelled" ? l.cancelledInfo : w === "past" ? l.past(when.dateIn, when.time) : l.punctualShort}</p>
          <a className="btn-ghost" href={`/termin/${token}`} style={{ textAlign: "center" }}>{l.pageTitle}</a>
          <Footer />
        </div>
      </Shell>
    );
  }
  return (
    <Shell title={l.rescheduleH}>
      <RescheduleApp token={token} lang={lang} currentDate={when.date} currentTime={when.time} />
      <div className="after" style={{ paddingTop: 0 }}>
        <Footer />
      </div>
    </Shell>
  );
}
