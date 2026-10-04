#!/bin/bash
# Alle 5 Minuten per Cron: prüft Speicherplatz, Container, Fehlerrate, Sicherung und Hintergrundläufe und sendet nur bei gutem Zustand
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

# 4. Nächtliche Sicherung vorhanden und jünger als 26 Stunden. Fehlt sie ganz, ist das ebenfalls ein Alarm.
FRESH=$(find /var/backups/paloskin -name 'buchung-*.sqlite.gz' -mmin -1560 2>/dev/null | wc -l)
if ! ls /var/backups/paloskin/buchung-*.sqlite.gz >/dev/null 2>&1; then
  PROBLEMS+=("keine Sicherung vorhanden")
elif [ "${FRESH:-0}" -lt 1 ]; then
  PROBLEMS+=("Sicherung älter als 26 Stunden")
fi

# 4a. Hintergrundläufe der Anwendung: letzter vollständiger Durchgang, letzter erfolgreicher Kalenderabgleich und
#     überfällige Arbeiten (Kalender, Bestätigungsmails, Studio-Mails älter als 30 Minuten). Eine erreichbare Seite
#     allein beweist nicht, dass die Läufe arbeiten. Gelesen wird nur die Datenbank, ohne Kundendaten.
STATE_OUT=$($COMPOSE exec -T app node --input-type=module - 2>/dev/null <<'NODE'
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(process.env.BOOKING_DB_PATH, { readOnly: true });
const meta = (k) => db.prepare("SELECT value FROM meta WHERE key = ?").get(k)?.value ?? null;
const age = (v) => (v ? Math.round((Date.now() - Date.parse(v)) / 60000) : null);
const out = [];
const tick = age(meta("jobs_tick_at"));
if (tick === null || tick > 15) out.push(`Hintergrundlauf seit ${tick ?? "unbekannt"} Minuten nicht durchgelaufen`);
if (process.env.BOOKING_ENGINE === "google") {
  const sync = age(meta("calendar_sync_ok_at"));
  if (sync === null || sync > 20) out.push(`Kalenderabgleich seit ${sync ?? "unbekannt"} Minuten nicht erfolgreich`);
}
const limit = new Date(Date.now() - 30 * 60000).toISOString();
const now = new Date().toISOString();
const n = (sql, ...a) => db.prepare(sql).get(...a).n;
const cal = n("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND calendar_state <> 'written' AND COALESCE(calendar_pending_at, created_at) < ?", limit);
const conf = n("SELECT COUNT(*) AS n FROM bookings WHERE deleted_at IS NULL AND status <> 'cancelled' AND mail_confirmation_sent_at IS NULL AND starts_at > ? AND COALESCE(rescheduled_at, created_at) < ?", now, limit);
const studio = n("SELECT COUNT(*) AS n FROM studio_mails WHERE sent_at IS NULL AND created_at < ?", limit);
if (cal) out.push(`${cal} Kalendereinträge überfällig`);
if (conf) out.push(`${conf} Bestätigungsmails überfällig`);
if (studio) out.push(`${studio} Studio-Mails überfällig`);
console.log(out.length ? out.join("; ") : "OK");
NODE
)
case "$STATE_OUT" in
  OK) ;;
  "") PROBLEMS+=("Zustand der Anwendung nicht lesbar") ;;
  *) PROBLEMS+=("$STATE_OUT") ;;
esac

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
