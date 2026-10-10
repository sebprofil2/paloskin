/*
 * Alle Werte von cancel_reason an einer Stelle (Liste mit Bedeutung in docs/SCHNITTSTELLE-KUNDENSYSTEM.md):
 *   customer_link          Kunde über die Terminseite, mehr als 24 Stunden vor dem Termin
 *   customer_short_notice  Kunde über „Leider verhindert“, 24 bis 2 Stunden vor dem Termin
 *   studio_calendar        Studio hat den Eintrag im Kalender „PALO SKIN Termine“ gelöscht
 *   crm:studio_cancelled   Kundensystem über POST /intern/v1/bookings/{id}/status
 */
export const CANCEL_REASON = {
  customerLink: "customer_link",
  customerShortNotice: "customer_short_notice",
  studioCalendar: "studio_calendar",
} as const;

/** Absage über die Terminseite: Grund nach dem Fenster zum Zeitpunkt der Absage. */
export function linkCancelReason(window: "open" | "short"): string {
  return window === "short" ? CANCEL_REASON.customerShortNotice : CANCEL_REASON.customerLink;
}

/** Absage durch das Kundensystem: fester Bezeichner mit dem Präfix crm:. */
export function crmCancelReason(reason: "studio_cancelled"): string {
  return `crm:${reason}`;
}

/** Absagen durch den Kunden lösen die Sofort-Mail an das Studio aus. */
export function isCustomerCancel(reason: string): boolean {
  return reason === CANCEL_REASON.customerLink || reason === CANCEL_REASON.customerShortNotice;
}
