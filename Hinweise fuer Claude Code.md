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

## Stand nach dem Einbau der Buchung (1. Oktober 2026, abends)

Gebaut nach dem „Bauauftrag: Buchungsseite Palo Skin mit echtem Google-Kalender“, Fassung 2, und dem Entwurf Version 26.

1. Next.js 16 liegt im Wurzelverzeichnis. `public` ist unverändert, nur `public/booking/index.html` ist nach `content/booking-interim.html` gewandert und wird von `/booking` ohne Testcode weiterhin ausgeliefert (`components/InterimBooking.tsx`).
2. `vercel.json` enthält nur noch Framework und Region `fra1`. Weiterleitungen, Umschreibungen und Kopfzeilen stehen in `next.config.ts`.
3. Zugang im Testbetrieb: `proxy.ts` setzt bei gültigem `?test=` ein Cookie, `app/booking/page.tsx` prüft Cookie oder Adresse. Die Serverrouten unter `app/api` prüfen dasselbe (`lib/access.ts`).
4. Motoren in `lib/engine`: `MockEngine` (erfundene Zeiten, Buchungen im Speicher) und `GoogleCalendarEngine` (Dienstkonto über `google-auth-library`, REST-Aufrufe an die Calendar API). `cancel` und `reschedule` werfen „noch nicht gebaut“.
5. Dauer in `lib/duration.ts`, Raster und Puffer in `lib/slots.ts`, Zeitrechnung in `lib/time.ts` (nur Europe/Berlin, Tests für den 25. Oktober 2026 in `lib/__tests__`).
6. Texte in `lib/texts.ts`: Block T wörtlich aus dem Entwurf, Block X mit Ergänzungen für die echte Seite (Testhinweis, Buchungsnummer, Dauer, unklarer Ausgang, Konflikt, Absage per WhatsApp, Fußzeile). Die Übersetzungen von Block X sind von der KI und müssen gegengelesen werden.
7. Bewusst weggelassen gegenüber dem Entwurf: der Satz „Die Bestätigung mit Kalendereinladung geht an …“ auf der Bestätigungsseite, weil in Stufe 1 keine E-Mail und keine Einladung verschickt wird. Ebenso der Hinweis zum Link in der Bestätigung; stattdessen steht dort der Satz zum Absagen per WhatsApp oder Anruf.
8. Meldung an Dr. Vogel bei unklarem Buchungsausgang: deutlich markierte Zeile im Protokoll des Hostings und, falls `OWNER_WEBHOOK_URL` gesetzt ist, ein POST mit JSON. Eine E-Mail-Benachrichtigung gibt es noch nicht.
9. Begrenzung auf sechs Buchungsversuche pro Stunde und Anschluss, im Speicher der Instanz. In Stufe 2 in die Datenbank verlegen.
10. Vor Google-Start: Dienstkonto anlegen, Calendar API aktivieren, die drei Kalender dem Dienstkonto freigeben (offen: Termine lesen, Termine: lesen und ändern, Hauptkalender: nur frei/belegt), Variablen aus `.env.example` auf Vercel setzen, `BOOKING_ENGINE=google`.
11. Vor dem ersten echten Kunden: Abschnitte 2 und 4 der Datenschutzerklärung umschreiben (Vercel statt GitHub Pages, Google Kalender mit Dienstkonto statt cal.com), siehe oben; danach `TEST_MODE=false`.

## Texte, die beim Umbau auf die Kalenderbuchung wieder angepasst werden müssen (1. Oktober 2026)

Solange /booking die Zwischenlösung (Anfrage per WhatsApp) zeigt, sind die Texte der Startseite ehrlich auf die Anfrage formuliert. Sobald die echte Buchung mit Google Kalender für alle freigeschaltet ist (`TEST_MODE=false`), in `public/index.html` und `public/assets/home-text.js` in allen fünf Sprachen anpassen:

1. `s1P` („So läuft es ab“, Schritt 1): derzeit „Behandlung aussuchen, Wunschtermin wählen, Anfrage absenden. Wir bestätigen den Termin per WhatsApp.“ Dann wieder auf die sofortige Bestätigung umstellen.
2. `hours` (Kopfbereich, Termine): derzeit „Nach Online-Anfrage“. Dann „Nach Online-Buchung“.
3. `hours2` (Studio, Termine): derzeit „Nur mit Termin, Anfrage online oder per WhatsApp“. Dann „Buchung online rund um die Uhr“.
4. `a5` (Häufige Fragen, Absagen): derzeit „Per WhatsApp an +49 151 58872566 …“. Erst ändern, wenn es Absagen über einen Link gibt.

