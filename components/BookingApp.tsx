"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SlotDay } from "@/lib/slots";
import { LANGS, TEXTS, type Texts } from "@/lib/texts";
import { CONSULT_LANGS, defaultConsult, isConsultLang, langDir, type ConsultLang } from "@/lib/i18n";
import Image from "next/image";
import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import type { KopfTexte } from "@/lib/kopf";
import { BILDER } from "@/lib/bilder";
import { bewertungPille } from "@/lib/bewertungen";
import { checkPhone } from "@/lib/phone";
import { PRICES, ZONE_IDS, hasBotulinum, hasTreatment, totalPrice, zoneCount, zonePrice, type Lachs, type Lang, type Selection, type Visit, type ZoneId } from "@/lib/treatments";
import { LogoKopf } from "@/components/LogoKopf";

/* ---------- Feste Angaben ---------- */
const PHONE = "+49 151 58872566";
const PHONE_TEL = "tel:+4915158872566";
const ADDRESS = "Hagenauer Straße 14, 10435 Berlin";
/* Google-Unternehmensprofil (Ersatz: https://maps.google.com/?cid=16946433859280785681) */
const MAPS = "https://maps.app.goo.gl/c3KoXo6d9YU5P2wy8";
const WA = "https://wa.me/4915158872566";
const TZ = "Europe/Berlin";
/* Notizfeld erst mit der eigenen Ablage (Stufe 2): im Kalender steht keine Notiz */
const NOTE_ENABLED = false;
const THOUSANDS: Record<Lang, string> = { de: ".", en: ",", es: ".", fr: "\u00A0", pt: ".", it: ".", tr: ".", uk: "\u00A0", ar: "," };

type Step = 1 | 2 | 3;
type ErrorKey = keyof Texts;

interface Form {
  vorname: string;
  nachname: string;
  handy: string;
  email: string;
  empfohlen: string;
  consent: boolean;
  reminder: boolean;
}

interface Slot {
  start: string;
  time: string;
}

interface State {
  /** Beratungssprache; solange nicht angetippt, gilt die Seitensprache als Vorauswahl (wenn sie eine der fünf ist) */
  consult: ConsultLang | null;
  consultTouched: boolean;
  persons: 1 | 2;
  step: Step;
  maxStep: Step;
  visit: Visit | null;
  beratung: boolean;
  zoneIds: ZoneId[];
  otherOn: boolean;
  otherText: string;
  zonesUnknown: boolean;
  kaumuskel: boolean;
  nefertiti: boolean;
  achsel: boolean;
  lachs: Lachs | null;
  note: string;
  noteOpen: boolean;
  open: { bot: boolean; boost: boolean };
  day: string | null;
  slot: Slot | null;
  f: Form;
  errors: Partial<Record<string, ErrorKey>>;
  refSent: boolean;
}

interface Booking {
  ref: string;
  requestId: string;
  start: string;
  end: string;
  durationMinutes: number;
  /** verbindlich gebucht (Schalter BOOKING_BINDING) oder Terminanfrage */
  binding?: boolean;
  manageUrl?: string;
  calendar?: { google: string; ics: string; outlook: string };
  /** mehr als 24 Stunden bis zum Termin: Verschieben und Absagen über den Link */
  canManage?: boolean;
}

type SlotsState = { status: "idle" | "loading" | "ready" | "down"; days: SlotDay[]; durationMinutes: number | null; key: string };
type BookState = { status: "idle" | "sending" | "error" | "unavailable" | "conflict" | "pending" } | { status: "done"; booking: Booking };

const blank = (checkup: boolean): State => ({
  consult: null,
  consultTouched: false,
  persons: 1,
  step: checkup ? 2 : 1,
  maxStep: checkup ? 2 : 1,
  visit: null,
  beratung: false,
  zoneIds: [],
  otherOn: false,
  otherText: "",
  zonesUnknown: false,
  kaumuskel: false,
  nefertiti: false,
  achsel: false,
  lachs: null,
  note: "",
  noteOpen: false,
  open: { bot: false, boost: false },
  day: null,
  slot: null,
  f: { vorname: "", nachname: "", handy: "", email: "", empfohlen: "", consent: false, reminder: false },
  errors: {},
  refSent: false,
});

function toSelection(s: State, checkup: boolean): Selection {
  return {
    persons: checkup ? 1 : s.persons, // Kontrolltermin nur allein
    visit: s.visit,
    checkup,
    beratung: s.beratung,
    zones: s.zoneIds,
    otherZone: s.otherOn ? s.otherText : null,
    zonesUnknown: s.zonesUnknown,
    kaumuskel: s.kaumuskel,
    nefertiti: s.nefertiti,
    achsel: s.achsel,
    lachs: s.lachs,
    note: s.note,
  };
}

/* Alles, wovon die Dauer abhängt; ändert sich das, werden die freien Zeiten neu geladen */
function durationKey(sel: Selection): string {
  return JSON.stringify([sel.checkup, sel.visit, sel.beratung, hasBotulinum(sel), !!sel.lachs, sel.persons]);
}


const pad = (n: number) => String(n).padStart(2, "0");
const keyToNoon = (key: string) => new Date(`${key}T12:00:00Z`);
/* Großbuchstabe am Anfang nach den Regeln der Sprache (Türkisch: i wird İ) */
const cap = (t: string, loc: string) => t.charAt(0).toLocaleUpperCase(loc) + t.slice(1);

