# Umzug auf einen Hetzner-Server (Vorbereitung, noch nichts ausgeführt)

Stand: 1. Oktober 2026. Ziel: dieselbe Anwendung wie auf Vercel, in Docker, hinter Caddy mit automatischem HTTPS.

## Server

- Hetzner Cloud, Standort Nürnberg oder Falkenstein (Deutschland), kleinster Typ reicht (zum Beispiel CX22, 2 vCPU, 4 GB).
- Ubuntu 24.04, Docker Engine mit Compose-Plugin, ufw mit nur 22, 80 und 443 offen, unattended-upgrades aktiv.
- Hetzner Firewall zusätzlich auf 22, 80, 443 beschränken; SSH nur mit Schlüssel.

## Schritte

1. DNS bei GoDaddy: A-Einträge für `paloskin.de` und `www.paloskin.de` auf die Server-IPv4, AAAA auf die IPv6. TTL vorher auf 300 Sekunden senken. Die Vercel-Einträge erst entfernen, wenn der Server läuft.
2. Repository auf den Server klonen (`git clone https://github.com/sebprofil2/paloskin.git /opt/paloskin`), Branch mit der Next.js-Buchung auschecken.
3. Umgebungsvariablen nach `/etc/paloskin/paloskin.env` (Vorlage `deploy/paloskin.env.example`), Rechte `chmod 600`.
4. Start: `docker compose -f deploy/docker-compose.yml up -d --build`. Caddy holt die Zertifikate, sobald DNS auf den Server zeigt.
5. Prüfen: `https://www.paloskin.de/`, `/impressum`, `/datenschutz`, `/booking` (ohne Code Zwischenlösung, mit `?test=` die Buchung), `/termine` leitet auf `/booking`, `/404`-Seite, Schriften laden von `/assets/fonts`.
6. Aktualisierung später: `git pull` und `docker compose -f deploy/docker-compose.yml up -d --build`.

## Dockerfile, geprüft

- Mehrstufig (Abhängigkeiten, Build, Laufzeit), Laufzeitbild `node:24-alpine` ohne Build-Werkzeuge, eigener Benutzer `app`.
- `output: "standalone"` in `next.config.ts`; kopiert werden `.next/standalone`, `.next/static`, `public` und `content` (Zwischenlösung).
- `.dockerignore` schließt `.env*`, `node_modules`, `.next` und `.git` aus, kein Schlüssel landet im Bild.
- `wget` für den Healthcheck ist in Alpine enthalten.
- Nicht lokal getestet, weil auf diesem Rechner kein Docker installiert ist. Erster Test auf dem Server mit `docker compose build`.

## Caddy statt nginx

Caddy, weil Zertifikate und Erneuerung ohne weitere Werkzeuge laufen und die Konfiguration kurz bleibt (`deploy/Caddyfile`). nginx bräuchte zusätzlich certbot und einen Erneuerungs-Timer.

## Unterschiede zu Vercel

- Keine Region-Einstellung nötig, der Server steht in Deutschland.
- Die Begrenzung pro Anschluss und die Mock-Buchungen leben im Speicher des einen Prozesses, auf dem Server also stabil über die Zeit (auf Vercel je Instanz).
- Protokolle: `docker compose logs app` zeigt auch die Meldungen „[PALO SKIN MELDUNG]“ bei unklaren Buchungsausgängen.
- Datenschutzerklärung Abschnitt 2 (Hosting) auf Hetzner Online GmbH, Gunzenhausen, umschreiben, Auftragsverarbeitungsvertrag mit Hetzner abschließen (im Hetzner-Konto abrufbar).