Außerdem: `TEST_MODE` gilt standardmäßig als eingeschaltet. Ohne Umgebungsvariablen auf Vercel zeigt /booking deshalb die Zwischenlösung, nie die Testbuchung.

## Google-Anbindung eingerichtet (1. Oktober 2026, spät)

- Google-Cloud-Projekt `palo-skin-buchung`, Dienstkonto `buchung-website@palo-skin-buchung.iam.gserviceaccount.com`. Schlüsseldatei nur lokal in `.env.local` als `GOOGLE_SERVICE_ACCOUNT_JSON` (eine Zeile JSON in einfachen Anführungszeichen), nie im Repository. Auf Vercel dieselbe Variable setzen.
- Kalender „Palo Skin Termine“: `c_5c073fe9d8b5b448d61cba6ab7573c5f61a7fc012d969ff103a6a91f7c2d17ad@group.calendar.google.com`, Dienstkonto hat Schreibrecht (`writer`). Hauptkalender `sebastian@paloskin.de`: nur frei/belegt (`freeBusyReader`). Beide geprüft.
- Freigegebene Kalender erscheinen in der Kalenderliste eines Dienstkontos erst, wenn sie einmal aufgenommen wurden: `node scripts/google-check.mjs add-open <Kalender-ID>`. Für den Betrieb ist das nicht nötig, der Motor arbeitet direkt mit den Kennungen aus den Umgebungsvariablen.
- Die Kennung von „Palo Skin offen“ steht in Google Kalender unter Einstellungen, Kalender „Palo Skin offen“, Abschnitt „Kalender integrieren“, Feld „Kalender-ID“. Sie gehört in `CALENDAR_OPEN_ID`.
- Testlauf: `node scripts/google-check.mjs list|busy|event` (Kalenderliste, frei/belegt der nächsten 7 Tage, Probetermin eintragen, lesen, löschen).

## Notiz Bezahlung (1. Oktober 2026)

Die Frage „Wie kann ich bezahlen?“ wurde aus den häufigen Fragen der Startseite entfernt. Zahlungsinformationen (Karte oder Überweisung) kommen später nur in die Buchungsbestätigung, nicht auf die Website.

## Personenzahl in der Buchung (1. Oktober 2026)

Schritt 1 beginnt mit „Für wie viele Personen?“ (1 Person vorausgewählt, höchstens 2). Besuchsfrage und Behandlung gelten für die buchende Person, die zweite wählt vor Ort. Dauer: jede weitere Person plus 20 Minuten (`lib/duration.ts`). Kalendereintrag und Auswahltext nennen „2 Personen“, der Preis ändert sich nicht. Nirgends auf der Website die Wörter Rabatt, Aktion, Vorteil oder günstiger.

Für später, nicht gebaut: Nach einer Buchung für 1 Person soll die Bestätigung einen Hinweis enthalten, dass auf 2 Personen umgebucht werden kann, mit einem Link, der den bestehenden Termin um 20 Minuten verlängert statt einen neuen anzulegen. Bei Buchungen für 2 Personen kein solcher Hinweis. Braucht den Versand der Bestätigung und die Datenbank aus Stufe 2 (Buchungs-ID, Idempotenz, Verlängerung prüft erneut die Verfügbarkeit).

## Härtung der Buchung nach der Sicherheitsprüfung (1. Oktober 2026, Punkt D)

