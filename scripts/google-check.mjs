/*
 * Testlauf der Google-Anbindung ohne die Anwendung: Kalenderliste, frei/belegt, Probetermin.
 * Aufruf: node scripts/google-check.mjs [list|slots|event|open-id]
 * Liest .env.local. Gibt nie Schlüsselinhalte aus.
 */
import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1).replace(/'\\''/g, "'");
  env[m[1]] = v;
}
const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
const jwt = new JWT({ email: sa.client_email, key: sa.private_key, scopes: ["https://www.googleapis.com/auth/calendar"] });
const API = "https://www.googleapis.com/calendar/v3";
async function call(method, path, body) {
  const { token } = await jwt.getAccessToken();
  const res = await fetch(API + path, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
const BOOKINGS = env.CALENDAR_BOOKINGS_ID;
const BUSY = env.CALENDAR_BUSY_IDS.split(",").map((x) => x.trim()).filter(Boolean);
const mode = process.argv[2] ?? "list";

if (mode === "list" || mode === "open-id") {
  const list = await call("GET", "/users/me/calendarList?minAccessRole=freeBusyReader");
  const items = list.items ?? [];
  if (mode === "open-id") {
    const open = items.find((c) => c.summary === "Palo Skin offen");
    console.log(open ? open.id : "");
  } else {
    console.log("Kalenderliste des Dienstkontos:");
    for (const c of items) console.log(` - ${c.summary} | ${c.id} | Recht: ${c.accessRole}`);
    if (!items.length) console.log(" (leer: freigegebene Kalender müssen einmal in die Liste des Dienstkontos aufgenommen werden)");
  }
}

if (mode === "add-open") {
  // Freigegebenen Kalender in die Liste des Dienstkontos aufnehmen, Kennung als Argument
  const id = process.argv[3];
  const r = await call("POST", "/users/me/calendarList", { id });
  console.log(`aufgenommen: ${r.summary} | ${r.id} | Recht: ${r.accessRole}`);
}

if (mode === "busy") {
  const from = new Date(); const to = new Date(Date.now() + 7 * 86400000);
  const r = await call("POST", "/freeBusy", { timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: "Europe/Berlin", items: BUSY.map((id) => ({ id })) });
  for (const id of BUSY) {
    const c = r.calendars?.[id];
    console.log(`frei/belegt ${id}: ${c?.errors ? "FEHLER " + JSON.stringify(c.errors) : (c?.busy?.length ?? 0) + " belegte Zeiträume"}`);
    for (const b of c?.busy ?? []) console.log(`    ${b.start} bis ${b.end}`);
  }
}

if (mode === "event") {
  const start = new Date(Date.now() + 3 * 86400000); start.setUTCHours(8, 0, 0, 0);
  const end = new Date(start.getTime() + 20 * 60000);
  const created = await call("POST", `/calendars/${encodeURIComponent(BOOKINGS)}/events?sendUpdates=none`, {
    summary: "Palo Skin: Test", description: "Probetermin der Anbindung, wird sofort wieder gelöscht.",
    start: { dateTime: start.toISOString(), timeZone: "Europe/Berlin" }, end: { dateTime: end.toISOString(), timeZone: "Europe/Berlin" },
    transparency: "opaque", extendedProperties: { private: { requestId: "probe-" + Date.now(), source: "paloskin-check" } },
  });
  console.log(`eingetragen: "${created.summary}" ${created.start.dateTime} bis ${created.end.dateTime} | Kennung ${created.id} | Status ${created.status}`);
  const fetched = await call("GET", `/calendars/${encodeURIComponent(BOOKINGS)}/events/${encodeURIComponent(created.id)}`);
  console.log(`gelesen:     "${fetched.summary}" ${fetched.start.dateTime} | Organisator ${fetched.organizer?.email ?? "?"}`);
  await call("DELETE", `/calendars/${encodeURIComponent(BOOKINGS)}/events/${encodeURIComponent(created.id)}?sendUpdates=none`);
  const after = await call("GET", `/calendars/${encodeURIComponent(BOOKINGS)}/events/${encodeURIComponent(created.id)}`).catch((e) => ({ status: "fehler " + e.message.slice(0, 40) }));
  console.log(`gelöscht:    Status danach "${after.status}"`);
}
