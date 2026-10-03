# Bauauftrag für Claude Code: Buchung Stufe 2 auf paloskin-1 (Datenbank, Ereignistabelle, Endpunkt für das Kundensystem)

Stand: 2. Oktober 2026, abends Berliner Zeit. Repository sebprofil2/paloskin, Branch zonen, läuft auf paloskin-1 (Hetzner, Nürnberg, 2.31.2.192). Grundlage: Übergabe an das CRM-Projekt vom 2. Oktober, Maßnahmenplan des CRM-Projekts (Punkt A6, A7), Entscheidungen von Dr. Vogel vom 2. Oktober abends (zwei Server, WireGuard, Löschfrist 90 Tage für Buchungsdaten).

Dieses Dokument ersetzt den früheren Entwurf `STUFE-2-DATENBANK-ENTWURF.md`. Der Umsetzungsstand steht am Ende.

## 1. Ziel

1. Die Buchung bekommt eine eigene Datenbank auf paloskin-1 mit atomarer Reservierung, damit zwei Kunden nie dieselbe Zeit bekommen und die Buchung später verbindlich werden kann.
2. Jede Buchungsänderung landet in derselben Transaktion in einer Ereignistabelle mit fortlaufender Nummer. Das Kundensystem auf paloskin-2 holt diese Ereignisse über einen Endpunkt im privaten Hetzner-Netz ab und bestätigt den Empfang.
3. paloskin-1 hält nur Buchungsdaten: Kontakt, Termin, Leistungswunsch, Notiz. Keine Behandlungsdokumentation, keine Fotos. Buchungsdaten werden 90 Tage nach dem Termin gelöscht.
4. Der Google Kalender bleibt die Sicht des Arztes auf den Tag: Die Buchung schreibt weiterhin den Termin in „Palo Skin Termine“ und respektiert belegte Zeiten aus dem Hauptkalender. Die Notiz des Kunden geht nie in den Kalender, nur in die Datenbank.

## 2. Datenbank

SQLite mit WAL auf einem beschreibbaren Docker-Volume (zum Beispiel /var/lib/paloskin/buchung.sqlite, Eigentümer 10001, Verzeichnis 0700). Der Container bleibt sonst schreibgeschützt. Zeiten in UTC speichern, Anzeige in Europe/Berlin.

Tabellen (Feldnamen Englisch, Oberfläche Deutsch):

1. `bookings`: id (ULID), reference (Buchungsnummer wie heute, idempotent aus der Anfragekennung), created_at (nie überschreiben), starts_at, ends_at, duration_minutes, persons (1 oder 2), first_visit (bool), service_codes (JSON-Liste der Leistungscodes, gleiche Codes wie im Kundensystem), zones (JSON-Liste), checkup (bool, Kontrolltermin-Link), status (requested, confirmed, cancelled, rescheduled, no_show, completed), channel (web), language (de, en, es, fr, pt), device (mobile, desktop), reminder_whatsapp (bool mit Zeitstempel der Einwilligung), first_name, last_name, phone_e164, email, note, calendar_event_id, calendar_state (pending, written, failed), updated_at, deleted_at.
2. `slot_locks`: slot_start (Unix-Minute, 10-Minuten-Raster), booking_id, UNIQUE(slot_start). Eine Buchung belegt alle 10-Minuten-Einheiten ihrer Dauer. Einfügen in einer Transaktion; Verletzung der Eindeutigkeit bedeutet „Da war jemand schneller“ (409, Text wie heute).
3. `booking_events`: seq (INTEGER PRIMARY KEY AUTOINCREMENT, fortlaufend, nie wiederverwendet), event_id (ULID), booking_id, type (created, confirmed, cancelled, rescheduled, reminder_changed, completed, deleted), payload (JSON, vollständiger Buchungsstand nach der Änderung einschließlich note, denn die Notiz gehört ins Kundensystem), occurred_at. Wird in derselben Transaktion wie die Buchungsänderung geschrieben.
4. `consumers`: name (zum Beispiel studio-os), acknowledged_seq, last_seen_at. Ein Eintrag je abholendem System.
5. `idempotency`: request_key, booking_id, created_at (ersetzt die heutige Ableitung, bleibt 7 Tage).

Freie Zeiten berechnen sich künftig aus: Fenster in „Palo Skin offen“ minus frei/belegt aus Hauptkalender und „Palo Skin Termine“ (wie heute) minus `slot_locks`. Ein Google-Fehler führt weiterhin nie zu „frei“.

Ablauf einer Buchung: Eingaben prüfen (Schemas wie heute), Transaktion: Idempotenz prüfen, `slot_locks` einfügen, `bookings` einfügen mit status requested und calendar_state pending, `booking_events` created schreiben, Commit. Danach Kalendereintrag schreiben; bei Erfolg calendar_state written und calendar_event_id setzen (kein eigenes Ereignis), bei Fehler calendar_state failed, Wiederholung durch einen Hintergrundlauf alle 5 Minuten bis maximal 24 Stunden, danach Alarm über den Heartbeat. Der Kunde sieht in beiden Fällen die Bestätigungsseite, denn die Reservierung in der Datenbank ist maßgeblich.

## 3. Endpunkt für das Kundensystem

Nur im privaten Hetzner-Netz erreichbar, nie über 2.31.2.192 oder die Domain.

