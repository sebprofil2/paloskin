/* Umgebungsvariablen an einer Stelle gelesen. Kein Schlüssel verlässt den Server. */
export interface Env {
  engine: "mock" | "google";
  testMode: boolean;
  testCode: string;
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
}

function int(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function readEnv(): Env {
  const busy = (process.env.CALENDAR_BUSY_IDS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const bookings = (process.env.CALENDAR_BOOKINGS_ID ?? "").trim();
  if (bookings && !busy.includes(bookings)) busy.push(bookings);
  return {
    engine: process.env.BOOKING_ENGINE === "google" ? "google" : "mock",
    testMode: process.env.TEST_MODE === "true",
    testCode: (process.env.TEST_ACCESS_CODE ?? "").trim(),
    stepMinutes: int(process.env.SLOT_STEP_MINUTES, 30),
    bufferMinutes: process.env.BUFFER_MINUTES === undefined ? 0 : int(process.env.BUFFER_MINUTES, 0),
    mockDown: process.env.BOOKING_MOCK_DOWN === "true",
    google: {
      serviceAccountEmail: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "").trim(),
      // Vercel speichert Zeilenumbrüche je nach Eingabe als \n: beide Formen zulassen
      privateKey: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
      calendarOpenId: (process.env.CALENDAR_OPEN_ID ?? "").trim(),
      calendarBookingsId: bookings,
      calendarBusyIds: busy,
    },
    ownerWebhookUrl: (process.env.OWNER_WEBHOOK_URL ?? "").trim(),
  };
}
