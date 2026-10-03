#!/bin/bash
# Alle 5 Minuten per Cron: prüft Speicherplatz, Container und Fehlerrate und sendet nur bei gutem Zustand
# einen Heartbeat an den externen Monitor. Bleibt der Heartbeat aus, alarmiert der Monitor per E-Mail.
# Keine Kundendaten: es werden nur Zähler und Zustände geprüft.
# Konfiguration: /etc/paloskin/monitor.env mit HEARTBEAT_URL=https://... (root, 0600); der Cron läuft deshalb als root.
set -u
ENV_FILE=/etc/paloskin/monitor.env
[ -f "$ENV_FILE" ] && . "$ENV_FILE"
COMPOSE="docker compose -f /opt/paloskin/deploy/docker-compose.yml"
PROBLEMS=()

# 1. Speicherplatz: Alarm ab 85 Prozent Belegung auf /
USE=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "${USE:-0}" -ge 85 ] && PROBLEMS+=("disk ${USE}%")

# 2. Container laufen und App ist healthy
STATE=$($COMPOSE ps --format '{{.Service}} {{.State}} {{.Health}}' 2>/dev/null)
echo "$STATE" | grep -q '^app running healthy' || PROBLEMS+=("app nicht healthy")
echo "$STATE" | grep -q '^caddy running' || PROBLEMS+=("caddy nicht running")

# 3. Fehlerrate der Anwendung in den letzten 10 Minuten (JSON-Zeilen mit level error, ohne Inhalte)
APP_LOG=$($COMPOSE logs --since 10m app 2>/dev/null)
ERRORS=$(printf '%s\n' "$APP_LOG" | grep -c '"level":"error"')
[ "${ERRORS:-0}" -ge 5 ] && PROBLEMS+=("${ERRORS} Fehler in 10 Minuten")

# 4. Nächtliche Sicherung vorhanden und jünger als 26 Stunden (sobald die erste Sicherung lief)
if [ -d /var/backups/paloskin ] && ls /var/backups/paloskin/buchung-*.sqlite.gz >/dev/null 2>&1; then
  FRESH=$(find /var/backups/paloskin -name 'buchung-*.sqlite.gz' -mmin -1560 | wc -l)
  [ "${FRESH:-0}" -ge 1 ] || PROBLEMS+=("Sicherung älter als 26 Stunden")
fi

# 5. Dauerhafter Alarm der Anwendung (zum Beispiel Kalendereintrag seit 24 Stunden offen): kein Heartbeat, bis er behoben ist
ALARMS=$(printf '%s\n' "$APP_LOG" | grep -c '"event":"ALARM')
[ "${ALARMS:-0}" -ge 1 ] && PROBLEMS+=("Alarm der Anwendung")

if [ ${#PROBLEMS[@]} -eq 0 ]; then
  SENT="kein Monitor konfiguriert"
  if [ -n "${HEARTBEAT_URL:-}" ]; then
    if curl -fsS -m 10 -o /dev/null "$HEARTBEAT_URL"; then SENT="Heartbeat gesendet"; else SENT="Heartbeat FEHLGESCHLAGEN"; fi
  fi
  logger -t paloskin-heartbeat "ok (disk ${USE}%, Fehler ${ERRORS:-0}), ${SENT}"
else
  logger -t paloskin-heartbeat "PROBLEM: ${PROBLEMS[*]}"
fi
