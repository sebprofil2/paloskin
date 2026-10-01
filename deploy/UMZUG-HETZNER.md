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

## 2. Server bei Hetzner bestellen

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

## 3. Erster Login und Grundschutz

1. Verbinden (beim ersten Mal die Frage „Are you sure you want to continue connecting“ mit `yes` beantworten):

```bash
ssh -i ~/.ssh/id_ed25519_paloskin root@<SERVER-IP>
```

Erwartet: eine Zeile, die mit `root@paloskin-1:~#` endet. Alle folgenden Blöcke in diesem Abschnitt laufen auf dem Server.

2. System aktualisieren (dauert einige Minuten):

```bash
apt update && apt -y upgrade
```

3. Benutzer `deploy` anlegen. Es wird nach einem Passwort gefragt: ein langes wählen und sicher ablegen (wird für `sudo` gebraucht, nicht zum Anmelden). Die Fragen nach Name und Telefon mit Enter überspringen.

```bash
adduser deploy
```

```bash
usermod -aG sudo deploy
```

4. Ihren SSH-Schlüssel für `deploy` übernehmen:

```bash
mkdir -p /home/deploy/.ssh && cp /root/.ssh/authorized_keys /home/deploy/.ssh/ && chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
```

5. Root-Login und Passwort-Login abschalten:

```bash
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/; s/^#\?KbdInteractiveAuthentication.*/KbdInteractiveAuthentication no/' /etc/ssh/sshd_config && systemctl restart ssh
```

6. Wichtig: Diese root-Sitzung offen lassen. Auf dem Mac ein zweites Terminalfenster öffnen und prüfen, dass der neue Zugang funktioniert:

```bash
ssh -i ~/.ssh/id_ed25519_paloskin deploy@<SERVER-IP>
```

Erwartet: `deploy@paloskin-1:~$`. Erst wenn das klappt, die root-Sitzung mit `exit` schließen. Ab jetzt immer als `deploy` anmelden; Befehle mit `sudo` fragen einmal das Passwort von `deploy` ab.

7. Firewall auf dem Server (zusätzlich zur Hetzner-Firewall) und automatische Sicherheitsupdates:

```bash
sudo ufw default deny incoming && sudo ufw default allow outgoing && sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp && sudo ufw --force enable
```

```bash
sudo apt -y install unattended-upgrades fail2ban && sudo dpkg-reconfigure -plow unattended-upgrades
```

Bei der Rückfrage „Automatically download and install stable updates?“ mit Ja antworten.

```bash
sudo timedatectl set-timezone Europe/Berlin
```

## 4. Docker installieren

Auf dem Server als `deploy`:

```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh
```

```bash
sudo usermod -aG docker deploy
```

Danach einmal abmelden und neu anmelden, damit die Gruppe gilt:

```bash
exit
```

```bash
ssh -i ~/.ssh/id_ed25519_paloskin deploy@<SERVER-IP>
```

Prüfen:

```bash
docker compose version
```

Erwartet: `Docker Compose version v2.…`.

Hinweis: Docker veröffentlicht Ports an UFW vorbei. Deshalb hat der App-Dienst in `deploy/docker-compose.yml` keinen `ports`-Eintrag; nur Caddy öffnet 80 und 443.

## 5. Code vom Branch „zonen“ auf den Server

```bash
sudo mkdir -p /opt/paloskin && sudo chown deploy:deploy /opt/paloskin && git clone --branch zonen https://github.com/sebprofil2/paloskin.git /opt/paloskin
```

Erwartet: am Ende keine Fehlermeldung, `ls /opt/paloskin` zeigt unter anderem `Dockerfile`, `deploy`, `public`.

## 6. Dienstkontoschlüssel und Umgebungsvariablen

1. Auf dem Mac, in einem eigenen Terminalfenster (nicht auf dem Server): Schlüsseldatei hochladen.

```bash
scp -i ~/.ssh/id_ed25519_paloskin ~/Downloads/palo-skin-buchung-1a5f1b62d06a.json deploy@<SERVER-IP>:/home/deploy/service-account.json
```

2. Auf dem Server: an den endgültigen Ort verschieben, nur root darf lesen.

```bash
sudo mkdir -p /etc/paloskin && sudo mv /home/deploy/service-account.json /etc/paloskin/service-account.json && sudo chown root:root /etc/paloskin/service-account.json && sudo chmod 600 /etc/paloskin/service-account.json && sudo chmod 700 /etc/paloskin
```

Prüfen:

```bash
sudo ls -l /etc/paloskin/
```

Erwartet: `-rw------- 1 root root … service-account.json`.

3. Umgebungsvariablen anlegen: Vorlage kopieren und ausfüllen. Es öffnet sich der Editor nano; `TEST_ACCESS_CODE=` mit dem Testcode füllen (16 Zeichen aus dem Terminal auf dem Mac), die Kalenderkennungen sind schon eingetragen. Speichern mit Strg+O, Enter, verlassen mit Strg+X.

```bash
sudo cp /opt/paloskin/deploy/paloskin.env.example /etc/paloskin/paloskin.env && sudo chmod 600 /etc/paloskin/paloskin.env && sudo nano /etc/paloskin/paloskin.env
```

Werte in der Datei:

| Variable | Wert |
|---|---|
| `BOOKING_ENGINE` | `google` |
| `TEST_MODE` | `true` |
| `TEST_ACCESS_CODE` | der Testcode |
| `SLOT_STEP_MINUTES` | `30` |
| `BUFFER_MINUTES` | `0` |
| `CALENDAR_OPEN_ID` | bleibt wie in der Vorlage |
| `CALENDAR_BOOKINGS_ID` | bleibt |
| `CALENDAR_BUSY_IDS` | bleibt |
| `TRUST_PROXY` | `true` |
| `OWNER_WEBHOOK_URL` | leer |

