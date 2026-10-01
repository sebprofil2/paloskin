# Umzug auf einen Hetzner-Server (Vorbereitung, noch nichts ausgeführt)

Stand: 1. Oktober 2026. Ziel: dieselbe Anwendung wie auf Vercel, als Docker-Container hinter Caddy mit automatischem HTTPS, Server in Deutschland.

## Dateien in diesem Ordner

| Datei | Zweck |
|---|---|
| `docker-compose.yml` | Zwei Dienste: `app` (Next.js, nur im internen Docker-Netz, kein veröffentlichter Port) und `caddy` (80 und 443). App ohne Root (Benutzer 10001), Dateisystem schreibgeschützt mit tmpfs für `/tmp` und den Next.js-Cache, alle Capabilities entfernt, `no-new-privileges`, Begrenzung auf 768 MB, 1 CPU und 256 Prozesse. Protokolle je 10 MB, fünf Dateien. |
| `Caddyfile` | HTTPS mit Let's Encrypt, Weiterleitung von paloskin.de auf www, Reverse-Proxy zur App, `Server`-Kopfzeile entfernt. HSTS auskommentiert, erst nach geprüftem HTTPS einschalten. |
| `paloskin.env.example` | Vorlage für `/etc/paloskin/paloskin.env` (Umgebungsvariablen ohne Schlüssel). |
| `../Dockerfile` | Mehrstufiger Build, Laufzeitbild `node:24-alpine`, Benutzer `app` mit fester Kennung 10001, kopiert nur Standalone-Server, statische Dateien, `public` und `content`. |
| `../.dockerignore` | Schließt `.env*`, Schlüsseldateien (`*.pem`, `*.key`, `*gserviceaccount*.json`, `palo-skin-buchung-*.json`), `.git`, `node_modules`, `.next` und `deploy` aus. |

Dienstkontoschlüssel: liegt als Datei `/etc/paloskin/service-account.json` (root, 0600) außerhalb von Repository und Image und wird als Compose-Secret unter `/run/secrets/google_service_account` eingebunden. Die App erhält nur den Pfad (`GOOGLE_SERVICE_ACCOUNT_FILE`), gelesen in `lib/env.ts`.

Sicherheitsheader setzt die Anwendung selbst (`next.config.ts`), damit Vercel und Hetzner gleich sind: Content-Security-Policy (nur eigene Quellen, Inline-Skripte und -Stile erlaubt, keine Einbettung, keine Fremdquellen), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. Lokal mit Produktionsbuild getestet, siehe Abschnitt „Test“.

## Umgebungsvariablen auf dem Server

In `/etc/paloskin/paloskin.env`:

| Variable | Wert |
|---|---|
| `BOOKING_ENGINE` | `google` |
| `TEST_MODE` | `true` bis zum ersten echten Kunden, dann `false` |
| `TEST_ACCESS_CODE` | langer zufälliger Code, nur im Testbetrieb |
| `SLOT_STEP_MINUTES` | `30` |
| `BUFFER_MINUTES` | `0` |
| `CALENDAR_OPEN_ID` | Kennung „Palo Skin offen“ |
| `CALENDAR_BOOKINGS_ID` | Kennung „Palo Skin Termine“ |
| `CALENDAR_BUSY_IDS` | `sebastian@paloskin.de` und die Kennung „Palo Skin Termine“, kommagetrennt |
| `TRUST_PROXY` | `true` (nur Caddy setzt X-Forwarded-For) |
| `OWNER_WEBHOOK_URL` | leer oder Adresse für Meldungen |

Gesetzt in `docker-compose.yml`: `NODE_ENV`, `PORT`, `HOSTNAME`, `GOOGLE_SERVICE_ACCOUNT_FILE`.

## Schritt für Schritt

