import type { Metadata } from "next";
import { headers } from "next/headers";
import { canCancelOnline } from "@/lib/booking";
import { verifyTerminToken } from "@/lib/links";
import { whenLabels } from "@/lib/mail-content";
import { getStore } from "@/lib/store";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, PHONE, STUDIO, WA_LINK } from "@/lib/texts-mail";
import type { Lang } from "@/lib/treatments";
import "../../booking/booking.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ihr Termin · PALO SKIN by Dr. Vogel",
  robots: { index: false, follow: false },
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/*
 * Terminseite aus den Mails (endgültige Texte vom 3. Oktober 2026): Anrede, blauer Kasten mit Datum, Uhrzeit, Adresse und
 * Kartenlink, Pünktlichkeitshinweis, dann je nach Zustand Zusage, Absage (bis 48 Stunden vorher) oder WhatsApp.
 * Keine Buchungsnummer, keine Behandlung. Änderungen nur per POST an /api/termin.
 */
export default async function TerminPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Params> }) {
  const { token } = await params;
  const sp = await searchParams;
  const action = one(sp.a);
  const message = one(sp.m);
  const h = await headers();
  const hint = (h.get("accept-language") ?? "").slice(0, 2).toLowerCase();
  const id = verifyTerminToken(token);
  const booking = id ? getStore().findById(id) : null;

  if (!booking || booking.deleted_at) {
    const lang: Lang = hint === "en" || hint === "es" || hint === "fr" || hint === "pt" ? hint : "de";
    const l = MAIL_TEXTS[lang];
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
  const when = whenLabels(new Date(booking.starts_at), lang);
  const now = new Date();
  const past = Date.parse(booking.ends_at) <= now.getTime();
  const cancelled = booking.status === "cancelled";
  const canCancel = !past && canCancelOnline(booking, now);
  const confirmed = !!booking.attendance_confirmed_at;
  const bookingLink = `/booking?lang=${lang}`;
  const open = !cancelled && !past;

  let status: string | null = null;
  if (message === "absage") status = l.doneCancel;
  else if (cancelled) status = l.cancelledInfo;
  else if (past) status = l.past(when.dateIn, when.time);
  else if (message === "ja" || confirmed) status = l.doneYes(when.dateIn, when.time);

  return (
    <Shell title={l.pageTitle}>
      <div className="page" style={{ gap: 6, paddingTop: 0, paddingBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 17 }}>{l.greeting(booking.first_name)}</p>
        <p style={{ margin: 0, fontSize: 17 }}>{l.pageIntro}</p>
      </div>
      <div className="confirm" style={{ padding: "28px 24px" }}>
        <p style={{ fontSize: 22, lineHeight: 1.3 }}>{when.dateYear}, {when.time}</p>
        <p style={{ margin: 0 }}>{STUDIO}<br />{ADDRESS}</p>
        <p style={{ margin: 0 }}><a href={MAPS_LINK} target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>{l.mapL}</a></p>
      </div>
      <div className="after" style={{ gap: 16 }}>
        {open ? <p className="hint" style={{ margin: 0, color: "var(--ink-2)" }}>{l.punctualShort}</p> : null}
        {status ? <p style={{ margin: 0, fontSize: 17 }}>{status}</p> : null}
        {open ? (
          action === "absagen" && canCancel ? (
            <form method="post" action="/api/termin" style={{ display: "grid", gap: 10 }}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="action" value="absagen" />
              <p style={{ margin: 0, fontSize: 17 }}>{l.cancelQ}<br /><strong>{when.dateYear}, {when.time}</strong></p>
              <button type="submit" className="primary">{l.cancelYes}</button>
              <a className="btn-ghost" href={`/termin/${token}`} style={{ textAlign: "center" }}>{l.cancelNo}</a>
            </form>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {!confirmed ? (
                <>
                  <p style={{ margin: 0, fontSize: 17 }}>{l.askOpen}</p>
                  <form method="post" action="/api/termin" style={{ display: "grid" }}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="action" value="ja" />
                    <button type="submit" className="primary">{l.yes}</button>
                  </form>
                </>
              ) : null}
              {canCancel ? (
                <a className="btn-ghost" href={`/termin/${token}?a=absagen`} style={{ textAlign: "center" }}>{l.cancel}</a>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 17 }}>{l.tooLate}</p>
                  <a className="btn-ghost" href={WA_LINK} target="_blank" rel="noopener" style={{ textAlign: "center" }}>{l.waButton}</a>
                </>
              )}
            </div>
          )
        ) : (
          <a className="btn-ghost" href={bookingLink} style={{ textAlign: "center" }}>{l.newBooking}</a>
        )}
        <Footer />
      </div>
    </Shell>
  );
}

function Footer() {
  return (
    <div className="note">
      <strong>{STUDIO}</strong>
      <a href={MAPS_LINK} target="_blank" rel="noopener">{ADDRESS}</a>
      <br />
      WhatsApp <a href={WA_LINK} target="_blank" rel="noopener">{PHONE}</a>
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shell">
      <main className="app" style={{ minHeight: "auto" }}>
        <div className="band" />
        <div className="brand">
          <div className="wm">PALO SKIN</div>
          <div className="by">by Dr. Vogel</div>
        </div>
        <div className="page" style={{ gap: 20, paddingBottom: 8 }}>
          <h2 style={{ marginTop: 8 }}>{title}</h2>
        </div>
        {children}
      </main>
    </div>
  );
}
