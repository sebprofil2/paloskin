import type { Metadata } from "next";
import { LogoKopf } from "@/components/LogoKopf";

/* Inhalt und Aufbau wie public/404.html, nichts neu geschrieben */
export const metadata: Metadata = {
  title: "Seite nicht gefunden · PALO SKIN by Dr. Vogel",
  robots: { index: false },
};

const redirectScript = `(function(){ var p=location.pathname.toLowerCase(); if (/termin|buchung|booking|book|appointment|cita|rendez|agend/.test(p)) location.replace("/booking"+location.search); })();`;

export default function NotFound() {
  return (
    <>
      <link rel="stylesheet" href="/assets/site.css" />
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <div className="band" />
      <header className="wrap top">
        <a className="wm" href="/" aria-label="PALO SKIN by Dr. Vogel, Startseite">
          <LogoKopf />
        </a>
        <nav className="nav">
          <a className="btn primary small" href="/booking">Termin buchen</a>
        </nav>
      </header>
      <main className="wrap" style={{ padding: "48px 20px 96px", maxWidth: 720 }}>
        <h1 style={{ fontSize: "clamp(30px,5vw,44px)" }}>Diese Seite gibt es nicht.</h1>
        <p className="lead" style={{ marginTop: 16 }}>Vielleicht hat sich ein Tippfehler eingeschlichen. Hier geht es weiter:</p>
        <p style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="btn primary" href="/booking">Termin buchen</a>
          <a className="btn ghost" href="/">Zur Startseite</a>
        </p>
        <p className="small" style={{ marginTop: 32 }} lang="en">
          Page not found. <a href="/booking">Book an appointment</a> or go to the <a href="/">start page</a>.
        </p>
      </main>
    </>
  );
}
