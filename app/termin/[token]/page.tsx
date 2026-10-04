import type { Metadata } from "next";
import { canConfirmAttendance, terminWindow } from "@/lib/booking";
import { verifyTerminToken } from "@/lib/links";
import { whenLabels } from "@/lib/mail-content";
import { getStore } from "@/lib/store";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, STUDIO, WA_LINK } from "@/lib/texts-mail";
import { Footer, langSuffix, Shell, terminLang } from "@/components/TerminShell";
import { requestLang } from "@/lib/i18n-server";
import "../../booking/booking.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ihr Termin · PALO SKIN by Dr. Vogel",
  robots: { index: false, follow: false },
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/*
 * Terminseite aus den Mails (Gesamtauftrag vom 3. Oktober 2026): Anrede, blauer Kasten, Pünktlichkeitshinweis, Zusage,
 * dann je nach Zeit bis zum Termin Verschieben und Absagen (mehr als 24 Stunden), Verschieben und „Leider verhindert“
 * (24 bis 2 Stunden) oder nichts (unter 2 Stunden). Änderungen nur per POST.
 */
export default async function TerminPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Params> }) {
  const { token } = await params;
  const sp = await searchParams;
  const action = one(sp.a);
  const message = one(sp.m);
  const id = verifyTerminToken(token);
  const booking = id ? getStore().findById(id) : null;

  if (!booking || booking.deleted_at) {
    const lang = await requestLang();
    const l = MAIL_TEXTS[lang];
    return (
      <Shell title={l.pageTitle} lang={lang}>
        <div className="after" style={{ gap: 16 }}>
          <p style={{ margin: 0, fontSize: 17 }}>{l.invalid}</p>
          <a className="btn-ghost" href={WA_LINK} target="_blank" rel="noopener" style={{ textAlign: "center" }}>{l.waButton}</a>
          <Footer />
        </div>
      </Shell>
    );
  }

  const lang = terminLang(sp.lang, booking.language);
  const q = langSuffix(lang, booking.language);
  const qa = langSuffix(lang, booking.language, "&");
  const l = MAIL_TEXTS[lang];
  const when = whenLabels(new Date(booking.starts_at), lang);
  const now = new Date();
  const w = terminWindow(booking, now);
  const confirmed = !!booking.attendance_confirmed_at;
  const bookingLink = `/booking?lang=${lang}`;
  const open = w === "open" || w === "short" || w === "closed";

  let status: string | null = null;
  if (message === "absage") status = l.doneCancel;
  else if (w === "cancelled") status = l.cancelledInfo;
  else if (w === "past") status = l.past(when.dateIn, when.time);
  else if (message === "ja" || confirmed) status = l.doneYes(when.dateIn, when.time);

  const askCancel = (action === "absagen" || action === "verhindert") && (w === "open" || w === "short");
  const cancelLabel = w === "short" ? l.cancelShort : l.cancel;

  return (
    <Shell title={l.pageTitle} lang={lang}>
      <div className="page" style={{ gap: 6, paddingTop: 0, paddingBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 17 }}>{l.greeting(booking.first_name)}</p>
        <p style={{ margin: 0, fontSize: 17 }}>{l.pageIntro}</p>
      </div>
      <div className="confirm" style={{ padding: "28px 24px" }}>
        <p style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 500 }}>{when.date}{lang === "ar" ? "،" : ","} <bdi>{when.time}</bdi></p>
        <p style={{ margin: 0 }}><bdi>{STUDIO}</bdi><br /><bdi>{ADDRESS}</bdi></p>
        <p style={{ margin: 0 }}><a href={MAPS_LINK} target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>{l.mapL}</a></p>
      </div>
      <div className="after" style={{ gap: 16 }}>
        {open ? <p className="hint" style={{ margin: 0, color: "var(--ink-2)" }}>{l.punctualShort}</p> : null}
        {status ? <p style={{ margin: 0, fontSize: 17 }}>{status}</p> : null}
        {open && askCancel ? (
          <form method="post" action="/api/termin" style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="absagen" />
            <input type="hidden" name="lang" value={q ? lang : ""} />
            <p style={{ margin: 0, fontSize: 17 }}>{l.cancelQ}<br /><strong>{when.date}, {when.time}</strong></p>
            <button type="submit" className="primary">{l.cancelYes}</button>
            <a className="btn-ghost" href={`/termin/${token}${q}`} style={{ textAlign: "center" }}>{l.cancelNo}</a>
            {w === "open" ? (
              <p style={{ margin: "6px 0 0", fontSize: 17 }}>{l.orReschedule} <a href={`/termin/${token}/verschieben${q}`}>{l.reschedule}</a></p>
            ) : null}
          </form>
        ) : open ? (
          <div style={{ display: "grid", gap: 10 }}>
            {canConfirmAttendance(booking, now) ? (
              <>
                <p style={{ margin: 0, fontSize: 17 }}>{l.confirmQ}</p>
                <form method="post" action="/api/termin" style={{ display: "grid" }}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="action" value="ja" />
                  <input type="hidden" name="lang" value={q ? lang : ""} />
                  <button type="submit" className="primary">{l.yes}</button>
                </form>
              </>
            ) : null}
            {w === "open" ? (
              <>
                <p className="hint" style={{ margin: "6px 0 0" }}>{l.windowOpen}</p>
                <a className="btn-ghost" href={`/termin/${token}/verschieben${q}`} style={{ textAlign: "center" }}>{l.reschedule}</a>
                <a className="btn-ghost" href={`/termin/${token}?a=absagen${qa}`} style={{ textAlign: "center" }}>{l.cancel}</a>
              </>
            ) : w === "short" ? (
              <>
                <p className="hint" style={{ margin: "6px 0 0" }}>{l.windowShort}</p>
                <a className="btn-ghost" href={`/termin/${token}/verschieben${q}`} style={{ textAlign: "center" }}>{l.reschedule}</a>
                <a className="btn-ghost" href={`/termin/${token}?a=verhindert${qa}`} style={{ textAlign: "center" }}>{cancelLabel}</a>
              </>
            ) : null}
          </div>
        ) : (
          <a className="btn-ghost" href={bookingLink} style={{ textAlign: "center" }}>{l.newBooking}</a>
        )}
        <Footer />
      </div>
    </Shell>
  );
}