1. Privates Netz: Hetzner-Netzwerk „paloskin-intern“ 10.0.0.0/24, paloskin-1 bekommt 10.0.0.2, paloskin-2 später 10.0.0.3. Anlegen über die Hetzner-Konsole (macht Claude oder Dr. Vogel), die Anleitung beschreibt es.
2. Caddy bekommt einen zweiten Server-Block, der nur an 10.0.0.2:8443 lauscht, mit Caddys interner Zertifizierungsstelle (tls internal). Das Wurzelzertifikat wird exportiert und dem Kundensystem gegeben, das es fest einpinnt. UFW: 8443 nur aus 10.0.0.0/24. Hetzner-Firewall bleibt bei 22, 80, 443 (sie wirkt nicht auf das private Netz).
3. Authentifizierung: Bearer-Token aus der Umgebung (INTERN_TOKEN, 32 Byte zufällig, Vergleich in konstanter Zeit, bei Schritt 6 im Terminal abgefragt wie der Testcode). Rate-Limit 120 Anfragen pro Minute. Antwortgröße begrenzt (limit maximal 500). Keine Weiterleitungen.
4. `GET /intern/v1/events?after=<seq>&limit=<n>`: liefert Ereignisse mit seq größer als after, aufsteigend, als JSON `{ "events": [ { "seq": 17, "event_id": "...", "type": "created", "occurred_at": "2026-10-05T07:12:03Z", "booking": { ...vollständiger Stand... } } ], "next_after": 17, "server_time": "..." }`. Leere Liste, wenn nichts Neues.
5. `POST /intern/v1/ack` mit `{ "consumer": "studio-os", "seq": 17 }`: setzt acknowledged_seq, nie rückwärts.
6. `POST /intern/v1/bookings/{id}/status` mit `{ "status": "confirmed" | "cancelled", "reason": "..." }`: einziger Rückweg. Setzt den Status, schreibt ein Ereignis und aktualisiert den Kalendereintrag (Titel bei confirmed unverändert, bei cancelled Eintrag löschen und `slot_locks` freigeben). Nichts anderes ist über den Rückweg änderbar.
7. `GET /intern/v1/health`: Zeit, Anzahl offener Ereignisse seit acknowledged_seq, calendar_state failed Anzahl. Keine Kundendaten.
8. Das vollständige JSON-Schema liegt als docs/SCHNITTSTELLE-KUNDENSYSTEM.md im Repository und wird an das CRM-Projekt übergeben. Das CRM-Projekt richtet seine Attrappe daran aus; bei Abweichungen gilt dieses Dokument.

## 4. Löschen und Sichern

1. Täglicher Lauf um 03:30 Uhr Berliner Zeit: Buchungen, deren Termin mehr als 90 Tage zurückliegt und deren letztes Ereignis vom Kundensystem bestätigt wurde, werden gelöscht (Zeile entfernt, Ereignis deleted mit nur booking_id und reference, kein Inhalt). Ereignisse werden gelöscht, sobald sie bestätigt und älter als 90 Tage sind. Ist nach 120 Tagen noch nichts bestätigt (Kundensystem nie angeschlossen), wird trotzdem gelöscht und im Protokoll vermerkt.
2. Nächtlich `sqlite3 .backup` nach /var/backups/paloskin/, 14 Tage behalten, im Hetzner-Server-Backup enthalten. Sobald der Sicherungsserver aus dem CRM-Projekt existiert: zusätzlich restic dorthin, Nur-Anfügen, 30 Tage. Wiederherstellungstest in der Anleitung.
3. Export „Palo Skin Termine“ (nächtlicher Kalenderexport als ICS auf den Server, 30 Tage), damit der Kalender einen Wiederherstellungsweg hat.

## 5. Sichtbare Änderungen für Kunden (Entscheidung Dr. Vogel, 2. Oktober abends)

1. Sobald die Reservierung in der Datenbank läuft und abgenommen ist, bucht die Seite verbindlich (Schalter BOOKING_BINDING, nach der Abnahme von Abschnitt 7 Punkt 1 bis 3 auf an). Bestätigungsseite dann: Überschrift „Ihr Termin ist gebucht. Die Bestätigung ist per E-Mail unterwegs.“, Rest wie heute (Datum, Adresse, Buchungsnummer, Kalenderknöpfe, Absagehinweis). Status in der Datenbank bei Buchung: confirmed. Übersetzungen EN, ES, FR, PT entsprechend. Solange der Schalter aus ist, bleibt „Terminanfrage“ und status requested.
2. Bestätigungsmail sofort nach dem Commit der Buchung, Absender bookings@paloskin.de, Antwort an info@paloskin.de. Versand über den SMTP-Relay von Google Workspace (smtp-relay.google.com, Port 587, TLS, Freigabe der Server-Adresse 2.31.2.192 in der Admin-Konsole; richtet Claude mit Dr. Vogel ein), damit kein Passwort auf dem Server liegt. Betreff „Ihr Termin bei Palo Skin am Montag, 5. Oktober um 14:00 Uhr“. Inhalt: Anrede mit Vornamen, Datum und Uhrzeit, Adresse mit Kartenlink, Buchungsnummer, Behandlungen in der Struktur der Übersicht unter „Unverbindliche Vorauswahl“, Absage oder Verschieben per WhatsApp unter +49 151 58872566 mindestens 48 Stunden vorher, Kalenderdatei (ICS) als Anhang, Unterschrift „Palo Skin by Dr. Vogel, Hagenauer Straße 14, 10435 Berlin“. Reiner Text plus einfache HTML-Fassung, keine Bilder, kein Tracking, keine Notiz des Kunden. Bei zu zweit: Satz „Wir haben für Sie beide Zeit eingeplant.“ Mehrsprachig wie die Seite. Scheitert der Versand, bleibt die Buchung gültig; Wiederholung durch den Hintergrundlauf, Protokoll nur mit Buchungsnummer.
3. Erinnerungen, Nachfassen und Statusänderungen bleiben Aufgabe des Kundensystems (CRM), nicht der Buchung. Bis dahin Erinnerung per WhatsApp von Hand.
4. Notizfeld (NOTE_ENABLED) wieder einschalten, Inhalt nur in der Datenbank, Platzhalter und Beschriftung wie in docs/TEXTE-BUCHUNG-DE.md Nummer 38 bis 40.
5. Die Buchungsnummer bleibt wie heute. Der Testbalken bleibt, bis Dr. Vogel den Testbetrieb beendet.

