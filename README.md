# paloskin.de

Website von Palo Skin by Dr. Vogel (Nidus Skin Berlin GmbH), Berlin Prenzlauer Berg.

Ein Next.js-Projekt (App Router, TypeScript, Tailwind):

- Startseite `/` als fertiges HTML vom Server (`app/route.ts`, `lib/startseite.ts`), ohne React-Laufzeit im Browser.
- Terminbuchung unter `/booking` mit Google Kalender (`app/booking`, `components/BookingApp.tsx`, `lib`), Terminseite und Verschieben unter `/termin`.
- Impressum und Datenschutz als statische Seiten im Ordner `public`.

Sprachen: Seitensprache an einer Stelle in `lib/i18n.ts` (Liste, Erkennung, Speicherung). Reihenfolge: `?lang=`, gespeicherte Wahl (Cookie `palo_lang`, dazu localStorage `paloLang`), Sprache des Geräts, sonst Deutsch. `proxy.ts` bestimmt sie für jede Seitenanfrage, damit schon der Server die richtige Sprache liefert. Texte: `lib/texts-home.ts` (Startseite), `lib/texts.ts` (Buchung), `lib/texts-mail.ts` (Mails, Terminseite, Verschieben), `lib/share-meta.ts` (Titel, Beschreibung, Vorschau). Der Test `lib/__tests__/sprachen.test.ts` prüft, dass jeder Textschlüssel in allen Sprachen vorhanden ist.

Adressen: `/` Startseite, `/booking` Terminbuchung, `/impressum`, `/datenschutz`. `/termine`, `/buchung`, `/termin`, `/book` leiten auf `/booking` weiter.

## Entwicklung

```bash
npm install
cp .env.example .env.local   # Werte eintragen, mindestens TEST_ACCESS_CODE
npm run dev                  # http://localhost:3000
npm test                     # Einheitstests (Dauer, Raster, Zeitumstellung, Testmotor, Eingabeprüfung)
npm run typecheck
npm run build
```

Ohne Angabe gilt Produktion (öffentlich). Testbetrieb nur mit `TEST_MODE=true` oder auf der Testinstanz (`PALOSKIN_INSTANCE=test`): Dann ist die Buchung nur nach Eingabe des Testcodes unter `/booking/zugang` erreichbar (Formular, HttpOnly-Cookie für 7 Tage, nie in der Adresse), ohne Code zeigt `/booking` nur „Testumgebung, nicht öffentlich“.

Kontrolltermin-Link: `/booking?kontrolle` (15 Minuten, beginnt bei der Terminwahl). Sprache: `?lang=de|en|es|fr|pt`.

## Buchungsmotor

`BOOKING_ENGINE=mock` liefert erfundene freie Zeiten und merkt sich Buchungen nur im Speicher der laufenden Instanz. `BOOKING_ENGINE=google` liest und schreibt die Google-Kalender über ein Dienstkonto, siehe `.env.example`. Beide Motoren liegen in `lib/engine`.

## Betrieb

- Eigener Server bei Hetzner (paloskin-1): Docker Compose mit Caddy davor, Image aus GitHub Actions. Anleitung in `deploy/UMZUG-HETZNER.md`.
- Lokal als Container: `docker build -t paloskin .` und `docker run -p 3000:3000 --env-file .env.local paloskin`.

Weitere Hinweise in „Hinweise fuer Claude Code.md“.
