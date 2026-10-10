/** Gerätetyp grob aus dem User-Agent, ohne ihn zu speichern. */
export function deviceFrom(userAgent: string | null | undefined): "mobile" | "desktop" {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent ?? "") ? "mobile" : "desktop";
}
