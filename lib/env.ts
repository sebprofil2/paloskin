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
  /** Ordner für den nächtlichen Kalenderexport; leer heißt Unterordner export neben der Datenbank */
  exportDir: string;
  /** Verbindliche Buchung (confirmed) statt Terminanfrage (requested); erst nach der Abnahme einschalten */
  bookingBinding: boolean;
  /** Öffentliche Adresse der Seite für Links in Mails, ohne Schrägstrich am Ende */
  publicBaseUrl: string;
  /** Signaturschlüssel der Terminlinks; leer heißt abgeleitet aus dem Cookie-Schlüssel */
  linkSecret: string;
  /** Empfänger der täglichen Handliste für WhatsApp-Erinnerungen; leer heißt keine Liste */
  ownerMail: string;
  /** Bearer-Token des Endpunkts für das Kundensystem (privates Netz); leer heißt Endpunkt aus */
  internToken: string;
  mail: {
    /** relay: über SMTP-Relay senden; file: in eine Datei neben der Datenbank schreiben (Entwicklung); off: nichts senden */
    mode: "relay" | "file" | "off";
    host: string;
    port: number;
    from: string;
    fromName: string;
    replyTo: string;
    /** Testinstanz: alle Mails an diese Adresse statt an den Kunden */
    redirectTo: string;
  };
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
    // Zeilenumbrüche im Schlüssel als echte Umbrüche oder als \n: beide Formen zulassen
    key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
  };
}

function mailMode(): "relay" | "file" | "off" {
  const m = (process.env.MAIL_MODE ?? "").trim();
  if (m === "relay" || m === "file" || m === "off") return m;
  return (process.env.MAIL_RELAY_HOST ?? "").trim() ? "relay" : "off";
}

export function readEnv(): Env {
  const sa = serviceAccount();
  const busy = (process.env.CALENDAR_BUSY_IDS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  let bookings = (process.env.CALENDAR_BOOKINGS_ID ?? "").trim();
  if (bookings && !busy.includes(bookings)) busy.push(bookings);
  let openId = (process.env.CALENDAR_OPEN_ID ?? "").trim();
  // Testinstanz: nur der Testkalender, für Fenster, Belegung und Einträge. Die Kalender der Produktion werden nie gelesen.
  if ((process.env.PALOSKIN_INSTANCE ?? "").trim() === "test") {
    const testCal = (process.env.TEST_CALENDAR_ID ?? "").trim();
    bookings = testCal;
    openId = testCal;
    busy.length = 0;
    if (testCal) busy.push(testCal);
  }
  return {
    engine: process.env.BOOKING_ENGINE === "google" ? "google" : "mock",
    // Standard ist Produktion (öffentlich, seit 4. Oktober 2026). Testbetrieb nur mit TEST_MODE=true oder auf der Testinstanz
    testMode: process.env.TEST_MODE === "true" || (process.env.PALOSKIN_INSTANCE ?? "").trim() === "test",
    testCode: (process.env.TEST_ACCESS_CODE ?? "").trim(),
    testCookieSecret: (process.env.TEST_COOKIE_SECRET ?? "").trim(),
    stepMinutes: int(process.env.SLOT_STEP_MINUTES, 30),
    bufferMinutes: process.env.BUFFER_MINUTES === undefined ? 0 : int(process.env.BUFFER_MINUTES, 0),
    mockDown: process.env.BOOKING_MOCK_DOWN === "true",
    google: {
      serviceAccountEmail: sa.email,
      privateKey: sa.key,
      calendarOpenId: openId,
      calendarBookingsId: bookings,
      calendarBusyIds: busy,
    },
    ownerWebhookUrl: (process.env.OWNER_WEBHOOK_URL ?? "").trim(),
    trustProxy: process.env.TRUST_PROXY === "true",
    dbPath: (process.env.BOOKING_DB_PATH ?? "").trim() || ".data/buchung.sqlite",
    exportDir: (process.env.CALENDAR_EXPORT_DIR ?? "").trim(),
    bookingBinding: process.env.BOOKING_BINDING === "true",
    publicBaseUrl: ((process.env.PUBLIC_BASE_URL ?? "").trim() || "https://www.paloskin.de").replace(/\/+$/, ""),
    linkSecret: (process.env.LINK_SECRET ?? "").trim(),
    internToken: (process.env.INTERN_TOKEN ?? "").trim(),
    ownerMail: (process.env.OWNER_MAIL ?? "").trim(),
    mail: {
      mode: mailMode(),
      host: (process.env.MAIL_RELAY_HOST ?? "").trim(),
      port: int(process.env.MAIL_RELAY_PORT, 587),
      from: (process.env.MAIL_FROM ?? "").trim() || "bookings@paloskin.de",
      fromName: (process.env.MAIL_FROM_NAME ?? "").trim() || "PALO SKIN by Dr. Vogel",
      replyTo: (process.env.MAIL_REPLY_TO ?? "").trim() || "bookings@paloskin.de",
      redirectTo: (process.env.MAIL_REDIRECT_TO ?? "").trim(),
    },
  };
}
