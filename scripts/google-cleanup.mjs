/* Testbuchungen im Kalender „Palo Skin Termine“ anzeigen und löschen: node scripts/google-cleanup.mjs [show|delete] [Buchungsnummer] */
import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1).replace(/'\\''/g, "'"); env[m[1]] = v; }
const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
const jwt = new JWT({ email: sa.client_email, key: sa.private_key, scopes: ["https://www.googleapis.com/auth/calendar"] });
const CAL = encodeURIComponent(env.CALENDAR_BOOKINGS_ID);
async function call(method, path) { const { token } = await jwt.getAccessToken(); const r = await fetch("https://www.googleapis.com/calendar/v3" + path, { method, headers: { authorization: `Bearer ${token}` } }); if (r.status === 204) return null; const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`); return JSON.parse(t); }
const [mode = "show", ref] = process.argv.slice(2);
const q = new URLSearchParams({ singleEvents: "true", orderBy: "startTime", timeMin: new Date().toISOString(), maxResults: "50" });
if (ref) q.set("privateExtendedProperty", `bookingRef=${ref}`); else q.set("privateExtendedProperty", "status=confirmed");
const list = await call("GET", `/calendars/${CAL}/events?${q}`);
for (const e of list.items ?? []) {
  console.log(`\n${e.summary} | ${e.start?.dateTime} bis ${e.end?.dateTime} | ${e.transparency ?? "opaque"} | Kennung ${e.id}`);
  console.log((e.description ?? "").split("\n").map((l) => "   " + l).join("\n"));
  if (mode === "delete") { await call("DELETE", `/calendars/${CAL}/events/${encodeURIComponent(e.id)}?sendUpdates=none`); console.log("   -> gelöscht"); }
}
if (!(list.items ?? []).length) console.log("keine Testbuchungen gefunden");
