import { readFileSync } from "node:fs";

/* Umgebungsvariablen an einer Stelle gelesen. Kein Schlüssel verlässt den Server. */
export interface Env {
  engine: "mock" | "google";
  testMode: boolean;
  testCode: string;
  /** Signaturschlüssel für das Testzugangs-Cookie; Wechsel widerruft alle Cookies */
  testCookieSecret: string;
  stepMinutes: number;
  bufferMinutes: number;
  mockDown: boolean;
  google: {
    serviceAccountEmail: string;
    privateKey: string;
    calendarOpenId: string;
    calendarBookingsId: string;
    calendarBusyIds: string[];
  };
  ownerWebhookUrl: string;
  /** X-Forwarded-For nur vom eigenen Proxy (Caddy) übernehmen */
  trustProxy: boolean;
  /** SQLite-Datei der Buchung (Stufe 2), auf dem Server /var/lib/paloskin/buchung.sqlite */
  dbPath: string;
  /** Verbindliche Buchung (confirmed) statt Terminanfrage (requested); erst nach der Abnahme einschalten */
  bookingBinding: boolean;
}

function int(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/*
 * Dienstkonto: entweder die komplette Schlüsseldatei in GOOGLE_SERVICE_ACCOUNT_JSON
 * oder getrennt GOOGLE_SERVICE_ACCOUNT_EMAIL und GOOGLE_PRIVATE_KEY.
 */
function serviceAccount(): { email: string; key: string } {
  let raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "").trim();
  // Auf dem eigenen Server liegt die Schlüsseldatei als Secret außerhalb von Repository und Image; hier steht nur der Pfad
  const file = (process.env.GOOGLE_SERVICE_ACCOUNT_FILE ?? "").trim();
  if (!raw && file) {
    try {
      raw = readFileSync(file, "utf8").trim();
    } catch {
      console.error("[env] GOOGLE_SERVICE_ACCOUNT_FILE nicht lesbar");
    }
  }
  if (raw) {
    try {
      const j = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (j.client_email && j.private_key) return { email: j.client_email, key: j.private_key };
    } catch {
      console.error("[env] GOOGLE_SERVICE_ACCOUNT_JSON ist kein gültiges JSON");
    }
  }
  return {
    email: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "").trim(),
    // Vercel speichert Zeilenumbrüche je nach Eingabe als \n: beide Formen zulassen
    key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
  };
}

export function readEnv(): Env {
  const sa = serviceAccount();
  const busy = (process.env.CALENDAR_BUSY_IDS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const bookings = (process.env.CALENDAR_BOOKINGS_ID ?? "").trim();
  if (bookings && !busy.includes(bookings)) busy.push(bookings);
  return {
    engine: process.env.BOOKING_ENGINE === "google" ? "google" : "mock",
    // Standard ist Testbetrieb: erst TEST_MODE=false schaltet die echte Buchung für alle frei
    testMode: process.env.TEST_MODE !== "false",
    testCode: (process.env.TEST_ACCESS_CODE ?? "").trim(),
    testCookieSecret: (process.env.TEST_COOKIE_SECRET ?? "").trim(),
    stepMinutes: int(process.env.SLOT_STEP_MINUTES, 30),
    bufferMinutes: process.env.BUFFER_MINUTES === undefined ? 0 : int(process.env.BUFFER_MINUTES, 0),
    mockDown: process.env.BOOKING_MOCK_DOWN === "true",
    google: {
      serviceAccountEmail: sa.email,
      privateKey: sa.key,
      calendarOpenId: (process.env.CALENDAR_OPEN_ID ?? "").trim(),
      calendarBookingsId: bookings,
      calendarBusyIds: busy,
    },
    ownerWebhookUrl: (process.env.OWNER_WEBHOOK_URL ?? "").trim(),
    trustProxy: process.env.TRUST_PROXY === "true",
    dbPath: (process.env.BOOKING_DB_PATH ?? "").trim() || ".data/buchung.sqlite",
    bookingBinding: process.env.BOOKING_BINDING === "true",
  };
}
