"use client";

import { useEffect, useMemo, useState } from "react";
import type { SlotDay, Slot } from "@/lib/slots";
import { LANGS, TEXTS } from "@/lib/texts";
import { MAIL_TEXTS, WA_LINK } from "@/lib/texts-mail";
import type { Lang } from "@/lib/treatments";

/*
 * Neue Zeit wählen (Block 6): Tagesleiste und Uhrzeiten wie in der Buchung, dieselbe Dauer und Auswahl.
 * Lädt freie Zeiten über den signierten Link und schickt die Wahl an /api/termin/verschieben.
 */
interface Props {
  token: string;
  lang: Lang;
  currentDate: string;
  currentTime: string;
}

type Loaded = { status: "loading" } | { status: "ready"; days: SlotDay[] } | { status: "down" } | { status: "none" };
type Result = { status: "idle" | "sending" | "conflict" | "error" } | { status: "done"; start: string; calendar: { google: string; ics: string; outlook: string } };

const TZ = "Europe/Berlin";
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function RescheduleApp({ token, lang, currentDate, currentTime }: Props) {
  const l = MAIL_TEXTS[lang];
  const t = TEXTS[lang];
  const loc = LANGS.find((x) => x.id === lang)?.loc ?? "de-DE";
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [result, setResult] = useState<Result>({ status: "idle" });
  const [tick, setTick] = useState(0);

  const dfmt = useMemo(() => (key: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { ...o, timeZone: TZ }).format(new Date(`${key}T12:00:00Z`)), [loc]);
  const dayLabel = (key: string) => cap(dfmt(key, { weekday: "long", day: "numeric", month: "long" }));
  const dayWd = (key: string) => cap(dfmt(key, { weekday: "short" }).replace(/\.$/, ""));
  const dayN = (key: string) => dfmt(key, { day: "numeric" });

  useEffect(() => {
    let alive = true;
    setLoaded({ status: "loading" });
    fetch(`/api/termin/slots?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { days?: SlotDay[] };
        if (!alive) return;
        if (!res.ok || !data.days) return setLoaded({ status: "down" });
        const days = data.days;
        if (!days.some((d) => d.slots.length)) return setLoaded({ status: "none" });
        setLoaded({ status: "ready", days });
        setDay((prev) => prev && days.some((d) => d.date === prev) ? prev : days.find((d) => d.slots.length)!.date);
      })
      .catch(() => alive && setLoaded({ status: "down" }));
    return () => {
      alive = false;
    };
  }, [token, tick]);

  async function move() {
    if (!slot || result.status === "sending") return;
    setResult({ status: "sending" });
    try {
      const res = await fetch("/api/termin/verschieben", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, start: slot.start }), cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { status?: string; booking?: { start: string; calendar: { google: string; ics: string; outlook: string } } };
      if (res.ok && data.status === "rescheduled" && data.booking) {
        setResult({ status: "done", start: data.booking.start, calendar: data.booking.calendar });
        window.scrollTo({ top: 0 });
        return;
      }
      if (res.status === 409) {
        setResult({ status: "conflict" });
        setSlot(null);
        setTick((x) => x + 1);
        return;
      }
      setResult({ status: "error" });
    } catch {
      setResult({ status: "error" });
    }
  }

  if (result.status === "done") {
    const key = result.start.slice(0, 10);
    const time = result.start.slice(11, 16);
    return (
      <>
        <div className="confirm" style={{ padding: "28px 24px" }}>
          <p style={{ fontSize: 22, lineHeight: 1.3 }}>{l.rescheduledH(dayLabel(key), t.at(time))}</p>
          <p style={{ margin: 0 }}>{l.rescheduledP}</p>
        </div>
        <div className="after" style={{ gap: 14, paddingBottom: 0 }}>
          <p style={{ margin: 0, fontSize: 17 }}>{l.saveQ}</p>
          <div className="cal" style={{ marginTop: 0 }}>
            <a className="btn-ghost" href={result.calendar.google} target="_blank" rel="noopener" style={{ textAlign: "center" }}>{l.gcal}</a>
            <a className="btn-ghost" href={result.calendar.ics} style={{ textAlign: "center" }}>{l.ical}</a>
            <a className="btn-ghost" href={result.calendar.outlook} target="_blank" rel="noopener" style={{ textAlign: "center" }}>{l.ocal}</a>
          </div>
          <p className="hint" style={{ margin: 0 }}>{l.oldCalendarNote}</p>
          <a className="btn-ghost" href={`/termin/${token}`} style={{ textAlign: "center" }}>{l.pageTitle}</a>
        </div>
      </>
    );
  }

  let body: React.ReactNode;
  if (loaded.status === "loading") body = <p className="slots-wait">{l.rescheduleLoading}</p>;
  else if (loaded.status === "down") body = <div className="note">{l.rescheduleDown} <a href={WA_LINK} target="_blank" rel="noopener">WhatsApp</a></div>;
  else if (loaded.status === "none") body = <div className="note">{l.rescheduleNone} <a href={WA_LINK} target="_blank" rel="noopener">WhatsApp</a></div>;
  else {
    const days = loaded.days;
    const current = days.find((d) => d.date === day) ?? days[0];
    body = (
      <>
        <div className="days" role="group" aria-label={t.dayAria}>
          {days.map((d) => (
            <button key={d.date} type="button" className={`day ${d.holiday || !d.slots.length ? "closed" : ""}`} aria-pressed={d.date === current.date} onClick={() => { setDay(d.date); setSlot(null); }}>
              <div className="w">{dayWd(d.date)}</div>
              <div className="n">{dayN(d.date)}</div>
            </button>
          ))}
        </div>
        <div>
          <div className="lbl" style={{ marginBottom: 10 }}>{dayLabel(current.date)}</div>
          {current.slots.length ? (
            <div className="slots">
              {current.slots.map((s) => (
                <button key={s.start} type="button" className="slot" aria-pressed={slot?.start === s.start} onClick={() => setSlot(s)}>{s.time}</button>
              ))}
            </div>
          ) : (
            <div className="note"><strong>{t.fullT}</strong>{t.fullP}</div>
          )}
        </div>
        {slot ? (
          <button type="button" className="primary" disabled={result.status === "sending"} onClick={move}>{l.rescheduleBtn(dayLabel(slot.start.slice(0, 10)), t.at(slot.time))}</button>
        ) : null}
      </>
    );
  }

  return (
    <div className="page" style={{ gap: 18, paddingTop: 0 }}>
      <p style={{ margin: 0, fontSize: 17 }}>{l.rescheduleP(currentDate, currentTime)}</p>
      {result.status === "conflict" ? <div className="missing">{l.rescheduleGone}</div> : null}
      {result.status === "error" ? <div className="missing">{l.rescheduleDown}</div> : null}
      {body}
    </div>
  );
}
