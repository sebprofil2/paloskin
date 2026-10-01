# Hinweise für Claude Code: Website paloskin.de und Buchung zusammenführen

Stand: 1. Oktober 2026 (Berliner Zeit). Dieses Repository enthält die fertige statische Website von Palo Skin by Dr. Vogel. Die Buchungsanwendung (Next.js, Google Kalender) wird nach dem „Bauauftrag Buchung mit Google Kalender" in dasselbe Repository gebaut. Ziel: ein Vercel-Projekt, eine Domain, keine zweite Seite.

## Was schon da ist (Ordner public)

1. `public/index.html`: Startseite, fünf Sprachen über `public/assets/lang.js` und `public/assets/home-text.js`. Texte sind freigegebene Inhalte, nichts umformulieren.
2. `public/booking/index.html`: Zwischenlösung für die Buchung (Behandlungsauswahl aus dem Entwurf, danach Wunschtermin und Anfrage per WhatsApp). Wird durch die echte Buchung ersetzt, siehe unten.
3. `public/impressum/index.html`, `public/datenschutz/index.html`: Rechtstexte, bleiben unverändert und werden von der Buchung verlinkt (`/impressum`, `/datenschutz`, mit `?lang=` für die Sprache).
4. `public/assets/site.css`: Markenstile (Ultramarin #002FA7, Kalk #F4F1EA, Schibsted Grotesk selbst gehostet unter `public/assets/fonts`, keine Schriften von Google-Servern laden, Datenschutz).
5. `public/404.html`, `public/robots.txt`, `public/sitemap.xml`, `public/assets/favicon.svg`, `public/assets/apple-touch-icon.png`.
6. `vercel.json`: saubere Adressen ohne `.html` und ohne Schrägstrich am Ende, Weiterleitungen `/termine`, `/buchung`, `/termin`, `/book` auf `/booking` (der QR-Code auf dem Schild zeigt auf `https://www.paloskin.de/termine`), Cache-Regel für die Schriften.

## Schritte beim Einbau der Next.js-Anwendung

1. Next.js im Wurzelverzeichnis anlegen (App Router, TypeScript, Tailwind). Der Ordner `public` bleibt genau so bestehen; Next.js liefert ihn unverändert aus.
2. In `vercel.json` die Zeile `"outputDirectory": "public"` entfernen (sie gilt nur für die statische Phase ohne Next.js). `cleanUrls`, `trailingSlash` und `redirects` bleiben, oder gleichwertig in `next.config` als `redirects()` und `trailingSlash: false` übernehmen.
3. Rewrites in `next.config`, damit die statischen Seiten unter sauberen Adressen erscheinen:
   - `/` auf `/index.html`
   - `/impressum` auf `/impressum/index.html`
   - `/datenschutz` auf `/datenschutz/index.html`
   Alternativ die drei Seiten als Route Handler oder als `app/page.tsx` mit `dangerouslySetInnerHTML` einbinden. Keine Inhalte neu schreiben.
4. Die Buchung bekommt die Route `app/booking/page.tsx`. Sobald sie steht, die Datei `public/booking/index.html` löschen, damit es nur eine Buchungsseite gibt. Bis dahin ist die Zwischenlösung unter `/booking` erreichbar.
5. Testbetrieb laut Bauauftrag: Ohne gültigen Testcode soll `/booking` nicht leer bleiben und keine Fehlermeldung zeigen, sondern den Inhalt der Zwischenlösung (Anfrage per WhatsApp), weil der QR-Code am Schild bereits auf die Seite führt. Mit Testcode die echte Buchung.
6. Startseite verlinkt auf `/booking` und hängt die Sprache als `?lang=de|en|es|fr|pt` an. Die Buchung soll diesen Parameter lesen, danach die gespeicherte Wahl (`localStorage` Schlüssel `paloLang`), danach die Gerätesprache, sonst Deutsch. Genau so macht es `public/assets/lang.js`, Funktion `detectLang`.
7. Kopf und Sprachauswahl der Buchung dürfen `public/assets/lang.js` (Fahnen, Sprachliste, Aufklappmenü) wiederverwenden, damit Startseite und Buchung gleich aussehen.
8. Datenschutzerklärung: Abschnitt 4 beschreibt die Buchung derzeit mit cal.com als Dienstleister. Sobald die Google-Kalender-Anbindung live geht, diesen Abschnitt auf Google (Kalender, Dienstkonto, Vercel als Hosting mit Region Frankfurt) umschreiben. Hosting-Abschnitt 2 von GitHub Pages auf Vercel umstellen. Beides vor dem ersten echten Kunden.

## Ergebnisse der Gegenprüfung des Vorgehens (1. Oktober 2026)

1. Dienstkonto und Gäste: Ein Dienstkonto kann bei einem privaten Gmail-Konto keine Teilnehmer in Termine eintragen (Google verlangt dafür Domain-weite Delegation, die es nur mit Google Workspace gibt). Der Kunde bekommt daher keine Google-Einladung. Wenn die Kalendereinladung an den Kunden von Google kommen soll, stattdessen OAuth mit dem Konto von Dr. Vogel (Refresh Token als Umgebungsvariable, einmalige Anmeldung), Termin mit Gast und `sendUpdates=all` anlegen. Andernfalls eigene Bestätigungsmail mit .ics-Anhang (zum Beispiel über Resend oder Brevo, Absender bookings@paloskin.de, dafür DNS-Einträge bei GoDaddy).
2. Doppelbuchung ohne Datenbank: nach `events.insert` sofort `events.list` im selben Zeitfenster des Buchungskalenders; sind es zwei Treffer und der eigene ist der jüngere, eigenen Eintrag wieder löschen und dem Kunden eine andere Zeit anbieten. Ergänzt die Anfragekennung aus dem Bauauftrag.
3. Raster: 30-Minuten-Raster bei 20-Minuten-Terminen verschenkt Zeit; Vorschlag Raster 10 Minuten (`SLOT_STEP_MINUTES=10`) plus Clusterung wie im Konzept (nach einer Buchung nur Zeiten direkt davor und danach anbieten).
4. Zeitumstellung: Winterzeit beginnt in Deutschland am Sonntag, 25. Oktober 2026, um 03:00 Uhr. Termine danach ausdrücklich testen, Berechnung nur mit `Europe/Berlin`, nie mit festem Versatz.
5. Vercel Pro ist Pflicht (Hobby-Tarif verbietet geschäftliche Nutzung), Funktionsregion `fra1`.

## Feste Angaben

- Studio: Palo Skin by Dr. Vogel, Nidus Skin Berlin GmbH, Hagenauer Straße 14, 10435 Berlin. Handelsregister Amtsgericht Charlottenburg HRB 290965 B.
- Studionummer (WhatsApp, Anruf, SMS): +49 151 58872566.
- Preise brutto: 1 Zone 120 €, 2 Zonen 210 €, 3 Zonen 300 €, jede weitere Zone 80 € (nur mit 3 Zonen), Kaumuskel 280 €, Nefertiti-Lift 280 €, Lachs-DNA 280 €, Lachs-DNA Viererpaket 1.000 €. Beratung ohne Preisangabe.
- Keine langen Gedankenstriche in sichtbaren Texten, keine Abkürzungen, durchgehend Siezen.
