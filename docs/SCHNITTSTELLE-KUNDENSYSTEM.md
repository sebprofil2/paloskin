# Schnittstelle Buchung zu Kundensystem (Studio OS)

Stand: 3. Oktober 2026, Fassung 4 des Bauauftrags Stufe 2, Codes verbindlich, Gegenprüfung des CRM-Projekts eingearbeitet. Dieses Dokument ist die verbindliche Beschreibung des Endpunkts auf paloskin-1; bei Abweichungen zwischen Attrappe und Dokument gilt das Dokument.

## 1. Zugang

- Adresse: `https://10.0.0.2:8443` im privaten Hetzner-Netz `paloskin-intern` (10.0.0.0/24). Der Name `buchung.intern` steht ebenfalls im Zertifikat; ein Hosts-Eintrag auf paloskin-2 ist optional, der Client prüft den Namen über eine Einstellung.
- Zertifikat: ausgestellt von Caddys interner Zertifizierungsstelle auf paloskin-1. Das Wurzelzertifikat (`root.crt`) wird per `scp` über das private Netz in das Home-Verzeichnis des Nutzers auf paloskin-2 gelegt; die Übernahme in den Zielordner macht das CRM-Projekt (dort `docs/BETRIEB.md`, Abschnitt 7). Das Kundensystem akzeptiert nur diese CA. Weg in `deploy/UMZUG-HETZNER.md`, Abschnitt 18.
- Authentifizierung: `Authorization: Bearer <INTERN_TOKEN>` bei jeder Anfrage. Ohne oder mit falschem Token 401. Das Token wird nur im Terminal übergeben.
- Begrenzung: 120 Anfragen pro Minute je Absender, danach 429. Keine Weiterleitungen. Alle Antworten `Cache-Control: no-store`, JSON in UTF-8.
- Von der öffentlichen Adresse (2.31.2.192, www.paloskin.de) existiert der Pfad nicht (Verbindung abgewiesen beziehungsweise 404).

## 2. Ereignisse abholen

`GET /intern/v1/events?after=<seq>&limit=<n>`

- `after`: letzte verarbeitete Nummer; ohne Angabe 0 (alles von Anfang an).
- `limit`: Standard 100, höchstens 500; größere Werte werden auf 500 gekürzt.
- Antwort: Ereignisse mit `seq` größer als `after`, aufsteigend, genau einmal je Nummer. `next_after` ist die letzte gelieferte Nummer, bei leerer Liste gleich `after`.

```json
{
  "events": [ { "seq": 17, "event_id": "01M3Z293MN1KK9BTG42T2BZBJG", "type": "created", "occurred_at": "2026-10-05T07:12:03.412Z", "booking": { } } ],
  "next_after": 17,
  "oldest_seq": 0,
  "stream_generation": "gen-20261004-k3j9q2m7x5",
  "server_time": "2026-10-05T07:12:09.001Z"
}
```

- `oldest_seq` (verpflichtend, seit 4. Oktober 2026): kleinste noch vorhandene Ereignisnummer. `0` heißt: es wurde noch nie ein Ereignis gelöscht, der Verlauf ist vollständig. Sind alle Ereignisse gelöscht, die Nummer nach der höchsten gelöschten.
- `stream_generation` (verpflichtend): Kennung des Ereignisstroms, Kleinbuchstaben, Ziffern und Bindestrich, höchstens 40 Zeichen. Beim ersten Öffnen der Datenbank zufällig erzeugt, im Normalbetrieb unverändert. Wird die Buchungsdatenbank aus einer Sicherung zurückgeholt oder neu angelegt, ändert sie sich (Ablauf in `deploy/UMZUG-HETZNER.md`, Abschnitt 19).
- Bedeutung für das Kundensystem: Ist `oldest_seq` größer als 0 und der eigene bestätigte Stand kleiner als `oldest_seq - 1`, fehlen Ereignisse. Weicht `stream_generation` von der gespeicherten ab, schließt der Zähler nicht mehr an den bisherigen Verlauf an. In beiden Fällen anhalten und den Betreiber fragen. Ausnahme ist der allererste Abruf, solange das Kundensystem noch keinen eigenen Stand gespeichert hat: Dann mit `after=0` beginnen, `stream_generation` speichern und ab da wie beschrieben prüfen. Auf www ist `oldest_seq` seit dem 4. Oktober 2026 schon 3; die gelöschten Ereignisse 1 und 2 gehörten zu Buchungen, die nicht mehr existieren, jede vorhandene Buchung hat ihr Ereignis im Strom.