1. Testzugang nur über das Formular `/booking/zugang` (POST an `/api/zugang`, Vergleich in konstanter Zeit, 5 Versuche je 15 Minuten und Anschluss). Cookie HttpOnly, SameSite=Strict, 14 Tage. Der Code steht nie in der Adresse, im Browser-Bundle oder im Protokoll. `proxy.ts` ist entfernt.
2. Eingabeprüfung strikt (`.strict()` in `lib/schema.ts`): unbekannte Felder wie Kalender-ID, Event-ID, Endzeit oder Gäste werden abgelehnt. Dauer, Fenster, Vorlauf, Horizont, Endzeit, Raster und Buchungsnummer bestimmt nur der Server.
3. Begrenzung (`lib/ratelimit.ts`): Buchung 6 je Stunde und Anschluss sowie 3 je Stunde und Kontakt (E-Mail plus Handynummer, nur als Hash gehalten), freie Zeiten 60 je Minute, Empfehlung 10 je Stunde. X-Forwarded-For nur bei `TRUST_PROXY=true` (hinter Caddy) oder auf Vercel. `Cache-Control: no-store` auf `/api/*` und `/booking/*`. An den Browser gehen nur buchbare Startzeiten.
4. Google-Fehler, Zeitüberschreitung oder Teilantwort ergeben nie „frei“. Nach einer Zeitüberschreitung beim Eintragen fragt der Server die Buchungsnummer nach: gefunden heißt „gespeichert, Antwort verloren“ (Bestätigung), nicht gefunden heißt „nicht gespeichert“ (Zustand „wir prüfen“, Meldung). Die Buchungsnummer ist aus der Anfragekennung abgeleitet (`lib/ref.ts`, SHA-256) und damit der Idempotenzschlüssel; die Anfragekennung selbst wird nicht gespeichert.
5. Kalendereintrag minimal: Titel „Palo Skin: Vorname N.“ (Nachname als Initiale), Beschreibung mit Behandlung und Kontakt, `extendedProperties.private` nur `bookingRef`, `status`, `service` (Leistungscode wie BOT+LDN+P2). Keine Notiz im Kalender; das Notizfeld ist bis Stufe 2 ausgeblendet (`NOTE_ENABLED` in `components/BookingApp.tsx`).
6. Protokolle (`lib/log.ts`): nur Ereignis, Zeit, Fehlerklasse, Kennungen. Keine Request-Bodies, Namen, Nummern oder Adressen; Google-Antworttexte werden nicht mitgeschrieben. Meldungen an Dr. Vogel enthalten nur Buchungsnummer, Status und Fehlerklasse.

## Zweite Sicherheitsprüfung, Umsetzung (2. Oktober 2026)

1. Image aus GitHub Actions (`.github/workflows/image.yml`) nach ghcr.io, privat; Server zieht nur. Notfall-Build über `deploy/docker-compose.build.yml`, Swap 2 GB als Reserve.
2. Schritt 3 in zwei Phasen (`deploy/schritt3.sh`): erst `deploy` mit sudo testen, dann Root- und Passwort-Login abschalten.
3. Dienstkontoschlüssel auf dem Host Eigentümer 10001:10001, Rechte 0400; Prüfung im Container dokumentiert (Abschnitt 6 der Umzugsanleitung).
4. Zugangs-Cookie signiert (HMAC-SHA256 mit `TEST_COOKIE_SECRET`), Ablauf 7 Tage serverseitig geprüft, Secure hinter dem Proxy, Widerruf durch Wechsel des Schlüssels (`lib/access.ts`, Tests in `lib/__tests__/access.test.ts`).
5. Schreibgeschütztes Dateisystem mit tmpfs für `/tmp` und `.next/cache`; Prüfbefehl in Abschnitt 6.
6. Testplan unter `neu.paloskin.de` vor der DNS-Umstellung (Abschnitt 8), inklusive Neustart, Kalenderausfall und Wiederherstellung aus Backup.
7. Docker-Protokolle daemonweit begrenzt (`deploy/daemon.json`), Speicherplatz im Heartbeat überwacht.
8. Überwachung: Better Stack (Prag) mit HTTPS-Monitor und Heartbeat, Alarm an accounts@paloskin.de; `deploy/heartbeat.sh` (Abschnitt 14).
9. Updates: Dependabot, monatlicher Image-Neubau, Ausrollen per `pull` und `up -d` (Abschnitt 15).

## Server paloskin-1 (Hetzner, Stand 2. Oktober 2026)