## 6. Nicht ändern

1. Kalenderfreigaben, Dienstkonto, Schlüsseldatei: unverändert.
2. Kalendereintrag bleibt minimal („Palo Skin: Vorname N.“, Beschreibung mit Behandlung und Kontakt, ohne Notiz).
3. Keine Rabatt-, Aktions- oder Vorteilstexte. Keine Dauer für Kunden sichtbar. Keine Abkürzungen, keine langen Gedankenstriche, „Kunden“, „Studio“.
4. Keine Geheimnisse im Chat oder im Repository. Token und Pfade über /etc/paloskin/paloskin.env.

## 7. Abnahme

1. Zwei gleichzeitige Buchungen derselben Zeit: genau eine gewinnt, die andere bekommt „Da war jemand schneller“.
2. Doppeltes Absenden und Wiederholung nach Verbindungsabbruch: genau eine Buchung, gleiche Buchungsnummer.
3. Google nicht erreichbar: Buchung wird gespeichert, calendar_state failed, Wiederholung trägt sie nach, Kunde sieht Bestätigung. Freie Zeiten bei Google-Fehler: 503, nie „frei“.
4. Manuell im Hauptkalender eingetragener Termin blockt die Zeit.
5. Endpunkt: von der öffentlichen Adresse nicht erreichbar (Verbindung abgewiesen), aus dem privaten Netz mit Token erreichbar, ohne Token 401, falsches Zertifikat wird vom Testclient abgelehnt. after und ack funktionieren, Ereignisse kommen genau einmal und in Reihenfolge.
6. Löschlauf: Testbuchung mit Termin vor 91 Tagen verschwindet, bestätigt und unbestätigt nach den Regeln oben.
7. Wiederherstellung der SQLite-Datei aus dem nächtlichen Backup auf dem Testserver.
8. Protokolle ohne Namen, Nummern, E-Mail-Adressen, Notizen.
9. Alle bisherigen Tests weiterhin grün, neue Tests für Reservierung, Ereignisse, Endpunkt, Löschlauf, Bestätigungsmail (Inhalt, Sprache, ICS, Wiederholung bei Versandfehler).
10. Bestätigungsmail kommt an einer Testadresse an, mit korrekter Zeit (auch nach dem 25. Oktober, Winterzeit), öffnet sich die Kalenderdatei auf dem iPhone mit richtiger Uhrzeit. Bei absichtlich falschem Relay bleibt die Buchung bestehen und die Mail wird nachgeholt.
11. Anleitung deploy/UMZUG-HETZNER.md ergänzt (privates Netz, Volume, Token, Backups), docs/SCHNITTSTELLE-KUNDENSYSTEM.md angelegt, docs/STUFE-2-DATENBANK-ENTWURF.md durch dieses Dokument ersetzt.

Reihenfolge: zuerst Datenbank und Reservierung hinter der bestehenden Buchung (ohne sichtbare Änderung), dann Bestätigungsmail und verbindliche Buchung (Schalter erst nach Abnahme an), dann Ereignistabelle und Endpunkt, dann Löschlauf und Backups, dann Notizfeld. Nach jedem Schritt Image bauen, auf neu.paloskin.de testen, dann ausrollen. Bericht nach jedem Schritt kurz.

## Umsetzungsstand

### Schritt 1: Datenbank und Reservierung (2. Oktober 2026)

- Datenbank über das in Node 24 eingebaute Modul `node:sqlite` (keine zusätzliche Abhängigkeit, kein nativer Build im Image). Schema in `lib/db.ts`, Reservierung und Zustände in `lib/store.ts`, Ablauf in `lib/booking.ts`, Hintergrundlauf in `lib/jobs.ts` (gestartet aus `instrumentation.ts`, alle 5 Minuten, erster Lauf 30 Sekunden nach dem Start).
- Die Tabellen entsprechen Abschnitt 2. Zusätzliche Felder in `bookings`: `consent_at`, `referral` (Empfehlung von der Bestätigungsseite), `selection` (vollständige Auswahl als JSON, aus der die Kalenderbeschreibung gebaut wird), `test_mode`, `calendar_attempts`, `calendar_attempted_at`. Die Anfragekennung steht nur als SHA-256-Hash in `idempotency`.
- `service_codes` enthält die Behandlungscodes BER, BOT, KAU, NEF, HYP, LDN, LDN4; Personenzahl und Kontrolltermin haben eigene Felder.
- Der Kalendermotor (`lib/engine`) kennt nur noch Fenster, frei/belegt und Einträge; Reservierung, Idempotenz und Buchungsnummer kommen aus der Datenbank. Die frühere Überschneidungsprüfung im Kalender entfällt, weil `slot_locks` entscheidet.
- Abweichung mit Absicht: Der Nachtrag des Kalendereintrags läuft auch nach 24 Stunden weiter (ein Nachtrag schadet nie); ab 24 Stunden schreibt jeder Lauf eine Zeile `ALARM Kalendereintrag seit 24 Stunden offen`, die der Heartbeat erkennt und daraufhin ausbleibt. Vor jedem Nachtrag wird der Kalender nach der Buchungsnummer durchsucht, damit nach einem unklaren Ausgang kein zweiter Eintrag entsteht.
- Ist der Kalender beim Buchen nicht lesbar, wird die Zeit trotzdem reserviert (der Kunde hat sie gerade als frei gesehen; Abschnitt 7 Punkt 3). Raster, Vorlauf und Horizont prüft die Buchung weiterhin selbst.
- `BOOKING_BINDING` ist vorbereitet (Status `confirmed` statt `requested`), bleibt aber aus, bis Abschnitt 5 umgesetzt und abgenommen ist.
- Betrieb: Volume `/var/lib/paloskin` (10001:10001, 0700), Testinstanz `app-test` mit eigener Datenbank unter `/var/lib/paloskin-test` hinter `neu.paloskin.de` (Compose-Profil `test`, Image-Tag des Arbeitsbranches). Siehe `deploy/UMZUG-HETZNER.md`, Abschnitt 16.