Vorgehen des Kundensystems: abholen, verarbeiten, bestätigen (Abschnitt 3), mit `after = next_after` weiter.

**Löschung von Ereignissen** (Entscheidung Dr. Vogel, 4. Oktober 2026: nichts darf verloren gehen): Bestätigte Ereignisse werden frühestens 90 Tage nach ihrem Entstehen gelöscht (täglicher Löschlauf). Ist ein Verbraucher angemeldet (angemeldet ist er mit seiner ersten Empfangsbestätigung über `POST /intern/v1/ack`; bloßes Abholen meldet nicht an), werden unbestätigte Ereignisse nie automatisch gelöscht; gelöscht wird nur, was alle angemeldeten Verbraucher bestätigt haben. Ist ein Ereignis länger als 3 Tage unbestätigt, alarmiert die Überwachung auf paloskin-1. Nur solange kein Verbraucher angemeldet ist, löscht der Löschlauf Ereignisse nach 120 Tagen auch unbestätigt.

## 3. Empfang bestätigen

`POST /intern/v1/ack` mit `{ "consumer": "studio-os", "seq": 17 }`

- Setzt `acknowledged_seq` des Abnehmers; eine kleinere Nummer verändert nichts (nie rückwärts). Antwort `{ "consumer": "studio-os", "acknowledged_seq": 17, "server_time": "..." }`.
- `consumer`: Kleinbuchstaben, Ziffern, Bindestrich, höchstens 40 Zeichen. Eine Nummer größer als die letzte vorhandene ergibt 409 mit `last_seq`.

## 4. Rückweg: Status setzen

`POST /intern/v1/bookings/{id}/status` mit `{ "status": "confirmed", "reason": "studio_confirmed" }` oder `{ "status": "cancelled", "reason": "studio_cancelled" }`

- `{id}` ist die ULID der Buchung (Feld `id`). `reason` ist einer der festen Bezeichner `studio_confirmed` oder `studio_cancelled` (kein Freitext, andere Werte ergeben 400). Bei Absage speichert die Buchung `cancel_reason` als `crm:studio_cancelled` (Präfix `crm:` plus Bezeichner).
- `confirmed`: eine Terminanfrage (`requested`) wird `confirmed`, Ereignis `confirmed`, Kalendereintrag unverändert. Ist die Buchung schon `confirmed`, passiert nichts (`changed: false`). Ist sie abgesagt, 409 `already_cancelled`.
- `cancelled`: Status `cancelled`, Belegung frei, Ereignis `cancelled`, Kalendereintrag gelöscht. Mehrfach aufrufbar (`changed: false` ab dem zweiten Mal).
- Antwort: `{ "booking": { vollständiger Stand }, "changed": true }`. Unbekannte Kennung 404. Nichts anderes ist über den Rückweg änderbar.

## 5. Zustand

`GET /intern/v1/health` liefert ohne Kundendaten:

```json
{ "server_time": "...", "last_seq": 42, "oldest_seq": 0, "stream_generation": "gen-20261004-k3j9q2m7x5", "consumers": [ { "name": "studio-os", "acknowledged_seq": 40, "last_seen_at": "...", "pending_events": 2 } ], "pending_events": 2, "calendar_failed": 0, "mail_unsent": 0 }
```

