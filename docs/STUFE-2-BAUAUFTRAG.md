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
