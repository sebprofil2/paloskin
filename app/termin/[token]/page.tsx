import type { Metadata } from "next";
import { headers } from "next/headers";
import { canCancelOnline } from "@/lib/booking";
import { verifyTerminToken } from "@/lib/links";
import { whenLabels } from "@/lib/mail-content";
import { getStore } from "@/lib/store";
import { TEXTS } from "@/lib/texts";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, PHONE, STUDIO, WA_LINK } from "@/lib/texts-mail";
import "../../booking/booking.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ihr Termin · Palo Skin by Dr. Vogel",
  robots: { index: false, follow: false },
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/*
 * Terminseite aus der Bestätigungsmail: zusagen oder absagen. Alles kommt aus der Datenbank; der Link trägt nur
 * die signierte Buchungskennung. Änderungen nur per POST an /api/termin, nie durch das Öffnen der Seite.
 */
export default async function TerminPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Params> }) {
  const { token } = await params;
  const sp = await searchParams;
  const action = one(sp.a);
  const message = one(sp.m);
  const h = await headers();
  const langHint = (h.get("accept-language") ?? "").slice(0, 2).toLowerCase();
  const id = verifyTerminToken(token);
  const booking = id ? getStore().findById(id) : null;

  if (!booking || booking.deleted_at) {
    const l = MAIL_TEXTS[langHint === "en" || langHint === "es" || langHint === "fr" || langHint === "pt" ? langHint : "de"];
    return (
      <Shell title={l.pageTitle}>
        <p className="hint" style={{ fontSize: 17, color: "var(--ink)" }}>{l.invalid}</p>
      </Shell>
    );
  }

  const lang = booking.language;
  const l = MAIL_TEXTS[lang];
  const t = TEXTS[lang];
  const when = whenLabels(new Date(booking.starts_at), lang);
  const now = new Date();
  const past = Date.parse(booking.ends_at) <= now.getTime();
  const cancelled = booking.status === "cancelled";
  const canCancel = !past && canCancelOnline(booking, now);
  const bookingLink = `/booking?lang=${lang}`;

  let status: string | null = null;
  if (message === "ja") status = l.doneYes;
  else if (message === "absage") status = l.doneCancel;
  else if (message === "zuspaet") status = l.tooLate;
  else if (message === "abgesagt" || cancelled) status = l.cancelledInfo;
  else if (message === "vorbei" || past) status = l.past;

  return (
    <Shell title={l.pageTitle}>
      <div className="confirm" style={{ padding: "28px 24px" }}>
        <p style={{ fontSize: 22, lineHeight: 1.3 }}>{when.dateYear}, {when.time}</p>
        <dl>
          <dt>{t.addrL}</dt>
          <dd className="addr"><a href={MAPS_LINK} target="_blank" rel="noopener">{`${STUDIO}, ${ADDRESS}`}</a></dd>
          <dt>{t.refL}</dt>
          <dd>{booking.reference}</dd>
        </dl>
      </div>
      <div className="after" style={{ gap: 16 }}>
        {status ? <p style={{ margin: 0, fontSize: 17 }}>{status}</p> : null}
        {!cancelled && !past ? (
          <>
            {booking.attendance_confirmed_at && message !== "ja" ? <p className="hint" style={{ margin: 0 }}>{l.attended}</p> : null}
            {action === "absagen" && canCancel && message !== "absage" ? (
              <form method="post" action="/api/termin" style={{ display: "grid", gap: 10 }}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="action" value="absagen" />
                <p style={{ margin: 0, fontSize: 17 }}>{l.cancelQ(when.dateYear, when.time)}</p>
                <button type="submit" className="primary">{l.cancelYes}</button>
                <a className="btn-ghost" href={`/termin/${token}`} style={{ textAlign: "center" }}>{l.cancelNo}</a>
              </form>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {!booking.attendance_confirmed_at ? (
                  <form method="post" action="/api/termin" style={{ display: "grid" }}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="action" value="ja" />
                    <button type="submit" className="primary">{l.yes}</button>
                  </form>
                ) : null}
                {canCancel ? <a className="btn-ghost" href={`/termin/${token}?a=absagen`} style={{ textAlign: "center" }}>{l.cancel}</a> : null}
                {!canCancel && message !== "zuspaet" ? <p className="hint" style={{ margin: 0 }}>{l.tooLate}</p> : null}
              </div>
            )}
          </>
        ) : null}
        {cancelled || past ? <a className="btn-ghost" href={bookingLink} style={{ textAlign: "center" }}>{l.newBooking}</a> : null}
        <div className="note">
          <strong>{STUDIO}</strong>
          <a href={MAPS_LINK} target="_blank" rel="noopener">{ADDRESS}</a>
          <br />
          WhatsApp <a href={WA_LINK} target="_blank" rel="noopener">{PHONE}</a>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shell">
      <main className="app" style={{ minHeight: "auto" }}>
        <div className="band" />
        <div className="brand">
          <div className="wm">Palo Skin</div>
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
