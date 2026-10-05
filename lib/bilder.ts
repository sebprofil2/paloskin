/*
 * Bilder der Startseite und der Buchung (Entwurf B), Webfassungen höchstens 1600 Pixel an der langen Seite, ohne Metadaten.
 * Eingebunden über next/image (Größen für Computer und Handy erzeugt Next.js). Austausch eines Bildes: Datei in app/bilder
 * ersetzen oder hier den Pfad ändern.
 */
import startbild from "@/app/bilder/startbild-dr-vogel.jpg";
// Vorläufig: Eine saubere Fassung folgt, dann nur diese Datei ersetzen
import haende from "@/app/bilder/haende-ruhige-hand.jpg";
import portraetRund from "@/app/bilder/dr-vogel-portraet-rund.jpg";
import beratungsraum from "@/app/bilder/studio-beratungsraum.jpg";
import behandlungsraum from "@/app/bilder/studio-behandlungsraum.jpg";
import lamellen from "@/app/bilder/studio-lamellen.jpg";
import eingang from "@/app/bilder/studio-eingang.jpg";
import faltenbehandlung from "@/app/bilder/behandlung-faltenbehandlung-seidenfalte.jpg";
import kaumuskel from "@/app/bilder/behandlung-kaumuskel.jpg";
import nefertiti from "@/app/bilder/behandlung-nefertiti-lift-bueste.jpg";
import lachsDna from "@/app/bilder/behandlung-lachs-dna-augenpartie.jpg";

export const BILDER = { startbild, haende, portraetRund, beratungsraum, behandlungsraum, lamellen, eingang, faltenbehandlung, kaumuskel, nefertiti, lachsDna };
