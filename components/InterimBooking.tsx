import { loadInterim } from "@/lib/interim";

/* Zwischenlösung unverändert ausliefern: Stile, Oberfläche und Skripte aus content/booking-interim.html */
export async function InterimBooking() {
  const { style, body } = await loadInterim();
  return (
    <>
      <link rel="stylesheet" href="/assets/site.css" />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `<style>${style}</style>${body}` }} />
    </>
  );
}
