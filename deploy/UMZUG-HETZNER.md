# Umzug auf einen Hetzner-Server, Schritt für Schritt

Stand: 2. Oktober 2026. Diese Anleitung ist zum Mitklicken geschrieben. Jeder Befehl steht in einem eigenen Block; Sie kopieren ihn in das Terminal und drücken Enter. Wörter in spitzen Klammern wie `<SERVER-IP>` ersetzen Sie durch Ihren Wert. Was der Server antwortet, steht als „Erwartet“. Dauer insgesamt etwa zwei Stunden, DNS-Umstellung am Ende.

Vorab: Es wird der Branch `zonen` ausgerollt. Die Live-Seite auf Vercel bleibt unverändert, bis Sie in Schritt 11 die DNS-Einträge umstellen. Bis dahin ist nichts öffentlich sichtbar.

## 1. SSH-Schlüssel auf dem Mac erzeugen (erledigt am 2. Oktober 2026)

Schlüsselpaar liegt unter `~/.ssh/id_ed25519_paloskin` (privat, mit Passphrase) und `~/.ssh/id_ed25519_paloskin.pub` (öffentlich, Kommentar `paloskin-hetzner`). Alle `ssh`- und `scp`-Befehle unten verwenden diesen Schlüssel über `-i ~/.ssh/id_ed25519_paloskin`. Den öffentlichen Schlüssel anzeigen:

```bash
cat ~/.ssh/id_ed25519_paloskin.pub
```

Bequemer wird es mit einem Eintrag in `~/.ssh/config` (anlegen, sobald die Server-IP bekannt ist); danach genügt `ssh paloskin`:

```
Host paloskin
  HostName <SERVER-IP>
  User deploy
  IdentityFile ~/.ssh/id_ed25519_paloskin
```

## 2. Server bei Hetzner bestellen (erledigt am 2. Oktober 2026)

Tatsächlich bestellt: Projekt „Palo Skin Website“, Server `paloskin-1`, Typ CPX12 (1 vCPU AMD, 2 GB, 40 GB) in Nürnberg, Ubuntu 24.04, tägliche Backups, IPv4 `2.31.2.192`, IPv6 `2a01:4f8:1c16:71ba::1`. SSH-Key bei Hetzner „paloskin-hetzner“, Firewall „firewall-1“ mit TCP 22, 80, 443 und ICMP, ohne UDP 443 (Caddy läuft deshalb ohne HTTP/3). Wegen der 2 GB Arbeitsspeicher legt Schritt 3 eine Swap-Datei von 2 GB an, damit der Docker-Build von Next.js nicht am Speicher scheitert.


1. https://console.hetzner.cloud anmelden, Projekt „paloskin“ anlegen (Neues Projekt).
2. Links „Security“, Reiter „SSH Keys“, „SSH-Key hinzufügen“: den kopierten Schlüssel einfügen, Name „Mac Sebastian“.
3. Links „Firewalls“, „Firewall erstellen“, Name „paloskin-web“. Eingehende Regeln anlegen: TCP 22 (Quelle Any), TCP 80 (Any), TCP 443 (Any), UDP 443 (Any). Ausgehend nichts ändern. Noch keinem Server zuweisen.
4. Links „Server“, „Server hinzufügen“:
   - Standort: Nürnberg oder Falkenstein.
   - Image: Ubuntu 24.04.
   - Typ: Shared vCPU, x86, CX22 (2 vCPU, 4 GB, 40 GB). Reicht für die Seite und die Buchung.
   - Netzwerk: IPv4 und IPv6 eingeschaltet lassen.
   - SSH-Keys: „Mac Sebastian“ anhaken.
   - Firewalls: „paloskin-web“ anhaken.
   - Name: `paloskin-1`.
   - „Kostenpflichtig bestellen“.
5. Nach einer Minute zeigt die Serverliste die IPv4-Adresse. Diese ist `<SERVER-IP>`. Die IPv6-Adresse (beginnt mit `2a01:`) notieren Sie als `<SERVER-IPV6>`; Hetzner zeigt ein Netz wie `2a01:4f8:…::/64`, die Serveradresse ist dieses Präfix mit `::1` am Ende.

## 3. Erster Login und Grundschutz (zwei Phasen, erledigt am 2. Oktober 2026)

Ergebnis: Benutzer `deploy` mit sudo (Passwort im Passwortmanager), UFW aktiv mit 22, 80, 443 TCP, unattended-upgrades und fail2ban aktiv, Zeitzone Europe/Berlin, Swap 2 GB, Root- und Passwort-Login abgeschaltet und gegengeprüft, Neustart durchgeführt. Auf dem Mac gibt es den Eintrag `Host paloskin` in `~/.ssh/config`, daher reicht ab jetzt `ssh paloskin`.