### Schritt 2: Bestätigungsmail, Terminlinks, Erinnerung, Schalter (2. Oktober 2026)

- Versand über `nodemailer` an den SMTP-Relay von Google Workspace, Port 587 mit STARTTLS, ohne Anmeldung. **Abweichung zum Text oben:** der Relay heißt `smtp-relay.gmail.com`; der im Auftrag genannte Name `smtp-relay.google.com` existiert nicht (NXDOMAIN). Die Freigabe in der Admin-Konsole gilt nur für die IPv4-Adresse 2.31.2.192; der Container verbindet sich über IPv4, der Server selbst würde IPv6 bevorzugen. Soll der Server auch außerhalb von Docker senden, muss die IPv6-Adresse 2a01:4f8:1c16:71ba::1 ebenfalls freigegeben werden.
- Inhalt wie Abschnitt 5 Punkt 2: Anrede mit Vornamen, Datum und Uhrzeit, Adresse mit Kartenlink, Buchungsnummer, Behandlungen in der Struktur der Übersicht („Unverbindliche Vorauswahl“), Hinweis auf Absage oder Verschieben 48 Stunden vorher mit WhatsApp-Nummer, Kalenderdatei im Anhang (Weltzeit, Winterzeit geprüft), Unterschrift. Reiner Text und einfache HTML-Fassung ohne Bilder und ohne Tracking, nie die Notiz. Bei zu zweit der Satz „Wir haben für Sie beide Zeit eingeplant.“ Fünf Sprachen (`lib/texts-mail.ts`, Übersetzungen noch gegenzulesen). Im Testbetrieb trägt der Betreff „TEST:“ und die Mail einen Hinweis.
- Solange `BOOKING_BINDING` aus ist, lautet die Mail „Ihre Terminanfrage … wir haben die Zeit vorgemerkt, wir bestätigen kurz per WhatsApp“ und der Kalendereintrag in der Datei steht auf TENTATIVE. Mit Schalter an: „Ihr Termin ist gebucht“, Status `confirmed`, Bestätigungsseite „Ihr Termin ist gebucht. Die Bestätigung ist per E-Mail unterwegs.“ (`doneBindingH`, fünf Sprachen). Der Browser erfährt den Schalter über das Feld `binding` in der Buchungsantwort.
- **Ergänzung nach Entscheidung von Dr. Vogel (2. Oktober, abends):** Signierte Links `/termin/<kennung>.<signatur>` in jeder Mail für „Ja, ich komme“ und „Termin absagen“. Die Seite liest alles aus der Datenbank, der Link enthält nur die Buchungskennung mit HMAC-SHA256 (`LINK_SECRET`). Zusage setzt `attendance_confirmed_at` und schreibt ein Ereignis vom neuen Typ `attendance_confirmed`. Absage ist über den Link bis 48 Stunden vor dem Termin möglich (Status `cancelled`, Belegung frei, Ereignis `cancelled`, Kalendereintrag gelöscht, bei Kalenderfehler räumt der Hintergrundlauf nach); danach zeigt die Seite den WhatsApp-Hinweis. Änderungen nur per POST, nie durch das Öffnen des Links.
- **Ergänzung, abweichend von Abschnitt 5 Punkt 3:** Erinnerungsmail etwa 24 Stunden vor dem Termin durch den Hintergrundlauf (Fenster 2 bis 24 Stunden vorher), ohne Kalenderdatei, mit denselben Links. Keine Erinnerung, wenn die Buchung weniger als 30 Stunden vor dem Termin entstand (die Bestätigung ist dann frisch).
- Scheitert der Versand, bleibt die Buchung gültig; der Hintergrundlauf wiederholt alle 5 Minuten, bis der Termin vorbei ist; nach 24 Stunden eine Alarmzeile, die den Heartbeat ausbleiben lässt. Protokoll nur mit Buchungsnummer und Fehlerklasse (SMTP-Code oder nodemailer-Kennung), nie mit Adressen oder Antworttext.
- Neue Spalten in `bookings`: `attendance_confirmed_at`, `cancelled_at`, `cancel_reason`, `mail_confirmation_sent_at`, `mail_confirmation_attempts`, `mail_confirmation_attempted_at`, `mail_reminder_sent_at`, `mail_reminder_attempts`, `mail_reminder_skipped`. Bestehende Datenbanken werden beim Start nachgezogen (`lib/db.ts`, `migrate`), die Ereignistabelle wird für den neuen Typ einmalig neu angelegt, Nummern bleiben erhalten.
- Testinstanz: `MAIL_REDIRECT_TO` (aus `deploy/.env` auf dem Server, Variable `PALOSKIN_TEST_MAIL`) leitet alle Mails der Testinstanz an eine Testadresse um, egal was eingegeben wurde; `PUBLIC_BASE_URL` ist dort `https://neu.paloskin.de`.

## Fassung 4: Entscheidungen zur Schnittstelle (2. Oktober 2026, abends)

Kurzfassung der „Entscheidungen Schnittstelle Buchung und Kundensystem, Antwort auf die Abweichungen“; gilt für Schritt 3.

