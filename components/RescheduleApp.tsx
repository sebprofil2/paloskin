"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BILDER } from "@/lib/bilder";
import type { SlotDay, Slot } from "@/lib/slots";
import { LANGS, TEXTS } from "@/lib/texts";
import { ADDRESS, MAIL_TEXTS, MAPS_LINK, WA_LINK } from "@/lib/texts-mail";
import type { Lang } from "@/lib/treatments";

/*
 * Neue Zeit wählen (Block 6), seit 10. Oktober 2026 im Design der Buchung (Entwurf B, Schritt 2): Tageskarten mit
 * Wochenpfeilen, Zeitknöpfe, Knopf unten, blaue Bestätigungskarte. Gleiche Stilklassen wie die Buchung (app/design/design.css),
 * die Buchung selbst bleibt unverändert. Logik wie bisher: freie Zeiten über den signierten Link (/api/termin/slots),
 * Verschieben über /api/termin/verschieben; dieselbe Dauer, Anschlusszeiten wie beim Buchen.
 */
interface Props {
  token: string;
  lang: Lang;
  /** ?lang=, wenn die Seite in einer anderen Sprache als die Buchung läuft */
  langQuery?: string;
  currentDate: string;
  currentTime: string;
}

type Loaded = { status: "loading" } | { status: "ready"; days: SlotDay[] } | { status: "down" } | { status: "none" };
type Result = { status: "idle" | "sending" | "conflict" | "error" | "unavailable" | "missing" } | { status: "done"; start: string; calendar: { google: string; ics: string; outlook: string } };

const TZ = "Europe/Berlin";
/* Großbuchstabe am Anfang nach den Regeln der Sprache (Türkisch: i wird İ) */
const cap = (t: string, loc: string) => t.charAt(0).toLocaleUpperCase(loc) + t.slice(1);
const keyToNoon = (key: string) => new Date(`${key}T12:00:00Z`);

