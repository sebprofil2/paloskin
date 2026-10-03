import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readEnv } from "@/lib/env";
import "../booking.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Testzugang · Palo Skin by Dr. Vogel", robots: { index: false, follow: false } };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/* Testzugang für den Funktionstest mit Freunden: Code eingeben, nie in der Adresse */
export default async function ZugangPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const lang = (one(sp.lang) ?? "").replace(/[^a-z]/g, "").slice(0, 2);
  const fehler = one(sp.fehler) === "1";
  const testMode = readEnv().testMode;
  // Ohne Testbetrieb gibt es keinen Zugangsweg mehr: direkt zur Buchung
  if (!testMode) redirect(`/booking${lang ? `?lang=${lang}` : ""}`);
  return (
    <div className="shell">
      <main className="app" id="app">
        <div className="band" />
        <header className="brand">
          <a href="/">
            <div className="wm">PALO SKIN</div>
            <div className="by">by Dr. Vogel</div>
          </a>
        </header>
        <div className="page">
          <section className="sec">
            <h2>Testzugang</h2>
            {testMode ? (
              <>
                <p className="lead">Bitte geben Sie den Testcode ein, den Sie von Dr. Vogel erhalten haben. Test access: please enter the code you received from Dr. Vogel.</p>
                {fehler ? <div className="missing">Der Code ist nicht richtig. The code is not correct.</div> : null}
                <form method="post" action="/api/zugang" autoComplete="off">
                  <input type="hidden" name="lang" value={lang} />
                  <label className="field" htmlFor="code">
                    <span className="l">Testcode</span>
                    <input id="code" name="code" type="password" autoComplete="off" required maxLength={80} />
                  </label>
                  <p className="hint">Der Code wird nur einmal übertragen und bleibt 7 Tage als Cookie auf diesem Gerät.</p>
                  <button type="submit" className="primary" style={{ marginTop: 12 }}>Weiter zur Buchung</button>
                </form>
              </>
            ) : (
              <p className="lead">Die Buchung ist ohne Code erreichbar: <a href="/booking">/booking</a></p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
