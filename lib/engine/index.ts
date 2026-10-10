import { readEnv } from "../env";
import { GoogleCalendarEngine } from "./google";
import { MockEngine } from "./mock";
import type { BookingEngine } from "./types";

/* Auswahl über BOOKING_ENGINE=mock|google. Eine Instanz je Prozess. */
let instance: BookingEngine | null = null;

export function getEngine(): BookingEngine {
  const wanted = readEnv().engine;
  if (!instance || instance.name !== wanted) instance = wanted === "google" ? new GoogleCalendarEngine() : new MockEngine();
  return instance;
}

export * from "./types";