/** Teilsatz als Link, zum Beispiel „per WhatsApp“ */
function withLink(text: string, part: string, href: string): React.ReactNode {
  const i = text.indexOf(part);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <a href={href} target="_blank" rel="noopener">{part}</a>
      {text.slice(i + part.length)}
    </>
  );
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<{ res: Response; data: Record<string, unknown> }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { res, data };
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Das Wort „Datenschutzerklärung“ (je Sprache) im Einwilligungstext verlinken */
function withPrivacyLink(text: string, word: string, href: string): React.ReactNode {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <a href={href} target="_blank" rel="noopener">{text.slice(i, i + word.length)}</a>
      {text.slice(i + word.length)}
    </>
  );
}

/* ---------- Komponente ---------- */
/* initialLang hat der Server bestimmt (lib/i18n.ts): Die Seite kommt gleich in der richtigen Sprache, nichts springt um */
export function BookingApp({ initialLang, testMode, checkup, kopf }: { initialLang: Lang; testMode: boolean; checkup: boolean; kopf: Record<Lang, KopfTexte> }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [s, setS] = useState<State>(() => blank(checkup));
  const [slots, setSlots] = useState<SlotsState>({ status: "idle", days: [], durationMinutes: null, key: "" });
  const [book, setBook] = useState<BookState>({ status: "idle" });
  const [requestId, setRequestId] = useState<string | null>(null);

  /*
   * Die Buchung startet immer leer. Holt Safari die Seite aus dem Seitenspeicher zurück (Zurück-Taste, Tabwechsel),
   * bleibt sonst die alte Auswahl samt eingeklappter Zusatzbehandlung stehen; deshalb wird dann alles außer der Sprache
   * zurückgesetzt. Im Browser wird keine Auswahl gespeichert, nur die Sprache.
   */
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setS(blank(checkup));
      setBook({ status: "idle" });
      setRequestId(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [checkup]);
  const [copyLabel, setCopyLabel] = useState<"copy" | "copied" | "marked">("copy");
  const appRef = useRef<HTMLElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  const l = TEXTS[lang];
  /* Preise, Nummern und Uhrzeiten bleiben in arabischer Schrift lesbar: als links-nach-rechts isoliert (LRI … PDI) */
  const ltr = (t: string) => (langDir(lang) === "rtl" ? `\u2066${t}\u2069` : t);
  const comma = lang === "ar" ? "،" : ",";
  const langQuery = lang === "de" ? "" : `?lang=${lang}`;
  const loc = LANGS.find((x) => x.id === lang)!.loc;
  /* Preise: Tausendertrennzeichen je Sprache (EN Komma, FR geschütztes Leerzeichen, sonst Punkt), Euro dahinter, wie auf der Startseite */
  const fmt = useCallback((n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS[lang]) + "\u00A0€", [lang]);
  /* Sichtbare Preise: „ab“ und Sternchen, Fußnote unter der Liste */
  const priceTag = (n: number) => ltr(`${fmt(n)}*`);
  const dfmt = useCallback((key: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { ...o, timeZone: TZ }).format(keyToNoon(key)), [loc]);
  const dayWd = (key: string) => cap(dfmt(key, { weekday: "short" }).replace(/\.$/, ""), loc);
  const dayN = (key: string) => Number(key.slice(8));
  const dayLabel = (key: string) => cap(dfmt(key, { weekday: "long", day: "numeric", month: "long" }), loc);

  /* Seitensprache wechseln (Sprachwahl speichert die Wahl); Eingaben bleiben erhalten */
  const setLang = (id: Lang) => setLangState(id);
  /* Beratungssprache: Vorauswahl ist die Seitensprache, wenn sie eine der fünf ist; bei Ukrainisch und Arabisch keine */
  const consult: ConsultLang | null = s.consultTouched ? s.consult : defaultConsult(lang);
  const setConsult = (c: ConsultLang) => setS((p) => clearErr({ ...p, consult: c, consultTouched: true }, "consult"));

  const selection = useMemo(() => toSelection(s, checkup), [s, checkup]);
  const selKey = durationKey(selection);
  const treatmentChosen = checkup || hasTreatment(selection) || s.beratung;
  const visitChosen = checkup || !!s.visit;
  const firstStep: Step = checkup ? 2 : 1;

  /* ---------- Freie Zeiten laden, sobald Schritt 2 sichtbar ist oder sich die Dauer geändert hat ---------- */
  const selRef = useRef(selection);
  selRef.current = selection;
  const loadedKeyRef = useRef<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  useEffect(() => {
    if (s.step !== 2) return;
    if (loadedKeyRef.current === selKey) return;
    loadedKeyRef.current = selKey;
    let cancelled = false;
    let finished = false;
    setSlots({ status: "loading", days: [], durationMinutes: null, key: selKey });
    (async () => {
      try {
        const { res, data } = await fetchJson("/api/slots", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selection: selRef.current }) }, 20000);
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data.days)) throw new Error("unavailable");
        const days = data.days as SlotDay[];
        setSlots({ status: "ready", days, durationMinutes: Number(data.durationMinutes) || null, key: selKey });
        setS((p) => {
          const stillThere = p.slot && days.some((d) => d.slots.some((x) => x.start === p.slot!.start));
          const firstFree = days.find((d) => d.slots.length);
          const dayOk = p.day && days.some((d) => d.date === p.day);
          return { ...p, slot: stillThere ? p.slot : null, day: dayOk ? p.day : (firstFree?.date ?? days[0]?.date ?? null), maxStep: stillThere ? p.maxStep : (Math.min(p.maxStep, 2) as Step) };
        });
      } catch {
        if (!cancelled) setSlots({ status: "down", days: [], durationMinutes: null, key: selKey });
      } finally {
        finished = true;
      }
    })();
    return () => {
      cancelled = true;
      if (!finished) loadedKeyRef.current = null;
    };
  }, [s.step, selKey, reloadTick]);

  /* Anfragekennung beim Laden von Schritt 3 */
  useEffect(() => {
    if (s.step === 3 && book.status === "idle") setRequestId(crypto.randomUUID());
  }, [s.step, book.status]);

  const toTop = () => appRef.current?.scrollIntoView({ block: "start" });
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el.tagName === "INPUT") (el as HTMLInputElement).focus({ preventScroll: true });
    }
  };

  /* ---------- Auswahl ---------- */
  const update = (fn: (p: State) => State) => setS((p) => fn(p));
  const clearErr = (p: State, key: string): State => {
    if (!p.errors[key]) return p;
    const errors = { ...p.errors };
    delete errors[key];
    return { ...p, errors };
  };
  const clearT = (p: State): State => ({ ...p, zoneIds: [], zonesUnknown: false, kaumuskel: false, nefertiti: false, achsel: false, otherOn: false, otherText: "", lachs: null });

  const setVisit = (v: Visit) => update((p) => clearErr({ ...p, visit: v }, "visit"));
  const toggleBeratung = () =>
    update((p) => {
      const on = !p.beratung;
      const next = on ? { ...clearT(p), beratung: true, open: { bot: false, boost: false } } : { ...p, beratung: false };
      return clearErr(next, "treat");
    });
  const pick = (fn: (p: State) => Partial<State>) => update((p) => clearErr({ ...p, beratung: false, ...fn(p) }, "treat"));
  /* Zonen antippen; „Weiß ich noch nicht“ schließt konkrete Zonen aus und umgekehrt */
  const toggleZone = (z: ZoneId) => pick((p) => ({ zoneIds: p.zoneIds.includes(z) ? p.zoneIds.filter((x) => x !== z) : [...p.zoneIds, z], zonesUnknown: false }));
  const toggleUnknown = () => pick((p) => (p.zonesUnknown ? { zonesUnknown: false } : { zonesUnknown: true, zoneIds: [], otherOn: false, otherText: "" }));
  const toggleLachs = (v: Lachs) => pick((p) => ({ lachs: p.lachs === v ? null : v }));
  const toggleFlag = (k: "kaumuskel" | "nefertiti" | "achsel") => pick((p) => ({ [k]: !p[k] }));
  const toggleOther = () => pick((p) => ({ otherOn: !p.otherOn, otherText: p.otherOn ? "" : p.otherText, zonesUnknown: false }));
  const toggleAcc = (k: "bot" | "boost") => update((p) => ({ ...p, open: { ...p.open, [k]: !p.open[k] } }));

  /* ---------- Prüfen und weiter ---------- */
  function validate(n: Step): string[] {
    const e: Partial<Record<string, ErrorKey>> = {};
    const f = s.f;
    // Reihenfolge wie auf der Seite: die erste Lücke wird angesteuert
    if (n === 1) {
      if (!visitChosen) e.visit = "eVisit";
      if (!consult) e.consult = "eConsult";
      if (!treatmentChosen) e.treat = "eTreat";
    }
    if (n === 2 && checkup && !consult) e.consult = "eConsult";
    if (n === 2 && !s.slot) e.slot = "eSlot";
    if (n === 3) {
      if (!f.vorname.trim()) e.vorname = "eVorname";
      if (!f.nachname.trim()) e.nachname = "eNachname";
      // Nur eine Eingabe ohne jede Ziffer hält auf; ungewöhnliche Nummern zeigen einen Hinweis (lib/phone.ts)
      if (!checkPhone(f.handy)) e.handy = "eHandy";
      if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "eEmail";
      if (!f.consent) e.consent = "eConsent";
    }
    setS((p) => ({ ...p, errors: e }));
    return Object.keys(e);
  }
  const target = (k: string) => ({ consult: "sec-consult", visit: "sec-visit", treat: "sec-treat", slot: "sec-slot" } as Record<string, string>)[k] || k;

  function next() {
    const bad = validate(s.step);
    if (bad.length) {
      setTimeout(() => scrollTo(target(bad[0])), 0);
      return;
    }
    if (s.step < 3) {
      const n = (s.step + 1) as Step;
      setS((p) => ({ ...p, step: n, maxStep: Math.max(p.maxStep, n) as Step, errors: {} }));
      setTimeout(toTop, 0);
      return;
    }
    void submit();
  }
  function goto(n: Step) {
    setS((p) => ({ ...p, step: n, errors: {} }));
    if (book.status === "error" || book.status === "unavailable" || book.status === "conflict") setBook({ status: "idle" });
    setTimeout(toTop, 0);
  }

  /* ---------- Buchen ---------- */
  async function submit() {
    if (!requestId || !s.slot || book.status === "sending") return;
    setBook({ status: "sending" });
    const payload = {
      requestId,
      selection,
      start: s.slot.start,
      lang,
      consultationLanguage: consult,
      customer: { vorname: s.f.vorname.trim(), nachname: s.f.nachname.trim(), handy: s.f.handy.trim(), email: s.f.email.trim() },
      consent: true,
      reminder: s.f.reminder,
      website: (document.getElementById("website") as HTMLInputElement | null)?.value ?? "",
    };
    try {
      const { res, data } = await fetchJson("/api/book", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }, 30000);
      if (res.ok && data.status === "booked") {
        setBook({ status: "done", booking: data.booking as Booking });
        // Auswahl löschen, nur Name für die Empfehlungsfrage behalten
        setS((p) => ({ ...blank(checkup), f: { ...blank(checkup).f, vorname: p.f.vorname, nachname: p.f.nachname } }));
        setTimeout(toTop, 0);
        return;
      }
      if (res.status === 409) {
        setBook({ status: "conflict" });
        setS((p) => ({ ...p, step: 2, slot: null, maxStep: 2, errors: {} }));
        loadedKeyRef.current = null;
        setReloadTick((t) => t + 1);
        setTimeout(toTop, 0);
        return;
      }
      if (res.status === 202) {
        setBook({ status: "pending" });
        return;
      }
      // Verfügbarkeit nicht prüfbar: nichts gebucht, Eingaben bleiben stehen
      if (res.status === 503 && data.status === "unavailable") {
        setBook({ status: "unavailable" });
        return;
      }
      setBook({ status: "error" });
    } catch {
      // Unklarer Ausgang: nicht neu buchen, sondern die Anfragekennung nachfragen
      for (let i = 0; i < 2; i++) {
        await sleep(2000);
        try {
          const { res, data } = await fetchJson(`/api/book?requestId=${encodeURIComponent(requestId)}${i === 1 ? "&report=1" : ""}`, { method: "GET" }, 10000);
          if (res.ok && data.status === "booked") {
            setBook({ status: "done", booking: data.booking as Booking });
            setTimeout(toTop, 0);
            return;
          }
        } catch {}
      }
      setBook({ status: "pending" });
    }
  }

  async function sendReferral() {
    const ref = s.f.empfohlen.trim();
    if (!ref || !requestId) return;
    setS((p) => ({ ...p, refSent: true }));
    try {
      await fetchJson("/api/referral", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId, referral: ref }) }, 10000);
    } catch {}
  }


  function copyNumber() {
    const done = () => setCopyLabel("copied");
    const fallback = () => {
      const el = numRef.current;
      if (!el) return;
      const r = document.createRange();
      r.selectNodeContents(el);
      const sel = getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      setCopyLabel("marked");
    };
    try {
      navigator.clipboard.writeText(PHONE).then(done, fallback);
    } catch {
      fallback();
    }
  }

  /* ---------- Darstellung nach Entwurf B (Vorlage vom 5. Oktober 2026); Logik oben unverändert ---------- */
  const miss = (key: string) => (s.errors[key] ? <div className="missing" role="alert">{String(l[s.errors[key]!])}</div> : null);
  /* Uhrzeit wie in der Vorlage ohne führende Null („7:30 Uhr“) */
  const timeLabel = (t: string) => l.at(t.replace(/^0(\d):/, "$1:"));
  const tick = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
  );

  const field = (id: keyof Form & string, label: React.ReactNode, type: string, extra: React.InputHTMLAttributes<HTMLInputElement>, hint?: React.ReactNode) => {
    const inv = s.errors[id];
    return (
      <div className={`field ${inv ? "invalid" : ""}`}>
        <label htmlFor={id}>{label}</label>
        <input id={id} type={type} value={String(s.f[id])} aria-invalid={inv ? true : undefined} onChange={(e) => setS((p) => ({ ...p, f: { ...p.f, [id]: e.target.value } }))} {...extra} />
        {inv ? <span className="err">{String(l[inv])}</span> : null}
        {hint}
      </div>
    );
  };

  /* Auswahlknopf wie in der Vorlage: echtes Eingabefeld (Radio oder Haken) unter der Pille */
  const choice = (name: string, checked: boolean, onChange: () => void, label: React.ReactNode, opts: { type?: "radio" | "checkbox"; cls?: string; lang?: string; disabled?: boolean } = {}) => (
    <label className={`ch ${opts.cls ?? ""}`} lang={opts.lang}>
      <input type={opts.type ?? "radio"} name={name} checked={checked} disabled={opts.disabled} onChange={onChange} />
      <span>{label}</span>
    </label>
  );

  /* ---------- Beratungssprache: Schritt 1 nach „Waren Sie schon einmal bei uns?“ (beim Kontrolltermin oben in Schritt 2), Pflichtfeld ---------- */
  const consultBlock = (
    <fieldset className="grp" id="sec-consult">
      <legend>{l.consultQ}</legend>
      {miss("consult")}
      <div className="opts">
        {CONSULT_LANGS.map((c) => (
          <span key={c.id} style={{ display: "contents" }}>{choice("beratung", consult === c.id, () => setConsult(c.id), <bdi>{c.name}</bdi>, { lang: c.id })}</span>
        ))}
      </div>
      {!isConsultLang(lang) ? <p className="note">{l.consultHint}</p> : null}
    </fieldset>
  );

  /* ---------- Übersicht „Ihre Buchung“: rechts beim Scrollen sichtbar, auf dem Handy unter der Karte ---------- */
  const chosenTitles = (): string[] => {
    if (checkup) return [l.checkupLbl];
    const out: string[] = [];
    if (s.beratung) out.push(l.unsureT);
    if (s.zoneIds.length || s.otherOn || s.zonesUnknown) out.push(l.botGroup);
    if (s.kaumuskel) out.push(l.kaumuskel);
    if (s.nefertiti) out.push(l.nefertiti);
    if (s.achsel) out.push(l.achsel);
    if (s.lachs) out.push(l.lachsGroup);
    return out;
  };
  const chosenDetail = (): string => {
    const zones = [...s.zoneIds.map((z) => l.zoneNames[z]), ...(s.otherOn ? [s.otherText.trim() || l.zoneOther] : []), ...(s.zonesUnknown ? [l.zoneUnknown] : [])];
    const lachs = s.lachs === "single" ? l.lachsOne : s.lachs === "pack" ? l.lachsFour : "";
    const sep = `${comma} `;
    const first = [zones.join(sep), lachs].filter(Boolean).join(sep);
    const facts = [checkup ? "" : s.persons === 2 ? l.persons2 : l.persons1, checkup ? "" : s.visit === "first" ? l.visitFirstSum : s.visit === "return" ? l.visitReturnSum : "", consult ? l.consultSum(l.consultNames[consult]) : ""].filter(Boolean).join(sep);
    return [first, facts].filter(Boolean).join(". ");
  };
  const total = totalPrice(selection);
  const pille = bewertungPille(lang, kopf[lang].googleB);
  const summary = (
    <aside className="sum" aria-label={l.sumH}>
      <p className="eyebrow">{l.sumH}</p>
      <dl className="rows">
        <div>
          <dt><span>{l.sumTreat}</span>{s.step === 3 && !checkup ? <a href="#" onClick={(e) => { e.preventDefault(); goto(1); }}>{l.change}</a> : null}</dt>
          {chosenTitles().length ? <dd>{chosenTitles().join(`${comma} `)}<span>{chosenDetail()}</span></dd> : <dd className="open">{l.sumOpen}<span>{chosenDetail()}</span></dd>}
        </div>
        <div>
          <dt><span>{l.sumWhen}</span>{s.step === 3 ? <a href="#" onClick={(e) => { e.preventDefault(); goto(2); }}>{l.change}</a> : null}</dt>
          <dd className={s.day && s.slot ? "" : "open"}>{s.day && s.slot ? `${dayLabel(s.day)}${comma} ${timeLabel(s.slot.time)}` : l.sumOpen}</dd>
        </div>
        <div>
          <dt><span>{l.sumPrice}</span></dt>
          <dd className={total > 0 ? "" : "open"}>{total > 0 ? priceTag(total) : l.sumOpen}</dd>
        </div>
      </dl>
      <p className="fn">{l.sumFn}</p>
      <div className="doc">
        <Image src={BILDER.portraetRund} alt="Dr. med. Sebastian Vogel" width={60} height={60} />
        <div><b><bdi>Dr. med. Sebastian Vogel</bdi></b><span>{l.docRole}</span></div>
      </div>
      {/* Bewertungspille wie in der Kopfzeile, aus lib/bewertungen.ts (Freigabe Dr. Vogel nur für Text und Link, 10. Oktober 2026) */}
      <a className="rate" href={pille.href} target="_blank" rel="noopener" aria-label={pille.aria}><span className="rate-lang">{pille.lang}</span><span className="rate-kurz" aria-hidden="true">{pille.kurz}</span></a>
      <p className="addr"><bdi>{ADDRESS}, Prenzlauer Berg</bdi></p>
      <p className="move">{l.moveNote}</p>
    </aside>
  );

  /* ---------- Schritt 1: Behandlung ---------- */
  const stepTreat = () => {
    const zoneN = zoneCount({ zones: s.zoneIds, otherZone: s.otherOn ? s.otherText : null });
    const botOn = s.zoneIds.length > 0 || s.otherOn || s.zonesUnknown;
    const row = (on: boolean, title: string, desc: string, price: string, onClick: () => void, expanded?: boolean, body?: React.ReactNode) => (
      <div className={`tr ${on ? "on" : ""}`}>
        <button type="button" className="tr-h" aria-pressed={on} aria-expanded={expanded} onClick={onClick}>
          <span className="box">{tick}</span>
          <span className="tr-t"><b>{title}</b><span>{desc}</span></span>
          {price ? <span className="tr-p">{price}</span> : null}
        </button>
        {expanded && body ? <div className="tr-b">{body}</div> : null}
      </div>
    );
    return (
      <>
        <fieldset className="grp" id="sec-persons">
          <legend>{l.personsQ}</legend>
          <div className="opts two">
            {choice("wer", s.persons === 1, () => setS((p) => ({ ...p, persons: 1 })), l.persons1)}
            {choice("wer", s.persons === 2, () => setS((p) => ({ ...p, persons: 2 })), l.persons2)}
          </div>
          {s.persons === 2 ? <p className="note">{l.secondPerson}</p> : null}
        </fieldset>
        <fieldset className="grp" id="sec-visit">
          <legend>{l.visitQ}</legend>
          {miss("visit")}
          <div className="opts two">
            {choice("schon", s.visit === "return", () => setVisit("return"), l.yesBeen)}
            {choice("schon", s.visit === "first", () => setVisit("first"), l.noFirst)}
          </div>
        </fieldset>
        {consultBlock}
        <fieldset className="grp" id="sec-treat">
          <legend>{l.treatQ}</legend>
          <p className="hint">{l.treatHint}</p>
          {miss("treat")}
          <div className="tl">
            {row(s.beratung, l.unsureT, l.unsureD, l.consultPrice, toggleBeratung)}
            {row(
              botOn,
              l.botGroup,
              l.botD,
              ltr(l.priceFrom(`${fmt(PRICES.zone1)}*`)),
              () => toggleAcc("bot"),
              s.open.bot || botOn,
              <>
                <div className="zones" role="group" aria-label={l.botGroup}>
                  {ZONE_IDS.map((z) => (
                    <span key={z} style={{ display: "contents" }}>{choice(`zone-${z}`, s.zoneIds.includes(z), () => toggleZone(z), l.zoneNames[z], { type: "checkbox" })}</span>
                  ))}
                  {choice("zone-other", s.otherOn, toggleOther, l.zoneOther, { type: "checkbox" })}
                  {choice("zone-unknown", s.zonesUnknown, toggleUnknown, l.zoneUnknown, { type: "checkbox" })}
                </div>
                {s.otherOn ? (
                  <div className="sub">
                    <input id="otherText" type="text" value={s.otherText} placeholder={l.otherPh} aria-label={l.otherPh} maxLength={80} autoFocus onChange={(e) => setS((p) => ({ ...p, otherText: e.target.value }))} />
                  </div>
                ) : null}
                {zoneN > 0 || s.zonesUnknown ? (
                  <div className="zsum" aria-live="polite">
                    <span>{zoneN > 0 ? l.zoneCountLabel(zoneN) : l.zonesOpen}</span>
                    {zoneN > 0 ? <span>{priceTag(zonePrice(zoneN))}</span> : null}
                  </div>
                ) : null}
              </>,
            )}
            {row(s.kaumuskel, l.kaumuskel, l.kaumuskelD, priceTag(PRICES.kaumuskel), () => toggleFlag("kaumuskel"))}
            {row(s.nefertiti, l.nefertiti, l.nefertitiD, priceTag(PRICES.nefertiti), () => toggleFlag("nefertiti"))}
            {row(s.achsel, l.achsel, l.achselD, priceTag(PRICES.achsel), () => toggleFlag("achsel"))}
            {row(
              !!s.lachs,
              l.lachsGroup,
              l.lachsGroupD,
              ltr(l.priceFrom(`${fmt(PRICES.lachs)}*`)),
              () => toggleAcc("boost"),
              s.open.boost || !!s.lachs,
              <div className="opts two">
                {choice("lachs", s.lachs === "single", () => toggleLachs("single"), <>{l.lachsOne} {priceTag(PRICES.lachs)}</>, { type: "checkbox" })}
                {choice("lachs", s.lachs === "pack", () => toggleLachs("pack"), <>{l.lachsFour} {priceTag(PRICES.lachsPack)}</>, { type: "checkbox" })}
              </div>,
            )}
          </div>
          <p className="fn">{l.priceHint}</p>
        </fieldset>
      </>
    );
  };

  /* ---------- Schritt 2: Termin ---------- */
  const firstFree = (): { day: string; slot: Slot } | null => {
    for (const d of slots.days) if (d.slots.length) return { day: d.date, slot: d.slots[0] };
    return null;
  };
  const [weekShift, setWeekShift] = useState(0);
  const stepSlot = () => {
    const chk = checkup ? <div className="alert"><b>{l.checkupLbl}</b>{l.checkupP}</div> : null;
    let body: React.ReactNode;
    if (slots.status === "down") {
      body = (
        <div className="alert" role="alert">
          <b>{l.downT}</b>
          {l.downP}
          <span className="num" ref={numRef}><a href={PHONE_TEL} dir="ltr">{PHONE}</a></span>
          <span className="row">
            <button className="btn ghost" type="button" onClick={copyNumber}>{l[copyLabel]}</button>
            <a className="btn ghost" href={WA} target="_blank" rel="noopener">WhatsApp</a>
          </span>
        </div>
      );
    } else if (slots.status !== "ready") {
      body = <p className="wait" aria-live="polite">{l.loading}</p>;
    } else if (!slots.days.length || !slots.days.some((d) => d.slots.length)) {
      body = (
        <div className="alert">
          <b>{l.fullT}</b>
          {l.noneFree} <a href={WA} target="_blank" rel="noopener" dir="ltr">{PHONE}</a>
        </div>
      );
    } else {
      const ff = firstFree();
      const day = slots.days.find((d) => d.date === s.day) ?? slots.days[0];
      /* Wochen ab Montag; gezeigt wird die Woche des gewählten Tages, mit den Pfeilen eine Woche vor oder zurück */
      const monday = (key: string) => {
        const d = keyToNoon(key);
        const wd = (d.getUTCDay() + 6) % 7;
        return new Date(d.getTime() - wd * 86400000).toISOString().slice(0, 10);
      };
      const addDays = (key: string, n: number) => new Date(keyToNoon(key).getTime() + n * 86400000).toISOString().slice(0, 10);
      const firstWeek = monday(slots.days[0].date);
      const lastWeek = monday(slots.days[slots.days.length - 1].date);
      const baseWeek = monday(day.date);
      let week = addDays(baseWeek, weekShift * 7);
      if (week < firstWeek) week = firstWeek;
      if (week > lastWeek) week = lastWeek;
      const keys = Array.from({ length: 7 }, (_, i) => addDays(week, i));
      const byKey = new Map(slots.days.map((d) => [d.date, d]));
      const tomorrowKey = addDays(new Date().toLocaleDateString("sv-SE", { timeZone: TZ }), 1);
      const quick = ff ? (
        <button type="button" className="next" onClick={() => { setWeekShift(0); setS((p) => clearErr({ ...p, day: ff.day, slot: ff.slot }, "slot")); }}>
          <span>
            <span className="eyebrow">{l.nextFree}</span>
            <b>{ff.day === tomorrowKey ? `${l.tomorrow}${comma} ` : ""}{dayLabel(ff.day)}{comma} {timeLabel(ff.slot.time)}</b>
          </span>
          <span className="go">{l.take}</span>
        </button>
      ) : null;
      const times = day.holiday ? (
        <div className="alert"><b>{l.closed}</b>{l.holiday}</div>
      ) : day.slots.length ? (
        <div className="opts times">
          {day.slots.map((t) => (
            <span key={t.start} style={{ display: "contents" }}>{choice("zeit", s.slot?.start === t.start, () => setS((p) => clearErr({ ...p, slot: t, day: day.date }, "slot")), <bdi>{timeLabel(t.time)}</bdi>)}</span>
          ))}
        </div>
      ) : (
        <div className="alert"><b>{l.fullT}</b>{l.fullP}</div>
      );
      body = (
        <>
          {quick}
          <fieldset className="grp">
            <div className="dayhead">
              <p>{l.orDayMonth(cap(dfmt(keys[0], { month: "long", year: "numeric" }), loc))}</p>
              <div className="arrows">
                <button className="arr" type="button" aria-label={l.prevWeek} disabled={week <= firstWeek} onClick={() => setWeekShift((w) => w - 1)}><span aria-hidden="true">‹</span></button>
                <button className="arr" type="button" aria-label={l.nextWeek} disabled={week >= lastWeek} onClick={() => setWeekShift((w) => w + 1)}><span aria-hidden="true">›</span></button>
              </div>
            </div>
            <div className="days" role="radiogroup" aria-label={l.dayAria}>
              {keys.map((k) => {
                const d = byKey.get(k);
                const closed = !d || d.holiday || !d.slots.length;
                return (
                  <label key={k} className={`ch day ${d && closed ? "closed" : ""}`}>
                    <input
                      type="radio"
                      name="tag"
                      checked={k === day.date}
                      disabled={!d}
                      aria-label={`${dayLabel(k)}${d?.holiday ? `${comma} ${l.closedAria}` : ""}`}
                      onChange={() => { setWeekShift(0); setS((p) => ({ ...p, day: k, slot: null, maxStep: Math.min(p.maxStep, 2) as Step })); }}
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
            <legend>{l.timesFor(dayLabel(day.date))}</legend>
            {miss("slot")}
            {times}
          </fieldset>
        </>
      );
    }
    return (
      <div id="sec-slot">
        {checkup ? consultBlock : null}
        {chk}
        {book.status === "conflict" ? (
          <div className="missing" role="alert">
            {l.conflict}
            <div style={{ marginTop: "var(--sp-10)" }}><button type="button" className="btn ghost" onClick={() => setBook({ status: "idle" })}>{l.otherTime}</button></div>
          </div>
        ) : null}
        {slots.status !== "ready" ? miss("slot") : null}
        {body}
        <p className="note" style={{ marginBottom: "var(--sp-36)" }}>{withLink(l.noSlotHint, l.noSlotLink, WA)}</p>
      </div>
    );
  };

  /* ---------- Schritt 3: Angaben ---------- */
  const stepData = () => {
    if (book.status === "pending") {
      return (
        <div className="alert" role="status">
          <b>{l.pendingT}</b>
          {l.pendingP}
          <span className="num">WhatsApp <a href={WA} target="_blank" rel="noopener" dir="ltr">{PHONE}</a></span>
        </div>
      );
    }
    const phone = checkPhone(s.f.handy);
    const phoneHint = (
      <>
        {phone && !phone.valid && !s.errors.handy ? <p className="note" role="status">{l.phoneHint}</p> : null}
        {s.visit === "return" ? <p className="note">{l.phoneReturn}</p> : null}
      </>
    );
    return (
      <div id="sec-data">
        <div className="frow">
          {field("vorname", l.vorname, "text", { autoComplete: "given-name", maxLength: 60 })}
          {field("nachname", l.nachname, "text", { autoComplete: "family-name", maxLength: 60 })}
        </div>
        {field("handy", l.handyWhy ? <>{l.handy} <em>{l.handyWhy}</em></> : l.handy, "tel", { autoComplete: "tel", inputMode: "tel", placeholder: l.phonePh, maxLength: 30, dir: "ltr" }, phoneHint)}
        {field("email", l.emailWhy ? <>{l.email} <em>{l.emailWhy}</em></> : l.email, "email", { autoComplete: "email", maxLength: 120, dir: "ltr" })}
        <div className="hp" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        <label className={`consent ${s.errors.consent ? "invalid" : ""}`} htmlFor="consent">
          <input id="consent" type="checkbox" checked={s.f.consent} onChange={(e) => setS((p) => clearErr({ ...p, f: { ...p.f, consent: e.target.checked } }, e.target.checked ? "consent" : ""))} />
          <span>{withPrivacyLink(l.consent, l.legalPrivacy, `/datenschutz${langQuery}`)}</span>
        </label>
        <label className="consent" htmlFor="reminder">
          <input id="reminder" type="checkbox" checked={s.f.reminder} onChange={(e) => setS((p) => ({ ...p, f: { ...p.f, reminder: e.target.checked } }))} />
          <span>{l.reminderOpt}<small>{l.voluntary}</small></span>
        </label>
        {s.errors.consent ? <div className="missing" role="alert">{l.eConsent}</div> : null}
        {book.status === "error" ? <div className="missing" role="alert">{l.bookErr}</div> : null}
        {book.status === "unavailable" ? <div className="missing" role="alert">{withLink(l.bookUnavailable, l.noSlotLink, WA)}</div> : null}
        <div className="zeit"><b>{l.cancelT}</b><p>{l.cancelP}</p><p>{l.cancelP2}</p></div>
      </div>
    );
  };

  /* ---------- Bestätigung: keine Buchungsnummer, keine Behandlung, keine Dauer ---------- */
  const screenDone = (b: Booking) => {
    const dayKey = b.start.slice(0, 10);
    const time = b.start.slice(11, 16);
    return (
      <div className="bk-done">
        <section className="donecard">
          <h2 className="h2">{b.binding ? l.doneBindingH : l.doneH}</h2>
          {b.binding ? <p style={{ marginTop: "var(--sp-12)" }}>{l.doneBindingP}</p> : null}
          <dl>
            <dt>{l.sumWhen}</dt>
            <dd>{dayLabel(dayKey)}{comma} {timeLabel(time)}</dd>
            <dt>{l.addrL}</dt>
            <dd><bdi>PALO SKIN by Dr. Vogel</bdi><br /><bdi>{ADDRESS}</bdi><br /><a href={MAPS} target="_blank" rel="noopener">{l.mapL}</a></dd>
          </dl>
          {b.calendar ? (
            <>
              <p>{l.saveQ}</p>
              <div className="cal">
                <a className="btn light" href={b.calendar.google} target="_blank" rel="noopener">{l.gcal} <span aria-hidden="true">↗</span></a>
                <a className="btn light" href={b.calendar.ics}>{l.ical} <span aria-hidden="true">↓</span></a>
                <a className="btn light" href={b.calendar.outlook} target="_blank" rel="noopener">{l.ocal} <span aria-hidden="true">↗</span></a>
              </div>
            </>
          ) : null}
        </section>
        <div className="after">
          <div className="fcard">
            <div className="zeit" style={{ marginTop: 0 }}><b>{l.cancelT}</b><p>{l.cancelP}</p>{b.canManage !== false ? <p>{l.cancelP2}</p> : null}</div>
            {s.refSent ? (
              <p className="note" style={{ paddingBottom: "var(--sp-24)" }}>{l.refThanks}</p>
            ) : (
              <div className="after" style={{ paddingBottom: "var(--sp-24)" }}>
                <div className="field">
                  <label htmlFor="empfohlen">{l.refQ}</label>
                  <input id="empfohlen" type="text" value={s.f.empfohlen} placeholder={l.refPh} maxLength={120} onChange={(e) => setS((p) => ({ ...p, f: { ...p.f, empfohlen: e.target.value } }))} />
                </div>
                <div><button type="button" className="btn ghost" onClick={sendReferral}>{l.refSend}</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Knöpfe unter der Karte; auf dem Handy am unteren Bildschirmrand ---------- */
  const navRow = () => {
    const label = s.step === 1 ? l.next1 : s.step === 2 ? l.next2 : l.book;
    const hideNext = (s.step === 2 && slots.status === "down") || book.status === "pending";
    const sending = book.status === "sending";
    return (
      <div className="nav">
        {s.step > firstStep && !sending ? <button className="btn ghost" type="button" onClick={() => goto(Math.max(firstStep, s.step - 1) as Step)}>{l.back}</button> : null}
        {hideNext ? null : (
          <div className="end">
            <button className="btn" type="button" disabled={sending || (s.step === 2 && slots.status !== "ready")} aria-busy={sending} onClick={next}>{label}</button>
          </div>
        )}
      </div>
    );
  };

  const steps = ([[1, l.stepTreat], [2, l.stepSlot], [3, l.stepData]] as [Step, string][]).filter(([n]) => n >= firstStep);
  const done = book.status === "done";
  return (
    <div className="pb">
      {testMode ? <div className="testbar" role="note"><b>Test.</b> {l.testBanner}</div> : null}
      <Kopfzeile lang={lang} t={kopf[lang]} page="booking" onLang={setLang} />
      <main className="wrap bk" id="app" ref={appRef} aria-live="polite">
        <h1 className="h2">{l.bookHA} <em>{l.bookHB}</em></h1>
        {done ? (
          screenDone((book as { status: "done"; booking: Booking }).booking)
        ) : (
          <>
            <ol className="stepper" aria-label={l.stepsAria}>
              {steps.map(([n, t], i) => {
                const cur = n === s.step;
                const can = n <= s.maxStep && !cur;
                return (
                  <li key={n} className={`stp ${cur ? "cur" : n < s.step ? "done" : ""}`} aria-current={cur ? "step" : undefined}>
                    {can ? (
                      <button type="button" className="snr" onClick={() => goto(n)} aria-label={t}>{i + 1}</button>
                    ) : (
                      <span className="snr">{i + 1}</span>
                    )}
                    <span className="stl">{t}</span>
                  </li>
                );
              })}
            </ol>
            <div className="bk-grid">
              <section className="fcard">
                {s.step === 1 ? stepTreat() : s.step === 2 ? stepSlot() : stepData()}
                {navRow()}
              </section>
              {summary}
            </div>
          </>
        )}
      </main>
      <Fusszeile lang={lang} t={kopf[lang]} mobileBar={false} />
    </div>
  );
}