1. Leistungscodes im Ereignis nur in den gemeinsamen Codes des Kundensystems (glabella, forehead, crows_feet, masseter, nefertiti, hyperhidrosis_axilla, polynucleotides_eye, polynucleotides_eye_4, consultation, control und so weiter). Intern bleiben BER, BOT, KAU, NEF, HYP, LDN, LDN4 und die deutschen Zonenkennungen. Übersetzung in `lib/service-codes.ts` beim Schreiben jedes Ereignisses; Zuordnungstabelle in `docs/SCHNITTSTELLE-KUNDENSYSTEM.md`. Fehlt eine Entsprechung: Vorschlag melden statt raten.
2. `appointment_type` explizit: checkup ergibt `control`, sonst first_visit ergibt `first`, sonst `follow_up`. `first_visit` und `checkup` bleiben zusätzlich.
3. Kein Ereignis `completed`; Typ bleibt reserviert.
4. Testbuchungen tragen `test: true`.
5. Gleicher Umschlag für alle Ereignisse: seq, event_id, type, occurred_at, booking. Bei `deleted` nur id und reference in booking. Kein Feld booking_id auf oberster Ebene.
6. `GET /intern/v1/events` ohne after ab 0; limit ohne Angabe 100, höchstens 500.
7. `reminder_whatsapp` als Objekt `{ consented, consented_at }`.
8. Rückweg `POST /intern/v1/bookings/{id}/status` mit der ULID und `{ status: confirmed | cancelled, reason }`.
9. Netz paloskin-intern 10.0.0.0/24: paloskin-1 ist 10.0.0.2, Endpunkt 10.0.0.2:8443, paloskin-2 wird 10.0.0.3, Sicherungsserver 10.0.0.4.
10. Caddy-Zertifikat für 10.0.0.2 und `buchung.intern`; Exportweg des Wurzelzertifikats in `deploy/UMZUG-HETZNER.md`.
11. `docs/SCHNITTSTELLE-KUNDENSYSTEM.md` als fertiges Schema mit Beispielen je Ereignistyp.

### Schritt 3: Ereignisse und Endpunkt (2. Oktober 2026)

- Ereignisnutzlast nach Fassung 4 (`toPayload` in `lib/store.ts`): gemeinsame Codes, `appointment_type`, `reminder_whatsapp` als Objekt, `test`; `deleted_at` ist nicht Teil der Nutzlast (Löschung ist ein eigenes Ereignis). Vorschläge für Codes ohne Vorgabe: `botulinum` (BOT) und die Zonen `brow_lift`, `lip_flip`, `bunny_lines`, `mouth_corners`, `chin`, `gummy_smile`, `upper_lip`, `nose`; in der Tabelle als Vorschlag markiert.
- Endpunkt unter `/intern/v1` (events, ack, bookings/{id}/status, health) in `app/intern`, Zugangsprüfung in `lib/intern.ts`: Kopfzeile `X-Palo-Intern: 1`, die nur der interne Caddy-Block setzt und die öffentlichen Blöcke entfernen; Bearer-Token aus `INTERN_TOKEN` in konstanter Zeit; 120 Anfragen pro Minute.
- Caddy: zweiter Block `https://10.0.0.2:8443, https://buchung.intern:8443` mit `tls internal`, Port 8443 in Compose nur an 10.0.0.2 veröffentlicht, UFW erlaubt 8443 nur aus 10.0.0.0/24. Öffentliche Blöcke beantworten `/intern/*` mit 404. Ziel des internen Blocks über `PALOSKIN_INTERN_UPSTREAM` (Standard app, zum Testen app-test).
- Bestätigung durch das Kundensystem schreibt nur bei `requested` ein Ereignis `confirmed`; mit Schalter `BOOKING_BINDING` entstehen Buchungen schon als `confirmed`, der Rückweg ändert dann nichts.

### Texte nach Freigabe (2. Oktober 2026, spät)

- Die ersten Mailtexte von Schritt 2 waren nicht freigegeben; www lief damit vom 2. Oktober 22:06 Uhr bis 22:14 Uhr mit Schalter an, ohne eine einzige Buchung. Seitdem auf www: `BOOKING_BINDING=false` und `MAIL_MODE=off`, Reservierung an. Die Testinstanz sendet weiter (Compose: `MAIL_MODE` relay und `BOOKING_BINDING` true nur für app-test, umgeleitet an die Testadresse).
- Neue Texte nach „Texte Bestätigungsmail, Erinnerungsmail und Terminseite freigegeben“: Marke „PALO SKIN by Dr. Vogel“, Antwort an bookings@paloskin.de, keine Buchungsnummer und keine Behandlung in Mails, Kalenderdatei und Terminseite; Bestätigungsmail nur mit „Termin absagen oder verschieben“, „Ja, ich komme“ nur in der Erinnerung; Terminseite mit Kasten aus Datum, Uhrzeit, Adresse. Deutsch wörtlich, Übersetzungen zur Freigabe in `docs/TEXTE-MAILS.md`. Ausrollen auf www mit Schalter an erst nach Freigabe der Übersetzungen.

### Schritt 4: Löschlauf, Sicherung, Kalenderexport (3. Oktober 2026)