## 6. Umschlag und Buchungsstand

Jedes Ereignis hat denselben Umschlag: `seq`, `event_id` (ULID), `type`, `occurred_at` (UTC), `booking`. Kein eigenes Feld `booking_id` auf oberster Ebene; die Kennung steht in `booking.id`. Bei `deleted` enthält `booking` nur `id` und `reference`.

Felder von `booking` (alle Zeiten UTC mit `Z`):

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `id` | ULID | Kennung der Buchung, Schlüssel für den Rückweg |
| `reference` | Text | Buchungsnummer für Kunden, zum Beispiel `PS-FFL87G` |
| `created_at` | Zeit | Entstehung, nie überschrieben |
| `starts_at`, `ends_at` | Zeit | Termin |
| `duration_minutes` | Zahl | Dauer |
| `persons` | 1 oder 2 | Allein oder zu zweit |
| `appointment_type` | `control`, `first`, `follow_up` | Kontrolltermin, erster Besuch, Folgebesuch |
| `first_visit`, `checkup` | bool | bleiben zusätzlich enthalten |
| `service_codes` | Liste | gemeinsame Codes, Tabelle in Abschnitt 8 |
| `zones` | Liste | gemeinsame Zonencodes, Tabelle in Abschnitt 8 |
| `other_zone` | Text oder null | frei eingetragene Zone des Kunden |
| `zones_unknown` | bool | „Ich weiß es noch nicht“ |
| `status` | `requested`, `confirmed`, `cancelled`, `rescheduled`, `no_show`, `completed` | Buchungsstatus; beim Verschieben bleibt er unverändert, `rescheduled` als Status wird derzeit nicht gesetzt |
| `channel` | `web` | Kanal |
| `language` | `de`, `en`, `es`, `fr`, `pt` | Sprache des Kunden |
| `device` | `mobile`, `desktop` | Gerät bei der Buchung |
| `reminder_whatsapp` | `{ "consented": bool, "consented_at": Zeit oder null }` | Einwilligung zur Erinnerung per WhatsApp |
| `consent_at` | Zeit | Einwilligung zur Verarbeitung |
| `first_name`, `last_name`, `phone_e164`, `email` | Text | Kontakt |
| `note` | Text | Notiz des Kunden, nur hier und in der Datenbank, nie im Kalender |
| `referral` | Text oder null | Empfehlung von der Bestätigungsseite |
| `test` | bool | Testbuchung (Testbetrieb der Seite); im Kundensystem gesondert behandeln |
| `calendar_event_id`, `calendar_state` | Text, `pending`/`written`/`failed` | Kalendereintrag des Arztes |
| `attendance_confirmed_at` | Zeit oder null | Zusage des Kunden („Ja, ich komme“). Frühestens ab dem Vortag des Termins, 10:00 Uhr Berliner Zeit (zeitgleich mit der Erinnerungsmail); vorher lehnt die Buchung eine Zusage ab. Bei Buchung oder Verschiebung nach diesem Zeitpunkt automatisch gesetzt (Zeitpunkt der Buchung oder Verschiebung), weil der Kunde keine Erinnerung mehr bekommt. Siehe Abschnitt 7, attendance_confirmed. |
| `cancelled_at`, `cancel_reason` | Zeit, Text | Absage; Werte und Bedeutung in Abschnitt 6.1 |
| `updated_at` | Zeit | letzte Änderung |

### 6.1 Werte von `cancel_reason`

Vollständige Liste, Stand 3. Oktober 2026. Andere Werte schreibt die Buchung nicht. Bei nicht abgesagten Buchungen ist `cancel_reason` `null`.

