/* Wird einmal beim Start des Servers ausgeführt (Node-Laufzeit), nicht beim Bauen. Startet die Hintergrundläufe. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startBackgroundJobs } = await import("./lib/jobs");
  startBackgroundJobs();
}
