/*
 * Änderungen des Studios im Kalender „Palo Skin Termine“ nachstellen (Prüfung des Abgleichs, lib/calendar-sync.ts):
 *   node scripts/google-studio.mjs list                      künftige Einträge: Zeiten, Buchungsnummer, TEST oder echt
 *   node scripts/google-studio.mjs show <Nummer>             Eintrag zur Buchungsnummer
 *   node scripts/google-studio.mjs extend <Nummer> [Minuten] nur das Ende verlängern (Vorgabe 20)
 *   node scripts/google-studio.mjs move <Nummer> [Minuten]   Beginn und Ende um Minuten verschieben (Vorgabe 60)
 *   node scripts/google-studio.mjs delete <Nummer>           Eintrag löschen
 * Keine Kundendaten in der Ausgabe.
 */
import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1).replace(/'\\''/g, "'"); env[m[1]] = v; }
const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
const jwt = new JWT({ email: sa.client_email, key: sa.private_key, scopes: ["https://www.googleapis.com/auth/calendar"] });
// CAL_ID wählt einen anderen Kalender, zum Beispiel den Testkalender „Palo Skin Test“
const CAL = encodeURIComponent(process.env.CAL_ID || env.CALENDAR_BOOKINGS_ID);
async function call(method, path, body) {
  const { token } = await jwt.getAccessToken();
  const r = await fetch("https://www.googleapis.com/calendar/v3" + path, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return null;
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t);
}
const line = (e) => `${e.start?.dateTime} bis ${e.end?.dateTime} | ${e.extendedProperties?.private?.bookingRef ?? "ohne Nummer"} | ${(e.summary ?? "").startsWith("TEST") ? "TEST" : "echt"} | Kennung ${e.id}`;
const [mode = "list", ref, minutes] = process.argv.slice(2);
if (mode === "list") {
  const q = new URLSearchParams({ singleEvents: "true", orderBy: "startTime", timeMin: new Date().toISOString(), maxResults: "50" });
  const r = await call("GET", `/calendars/${CAL}/events?${q}`);
  for (const e of r.items ?? []) console.log(line(e));
  process.exit(0);
}
const q = new URLSearchParams({ singleEvents: "true", maxResults: "5", privateExtendedProperty: `bookingRef=${ref}` });
const e = ((await call("GET", `/calendars/${CAL}/events?${q}`)).items ?? []).find((x) => x.status !== "cancelled");
if (!e) { console.log("kein Eintrag"); process.exit(1); }
console.log(line(e));
const patch = (body) => call("PATCH", `/calendars/${CAL}/events/${encodeURIComponent(e.id)}?sendUpdates=none`, body);
const startMs = Date.parse(e.start.dateTime);
const endMs = Date.parse(e.end.dateTime);
if (mode === "extend") { const end = new Date(endMs + Number(minutes ?? 20) * 60000); await patch({ end: { dateTime: end.toISOString() } }); console.log(`Ende auf ${end.toISOString()} gesetzt`); }
if (mode === "move") { const start = new Date(startMs + Number(minutes ?? 60) * 60000); const end = new Date(start.getTime() + (endMs - startMs)); await patch({ start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } }); console.log(`Verschoben auf ${start.toISOString()} bis ${end.toISOString()}`); }
if (mode === "delete") { await call("DELETE", `/calendars/${CAL}/events/${encodeURIComponent(e.id)}?sendUpdates=none`); console.log("gelöscht"); }
