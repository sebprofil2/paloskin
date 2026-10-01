# paloskin.de

Website von Palo Skin by Dr. Vogel (Nidus Skin Berlin GmbH), Berlin Prenzlauer Berg.

Ein Next.js-Projekt (App Router, TypeScript, Tailwind) mit zwei Teilen:

- Statische Seiten im Ordner `public` (Startseite, Impressum, Datenschutz), unverändert ausgeliefert.
- Terminbuchung unter `/booking` mit Google Kalender (`app/booking`, `components/BookingApp.tsx`, `lib`).

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

Im Testbetrieb (Standard, solange nicht `TEST_MODE=false`) ist die echte Buchung nur nach Eingabe des Testcodes unter `/booking/zugang` erreichbar (Formular, HttpOnly-Cookie für 14 Tage, nie in der Adresse). Ohne Cookie zeigt `/booking` die Zwischenlösung (Anfrage per WhatsApp) aus `content/booking-interim.html`.

Kontrolltermin-Link: `/booking?kontrolle` (15 Minuten, beginnt bei der Terminwahl). Sprache: `?lang=de|en|es|fr|pt`.

## Buchungsmotor

`BOOKING_ENGINE=mock` liefert erfundene freie Zeiten und merkt sich Buchungen nur im Speicher der laufenden Instanz. `BOOKING_ENGINE=google` liest und schreibt die Google-Kalender über ein Dienstkonto, siehe `.env.example`. Beide Motoren liegen in `lib/engine`.

## Betrieb

- Vercel Pro, Funktionsregion Frankfurt (`vercel.json`). Umgebungsvariablen aus `.env.example` im Vercel-Projekt setzen.
- Docker: `docker build -t paloskin .` und `docker run -p 3000:3000 --env-file .env.local paloskin` (für den späteren Umzug auf einen Hetzner-Server, HTTPS zum Beispiel über Caddy davor).

Weitere Hinweise in „Hinweise fuer Claude Code.md“.
