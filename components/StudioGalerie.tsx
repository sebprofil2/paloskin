"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Studiofotos zum Vergrößern (10. Oktober 2026). Die vier Fotos bleiben in Größe und Anordnung wie bisher, sind aber Knöpfe.
 * Antippen öffnet eine bildschirmfüllende Ansicht (natives <dialog>, dadurch bleibt der Fokus darin und Escape schließt):
 * Wischen, Pfeiltasten und Pfeilknöpfe blättern, „1 / 4“, Schließen-Knopf, Schließen auch durch Tippen neben das Foto.
 * Das große Foto ist die Originaldatei (1050 mal 1400 Pixel) und wird erst beim Öffnen geladen. Kein fremdes Skript,
 * keine Bibliothek, kein Cookie. Arabisch von rechts nach links: Blättern und Pfeile gespiegelt.
 */
export type GaleriePhoto = { img: StaticImageData; alt: string };
export type GalerieTexte = { zoomPhoto: string; closeView: string; prevPhoto: string; nextPhoto: string; photosView: string };

export function StudioGalerie({ photos, t, rtl }: { photos: GaleriePhoto[]; t: GalerieTexte; rtl: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const n = photos.length;

  const open = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    openerRef.current = e.currentTarget;
    setIndex(i);
    dialogRef.current?.showModal();
    closeRef.current?.focus();
  };
  const close = useCallback(() => dialogRef.current?.close(), []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    // Nach dem Schließen (Knopf, Escape, Tippen daneben): Fokus zurück auf das Foto, das geöffnet wurde
    const onClose = () => {
      setIndex(null);
      openerRef.current?.focus();
    };
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(rtl ? -1 : 1);
    else if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
    else return;
    e.preventDefault();
  };
  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - s.x;
    const dy = p.clientY - s.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    // Nach links wischen: nächstes Foto (bei Arabisch umgekehrt)
    step((dx < 0) !== rtl ? 1 : -1);
  };
  // Tippen neben das Foto schließt; Tippen auf Foto oder Knöpfe nicht
  const onClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (!el.closest("img, button")) close();
  };

  const cur = index === null ? null : photos[index];
  return (
    <>
      <div className="studio-grid">
        {photos.map((p, i) => (
          <figure key={p.alt}>
            <button type="button" className="studio-zoom" aria-label={`${t.zoomPhoto}: ${p.alt}`} aria-haspopup="dialog" onClick={(e) => open(i, e)}>
              <Image src={p.img} alt={p.alt} sizes="(max-width: 899px) 50vw, 160px" />
            </button>
          </figure>
        ))}
      </div>
      <dialog ref={dialogRef} className="galerie" aria-label={t.photosView} onKeyDown={onKey} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={onClick}>
        <div className="galerie-buehne">
          {cur ? (
            // Originaldatei in voller Auflösung, erst beim Öffnen geladen (kein Bildumweg über next/image)
            // eslint-disable-next-line @next/next/no-img-element
            <img key={cur.img.src} src={cur.img.src} width={cur.img.width} height={cur.img.height} alt={cur.alt} />
          ) : null}
        </div>
        <button ref={closeRef} type="button" className="galerie-zu" onClick={close} aria-label={t.closeView}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <button type="button" className="galerie-pfeil galerie-zurueck" onClick={() => step(-1)} aria-label={t.prevPhoto}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" className="galerie-pfeil galerie-vor" onClick={() => step(1)} aria-label={t.nextPhoto}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <p className="galerie-zahl" aria-live="polite"><bdi dir="ltr">{index === null ? "" : `${index + 1} / ${n}`}</bdi></p>
      </dialog>
    </>
  );
}