Phase A richtet alles ein, Phase B schaltet Root- und Passwort-Login erst ab, nachdem der Zugang als `deploy` samt `sudo` nachweislich funktioniert. Beides läuft über das Skript `deploy/schritt3.sh` beziehungsweise die Befehle unten; die root-Sitzung bleibt bis zum Ende von Phase B offen.

**Phase A, als root:**

```bash
ssh -i ~/.ssh/id_ed25519_paloskin root@2.31.2.192
```

1. System aktualisieren: `apt update && apt -y upgrade`
2. Benutzer `deploy` anlegen, in die Gruppe `sudo`, ein langes sudo-Passwort setzen (im Passwortmanager ablegen), Ihren öffentlichen Schlüssel nach `/home/deploy/.ssh/authorized_keys` (Verzeichnis 700, Datei 600, Eigentümer deploy).
3. UFW passend zur Hetzner-Firewall: eingehend nur 22, 80, 443 TCP; `ufw enable`.
4. `unattended-upgrades` und `fail2ban` installieren und aktivieren, Zeitzone `Europe/Berlin`.
5. Swap-Datei 2 GB als Reserve (`fallocate`, `mkswap`, `swapon`, Eintrag in `/etc/fstab`, `vm.swappiness=10`).

**Prüfung, in einem zweiten Terminalfenster auf dem Mac:**

```bash
ssh -i ~/.ssh/id_ed25519_paloskin deploy@2.31.2.192 'sudo -S -v < /dev/null 2>&1 | head -1; sudo -k; echo "angemeldet als $(whoami)"'
```

Erwartet: `angemeldet als deploy`. Dann `sudo` mit Passwort prüfen (`sudo whoami` muss `root` ausgeben). Erst wenn beides klappt, Phase B.

**Phase B, als root in der noch offenen Sitzung:**

```bash
printf 'PermitRootLogin no\nPasswordAuthentication no\nKbdInteractiveAuthentication no\n' > /etc/ssh/sshd_config.d/10-paloskin.conf && sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config.d/50-cloud-init.conf 2>/dev/null; sshd -t && systemctl restart ssh && sshd -T | grep -E '^(permitrootlogin|passwordauthentication)'
```

Erwartet: `permitrootlogin no` und `passwordauthentication no`. Danach in neuer Verbindung prüfen, dass `ssh root@2.31.2.192` abgelehnt wird und `deploy` weiter hineinkommt. Dann die root-Sitzung mit `exit` schließen.

## 4. Docker installieren (erledigt am 2. Oktober 2026: Docker 29.8, Compose v5.5, daemon.json aktiv, deploy in Gruppe docker)

Auf dem Server als `deploy`:

```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh && sudo usermod -aG docker deploy
```

Protokolle daemonweit begrenzen (10 MB, fünf Dateien je Container) und Container bei Daemon-Neustart weiterlaufen lassen:

```bash
sudo install -m 644 /opt/paloskin/deploy/daemon.json /etc/docker/daemon.json && sudo systemctl restart docker
```

(Die Datei liegt erst nach Schritt 5 im Verzeichnis; den Befehl dann ausführen.) Danach einmal abmelden und neu anmelden, damit die Gruppe `docker` gilt. Prüfen: `docker compose version`.

Hinweis: Docker veröffentlicht Ports an UFW vorbei. Deshalb hat der App-Dienst in `deploy/docker-compose.yml` keinen `ports`-Eintrag; nur Caddy öffnet 80 und 443.

## 5. Code vom Branch „zonen“ auf den Server (erledigt am 2. Oktober 2026, /opt/paloskin)

```bash
sudo mkdir -p /opt/paloskin && sudo chown deploy:deploy /opt/paloskin && git clone --branch zonen https://github.com/sebprofil2/paloskin.git /opt/paloskin
```

Erwartet: am Ende keine Fehlermeldung, `ls /opt/paloskin` zeigt unter anderem `Dockerfile`, `deploy`, `public`.

## 6. Dienstkontoschlüssel und Umgebungsvariablen (erledigt am 2. Oktober 2026: Schlüssel 10001:10001 0400, paloskin.env mit Testcode und Cookie-Schlüssel, docker login ghcr.io)

1. Auf dem Mac, in einem eigenen Terminalfenster (nicht auf dem Server): Schlüsseldatei hochladen.

```bash
scp -i ~/.ssh/id_ed25519_paloskin ~/Downloads/palo-skin-buchung-1a5f1b62d06a.json deploy@<SERVER-IP>:/home/deploy/service-account.json
```

2. Auf dem Server: an den endgültigen Ort verschieben, nur root darf lesen.

```bash
sudo mkdir -p /etc/paloskin && sudo mv /home/deploy/service-account.json /etc/paloskin/service-account.json && sudo chown 10001:10001 /etc/paloskin/service-account.json && sudo chmod 400 /etc/paloskin/service-account.json && sudo chmod 700 /etc/paloskin
```