export function RescheduleApp({ token, lang, langQuery = "", currentDate, currentTime }: Props) {
  const l = MAIL_TEXTS[lang];
  const t = TEXTS[lang];
  const loc = LANGS.find((x) => x.id === lang)?.loc ?? "de-DE";
  const comma = lang === "ar" ? "،" : ",";
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [weekShift, setWeekShift] = useState(0);
  const [result, setResult] = useState<Result>({ status: "idle" });
  const [tick, setTick] = useState(0);

  const dfmt = useMemo(() => (key: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { ...o, timeZone: TZ }).format(keyToNoon(key)), [loc]);
  const dayLabel = (key: string) => cap(dfmt(key, { weekday: "long", day: "numeric", month: "long" }), loc);
  const dayN = (key: string) => Number(key.slice(8));
  /* Uhrzeit wie in der Buchung ohne führende Null („7:30 Uhr“) */
  const timeLabel = (hhmm: string) => t.at(hhmm.replace(/^0(\d):/, "$1:"));

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
        setDay((prev) => (prev && days.some((d) => d.date === prev) ? prev : days.find((d) => d.slots.length)!.date));
      })
      .catch(() => alive && setLoaded({ status: "down" }));
    return () => {
      alive = false;
    };
  }, [token, tick]);

  async function move() {
    if (result.status === "sending") return;
    if (!slot) {
      setResult({ status: "missing" });
      return;
    }
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
      if (res.status === 503 && data.status === "unavailable") {
        setResult({ status: "unavailable" });
        return;
      }
      setResult({ status: "error" });
    } catch {
      setResult({ status: "error" });
    }
  }

  const heading = (
    <h1 className="h2">
      {l.rsHA} <em>{l.rsHB}</em>
    </h1>
  );

  /* ---------- Bestätigung im Stil der Buchung: blaue Karte, Kalender-Knöpfe, Hinweis zum alten Kalendereintrag ---------- */
  if (result.status === "done") {
    const key = result.start.slice(0, 10);
    const time = result.start.slice(11, 16);
    return (
      <>
        <div className="bk-done">
          <section className="donecard">
            <h2 className="h2">{l.rsDoneH}</h2>
            <p style={{ marginTop: "var(--sp-12)" }}>{l.rescheduledP}</p>
            <dl>
              <dt>{t.sumWhen}</dt>
              <dd>{dayLabel(key)}{comma} {timeLabel(time)}</dd>
              <dt>{t.addrL}</dt>
              <dd><bdi>PALO SKIN by Dr. Vogel</bdi><br /><bdi>{ADDRESS}</bdi><br /><a href={MAPS_LINK} target="_blank" rel="noopener">{t.mapL}</a></dd>
            </dl>
            <p>{l.saveQ}</p>
            <div className="cal">
              <a className="btn light" href={result.calendar.google} target="_blank" rel="noopener">{l.gcal} <span aria-hidden="true">↗</span></a>
              <a className="btn light" href={result.calendar.ics}>{l.ical} <span aria-hidden="true">↓</span></a>
              <a className="btn light" href={result.calendar.outlook} target="_blank" rel="noopener">{l.ocal} <span aria-hidden="true">↗</span></a>
            </div>
          </section>
          <div className="after">
            <div className="fcard">
              <div className="zeit" style={{ marginTop: 0 }}><p>{l.oldCalendarNote}</p></div>
              <p style={{ paddingBottom: "var(--sp-24)" }}><a className="btn ghost" href={`/termin/${token}${langQuery}`}>{l.pageTitle}</a></p>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ---------- Hinweise mit Lösung ---------- */
  const unavailable = (() => {
    // Der Satzteil „per WhatsApp“ (je Sprache wie in der Buchung) wird zum Link
    const text = l.rescheduleUnavailable;
    const part = t.noSlotLink;
    const i = text.indexOf(part);
    if (i < 0) return text;
    return <>{text.slice(0, i)}<a href={WA_LINK} target="_blank" rel="noopener">{part}</a>{text.slice(i + part.length)}</>;
  })();
  const notice =
    result.status === "conflict" ? <div className="missing" role="alert">{l.rescheduleGone}</div>
    : result.status === "error" ? <div className="missing" role="alert">{l.rescheduleDown}</div>
    : result.status === "unavailable" ? <div className="missing" role="alert">{unavailable}</div>
    : result.status === "missing" ? <div className="missing" role="alert">{t.eSlot}</div>
    : null;

  /* ---------- Tageskarten und Uhrzeiten wie in Schritt 2 der Buchung ---------- */
  let body: React.ReactNode;
  if (loaded.status === "loading") body = <p className="wait" aria-live="polite">{t.loading}</p>;
  else if (loaded.status === "down") body = <div className="alert" role="alert">{l.rescheduleDown} <a href={WA_LINK} target="_blank" rel="noopener">WhatsApp</a></div>;
  else if (loaded.status === "none") body = <div className="alert">{l.rescheduleNone} <a href={WA_LINK} target="_blank" rel="noopener">WhatsApp</a></div>;
  else {
    const days = loaded.days;
    const current = days.find((d) => d.date === day) ?? days[0];
    /* Wochen ab Montag; gezeigt wird die Woche des gewählten Tages, mit den Pfeilen eine Woche vor oder zurück */
    const monday = (key: string) => {
      const d = keyToNoon(key);
      const wd = (d.getUTCDay() + 6) % 7;
      return new Date(d.getTime() - wd * 86400000).toISOString().slice(0, 10);
    };
    const addDays = (key: string, n: number) => new Date(keyToNoon(key).getTime() + n * 86400000).toISOString().slice(0, 10);
    const firstWeek = monday(days[0].date);
    const lastWeek = monday(days[days.length - 1].date);
    let week = addDays(monday(current.date), weekShift * 7);
    if (week < firstWeek) week = firstWeek;
    if (week > lastWeek) week = lastWeek;
    const keys = Array.from({ length: 7 }, (_, i) => addDays(week, i));
    const byKey = new Map(days.map((d) => [d.date, d]));
    const times = current.holiday ? (
      <div className="alert"><b>{t.closed}</b>{t.holiday}</div>
    ) : current.slots.length ? (
      <div className="opts times">
        {current.slots.map((s) => (
          <label key={s.start} className="ch">
            <input type="radio" name="zeit" checked={slot?.start === s.start} onChange={() => { setSlot(s); if (result.status === "missing" || result.status === "conflict") setResult({ status: "idle" }); }} />
            <span><bdi>{timeLabel(s.time)}</bdi></span>
          </label>
        ))}
      </div>
    ) : (
      <div className="alert"><b>{t.fullT}</b>{t.fullP}</div>
    );
    body = (
      <>
        <fieldset className="grp">
          <div className="dayhead">
            {/* Nur Monat und Jahr: „Oder Tag wählen“ passt hier nicht, weil kein Vorschlag „Nächster freier Termin“ darüber steht */}
            <p>{cap(dfmt(keys[0], { month: "long", year: "numeric" }), loc)}</p>
            <div className="arrows">
              <button className="arr" type="button" aria-label={t.prevWeek} disabled={week <= firstWeek} onClick={() => setWeekShift((w) => w - 1)}><span aria-hidden="true">‹</span></button>
              <button className="arr" type="button" aria-label={t.nextWeek} disabled={week >= lastWeek} onClick={() => setWeekShift((w) => w + 1)}><span aria-hidden="true">›</span></button>
            </div>
          </div>
          <div className="days" role="radiogroup" aria-label={t.dayAria}>
            {keys.map((k) => {
              const d = byKey.get(k);
              const closed = !d || d.holiday || !d.slots.length;
              return (
                <label key={k} className={`ch day ${d && closed ? "closed" : ""}`}>
                  <input
                    type="radio"
                    name="tag"
                    checked={k === current.date}
                    disabled={!d}
                    aria-label={`${dayLabel(k)}${d?.holiday ? `${comma} ${t.closedAria}` : ""}`}
                    onChange={() => { setWeekShift(0); setDay(k); setSlot(null); }}
                  />
                  <span>
                    <span className="wd">{cap(dfmt(k, { weekday: "long" }), loc)}</span>
                    <span className="nr">{dayN(k)}</span>
                    <span className="mo">{dfmt(k, { month: "long" })}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="grp">
          <legend>{t.timesFor(dayLabel(current.date))}</legend>
          {times}
        </fieldset>
      </>
    );
  }

  /* Bisheriger Termin: auf dem Handy oben in der Karte, am Computer rechts in der Seitenkarte (wie „Ihre Buchung“) */
  const bisher = (
    <>
      <b>{l.rsCurrentL}</b>
      <p className="rs-when">{currentDate}{comma} {currentTime}</p>
      <p>{l.rsKeepP}</p>
    </>
  );
  const ready = loaded.status === "ready";
  return (
    <>
      {heading}
      <div className="bk-grid">
        <section className="fcard" id="sec-slot">
          <div className="zeit rs-top" style={{ marginTop: 0 }}>{bisher}</div>
          {notice}
          {body}
          {ready ? (
            <div className="nav">
              <div className="end">
                <button className="btn" type="button" disabled={result.status === "sending"} aria-busy={result.status === "sending"} onClick={move}>{l.reschedule}</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingBottom: "var(--sp-24)" }} />
          )}
        </section>
        <aside className="sum rs-side" aria-label={l.rsCurrentL}>
          <div className="rs-bisher">{bisher}</div>
          <div className="doc">
            <Image src={BILDER.portraetRund} alt="Dr. med. Sebastian Vogel" width={60} height={60} />
            <div><b><bdi>Dr. med. Sebastian Vogel</bdi></b><span>{t.docRole}</span></div>
          </div>
        </aside>
      </div>
    </>
  );
}
