# Stufe 2: eigene Buchungsablage auf Hetzner, Entwurf des Schemas zur Freigabe

Stand: 1. Oktober 2026. Noch nichts gebaut. SQLite mit persistentem Volume zum Start, Schema so angelegt, dass es später unverändert nach PostgreSQL wandern kann (keine SQLite-Sonderfunktionen, Zeitstempel als ISO-Text in UTC, Kennungen als Text).

## Grundsätze

1. Die Datenbank ist die Wahrheit für Buchungen, Kunden und Notizen. Der Google-Kalender bekommt nur Zeit, Vorname und Buchungs-ID.
2. Reservierung atomar: Jede Buchung belegt alle 10-Minuten-Einheiten ihrer Dauer in einer Tabelle mit eindeutiger Einheit je Zeitpunkt. Eine zweite Buchung auf eine belegte Einheit scheitert an der Eindeutigkeit, die Transaktion rollt zurück. Kein Fenster, in dem zwei Buchungen gleichzeitig „frei“ sehen.
3. Idempotenz dauerhaft: Anfragekennung des Browsers wird gehasht gespeichert und auf die Buchung abgebildet. Wiederholte Anfragen geben dieselbe Buchung zurück, auch nach Neustart.
4. Datensparsamkeit: personenbezogene Daten nur in `kunde` und `buchung`, Notizen getrennt, Löschfristen je Tabelle.
5. CRM-Grundstein: Kunde mit Verlauf (Buchungen, Status, Notizen, Zeitstempel), Status-Historie je Buchung.

## Tabellen

```sql
-- Kunde: eine Zeile je Person, erkannt über normalisierte Handynummer (E.164) und E-Mail
CREATE TABLE kunde (
  id            TEXT PRIMARY KEY,               -- ULID
  vorname       TEXT NOT NULL,
  nachname      TEXT NOT NULL,
  handy_e164    TEXT NOT NULL,                  -- +4915112345678
  email         TEXT NOT NULL,                  -- kleingeschrieben
  sprache       TEXT NOT NULL CHECK (sprache IN ('de','en','es','fr','pt')),
  empfehlung    TEXT,                           -- Name oder Code, erste Nennung
  erstellt_am   TEXT NOT NULL,                  -- ISO 8601 UTC
  geaendert_am  TEXT NOT NULL,
  geloescht_am  TEXT                            -- Löschung oder Anonymisierung, siehe Fristen
);
CREATE UNIQUE INDEX kunde_handy ON kunde (handy_e164) WHERE geloescht_am IS NULL;
CREATE INDEX kunde_email ON kunde (email);

-- Buchung: ein Termin
CREATE TABLE buchung (
  id              TEXT PRIMARY KEY,             -- ULID
  buchungsnummer  TEXT NOT NULL UNIQUE,         -- PS-XXXXXX, sichtbar für den Kunden
  kunde_id        TEXT NOT NULL REFERENCES kunde (id),
  beginn_utc      TEXT NOT NULL,                -- ISO 8601 UTC
  ende_utc        TEXT NOT NULL,
  dauer_min       INTEGER NOT NULL CHECK (dauer_min BETWEEN 10 AND 240),
  personen        INTEGER NOT NULL DEFAULT 1 CHECK (personen IN (1,2)),
  besuch          TEXT NOT NULL CHECK (besuch IN ('erstbesuch','folgebesuch','kontrolle')),
  status          TEXT NOT NULL CHECK (status IN ('reserviert','bestaetigt','abgesagt','verschoben','erschienen','nicht_erschienen')),
  leistungscode   TEXT NOT NULL,                -- BOT+LDN+P2
  auswahl_json    TEXT NOT NULL,                -- Selection wie vom Server geprüft (Zonen, Sonstiges, Lachs-DNA, ...)
  preis_richtwert INTEGER,                      -- Euro brutto, Summe der Richtwerte, NULL bei Beratung
  einwilligung_am TEXT NOT NULL,                -- Zeitpunkt der Einwilligung
  quelle          TEXT NOT NULL DEFAULT 'website', -- website, whatsapp, telefon, vor_ort
  kalender_event_id TEXT,                       -- Google-Ereignis, falls synchronisiert
  kalender_sync_am  TEXT,
  erstellt_am     TEXT NOT NULL,
  geaendert_am    TEXT NOT NULL
);
CREATE INDEX buchung_kunde ON buchung (kunde_id);
CREATE INDEX buchung_beginn ON buchung (beginn_utc);

-- Belegung: eine Zeile je 10-Minuten-Einheit; die Eindeutigkeit macht die Reservierung atomar
CREATE TABLE belegung (
  einheit_utc  TEXT NOT NULL,                   -- Beginn der 10-Minuten-Einheit, ISO 8601 UTC
  buchung_id   TEXT NOT NULL REFERENCES buchung (id) ON DELETE CASCADE,
  PRIMARY KEY (einheit_utc)
);
CREATE INDEX belegung_buchung ON belegung (buchung_id);

-- Idempotenz: Anfragekennung des Browsers (gehasht) auf Buchung
CREATE TABLE idempotenz (
  schluessel_hash TEXT PRIMARY KEY,             -- SHA-256 der Anfragekennung
  buchung_id      TEXT NOT NULL REFERENCES buchung (id),
  erstellt_am     TEXT NOT NULL,
  ablauf_am       TEXT NOT NULL                 -- zum Beispiel 30 Tage, danach aufräumen
);

-- Notiz: frei formulierter Text, getrennt von der Buchung, mit Urheber
CREATE TABLE notiz (
  id          TEXT PRIMARY KEY,
  kunde_id    TEXT NOT NULL REFERENCES kunde (id),
  buchung_id  TEXT REFERENCES buchung (id),
  urheber     TEXT NOT NULL CHECK (urheber IN ('kunde','studio')),
  text        TEXT NOT NULL,
  erstellt_am TEXT NOT NULL
);
CREATE INDEX notiz_kunde ON notiz (kunde_id);

-- Statusverlauf je Buchung, für Nachvollziehbarkeit und CRM
CREATE TABLE buchung_status (
  id          TEXT PRIMARY KEY,
  buchung_id  TEXT NOT NULL REFERENCES buchung (id) ON DELETE CASCADE,
  von_status  TEXT,
  zu_status   TEXT NOT NULL,
  grund       TEXT,                             -- kunde_whatsapp, studio, system_timeout, ...
  erstellt_am TEXT NOT NULL
);
CREATE INDEX buchung_status_buchung ON buchung_status (buchung_id);

-- Begrenzungen und Zugangsversuche, ersetzt den Speicher der Instanz
CREATE TABLE begrenzung (
  schluessel  TEXT NOT NULL,                    -- ip:<hash> oder contact:<hash>
  zeitpunkt   TEXT NOT NULL,
  PRIMARY KEY (schluessel, zeitpunkt)
);
```