Der Container läuft als Benutzer 10001; Compose übernimmt bei Datei-Secrets weder Eigentümer noch Rechte, es gelten die der Datei auf dem Host. Deshalb Eigentümer 10001:10001 und Rechte 0400 (nur dieser Benutzer darf lesen, sonst niemand). Prüfen:

```bash
sudo ls -ln /etc/paloskin/
```

Erwartet: `-r-------- 1 10001 10001 … service-account.json`. Nach dem Start in Schritt 7 im laufenden Container nachprüfen, dass die Datei lesbar ist und das Dateisystem sonst schreibgeschützt bleibt:

```bash
cd /opt/paloskin && docker compose -f deploy/docker-compose.yml exec app sh -c 'id; head -c 60 /run/secrets/google_service_account | grep -o "service_account" && echo "Secret lesbar"; touch /app/probe 2>&1 | grep -q "Read-only" && echo "Dateisystem schreibgeschützt"; touch /tmp/probe /app/.next/cache/probe && echo "tmpfs beschreibbar"'
```

Erwartet: `uid=10001 gid=10001`, `Secret lesbar`, `Dateisystem schreibgeschützt`, `tmpfs beschreibbar`.

3. Umgebungsvariablen anlegen: Vorlage kopieren und ausfüllen. Es öffnet sich der Editor nano; `TEST_ACCESS_CODE=` mit dem Testcode füllen (16 Zeichen aus dem Terminal auf dem Mac), `TEST_COOKIE_SECRET=` mit einer langen Zufallszeichenfolge (zum Beispiel `openssl rand -hex 32`), die Kalenderkennungen sind schon eingetragen. Speichern mit Strg+O, Enter, verlassen mit Strg+X.

```bash
sudo cp /opt/paloskin/deploy/paloskin.env.example /etc/paloskin/paloskin.env && sudo chmod 600 /etc/paloskin/paloskin.env && sudo nano /etc/paloskin/paloskin.env
```

Werte in der Datei:

| Variable | Wert |
|---|---|
| `BOOKING_ENGINE` | `google` |
| `TEST_MODE` | `true` |
| `TEST_ACCESS_CODE` | der Testcode |
| `TEST_COOKIE_SECRET` | Zufallszeichenfolge, Wechsel widerruft alle Zugangs-Cookies (7 Tage Laufzeit) |
| `SLOT_STEP_MINUTES` | `30` |
| `BUFFER_MINUTES` | `0` |
| `CALENDAR_OPEN_ID` | bleibt wie in der Vorlage |
| `CALENDAR_BOOKINGS_ID` | bleibt |
| `CALENDAR_BUSY_IDS` | bleibt |
| `TRUST_PROXY` | `true` |
| `OWNER_WEBHOOK_URL` | leer |

Der Schlüsselpfad `GOOGLE_SERVICE_ACCOUNT_FILE` steht fest in `docker-compose.yml` und zeigt auf das Secret; in der Umgebungsdatei steht kein Schlüssel.

## 7. Image holen und starten (erledigt am 2. Oktober 2026: app healthy, Secret lesbar, Dateisystem schreibgeschützt, tmpfs beschreibbar, Zertifikat für neu.paloskin.de)

Das Image baut GitHub Actions bei jedem Push auf `zonen` (später `main`) und monatlich neu für `linux/amd64` und legt es unter `ghcr.io/sebprofil2/paloskin:<branch>` ab (`.github/workflows/image.yml`). Der Server baut nichts, er zieht nur das fertige Image. Vorbereitung auf GitHub, einmalig:

1. Nach dem ersten Lauf der Action auf github.com unter „Packages“ das Paket `paloskin` öffnen, „Package settings“, „Change visibility“ auf **Private** stellen (das Repository ist öffentlich, das Image soll es nicht sein).
2. Ein Token nur zum Lesen anlegen: github.com, Settings, Developer settings, Personal access tokens, „Tokens (classic)“, „Generate new token“, nur Haken bei `read:packages`, Laufzeit 1 Jahr, Name „paloskin-1 pull“. Token kopieren.

Auf dem Server als `deploy` einmalig anmelden (Token wird abgefragt, nicht in der Befehlszeile eintippen):

```bash
docker login ghcr.io -u sebprofil2
```

Start:

```bash
cd /opt/paloskin && docker compose -f deploy/docker-compose.yml pull && docker compose -f deploy/docker-compose.yml up -d
```

Danach:

```bash
docker compose -f deploy/docker-compose.yml ps
```

Erwartet: `app` mit Status `running (healthy)`, `caddy` mit `running`. Falls `app` nicht healthy wird: `docker compose -f deploy/docker-compose.yml logs --tail 50 app`. Caddy meldet bis zur DNS-Umstellung Zertifikatsfehler für www und apex; das ist erwartet. Für `neu.paloskin.de` (Schritt 8) holt es sofort ein Zertifikat.