| Wert | Bedeutung |
|---|---|
| `customer_link` | Der Kunde hat über die Terminseite abgesagt, mehr als 24 Stunden vor dem Termin („Termin absagen“). Sofort-Mail an das Studio „Abgesagt“. |
| `customer_short_notice` | Der Kunde hat über die Terminseite abgesagt, 24 bis 2 Stunden vor dem Termin („Leider verhindert“). Sofort-Mail an das Studio „Kurzfristig abgesagt“. Unter 2 Stunden ist online keine Absage möglich. |
| `studio_calendar` | Das Studio hat den Eintrag im Kalender „Palo Skin Termine“ gelöscht. Keine Mail an den Kunden, Studio-Mail „Im Kalender abgesagt“. |
| `crm:studio_cancelled` | Das Kundensystem hat über `POST /intern/v1/bookings/{id}/status` mit `reason: "studio_cancelled"` abgesagt. Präfix `crm:` plus Bezeichner; andere Bezeichner nimmt der Endpunkt nicht an (400). |

Bis zum 3. Oktober 2026 hieß die kurzfristige Absage `customer_link_short`. Die Buchung hat diesen Wert beim Start der neuen Fassung in Buchungen und Ereignissen auf `customer_short_notice` umgestellt; zu diesem Zeitpunkt hatte noch kein Verbraucher Ereignisse abgeholt. Die Absage des Kundensystems wurde bis dahin als `studio_cancelled` ohne Präfix gespeichert; in der Datenbank gab es keinen solchen Fall.

### 6.2 Vollständige Nutzlast, `null` statt Weglassen

Jedes Ereignis außer `deleted` trägt in `booking` immer alle Felder aus Abschnitt 6. Ein Feld ohne Wert steht ausdrücklich als `null` in der Nutzlast und wird nie weggelassen. Das gilt besonders beim Verschieben (Kunde über die Terminseite oder Studio im Kalender): `attendance_confirmed_at` ist danach `null`, weil eine Zusage nur für den Termin gilt, für den sie gegeben wurde.

## 7. Ereignistypen mit Beispielen

Gemeinsame Werte der Beispiele: Buchung `01M3Z293MN1KK9BTG42T2BZBJG`, Nummer `PS-FFL87G`, Termin 6. Oktober 2026, 07:30 Berliner Zeit.

### created: neue Buchung (Status `requested`, oder `confirmed` bei verbindlicher Buchung)

```json
{
  "seq": 1,
  "event_id": "01M3Z293MQ4R6N7X8WQ2ZK5H0D",
  "type": "created",
  "occurred_at": "2026-10-02T19:43:23.801Z",
  "booking": {
    "id": "01M3Z293MN1KK9BTG42T2BZBJG",
    "reference": "PS-FFL87G",
    "created_at": "2026-10-02T19:43:23.801Z",
    "starts_at": "2026-10-06T05:30:00.000Z",
    "ends_at": "2026-10-06T06:40:00.000Z",
    "duration_minutes": 70,
    "persons": 2,
    "appointment_type": "first",
    "first_visit": true,
    "checkup": false,
    "service_codes": ["botulinum", "polynucleotides_eye"],
    "zones": ["forehead", "glabella", "crows_feet"],
    "other_zone": null,
    "zones_unknown": false,
    "status": "confirmed",
    "channel": "web",
    "language": "de",
    "device": "mobile",
    "reminder_whatsapp": { "consented": true, "consented_at": "2026-10-02T19:43:23.795Z" },
    "consent_at": "2026-10-02T19:43:23.795Z",
    "first_name": "Erika",
    "last_name": "Testmail",
    "phone_e164": "+491510000004",
    "email": "erika.testmail@example.com",
    "note": "Bitte leise, ich bin empfindlich.",
    "referral": null,
    "test": true,
    "calendar_event_id": null,
    "calendar_state": "pending",
    "attendance_confirmed_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "updated_at": "2026-10-02T19:43:23.801Z"
  }
}
```

### confirmed: Terminanfrage vom Kundensystem bestätigt (Rückweg)