- Täglicher Lauf im Serverprozess (`lib/retention.ts`), fällig ab 03:30 Uhr Berliner Zeit, einmal je Tag; ein verpasster Lauf (Neustart) wird beim nächsten Tick nachgeholt, der Tag steht in der Tabelle `meta`.
- Buchungen, deren Termin mehr als 90 Tage zurückliegt und deren Ereignisse alle vom Kundensystem bestätigt sind (seq kleiner oder gleich der kleinsten bestätigten Nummer aller Abnehmer), werden gelöscht: Zeile, Belegung und Idempotenzschlüssel weg, Ereignis `deleted` nur mit `id` und `reference`. Nach 120 Tagen auch unbestätigt, mit Protokollzeile `retention_forced_delete` (nur Buchungsnummer). Solange kein Abnehmer angemeldet ist, greift nur die 120-Tage-Regel.
- Ereignisse werden gelöscht, sobald sie bestätigt und älter als 90 Tage sind, nach 120 Tagen auch unbestätigt (`retention_forced_events`). Nummern werden nie wiederverwendet.
- Kalenderexport: „Palo Skin Termine“ 7 Tage zurück bis 90 Tage voraus als `palo-skin-termine-JJJJ-MM-TT.ics` unter `/var/lib/paloskin/export` (0700, Dateien 0600), 30 Tage aufbewahrt.
- Sicherung: `deploy/backup.sh` als root per Cron um 03:45 Uhr: `sqlite3 .backup` nach `/var/backups/paloskin/buchung-JJJJ-MM-TT.sqlite.gz` mit Integritätsprüfung, 14 Tage, dazu der jüngste Kalenderexport. Der Heartbeat bleibt aus, wenn die jüngste Sicherung älter als 26 Stunden ist. restic zum Sicherungsserver folgt, sobald er existiert (10.0.0.4).
- Wiederherstellungstest: Anleitung Abschnitt 19, durchgeführt auf der Testinstanz.

### Gegenprüfung des CRM-Projekts (3. Oktober 2026)

- Zonencode `upper_lip` heißt in der gemeinsamen Liste `upper_lip_lines` (geändert in `lib/service-codes.ts` und im Schema).
- Rückweg: `reason` sind die festen Bezeichner `studio_confirmed` und `studio_cancelled`, gespeichert als `cancel_reason` ohne Präfix.
- Kopierweg des Wurzelzertifikats in das Home-Verzeichnis des Nutzers auf paloskin-2, Hosts-Eintrag optional.
- Maßstab: fünf bis zehn Buchungen am Tag, keine weitere Arbeit für Gleichzeitigkeit oder Hochlast.

### Öffentlich schalten und Handliste (3. Oktober 2026, Gesamtauftrag)

- Texte: „Spezialisiert auf Faltenbehandlungen“, Kachel „Übermäßiges Schwitzen“ mit Unterzeile „Achseln (Hyperhidrose)“, Feld „Handynummer“ ohne Zusatz, E-Mail-Feld mit „(dorthin kommt Ihre Bestätigung mit Kalendereintrag)“, in fünf Sprachen.
- Schriftmacke behoben: Ursache war `font-variant-numeric: tabular-nums`; die Schrift Schibsted Grotesk setzt mit dem Merkmal tnum auch Punkt und Komma auf Ziffernbreite („1 . 000 €*“, „Botox : 3 Zonen“, „Dr . Vogel ,“). Tabellenziffern jetzt nur noch bei Tag und Uhrzeit (reine Ziffern).
- Öffentlich: `TEST_MODE=false` auf www; `/booking` ohne Code, `/booking/zugang` leitet auf `/booking`, Testbalken weg, Buchungen ohne `test`-Kennzeichen und ohne „TEST“ im Kalender. Die Testinstanz bleibt im Testbetrieb (Compose `TEST_MODE` für app-test).
- Handliste für WhatsApp-Erinnerungen bis zum Kundensystem: Kalendereintrag mit „WhatsApp-Erinnerung: ja, <Nummer>“ nur bei Haken, sonst keine Nummer im Kalender. Täglich ab 18:00 Uhr Berliner Zeit Mail an `OWNER_MAIL` mit den Terminen des nächsten Tages (Vorname, Nachname, Uhrzeit, wa.me-Link), Betreff „Morgen erinnern: N Termine“, keine Mail ohne Termine, Protokoll nur mit Anzahl (`lib/reminder-list.ts`).
- Caddy-Zugriffsprotokolle (mit IP-Adresse) höchstens 14 Tage (`roll_keep_for 336h`); die Protokolle der Anwendung enthalten keine personenbezogenen Daten (Feldliste in `lib/log.ts`).
- Offen: neue Datenschutzerklärung (Text aus dem Cowork-Projekt liegt nicht vor).

### Nacharbeiten Datenschutzerklärung (3. Oktober 2026, abends)

- Löschlauf löscht mit der Buchung auch den Kalendereintrag in „Palo Skin Termine“ (über `calendar_event_id`); ein schon fehlender Eintrag ist kein Fehler, bei nicht erreichbarem Kalender bleibt die Buchung bis zum nächsten Lauf. Protokoll nur mit Anzahlen.
- Kalendereintrag verschlankt: Titel „Palo Skin: Vorname N.“, Buchungsnummer, Besuch, zu zweit, Vorauswahl mit Preisen, Sprache, gegebenenfalls Empfehlung, bei WhatsApp-Haken „WhatsApp-Erinnerung: ja, <Nummer>“. E-Mail-Adresse, Einwilligungszeitpunkt und Dauer stehen nur noch in der Datenbank. Ziffer 4 der Datenschutzerklärung entsprechend gekürzt.

### Gesamtauftrag Kundentexte, Kartenlink, Kalender-Knöpfe, Erinnerung, Liste (3. Oktober 2026, abends)