1. **Server anlegen.** Hetzner Cloud, Standort Nürnberg oder Falkenstein, Typ CX22 (2 vCPU, 4 GB) reicht. Ubuntu 24.04. Beim Anlegen den eigenen SSH-Schlüssel hinterlegen, kein Passwort. Hetzner-Firewall: eingehend nur 22, 80, 443.
2. **Erster Zugang und Benutzer.** Als root per Schlüssel anmelden, Benutzer `deploy` anlegen (`adduser deploy`, `usermod -aG sudo deploy`), den SSH-Schlüssel nach `/home/deploy/.ssh/authorized_keys` kopieren. In `/etc/ssh/sshd_config` setzen: `PermitRootLogin no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`. `systemctl restart ssh`. Zugang als `deploy` in zweiter Sitzung prüfen, erst dann die root-Sitzung schließen.
3. **System.** `apt update && apt upgrade`, `unattended-upgrades` aktivieren. UFW: `ufw default deny incoming`, `ufw default allow outgoing`, `ufw allow 22,80,443/tcp`, `ufw allow 443/udp`, `ufw enable`. Zeitzone `timedatectl set-timezone Europe/Berlin`. fail2ban für SSH.
4. **Docker.** Docker Engine mit Compose-Plugin nach der Anleitung von Docker (apt-Repository), `deploy` in die Gruppe `docker`. Hinweis: Docker veröffentlicht Ports an UFW vorbei, deshalb hat der App-Dienst keinen `ports`-Eintrag, nur Caddy.
5. **Geheimnisse.** `mkdir -p /etc/paloskin`, Schlüsseldatei als `/etc/paloskin/service-account.json` und Variablen als `/etc/paloskin/paloskin.env` ablegen (per `scp` vom eigenen Rechner), `chown root:root`, `chmod 600`, Verzeichnis `chmod 700`.
6. **Code.** `git clone https://github.com/sebprofil2/paloskin.git /opt/paloskin`, Branch mit der Next.js-Buchung auschecken. Keine `.env`-Dateien im Verzeichnis.
7. **Start ohne DNS.** `docker compose -f deploy/docker-compose.yml up -d --build`. Status: `docker compose -f deploy/docker-compose.yml ps`, Protokoll: `docker compose -f deploy/docker-compose.yml logs -f app`. Caddy wartet mit dem Zertifikat, bis DNS zeigt.
8. **Test vor der Umstellung.** Vom eigenen Rechner mit Host-Zuordnung: `curl -k --resolve www.paloskin.de:443:<Server-IP> https://www.paloskin.de/` und dasselbe für `/impressum`, `/datenschutz`, `/booking`, `/termine` (308 auf /booking), eine falsche Adresse (404), `/assets/fonts/SchibstedGrotesk-Variable.woff2` (200, Cache-Control). Mit `?test=<Code>` die Buchung bis zur Bestätigung, Eintrag im Kalender prüfen und löschen. Header prüfen: `curl -sI` zeigt CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
9. **DNS umstellen.** Bei GoDaddy vorher TTL auf 300 Sekunden senken. A-Einträge für `paloskin.de` und `www.paloskin.de` auf die Server-IPv4, AAAA auf die IPv6, die Vercel-Einträge (CNAME oder A 76.76.21.21) ersetzen. Nach einigen Minuten: `dig +short www.paloskin.de`, dann `https://www.paloskin.de/` ohne `--resolve` prüfen. Caddy holt das Zertifikat automatisch, Protokoll: `docker compose logs caddy`.
10. **HSTS einschalten.** Wenn beide Hostnamen mit gültigem Zertifikat antworten und die Weiterleitung von paloskin.de funktioniert: HSTS-Zeile im `Caddyfile` einkommentieren, `docker compose -f deploy/docker-compose.yml restart caddy`.
11. **Vercel.** Projekt erst dann auf „paused“ setzen oder die Domain dort entfernen, wenn der Server eine Woche stabil läuft. Die Vercel-Umgebungsvariablen danach löschen.
12. **Aktualisierung später.** `cd /opt/paloskin && git pull && docker compose -f deploy/docker-compose.yml up -d --build`.

## Rückweg

Solange die Vercel-Domain-Einträge nicht gelöscht sind, genügt es, die DNS-Einträge bei GoDaddy wieder auf Vercel zu setzen (CNAME `www` auf `cname.vercel-dns.com`, A `@` auf `76.76.21.21`; die genauen Werte stehen im Vercel-Projekt unter Domains). Mit TTL 300 greift das in wenigen Minuten. Der Server kann weiterlaufen und später erneut getestet werden.

## Protokolle ohne personenbezogene Daten

Die App protokolliert nur Fehlerklasse, Zeitpunkt und Anfragekennung, keine Request-Bodies, Namen, Nummern oder Adressen (siehe Härtung D4). Caddy protokolliert Zugriffe als JSON mit IP-Adresse; die Dateien rotieren bei 10 MB, fünf Dateien, also kurz. Für die Datenschutzerklärung: Hosting Hetzner Online GmbH, Gunzenhausen, Auftragsverarbeitungsvertrag im Hetzner-Konto abschließen, Abschnitt 2 umschreiben.

## Nicht lokal getestet

Auf diesem Rechner ist kein Docker installiert. `docker compose build` und der Healthcheck werden erstmals auf dem Server ausgeführt (Schritt 7). Die Anwendung selbst, die Header und die Zugriffsregeln sind lokal mit Produktionsbuild geprüft.