Wie `created`, mit `"type": "confirmed"`, `"status": "confirmed"` und neuem `updated_at`. Bei verbindlicher Buchung (Schalter an) entsteht dieses Ereignis nicht, weil die Buchung schon als `confirmed` entsteht.

```json
{ "seq": 2, "event_id": "01M3Z2A0J6Q5R9T0WXYZ123456", "type": "confirmed", "occurred_at": "2026-10-02T20:01:11.004Z", "booking": { "id": "01M3Z293MN1KK9BTG42T2BZBJG", "reference": "PS-FFL87G", "status": "confirmed", "updated_at": "2026-10-02T20:01:11.004Z", "...": "übrige Felder wie bei created" } }
```

### attendance_confirmed: Zusagestand geändert

Regel seit 4. Oktober 2026: Eine Zusage ist erst ab dem Vortag des Termins, 10:00 Uhr Berliner Zeit, möglich. Ereignis `attendance_confirmed` mit gesetztem `attendance_confirmed_at`, wenn der Kunde über die Terminseite oder die Erinnerungsmail zusagt. Bei kurzfristigen Buchungen (nach dem Vortag 10 Uhr) steht `attendance_confirmed_at` schon im Ereignis `created`, beim Verschieben in dieses Zeitfenster im Ereignis `rescheduled`; ein eigenes Ereignis `attendance_confirmed` gibt es dann nicht. Zusagen, die vor Einführung der Regel früher gegeben wurden, hat die Buchung am 4. Oktober 2026 einmalig zurückgesetzt: Ereignis `attendance_confirmed` mit `attendance_confirmed_at: null` (Zusage zurückgenommen). Maßgeblich ist immer der Wert in der Nutzlast.

```json
{ "seq": 3, "event_id": "01M3Z2B3C8D9E0F1G2H3J4K5M6", "type": "attendance_confirmed", "occurred_at": "2026-10-02T19:44:53.668Z", "booking": { "id": "01M3Z293MN1KK9BTG42T2BZBJG", "reference": "PS-FFL87G", "status": "confirmed", "attendance_confirmed_at": "2026-10-02T19:44:53.668Z", "updated_at": "2026-10-02T19:44:53.668Z", "...": "übrige Felder wie bei created" } }
```

### cancelled: Absage durch Kunde (Link), Studio (Eintrag im Kalender gelöscht) oder Kundensystem (Rückweg)

```json
{ "seq": 4, "event_id": "01M3Z2C4D5E6F7G8H9J0K1M2N3", "type": "cancelled", "occurred_at": "2026-10-02T19:44:54.230Z", "booking": { "id": "01M3Z293MN1KK9BTG42T2BZBJG", "reference": "PS-FFL87G", "status": "cancelled", "cancelled_at": "2026-10-02T19:44:54.230Z", "cancel_reason": "customer_link", "calendar_event_id": "g9lgojcpqbtal5is5ljv4f0rrg", "updated_at": "2026-10-02T19:44:54.230Z", "...": "übrige Felder wie bei created" } }
```

`cancel_reason` ist einer der Werte aus Abschnitt 6.1. `calendar_event_id` kann im Ereignis noch gesetzt sein; der Kalendereintrag wird direkt danach gelöscht.

### rescheduled: Termin verschoben (Kunde über die Terminseite oder Studio im Kalender)

Ereignistyp `rescheduled`; der Status der Buchung bleibt unverändert (in der Regel `confirmed`). `booking` trägt die neuen Zeiten `starts_at`, `ends_at` und `duration_minutes`; die alte Zeit kennt das Kundensystem aus dem vorherigen Stand. Eine Zusage (`attendance_confirmed_at`) gilt nur für den Termin, für den sie gegeben wurde, und ist nach dem Verschieben wieder `null`. Ändert das Studio im Kalender nur das Ende des Termins (Dauer), kommt ebenfalls `rescheduled` mit unverändertem `starts_at` und neuem `ends_at`.