- Kartenlink überall auf das Google-Unternehmensprofil (`https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8`): Mails, Terminseite, Bestätigungsseite, Startseite, Beschreibung der Kalenderdatei. Das Impressum enthielt keinen Kartenlink.
- Bestätigungsmail mit drei Kalender-Knöpfen: Google (Vorlagenlink), iPhone (Kalenderdatei vom Server unter `/termin/<token>/kalender.ics`, Content-Type text/calendar), Outlook (Deeplink). Inhalt überall: Titel „Termin bei PALO SKIN“, Ort, Beschreibung nur Absagehinweis mit WhatsApp-Nummer und Kartenlink. Anhang termin.ics bleibt.
- Erinnerung am Vortag ab 10:00 Uhr Berliner Zeit an alle nicht abgesagten Termine des nächsten Tages, die vor 10:00 Uhr gebucht wurden; später Gebuchte bekommen keine. Gescheiterte Sendungen werden alle 5 Minuten wiederholt. Die alte 24- und 30-Stunden-Regel ist entfernt.
- Liste um 18:00 Uhr: Betreff „Morgen: N Termine, davon M noch nicht bestätigt“, je Termin Uhrzeit, Name, Stand; bei noch offenen mit WhatsApp-Haken ein wa.me-Link, ohne Haken ein tel-Link; bei bestätigten keine Nummer.
- Endgültige Kundentexte in `lib/texts-mail.ts` und `lib/texts.ts` (Bestätigungsseite „Gebucht! Wir freuen uns auf Sie.“, Hinweiskasten „Zeit für Sie“), Liste in `docs/TEXTE-MAILS.md`. Datenschutzerklärung Ziffer 4 angepasst (Liste mit Bestätigungsstand, Link auf das Unternehmensprofil).

## Gesamtauftrag vom 3. Oktober 2026, abends (Blöcke 1 bis 10)

- Block 1 Startseite: gleichmäßiger Seitenrand (Ursache: `padding` im Hero und in den Abschnitten überschrieb den Seitenrand des `.wrap`), vier häufige Fragen, Ablauf mit echter Buchung, Titel und Beschreibung, strukturierte Daten als MedicalBusiness mit Physician, Öffnungszeiten, Betreiberin, sameAs (Unternehmensprofil, Instagram); Marke PALO SKIN in Kopf, Fuß, Impressum, Datenschutz, Mails, Kalenderdatei. Anfrage-Texte ersetzt (s1P, hours, hours2 in fünf Sprachen; Knopf „Termin buchen“ in der Buchung).
- Block 2: E-Mail-Zusatz entfernt, Knopf „Termin buchen“, Handynummer in E.164 (`lib/phone.ts`, Tests), Kasten „Zeit für Sie“ mit 24 Stunden.
- Block 3: Bestätigungsseite ohne Buchungsnummer, Behandlung und Dauer; Kalender-Knöpfe aus der Buchungsantwort (`manageUrl`, `calendar`, `canManage`).
- Block 4: Auswahl im Browser wird nie gespeichert; bei Rückkehr aus dem Seitenspeicher (Safari) und nach erfolgreicher Buchung wird alles außer der Sprache zurückgesetzt. Dauertabelle als Test in `lib/__tests__/duration.test.ts`.
- Block 5: endgültige Mailtexte; Erinnerungssatz nur, wenn die Erinnerung noch kommt (Buchung vor dem Vortag 10:00 Uhr); Verschieben-Satz nur bei mehr als 24 Stunden, sonst Knopf „Termin ansehen“; Mail nach dem Verschieben mit Betreff „Verschoben“.
- Block 6: Terminseite mit drei Fenstern (mehr als 24 Stunden, 24 bis 8 Stunden, unter 8 Stunden), serverseitig in `terminWindow`. Verschieben bis 8 Stunden vorher, beliebig oft, atomar (`Store.reschedule`: alte Belegung erst frei, wenn die neue steht, sonst Rollback), Kalendereintrag wird verschoben (`moveEvent`), neue Bestätigung, Erinnerung nach den normalen Regeln, Zusage wird zurückgesetzt. Schnittstelle: Ereignis `rescheduled` (im Schema reserviert, kein neuer Typ), Nutzlast mit den neuen Zeiten, Status bleibt `confirmed`.
- Block 7: Vorlauf 2 Stunden, Nachtregel (Beginn vor 10:00 Uhr nur bis 23:00 Uhr am Vorabend), Horizont 6 Wochen, überall und serverseitig beim Absenden; Hinweis unter den Uhrzeiten, neue Konfliktmeldung mit Knopf.
- Block 8: Studio-Mails über die Warteschlange `studio_mails` (sofort, sonst alle 5 Minuten), nur Deutsch, ohne Behandlung, Nummer, Adresse, Buchungsnummer, „[TEST]“ bei Testbuchungen.
- Block 9: Datenschutzerklärung Ziffer 4, zwei Sätze.
- Block 10: Löscht das Studio einen Eintrag direkt im Kalender, merkt die Buchung nichts davon: Status bleibt, Belegung bleibt (die Zeit ist online weiter blockiert), keine Mail. Absagen gehören über den Rückweg des Kundensystems oder den Link.

## Dauer der Termine (Entscheidung Dr. Vogel, 3. Oktober 2026)

Folgebesuche dauern so lang wie erste Besuche; Termine von 20 Minuten gibt es nicht mehr. Die Frage „Waren Sie schon einmal bei uns?“ bleibt im Formular und im Ereignis (`appointment_type`), ändert aber die Dauer nicht mehr. Der Kontrolltermin (nur über den Link `/booking?kontrolle`) ist nur allein buchbar; der Server weist „zu zweit“ dort ab. Die Tabelle ist als Test in `lib/__tests__/duration.test.ts` festgeschrieben.

| Auswahl | allein | zu zweit |
|---|---|---|
| Beratung („Ich bin noch unsicher“) | 30 Minuten | 50 Minuten |
| Botox (Zonen, andere Zone, Kaumuskel, Nefertiti-Lift, Schwitzen) | 30 Minuten | 50 Minuten |
| Nur Lachs-DNA | 30 Minuten | 50 Minuten |
| Botox und Lachs-DNA | 50 Minuten | 70 Minuten |
| Kontrolltermin | 15 Minuten | nicht wählbar |

## Kalender als Werkzeug des Studios (3. Oktober 2026, abends)

Alle 5 Minuten gleicht `lib/calendar-sync.ts` Änderungen im Kalender „Palo Skin Termine“ mit den Buchungen ab (Google `events.list` mit `updatedMin` und `showDeleted`, Marke `calendar_sync_since` in `meta`, eine Minute Überlappung).

