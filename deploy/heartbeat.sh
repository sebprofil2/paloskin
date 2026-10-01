#!/bin/bash
# Alle 5 Minuten per Cron: prüft Speicherplatz, Container und Fehlerrate und sendet nur bei gutem Zustand
# einen Heartbeat an den externen Monitor. Bleibt der Heartbeat aus, alarmiert der Monitor per E-Mail.
# Keine Kundendaten: es werden nur Zähler und Zustände geprüft.
# Konfiguration: /etc/paloskin/monitor.env mit HEARTBEAT_URL=https://...
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
ERRORS=$($COMPOSE logs --since 10m app 2>/dev/null | grep -c '"level":"error"')
[ "${ERRORS:-0}" -ge 5 ] && PROBLEMS+=("${ERRORS} Fehler in 10 Minuten")

if [ ${#PROBLEMS[@]} -eq 0 ]; then
  [ -n "${HEARTBEAT_URL:-}" ] && curl -fsS -m 10 -o /dev/null "$HEARTBEAT_URL"
  logger -t paloskin-heartbeat "ok (disk ${USE}%, Fehler ${ERRORS:-0})"
else
  logger -t paloskin-heartbeat "PROBLEM: ${PROBLEMS[*]}"
fi