```json
{ "seq": 5, "event_id": "01M41JC7Q2W8R4T6Y0A1B2C3D4", "type": "rescheduled", "occurred_at": "2026-10-03T19:03:01.921Z", "booking": { "id": "01M3Z293MN1KK9BTG42T2BZBJG", "reference": "PS-FFL87G", "status": "confirmed", "starts_at": "2026-10-08T07:00:00.000Z", "ends_at": "2026-10-08T07:30:00.000Z", "duration_minutes": 30, "attendance_confirmed_at": null, "updated_at": "2026-10-03T19:03:01.921Z", "...": "übrige Felder wie bei created" } }
```

### reminder_changed: reserviert

Für eine spätere Änderung der WhatsApp-Einwilligung. Erscheint derzeit nicht.

### completed: reserviert, wird nicht gesendet

Das Erscheinen eines Kunden entscheidet nur das Kundensystem. Die Buchung sendet dieses Ereignis nicht.

### deleted: Löschlauf (Schritt 4), nur Kennung und Nummer

```json
{ "seq": 918, "event_id": "01N2A1B2C3D4E5F6G7H8J9K0M1", "type": "deleted", "occurred_at": "2027-01-05T02:30:00.000Z", "booking": { "id": "01M3Z293MN1KK9BTG42T2BZBJG", "reference": "PS-FFL87G" } }
```

## 8. Zuordnung der Codes

Intern bleiben die Codes unverändert; übersetzt wird beim Schreiben jedes Ereignisses (`lib/service-codes.ts`). Alle Codes sind verbindlich (bestätigt von Dr. Vogel am 3. Oktober 2026), ebenso die Felder `other_zone` und `zones_unknown`.

Behandlungen (`service_codes`):

| Intern | Gemeinsam | Deutsch |
| --- | --- | --- |
| BER | `consultation` | Beratung |
| BOT | `botulinum` | Botox-Behandlung, Zonen in `zones` |
| KAU | `masseter` | Kaumuskel |
| NEF | `nefertiti` | Nefertiti-Lift |
| HYP | `hyperhidrosis_axilla` | Übermäßiges Schwitzen (Achseln) |
| LDN | `polynucleotides_eye` | Lachs-DNA, eine Behandlung |
| LDN4 | `polynucleotides_eye_4` | Lachs-DNA, vier Behandlungen |
| KON | `control` | Kontrolltermin, als `appointment_type` |

Personenzahl (intern P2) ist das Feld `persons`, kein Code.

Zonen (`zones`):

| Intern | Gemeinsam | Deutsch |
| --- | --- | --- |
| zornesfalte | `glabella` | Zornesfalte |
| stirn | `forehead` | Stirn |
| kraehenfuesse | `crows_feet` | Krähenfüße |
| browlift | `brow_lift` | Browlift |
| lipflip | `lip_flip` | Lip Flip |
| bunnylines | `bunny_lines` | Bunny Lines |
| mundwinkel | `mouth_corners` | Mundwinkel |
| erdbeerkinn | `chin` | Erdbeerkinn |
| gummysmile | `gummy_smile` | Gummy Smile |
| oberlippe | `upper_lip_lines` | Oberlippe |
| nase | `nose` | Nase |

Eine frei eingetragene Zone steht nur in `other_zone`, „weiß ich noch nicht“ nur in `zones_unknown`; beide erzeugen keinen Code.

## 9. Fehler

| Status | Bedeutung |
| --- | --- |
| 400 `invalid` | Parameter oder Body ungültig |
| 401 `unauthorized` | Token fehlt oder falsch |
| 404 `not_found` | Buchung unbekannt, oder Pfad außerhalb des privaten Netzes |
| 409 `unknown_seq` / `already_cancelled` | Bestätigung über die letzte Nummer hinaus, Bestätigen einer Absage |
| 429 `rate_limited` | mehr als 120 Anfragen pro Minute |
| 503 `failed` | Datenbank nicht erreichbar; später erneut versuchen |
