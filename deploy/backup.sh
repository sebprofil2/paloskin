#!/bin/bash
# Nächtliche Sicherung der Buchungsdatenbank (Stufe 2, Abschnitt 4): täglich 03:45 Uhr als root per Cron.
# sqlite3 .backup liest konsistent, auch während die App schreibt (WAL). Ablage unter /var/backups/paloskin,
# gepackt, nur root lesbar, 14 Tage aufbewahrt. Der Ordner liegt im täglichen Hetzner-Server-Backup.
# Zusätzlich wird der jüngste Kalenderexport der App (ICS, 30 Tage) mitgesichert.
set -u
SRC=/var/lib/paloskin/buchung.sqlite
EXPORTS=/var/lib/paloskin/export
DEST=/var/backups/paloskin
KEEP_DAYS=14
STAMP=$(date +%F)
umask 077
mkdir -p "$DEST"
if [ ! -f "$SRC" ]; then logger -t paloskin-backup "FEHLER: $SRC fehlt"; exit 1; fi
TMP="$DEST/buchung-$STAMP.sqlite.tmp"
if sqlite3 "$SRC" ".backup '$TMP'" && sqlite3 "$TMP" "PRAGMA integrity_check;" | grep -qx ok; then
  gzip -f "$TMP" && mv -f "$TMP.gz" "$DEST/buchung-$STAMP.sqlite.gz"
  SIZE=$(stat -c %s "$DEST/buchung-$STAMP.sqlite.gz")
  logger -t paloskin-backup "ok: buchung-$STAMP.sqlite.gz ($SIZE Byte)"
else
  rm -f "$TMP" "$TMP.gz"
  logger -t paloskin-backup "FEHLER: Sicherung oder Prüfung fehlgeschlagen"
  exit 1
fi
LATEST_ICS=$(ls -1t "$EXPORTS"/palo-skin-termine-*.ics 2>/dev/null | head -1)
[ -n "$LATEST_ICS" ] && cp -f "$LATEST_ICS" "$DEST/" && chmod 600 "$DEST/$(basename "$LATEST_ICS")"
find "$DEST" -name 'buchung-*.sqlite.gz' -mtime +$KEEP_DAYS -delete
find "$DEST" -name 'palo-skin-termine-*.ics' -mtime +30 -delete
exit 0