- Eintrag gelöscht: Buchung abgesagt mit `cancel_reason studio_calendar`, Zeit frei, Erinnerung entfällt, Ereignis `cancelled`, keine Kundenmail, Studio-Mail „Im Kalender abgesagt: Mittwoch, 7.10., 07:30 Uhr“.
- Beginn verschoben: Ereignis `rescheduled` (Status bleibt `confirmed`), Kunde bekommt Mail C „Verschoben“, Studio-Mail „Im Kalender verschoben“ mit Bisher und Neu, Zusage zurückgesetzt, Erinnerung nach den normalen Regeln. Der Kalender wird dabei nicht angefasst.
- Nur Ende geändert: Buchung übernimmt Ende und Dauer, Belegung angepasst, keine Mail; Ereignis `rescheduled` mit unverändertem `starts_at` und neuem `ends_at`.
- Was das Studio im Kalender macht, gilt immer: keine Fenster, kein Vorlauf, keine Nachtregel, kein Raster. Belegt das Studio eine Zeit, die online schon eine andere Buchung hält, bleibt deren Einheit bei ihr; online blockt der Kalender die Zeit ohnehin über frei/belegt.
- Ignoriert: eigene Änderungen der Buchung (Anlegen, Verschieben über die Terminseite, Löschlauf um 03:30 Uhr), vergangene Termine, Einträge ohne Buchung, Änderungen nur an Titel oder Beschreibung. Erkennung über die Buchungsdaten selbst: stimmen die Zeiten schon oder ist die Buchung schon abgesagt, passiert nichts.
- Kalender nicht lesbar: nichts ändert sich, die Marke bleibt stehen, der nächste Lauf holt nach. Protokoll nur mit Buchungsnummer, Zählern und Fehlerklasse.
- Tests in `lib/__tests__/calendar-sync.test.ts`.

## Startseite, zweite Textrunde (3. Oktober 2026, abends)

Texte von Dr. Vogel wörtlich übernommen (`public/index.html`, `public/assets/home-text.js`, fünf Sprachen aus dem Deutschen übersetzt): Einstieg mit neuem Leitsatz und Knopf „Eine Frage? Schreiben Sie uns“ (WhatsApp), Kurzinfo „Ihr Arzt“; Behandlungen und Preise mit Einleitung, eigenen Gruppen für Kaumuskel (Masseter), Nefertiti-Lift und Übermäßiges Schwitzen, Link „Was zählt als Zone?“ (springt zur ersten Frage und klappt sie auf); Ablauf „Ihr Termin bei PALO SKIN“ in drei Schritten; Studio „Ein Studio. Ihr Arzt.“ mit Zitat (Platz für einen persönlichen Satz zwischen den Absätzen ist als Kommentar markiert), Sprachen, Adresse und Kartenlink; vier Fragen. Die Zeilen WhatsApp, Instagram und Termine des alten Studio-Abschnitts sind entfallen (WhatsApp über den Knopf oben, Instagram weiter in den strukturierten Daten). Strukturierte Daten und Seitentitel unverändert.

Bezeichnungen in der Buchung angeglichen (`lib/texts.ts`, `lib/treatments.ts`, `lib/service-codes.ts`): „Kaumuskel (Masseter)“ mit Untertitel „Facial Slimming, Entspannung bei Zähneknirschen“, Nefertiti-Lift „Hals und Kieferkontur“, „Lachs-DNA, vier Behandlungen“ mit Untertitel „Dunkle Augenringe, Augenpartie“ (vorher „Viererpaket“), auch im Kalendereintrag und in der Namensliste der Codes. Screenshots in `docs/screenshots-2026-10-03-startseite`.

## Nachträge vom 3. Oktober 2026, spät

- PS-525K6E und PS-QHNRCG still abgesagt (Grund `studio_calendar`, Ereignis `cancelled`, keine Mails); der Hintergrundlauf hat die Kalender-Kennung danach bereinigt.
- Startseite, Studio: Kontaktzeile WhatsApp und Instagram unter dem Kartenlink.
- Seitenrand: `.wrap` nimmt links und rechts mindestens den sicheren Bereich des iPhones (`env(safe-area-inset-left/right)`); die Kopfzeile hatte mit `padding:18px 0` den seitlichen Rand von `.wrap` überschrieben. Gleiches für die feste Leiste unten und den Rand der Buchungsseiten. Fußzeile der Buchung auf 24 Pixel wie die Bestätigung.
- Buchung Schritt 1: Der Kopf einer Gruppe nennt die gewählten Einträge nicht mehr; der Einstiegspreis steht nur, solange in der Gruppe nichts gewählt ist.
- Kalendereintrag für Kunden (Datei, Google, Outlook): Beschreibung mit persönlichem Link zur Terminseite und Kartenlink, ohne WhatsApp-Regel; Kalenderdatei mit Erinnerung 1 Stunde vorher (`VALARM`). Unbenutzter alter Satz `afterCancelReal` (Absage per WhatsApp, 48 Stunden) entfernt.
- Grenze für Verschieben und kurzfristige Absage von 8 auf 2 Stunden (Entscheidung Dr. Vogel): Terminseite mehr als 24 Stunden wie bisher, 24 bis 2 Stunden „Sie können nicht kommen?“ mit [Termin verschieben] [Leider verhindert], unter 2 Stunden nichts; serverseitig in `terminWindow`. Bestätigungsmail: Knopf immer „Termin verschieben oder absagen“, der Satz zu den 24 Stunden nur bei mehr als 24 Stunden; „Termin ansehen“ entfällt. Studio-Mail „Kurzfristig abgesagt“ gilt für 24 bis 2 Stunden. Unbenutzter alter Satz `cancelShort` (48 Stunden) in `lib/texts.ts` entfernt.
