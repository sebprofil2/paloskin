import { ADDRESS, MAPS_LINK, PHONE, STUDIO, WA_LINK } from "@/lib/texts-mail";
import type { Lang } from "@/lib/treatments";
import { LogoKopf } from "@/components/LogoKopf";

/* Rahmen der Terminseiten: Kopf mit Marke, Überschrift, Fußkasten mit Adresse und WhatsApp. */
export function langFromHint(hint: string): Lang {
  return hint === "en" || hint === "es" || hint === "fr" || hint === "pt" ? hint : "de";
}

export function Footer() {
  return (
    <div className="note">
      <strong>{STUDIO}</strong>
      <a href={MAPS_LINK} target="_blank" rel="noopener">{ADDRESS}</a>
      <br />
      WhatsApp <a href={WA_LINK} target="_blank" rel="noopener">{PHONE}</a>
    </div>
  );
}

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shell">
      <main className="app" style={{ minHeight: "auto" }}>
        <div className="band" />
        <div className="brand">
          <a href="/" aria-label="PALO SKIN by Dr. Vogel, Startseite">
            <LogoKopf />
          </a>
        </div>
        <div className="page" style={{ gap: 20, paddingBottom: 8 }}>
          <h2 style={{ marginTop: 8 }}>{title}</h2>
        </div>
        {children}
      </main>
    </div>
  );
}
