import { rechtsseiteAntwort } from "@/lib/rechtsseiten";

export const dynamic = "force-dynamic";

/* Datenschutzerklärung: deutscher Rechtstext, oben nur der Hinweis der gewählten Sprache (lib/rechtsseiten.ts) */
export function GET(req: Request) {
  return rechtsseiteAntwort("datenschutz", req);
}