Der Schlüsselpfad `GOOGLE_SERVICE_ACCOUNT_FILE` steht fest in `docker-compose.yml` und zeigt auf das Secret; in der Umgebungsdatei steht kein Schlüssel.

## 7. Start

Auf dem Server:

```bash
cd /opt/paloskin && docker compose -f deploy/docker-compose.yml up -d --build
```

Der erste Build dauert drei bis fünf Minuten. Danach:

```bash
docker compose -f deploy/docker-compose.yml ps
```

Erwartet: `app` mit Status `running (healthy)`, `caddy` mit `running`. Falls `app` nicht healthy wird:

```bash
docker compose -f deploy/docker-compose.yml logs --tail 50 app
```

Caddy meldet in dieser Phase Fehler beim Zertifikat, weil die Domain noch auf Vercel zeigt. Das ist erwartet und verschwindet nach Schritt 11.

## 8. Test über die Server-IP, vor der DNS-Umstellung

Auf dem Mac. Der Parameter `--resolve` tut so, als zeige www.paloskin.de schon auf den Server; `-k` ignoriert das noch fehlende Zertifikat.

Startseite, Erwartet `200`:

```bash
curl -sk --resolve www.paloskin.de:443:<SERVER-IP> -o /dev/null -w "%{http_code}\n" https://www.paloskin.de/
```

Impressum, Datenschutz, Buchung (je `200`):

```bash
for p in /impressum /datenschutz /booking; do curl -sk --resolve www.paloskin.de:443:<SERVER-IP> -o /dev/null -w "$p %{http_code}\n" "https://www.paloskin.de$p"; done
```

Weiterleitung `/termine` auf `/booking`, Erwartet `308` und `Location: https://www.paloskin.de/booking`:

```bash
curl -sk --resolve www.paloskin.de:443:<SERVER-IP> -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.paloskin.de/termine
```

Falsche Adresse, Erwartet `404`:

```bash
curl -sk --resolve www.paloskin.de:443:<SERVER-IP> -o /dev/null -w "%{http_code}\n" https://www.paloskin.de/gibtsnicht
```

Schrift mit Cache-Regel, Erwartet `200` und `max-age=31536000`:

```bash
curl -sk --resolve www.paloskin.de:443:<SERVER-IP> -D - -o /dev/null https://www.paloskin.de/assets/fonts/SchibstedGrotesk-Variable.woff2 | grep -i "HTTP/\|cache-control"
```

Sicherheitsheader, Erwartet Zeilen mit `content-security-policy`, `x-content-type-options`, `x-frame-options`, `referrer-policy`:

```bash
curl -sk --resolve www.paloskin.de:443:<SERVER-IP> -D - -o /dev/null https://www.paloskin.de/booking | grep -i "content-security\|x-content\|x-frame\|referrer"
```

Buchung im Browser: Auf dem Mac die Datei `/etc/hosts` vorübergehend ergänzen (`sudo nano /etc/hosts`, Zeile `<SERVER-IP> www.paloskin.de paloskin.de`), dann in Safari https://www.paloskin.de/booking/zugang öffnen, die Zertifikatswarnung bestätigen, Testcode eingeben, eine Buchung mit erfundenem Namen durchführen, den Eintrag im Google-Kalender „Palo Skin Termine“ prüfen und löschen. Die Zeile aus `/etc/hosts` danach wieder entfernen.

## 9. Was Sie zusätzlich prüfen sollten

- Sprachen: Startseite mit `?lang=en` und Buchung mit `?lang=fr` öffnen.
- Handyansicht: Safari, Entwicklermenü, „Responsive Design Mode“, iPhone wählen.
- Protokoll auf dem Server ohne Kundendaten: `docker compose -f deploy/docker-compose.yml logs --tail 20 app` zeigt nur JSON-Zeilen mit Ereignis, Zeit und Kennungen.

## 10. Caddy-Zertifikat vorbereiten

Nichts zu tun. Sobald DNS auf den Server zeigt, holt Caddy das Zertifikat selbst (ein bis zwei Minuten).

## 11. DNS bei GoDaddy umstellen

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

```bash
cd /opt/paloskin && git pull && docker compose -f deploy/docker-compose.yml up -d --build
```

## Was die Dateien tun

- `docker-compose.yml`: App ohne Root (Benutzer 10001), Dateisystem schreibgeschützt mit tmpfs für `/tmp` und den Next.js-Cache, alle Capabilities entfernt, `no-new-privileges`, Begrenzung auf 768 MB, 1 CPU und 256 Prozesse, Healthcheck, Protokolle begrenzt. Caddy mit 80 und 443, Zertifikate auf einem Volume.
- `Caddyfile`: Weiterleitung paloskin.de auf www, Reverse-Proxy zur App, nur Caddy setzt `X-Forwarded-For`, `Server`-Kopfzeile entfernt, HSTS vorbereitet.
- Sicherheitsheader (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) setzt die App in `next.config.ts`, getestet mit Produktionsbuild ohne CSP-Verstöße.
- `.dockerignore` schließt `.env*`, Schlüsseldateien, `.git`, `node_modules`, `.next` und `deploy` aus.
- Nicht lokal getestet: der Docker-Build selbst (kein Docker auf diesem Mac). Erster Lauf in Schritt 7.
