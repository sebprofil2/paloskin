# PALO SKIN Website

Für alle Texte gilt der Sprachleitfaden in docs/SPRACHLEITFADEN.md, extern und intern: Website, Buchung, Terminseite, Kundenmails, Kalendereinträge, Übersetzungen, Studio-Mails, Tageslisten, Studio-Kalendereinträge, interne Seiten, Hinweise und Fehlermeldungen. Jeden neuen oder geänderten Text vorher daran prüfen.

Bestehende Texte und Gestaltung (Festlegung Dr. Vogel, 10. Oktober 2026):
- Die Buchungsseite (alle Schritte, Bestätigung, Terminseite, Verschieben) wird nicht angefasst, weder Texte noch Gestaltung. Ausnahme nur auf ausdrücklichen Auftrag von Dr. Vogel.
- Die Startseite darf gegen den Sprachleitfaden überarbeitet werden, aber jede Änderung erst als Vorschlag mit Bildern, dann nach Freigabe.
- Alle anderen bestehenden Texte werden nur nach ausdrücklicher Freigabe geändert. Prüflisten mit Vorschlägen sind erwünscht.
- Keine großgeschriebenen Etiketten über Überschriften (Sprachleitfaden, Form 3). Auf der Startseite in allen Sprachen entfernt (10. Oktober 2026); die Buchungsseite bleibt davon unberührt.

Weiterleitung /wallet: absichtlich unverlinkte 302-Weiterleitung zum Wallet-Pass (paloskin.de, www und neu, auch /wallet/). Steht in deploy/Caddyfile im Baustein „wallet“; das Ziel bei Bedarf dort ändern. Nirgends verlinken, nicht in die Sitemap. Nach einer Änderung an deploy/Caddyfile auf dem Server Caddy neu erstellen (docker compose -f deploy/docker-compose.yml up -d --force-recreate caddy), ein Neuladen allein sieht die neue Datei nicht.

Weiterleitung /oysters: unverlinkte, vorübergehende 302-Weiterleitung zur Einladung für die Eröffnung am 24. Oktober 2026 (paloskin.de, www und neu, auch /oysters/), Ziel https://oysters-and-botox.netlify.app. Steht im selben Caddy-Baustein „wallet“ und wird nach dem Event wieder entfernt.