Notfall ohne GitHub Actions: `docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.build.yml up -d --build` baut auf dem Server (dafür ist die Swap-Datei).

## 8. Test unter neu.paloskin.de, vor der DNS-Umstellung (am 2. Oktober 2026 erledigt bis auf die Wiederherstellung aus dem Backup)

Ergebnis: alle Seiten 200, `/termine` 308 auf `/booking`, 404 korrekt, Schrift mit Cache-Regel, Sicherheitsheader gesetzt, Zertifikat von Let's Encrypt für neu.paloskin.de, Zugangs-Cookie HttpOnly, SameSite=Strict, Secure, 7 Tage, falscher Code ohne Cookie. Serverneustart: beide Dienste wieder da, Swap aktiv. Kalenderausfall simuliert: freie Zeiten 503 „unavailable“, Buchungsversuch 503, keine Erfolgsmeldung, Protokoll nur `google_slots_failed` und `book_failed` ohne Inhalte, nach Rückbau wieder 200. Echte Terminanfrage über die Domain im Kalender „Palo Skin Termine“ eingetragen (Titel „TEST Palo Skin: Erika S.“) und gelöscht. Heartbeat-Cron installiert (`ok (disk 13%, Fehler 0)`), Monitor-URL folgt mit dem Better-Stack-Konto. Offen: Wiederherstellung aus einem Hetzner-Backup auf einen Testserver (Hetzner-Konsole, siehe unten).

Bei GoDaddy einen Eintrag `A` mit Name `neu` und Wert `2.31.2.192` anlegen (TTL 600). Nach wenigen Minuten holt Caddy ein echtes Zertifikat für `neu.paloskin.de`; der Block dafür steht im `Caddyfile` und wird nach dem Umzug entfernt. Dann auf dem Mac, alles mit echtem HTTPS:

Startseite, Impressum, Datenschutz, Buchung (je `200`):

```bash
for p in / /impressum /datenschutz /booking /booking/zugang; do curl -s -o /dev/null -w "$p %{http_code}\n" "https://neu.paloskin.de$p"; done
```

Weiterleitung `/termine` auf `/booking` (`308`):

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://neu.paloskin.de/termine
```

Falsche Adresse (`404`), Schrift mit Cache-Regel (`200`, `max-age=31536000`), Sicherheitsheader:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://neu.paloskin.de/gibtsnicht; curl -s -D - -o /dev/null https://neu.paloskin.de/assets/fonts/SchibstedGrotesk-Variable.woff2 | grep -i "cache-control"; curl -s -D - -o /dev/null https://neu.paloskin.de/booking | grep -i "content-security\|x-content\|x-frame\|referrer\|strict-transport"
```

Zugangs-Cookie (muss `HttpOnly`, `Secure`, `SameSite=Strict` tragen und ohne Code abgelehnt werden):

```bash
curl -s -o /dev/null -D - -X POST https://neu.paloskin.de/api/zugang -d "code=falsch" | grep -i "^HTTP\|location\|set-cookie"
```