- CPX12 Nürnberg, Ubuntu 24.04, IPv4 2.31.2.192, IPv6 2a01:4f8:1c16:71ba::1, Hetzner-Firewall „firewall-1“ (TCP 22, 80, 443, ICMP), tägliche Backups. Zugang nur per Schlüssel als `deploy` (`ssh paloskin` vom Mac), Root- und Passwort-Login aus, UFW 22/80/443, fail2ban, unattended-upgrades, Swap 2 GB.
- Docker 29 mit Compose v5, Code unter `/opt/paloskin` (Branch `zonen`), Image aus `ghcr.io/sebprofil2/paloskin:zonen` (privat, Login als deploy gespeichert). Geheimnisse in `/etc/paloskin`: `service-account.json` (10001:10001, 0400), `paloskin.env` (deploy, 0600, mit Testcode und Cookie-Schlüssel).
- Caddy ohne HTTP/3. Seit 2. Oktober 2026, 15:25 Uhr zeigen `www.paloskin.de` und `paloskin.de` auf den Server (TTL 600), Zertifikate von Let's Encrypt für beide, HSTS noch aus (erst nach einer Woche Stabilität einschalten). Vercel-Projekt und Domain dort noch eine Woche belassen (Rückweg), dann entfernen. Heartbeat-Cron alle 5 Minuten, Monitor-URL noch leer. Block `neu.paloskin.de` im Caddyfile nach dem Umzug entfernen.
- Ausrollen: `cd /opt/paloskin && git pull && docker compose -f deploy/docker-compose.yml pull && docker compose -f deploy/docker-compose.yml up -d`.

## Buchung Stufe 2, Schritt 1: Datenbank und Reservierung (2. Oktober 2026)

- Bauauftrag in `docs/STUFE-2-BAUAUFTRAG.md` (ersetzt den Entwurf), Umsetzungsstand am Ende des Dokuments. Arbeitsbranch `stufe2`, Testinstanz `app-test` hinter `neu.paloskin.de` (Compose-Profil `test`), Ausrollen durch Fast-Forward von `zonen`.
- Datenbank: `node:sqlite` (Node 24), Datei `/var/lib/paloskin/buchung.sqlite` (Volume, 10001:10001, 0700), lokal `.data/buchung.sqlite`. Schema `lib/db.ts`, Reservierung `lib/store.ts`, Ablauf `lib/booking.ts`, Hintergrundlauf `lib/jobs.ts` über `instrumentation.ts`.
- Reihenfolge der weiteren Schritte: Bestätigungsmail und verbindliche Buchung (`BOOKING_BINDING`), Endpunkt im privaten Netz, Löschlauf und Backups, Notizfeld.

## Buchung Stufe 2, Schritt 2: Bestätigungsmail, Terminlinks, Erinnerung (2. Oktober 2026)

- Relay: `smtp-relay.gmail.com:587` STARTTLS ohne Anmeldung, Freigabe nur für IPv4 2.31.2.192 (Container spricht IPv4). Mailer `lib/mail.ts` (Betriebsarten relay, file, off), Inhalte `lib/mail-content.ts`, Texte `lib/texts-mail.ts`, Links `lib/links.ts` (HMAC mit `LINK_SECRET`), Seite `app/termin/[token]`, Route `app/api/termin`.
- Zusage und Absage über den Link (Absage bis 48 Stunden vorher), Erinnerung 24 Stunden vorher, `BOOKING_BINDING` vorbereitet und aus. Lokal `MAIL_MODE=file` schreibt Mails nach `.data/mail`.

## Buchung Stufe 2, Schritt 3: Ereignisse und Endpunkt (2. Oktober 2026)

- Fassung 4 des Bauauftrags am Ende von `docs/STUFE-2-BAUAUFTRAG.md`; Schema für das CRM-Projekt in `docs/SCHNITTSTELLE-KUNDENSYSTEM.md` (Codes ohne Vorgabe sind als Vorschlag markiert).
- Endpunkt `/intern/v1` (`app/intern`, `lib/intern.ts`), nur über den Caddy-Block an 10.0.0.2:8443 (tls internal) mit Kopfzeile `X-Palo-Intern` und `INTERN_TOKEN`. Öffentliche Blöcke liefern für `/intern/*` 404. Ziel des Blocks über `PALOSKIN_INTERN_UPSTREAM` in `deploy/.env`.

## Buchung Stufe 2, Schritt 4: Löschlauf und Sicherung (3. Oktober 2026)

- Täglicher Lauf in `lib/retention.ts` (90/120 Tage, Ereignis `deleted` nur mit Kennung, Kalenderexport nach `/var/lib/paloskin/export`), Sicherung per Cron `deploy/backup.sh` (03:45 Uhr, `/var/backups/paloskin`, 14 Tage), Heartbeat prüft das Alter der Sicherung. Wiederherstellung in Anleitung Abschnitt 19.
- Stand nach dem Ausrollen am 3. Oktober 2026: www bucht verbindlich mit Bestätigungsmail (freigegebene Texte, fünf Sprachen), Endpunkt im privaten Netz zeigt auf die Produktivinstanz, Testinstanz weiter auf `stufe2` mit Umleitung der Mails.
