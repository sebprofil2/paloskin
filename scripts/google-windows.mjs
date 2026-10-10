/* Zwei Testfenster „Offen“ in „PALO SKIN offen“ anlegen: morgen und übermorgen, 10 bis 18 Uhr Berliner Zeit */
import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1).replace(/'\\''/g, "'"); env[m[1]] = v; }
const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
const jwt = new JWT({ email: sa.client_email, key: sa.private_key, scopes: ["https://www.googleapis.com/auth/calendar"] });
const OPEN = env.CALENDAR_OPEN_ID;
const berlinKey = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
for (const days of [1, 2]) {
  const key = berlinKey(new Date(Date.now() + days * 86400000));
  const { token } = await jwt.getAccessToken();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(OPEN)}/events?sendUpdates=none`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ summary: "Offen", start: { dateTime: `${key}T10:00:00`, timeZone: "Europe/Berlin" }, end: { dateTime: `${key}T18:00:00`, timeZone: "Europe/Berlin" } }),
  });
  const text = await res.text();
  console.log(`${key} 10:00 bis 18:00: ${res.ok ? "angelegt" : "NICHT angelegt, HTTP " + res.status + " " + (JSON.parse(text).error?.message ?? "")}`);
}