Erwartet: `303` auf `/booking/zugang?fehler=1`, kein `set-cookie`. Mit richtigem Code (im Browser unter https://neu.paloskin.de/booking/zugang): Weiterleitung auf `/booking`, danach Terminanfrage mit erfundenem Namen bis zur Bestätigung, Eintrag in „Palo Skin Termine“ prüfen und löschen (`node scripts/google-cleanup.mjs delete <Nummer>` auf dem Mac).

Kompletter Serverneustart:

```bash
ssh -i ~/.ssh/id_ed25519_paloskin deploy@2.31.2.192 'sudo reboot'
```

Nach zwei Minuten: `docker compose -f deploy/docker-compose.yml ps` zeigt beide Dienste `running`, `swapon --show` zeigt `/swapfile`, https://neu.paloskin.de/booking antwortet `200`.

Simulierter Kalenderausfall: in `/etc/paloskin/paloskin.env` die Kennung `CALENDAR_OPEN_ID` vorübergehend um ein Zeichen verändern, `docker compose -f deploy/docker-compose.yml up -d` (lädt die Umgebung neu). Im Browser mit Zugangs-Cookie bis Schritt 2 gehen: Erwartet „Gerade hakt es bei uns.“ mit WhatsApp-Nummer, keine Uhrzeiten, keine Buchung möglich. Protokoll zeigt `google_slots_failed` ohne Inhalte. Kennung zurücksetzen, erneut `up -d`, Uhrzeiten erscheinen wieder.

Wiederherstellung aus einem Hetzner-Backup: in der Hetzner-Konsole beim Server unter „Backups“ ein Backup auswählen, „Create Server from Backup“, als `paloskin-test` mit derselben Firewall. Mit `ssh -i ~/.ssh/id_ed25519_paloskin deploy@<TEST-IP>` anmelden, `docker compose -f /opt/paloskin/deploy/docker-compose.yml ps` prüfen (Container laufen, Secret vorhanden). Testserver danach löschen. Ergebnis mit Datum in der Hinweise-Datei festhalten.

## 9. Was Sie zusätzlich prüfen sollten

- Sprachen: Startseite mit `?lang=en` und Buchung mit `?lang=fr` öffnen.
- Handyansicht: Safari, Entwicklermenü, „Responsive Design Mode“, iPhone wählen.
- Protokoll auf dem Server ohne Kundendaten: `docker compose -f deploy/docker-compose.yml logs --tail 20 app` zeigt nur JSON-Zeilen mit Ereignis, Zeit und Kennungen.

## 10. Caddy-Zertifikat vorbereiten

Nichts zu tun. Sobald DNS auf den Server zeigt, holt Caddy das Zertifikat selbst (ein bis zwei Minuten).

## 11. DNS bei GoDaddy umstellen (erledigt am 2. Oktober 2026: www und apex auf 2.31.2.192, Zertifikate von Let's Encrypt für beide, http auf https 308, apex auf www 301, HSTS noch aus)

1. Vorher bei GoDaddy, „Meine Produkte“, Domain paloskin.de, „DNS verwalten“: die bestehenden Einträge fotografieren oder notieren (für den Rückweg). Typisch: `A @ 76.76.21.21` und `CNAME www cname.vercel-dns.com` (die genauen Werte stehen auch im Vercel-Projekt unter Settings, Domains).
2. TTL der beiden Einträge auf 600 Sekunden setzen, eine Stunde warten (dann greift der Wechsel später schnell).
3. Umstellen:
   - `A` mit Name `@`: Wert `<SERVER-IP>`.
   - `www`: den CNAME löschen und einen `A`-Eintrag mit Name `www` und Wert `<SERVER-IP>` anlegen.
   - Zusätzlich `AAAA` mit Name `@` und `www`: Wert `<SERVER-IPV6>`.
4. Nach fünf bis zehn Minuten auf dem Mac prüfen:

```bash
dig +short www.paloskin.de A
```

Erwartet: `<SERVER-IP>`. Dann im Browser https://www.paloskin.de öffnen: Schloss-Symbol ohne Warnung, Startseite mit neuem Stand, `/booking` zeigt die Zwischenlösung, `/booking/zugang` die Codeabfrage.

5. HSTS einschalten, erst wenn https://paloskin.de und https://www.paloskin.de beide ohne Warnung laden. Auf dem Server in `deploy/Caddyfile` das `#` vor der Zeile `Strict-Transport-Security` entfernen, dann:

```bash
cd /opt/paloskin && docker compose -f deploy/docker-compose.yml restart caddy
```

6. Vercel: eine Woche lang nichts ändern. Danach im Vercel-Projekt unter Settings, Domains die Domain entfernen und die Umgebungsvariablen löschen.

## 12. Rückweg zu Vercel

Solange die Domain bei Vercel nicht entfernt ist: bei GoDaddy die beiden Einträge auf die notierten Vercel-Werte zurücksetzen (`A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`) und die `AAAA`-Einträge löschen. Mit TTL 600 greift das in etwa zehn Minuten. Der Server kann weiterlaufen; `docker compose -f deploy/docker-compose.yml down` hält ihn an.

## 13. Später: Aktualisieren

Siehe Abschnitt 15.

## 14. Überwachung, schlank

- **Externer HTTPS-Monitor:** Vorschlag Better Stack (Betterstack Uptime, Sitz Prag, EU; kostenloser Tarif mit HTTPS-Checks, Heartbeat-Monitoren und E-Mail-Alarm). Alternative mit Sitz in der EU: UptimeRobot (Malta). Einrichtung: Konto mit accounts@paloskin.de, Monitor „HTTPS“ auf `https://www.paloskin.de/booking` (nach dem Umzug), Intervall 3 Minuten, Alarm per E-Mail an accounts@paloskin.de nach zwei Fehlversuchen.
- **Heartbeat vom Server:** Zweiter Monitor vom Typ „Heartbeat“ mit Erwartung alle 10 Minuten. Die URL in `/etc/paloskin/monitor.env` als `HEARTBEAT_URL=` eintragen (root, 0600). Das Skript `deploy/heartbeat.sh` prüft alle 5 Minuten Speicherplatz (Alarm ab 85 Prozent), Containerzustand und die Fehlerrate der Anwendung (ab 5 Fehlerzeilen in 10 Minuten) und sendet den Heartbeat nur bei gutem Zustand. Bleibt er aus, alarmiert der Monitor per E-Mail. Es werden nur Zähler ausgewertet, keine Inhalte. Cron einrichten:

```bash
sudo install -m 755 /opt/paloskin/deploy/heartbeat.sh /usr/local/bin/paloskin-heartbeat && echo '*/5 * * * * root /usr/local/bin/paloskin-heartbeat' | sudo tee /etc/cron.d/paloskin-heartbeat
```

- Ergebnis im Serverprotokoll: `journalctl -t paloskin-heartbeat --since today`.

## 15. Update-Ablauf

- **Dependabot** (`.github/dependabot.yml`) schlägt wöchentlich gebündelte Aktualisierungen für npm-Abhängigkeiten (Next.js, React, zod), das Basis-Image im Dockerfile und die Actions vor. Pull Requests nach Prüfung mergen; Typprüfung und Tests laufen lokal mit `npm run typecheck && npm test`.
- **Monatliches Neubauen:** Die Action baut das Image am 1. jedes Monats neu, damit Sicherheitsupdates des Basis-Images (`node:24-alpine`) einfließen, auch ohne Codeänderung.
- **Ausrollen auf den Server**, nach jedem gemergten Update oder spätestens monatlich:

```bash
cd /opt/paloskin && git pull && docker compose -f deploy/docker-compose.yml pull && docker compose -f deploy/docker-compose.yml up -d && docker image prune -f
```

- **Node-Hauptversion:** einmal jährlich im Oktober auf die aktuelle LTS (Dockerfile `node:XX-alpine`, `package.json` `engines`), zuerst lokal bauen und testen.
- **Betriebssystem:** Sicherheitsupdates automatisch (unattended-upgrades); einmal im Monat `sudo apt update && sudo apt -y upgrade` und bei `/var/run/reboot-required` ein Neustart in einer ruhigen Stunde.

## Was die Dateien tun

- `docker-compose.yml`: Image aus ghcr.io, App ohne Root (Benutzer 10001), Dateisystem schreibgeschützt mit tmpfs für `/tmp` und den Next.js-Cache, alle Capabilities entfernt, `no-new-privileges`, Begrenzung auf 640 MB, 1 CPU und 256 Prozesse, Healthcheck, Protokolle begrenzt. Caddy mit 80 und 443 (ohne HTTP/3), Zertifikate auf einem Volume. `docker-compose.build.yml` nur für den Notfall-Build auf dem Server.
- `daemon.json`: daemonweite Protokollgrenzen und `live-restore`. `heartbeat.sh`: Zustandsprüfung und Heartbeat an den Monitor.
- `Caddyfile`: Weiterleitung paloskin.de auf www, Reverse-Proxy zur App, nur Caddy setzt `X-Forwarded-For`, `Server`-Kopfzeile entfernt, HSTS vorbereitet.
- Sicherheitsheader (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) setzt die App in `next.config.ts`, getestet mit Produktionsbuild ohne CSP-Verstöße.
- `.dockerignore` schließt `.env*`, Schlüsseldateien, `.git`, `node_modules`, `.next` und `deploy` aus.
- Nicht lokal getestet: der Docker-Build selbst (kein Docker auf diesem Mac). Erster Lauf in Schritt 7.

## 16. Stufe 2: Buchungsdatenbank und Testinstanz (ab 2. Oktober 2026)

Die Buchung reserviert jetzt in einer SQLite-Datei auf dem Server; der Kalender ist nur noch die Sicht des Arztes. Der Container bleibt schreibgeschützt, nur das Datenbankverzeichnis ist beschreibbar eingebunden.

- **Verzeichnisse anlegen** (einmalig, Eigentümer ist der App-Benutzer 10001 im Container):

```bash
sudo install -d -m 700 -o 10001 -g 10001 /var/lib/paloskin /var/lib/paloskin-test
```

- **Testinstanz** `app-test`: gleiches Compose-File, Profil `test`, Image-Tag des Arbeitsbranches (Standard `stufe2`, änderbar mit `PALOSKIN_TEST_TAG`), eigene Datenbank unter `/var/lib/paloskin-test`, erreichbar nur über `neu.paloskin.de`. Sie nutzt dieselben Kalender wie die Seite, Testbuchungen erscheinen also als „TEST Palo Skin: …“ in „Palo Skin Termine“ und werden danach gelöscht (`scripts/google-cleanup.mjs`).

```bash
cd /opt/paloskin && git fetch && git checkout stufe2 && git pull && docker compose -f deploy/docker-compose.yml --profile test pull app-test && docker compose -f deploy/docker-compose.yml --profile test up -d app-test && docker compose -f deploy/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

- **Ausrollen nach bestandenem Test:** Branch `zonen` auf den Stand von `stufe2` bringen (Fast-Forward), dann wie in Abschnitt 15 (`git checkout zonen && git pull && … pull && … up -d`). Beim ersten Ausrollen bekommt der Container das Volume; die Datenbank wird beim ersten Zugriff angelegt (WAL-Modus, drei Dateien `buchung.sqlite`, `-wal`, `-shm`).
- **Testinstanz anhalten:** `docker compose -f deploy/docker-compose.yml --profile test stop app-test` (neu.paloskin.de antwortet dann mit 502).
- **Blick in die Datenbank ohne Kundendaten** (Anzahl Buchungen, Kalenderzustand, Ereignisse), aus dem Container heraus, nur lesend:

```bash
docker compose -f /opt/paloskin/deploy/docker-compose.yml exec app node -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(process.env.BOOKING_DB_PATH,{readOnly:true});console.log(db.prepare("select status, calendar_state, count(*) n from bookings where deleted_at is null group by 1,2").all(), db.prepare("select count(*) events, max(seq) last_seq from booking_events").get())'
```

- **Hintergrundlauf:** alle 5 Minuten im Serverprozess (Protokollzeile `calendar_retry`), holt fehlende Kalendereinträge nach. Bleibt ein Eintrag 24 Stunden offen, schreibt die App `ALARM …` ins Protokoll; der Heartbeat bleibt dann aus und der Monitor alarmiert.
- **Sicherung und Löschlauf:** folgen in Schritt 4 des Bauauftrags (`docs/STUFE-2-BAUAUFTRAG.md`). Bis dahin ist die Datei im täglichen Hetzner-Server-Backup enthalten.

## 17. Stufe 2, Schritt 2: Bestätigungsmail über den Google-Relay (2. Oktober 2026)

- **Relay in der Google-Admin-Konsole:** Apps, Google Workspace, Gmail, Routing, „SMTP-Relay-Dienst“: nur angegebene IP-Adressen, Eintrag 2.31.2.192 (bei Bedarf zusätzlich die IPv6-Adresse 2a01:4f8:1c16:71ba::1), TLS-Verschlüsselung erforderlich, keine SMTP-Authentifizierung, zulässige Absender nur eigene Domains. Der Hostname ist `smtp-relay.gmail.com` (nicht `smtp-relay.google.com`), Port 587, STARTTLS.
- **Umgebung** in `/etc/paloskin/paloskin.env` ergänzen (Vorlage `deploy/paloskin.env.example`): `MAIL_RELAY_HOST`, `MAIL_RELAY_PORT`, `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO`, `BOOKING_BINDING=false` und `LINK_SECRET`. Den Schlüssel direkt auf dem Server erzeugen, ohne ihn anzuzeigen:

```bash
printf 'LINK_SECRET=%s\n' "$(openssl rand -base64 32)" >> /etc/paloskin/paloskin.env
```

- **Testinstanz:** `deploy/.env` (nicht im Repository) mit `PALOSKIN_TEST_MAIL=<Testadresse>`; dann gehen alle Mails von neu.paloskin.de an diese Adresse, egal welche Adresse im Formular steht.
- **Probe von Hand**, falls der Relay ablehnt (die Antwortzeilen zeigen den Grund; wichtig ist `-4`, sonst meldet sich der Server über IPv6):

```bash
{ sleep 2; printf 'EHLO paloskin-1.paloskin.de\r\n'; sleep 1; printf 'QUIT\r\n'; sleep 1; } | openssl s_client -quiet -4 -starttls smtp -connect smtp-relay.gmail.com:587 2>&1 | grep -E '^[0-9]{3} '
```

- **Prüfen im Betrieb:** Protokollzeilen `mail_sent` und `mail_failed` (nur Buchungsnummer, Art und Fehlerklasse), Spalten `mail_confirmation_sent_at` und `mail_reminder_sent_at` in der Datenbank. Bleibt eine Bestätigung 24 Stunden aus, schreibt die App `ALARM Bestätigungsmail …` und der Heartbeat bleibt aus.
- **Schalter verbindliche Buchung:** erst nach der Abnahme `BOOKING_BINDING=true` in `paloskin.env` setzen und den Container neu starten (`docker compose -f deploy/docker-compose.yml up -d app`).

## 18. Stufe 2, Schritt 3: Endpunkt für das Kundensystem im privaten Netz (2. Oktober 2026)

- **Privates Netz:** Hetzner-Netzwerk `paloskin-intern` (10.0.0.0/24) in der Cloud-Konsole anlegen und den Server anbinden. Ubuntu bekommt die Adresse per DHCP von selbst (Prüfung: `ip -4 -brief addr` zeigt `enp7s0` mit 10.0.0.2, `ip -4 route` eine Route 10.0.0.0/24 über 10.0.0.1). Die Hetzner-Firewall wirkt nicht auf das private Netz.
- **UFW:** `sudo ufw allow from 10.0.0.0/24 to any port 8443 proto tcp`. Docker veröffentlicht 8443 ohnehin nur an 10.0.0.2 (Compose), von 2.31.2.192 aus wird die Verbindung abgewiesen.
- **Token** erzeugen, ohne es anzuzeigen, dann einmal in einem Terminal-Tab ablesen und dem CRM-Projekt übergeben:

```bash
printf 'INTERN_TOKEN=%s\n' "$(openssl rand -base64 32)" >> /etc/paloskin/paloskin.env
```

- **Caddy** lauscht nach `docker compose up -d` auch an 10.0.0.2:8443 mit einem Zertifikat der internen Zertifizierungsstelle für 10.0.0.2 und `buchung.intern`. Wurzelzertifikat exportieren und an paloskin-2 geben (nur über das private Netz, in das Home-Verzeichnis des dortigen Nutzers; die Übernahme in den Zielordner macht das CRM-Projekt, dort `docs/BETRIEB.md` Abschnitt 7; `<nutzername>` durch den Nutzer auf paloskin-2 ersetzen):

```bash
cd /opt/paloskin && docker compose -f deploy/docker-compose.yml cp caddy:/data/caddy/pki/authorities/local/root.crt /home/deploy/paloskin-intern-root.crt && scp /home/deploy/paloskin-intern-root.crt <nutzername>@10.0.0.3:/home/<nutzername>/paloskin-intern-root.crt
```

- Ein Hosts-Eintrag `10.0.0.2 buchung.intern` auf paloskin-2 ist optional; der Client des Kundensystems prüft den Namen über eine Einstellung.

- **Prüfung vom Server selbst** (Quelladresse 10.0.0.2 liegt im privaten Netz); das Token nur aus der Datei lesen:

```bash
TOKEN=$(grep '^INTERN_TOKEN=' /etc/paloskin/paloskin.env | cut -d= -f2-); curl -sS --cacert /home/deploy/paloskin-intern-root.crt -H "Authorization: Bearer $TOKEN" https://10.0.0.2:8443/intern/v1/health; unset TOKEN
```

- Erwartung: ohne Token 401, mit falschem Zertifikat lehnt curl ab (`--cacert` auf eine andere CA), von außen `curl https://2.31.2.192:8443` Verbindung abgewiesen, `https://www.paloskin.de/intern/v1/health` 404.
- **Testphase:** `PALOSKIN_INTERN_UPSTREAM=app-test:3000` in `deploy/.env` leitet den internen Block auf die Testinstanz; für den Betrieb die Zeile entfernen und Caddy neu erstellen (`up -d --force-recreate --no-deps caddy`).
- **Schema** für das CRM-Projekt: `docs/SCHNITTSTELLE-KUNDENSYSTEM.md`.

## 19. Stufe 2, Schritt 4: Löschlauf, Sicherung, Wiederherstellung (3. Oktober 2026)

- **Löschlauf und Kalenderexport** laufen in der App (ab 03:30 Uhr Berliner Zeit, Protokollzeilen `retention_run`, `calendar_exported`, `daily_run`). Exporte liegen unter `/var/lib/paloskin/export` (nur für den Benutzer 10001 lesbar; als root: `sudo ls /var/lib/paloskin/export`).
- **Sicherung einrichten** (einmalig, als deploy mit sudo):

```bash
sudo apt-get install -y sqlite3 && sudo install -d -m 700 -o root -g root /var/backups/paloskin && sudo install -m 755 /opt/paloskin/deploy/backup.sh /usr/local/bin/paloskin-backup && echo '45 3 * * * root /usr/local/bin/paloskin-backup' | sudo tee /etc/cron.d/paloskin-backup && sudo /usr/local/bin/paloskin-backup && sudo ls -l /var/backups/paloskin && journalctl -t paloskin-backup --since today --no-pager
```

- Nach jeder Änderung an `deploy/backup.sh` oder `deploy/heartbeat.sh`: `sudo install -m 755 … /usr/local/bin/…` wiederholen (Abschnitt 14).
- **Wiederherstellung** (Beispiel auf der Testinstanz; für www `app` statt `app-test` und `/var/lib/paloskin`):

```bash
cd /opt/paloskin && docker compose -f deploy/docker-compose.yml --profile test stop app-test && sudo sh -c 'gunzip -c /var/backups/paloskin/buchung-$(date +%F).sqlite.gz > /var/lib/paloskin-test/buchung.sqlite && rm -f /var/lib/paloskin-test/buchung.sqlite-wal /var/lib/paloskin-test/buchung.sqlite-shm && chown 10001:10001 /var/lib/paloskin-test/buchung.sqlite && chmod 644 /var/lib/paloskin-test/buchung.sqlite' && docker compose -f deploy/docker-compose.yml --profile test start app-test
```

- Danach Zahlen prüfen (Buchungen, letzte Ereignisnummer) mit dem Befehl aus Abschnitt 16; sie müssen dem Stand der Sicherung entsprechen. Die Datei `-wal` muss vor dem Start gelöscht sein, sonst mischt SQLite alte Schreibvorgänge hinein.
- **Hetzner-Server-Backup** enthält `/var/backups/paloskin` und `/var/lib/paloskin`; eine Wiederherstellung des ganzen Servers ist in Abschnitt 8 beschrieben.