## Ablauf einer Buchung mit der Datenbank

1. Server prüft Eingaben, berechnet Dauer, Fenster und freie Zeiten wie heute (Fenster weiter aus „Palo Skin offen“, belegt aus `belegung` plus frei/belegt des Hauptkalenders).
2. Transaktion: Idempotenzschlüssel nachsehen (Treffer: bestehende Buchung zurückgeben). Kunde anlegen oder über Handynummer finden. Buchung mit Status `reserviert` einfügen. Alle Einheiten in `belegung` einfügen; schlägt eine fehl, Rollback und Antwort „Termin gerade vergeben“. Idempotenzschlüssel eintragen. Commit.
3. Nach dem Commit: Google-Ereignis anlegen (Titel „Palo Skin: Vorname“, Zeit, Buchungs-ID in `extendedProperties`), `kalender_event_id` speichern, Status `bestaetigt`. Scheitert Google, bleibt die Buchung `reserviert` und ein Nachlauf versucht die Synchronisation erneut; die Zeit ist in der Datenbank bereits sicher belegt.
4. Bestätigung an den Kunden erst nach Commit (Stufe 2 mit Versand).

## Löschfristen (Vorschlag, mit Datenschutzpaket abstimmen)

- Buchungen ohne Behandlung: 12 Monate nach dem Termin anonymisieren (Name, Kontakt entfernen, Statistik bleibt).
- Kunden ohne Buchung seit 36 Monaten: anonymisieren.
- `idempotenz` und `begrenzung`: 30 Tage.
- Behandlungsdokumentation gehört nicht in diese Datenbank (ärztliche Dokumentation mit eigenen Fristen).

## Betrieb

- SQLite-Datei auf einem Docker-Volume (`/data/paloskin.db`), WAL-Modus, tägliche Sicherung per `sqlite3 .backup` auf ein zweites Volume, verschlüsselt an einen Speicher in Deutschland kopieren.
- Zugriff nur aus der App; keine Freigabe nach außen.
- Umzug nach PostgreSQL: gleiche Tabellen, `belegung` als Ausschlussbedingung auf Zeitbereich (`EXCLUDE USING gist (zeitraum WITH &&)`).

## Offene Entscheidungen

1. Einheit 10 Minuten (passt zu 20-, 30-, 40-, 50-Minuten-Terminen) oder 5 Minuten?
2. Soll der Hauptkalender weiter per frei/belegt gelesen werden, oder trägt Dr. Vogel private Blockaden künftig in „Palo Skin Termine“ ein?
3. Kunde erkennen über Handynummer (Vorschlag) oder E-Mail?
