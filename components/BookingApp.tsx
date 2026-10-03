"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SlotDay } from "@/lib/slots";
import { FLAGS, LANGS, TEXTS, isLang, type Texts } from "@/lib/texts";
import { normalizePhoneE164 } from "@/lib/phone";
import { PRICES, ZONE_IDS, hasBotulinum, hasTreatment, zoneCount, zonePrice, type Lachs, type Lang, type Selection, type Visit, type ZoneId } from "@/lib/treatments";

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
const THOUSANDS: Record<Lang, string> = { de: ".", en: ",", es: ".", fr: "\u00A0", pt: "." };

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
type BookState = { status: "idle" | "sending" | "error" | "conflict" | "pending" } | { status: "done"; booking: Booking };

const blank = (checkup: boolean): State => ({
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


/* Sprache: Adresse, dann gespeicherte Wahl, dann Sprache des Geräts, sonst Deutsch (wie lang.js) */
function detectLang(fromUrl: Lang | null): Lang {
  if (fromUrl) return fromUrl;
  try {
    const saved = localStorage.getItem("paloLang");
    if (isLang(saved)) return saved;
  } catch {}
  const nav = (navigator.languages || [navigator.language || "de"]).map((l) => String(l).slice(0, 2).toLowerCase());
  for (const n of nav) if (isLang(n)) return n;
  return "de";
}

const pad = (n: number) => String(n).padStart(2, "0");
const keyToNoon = (key: string) => new Date(`${key}T12:00:00Z`);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

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

/* ---------- Bausteine (außerhalb der Komponente, damit Eingabefelder beim Tippen nicht neu entstehen) ---------- */
function Opt({ t, d, p, on, kind = "radio", onClick }: { t: string; d?: string; p?: string; on: boolean; kind?: "radio" | "checkbox"; onClick: () => void }) {
  return (
    <button type="button" className="opt" role={kind} aria-checked={on} onClick={onClick}>
      <span className="ot">
        <span className="t">{t}</span>
        {d ? <span className="d">{d}</span> : null}
        {p ? <span className="pm">{p}</span> : null}
      </span>
      <span className="tick" aria-hidden="true" />
    </button>
  );
}

function Acc({ open, title, meta, chosen, onToggle, children }: { open: boolean; title: string; meta: string; chosen: string; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className={`accw ${chosen ? "has" : ""}`}>
      <button type="button" className="acc" aria-expanded={open} onClick={onToggle}>
        <span className="at">{title}</span>
        {/* Gewählte Einträge stehen nicht doppelt im Kopf: Markierung an den Karten und Zonensumme reichen. Der Einstiegspreis nur, solange nichts gewählt ist. */}
        <span className="am">{chosen ? "" : meta}</span>
        <span className="chev" aria-hidden="true" />
      </button>
      {open ? <div className="accp">{children}</div> : null}
    </div>
  );
}

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
export function BookingApp({ initialLang, testMode, checkup }: { initialLang: Lang | null; testMode: boolean; checkup: boolean }) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? "de");
  const [ready, setReady] = useState(false);
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
  const numRef = useRef<HTMLDivElement>(null);

  const l = TEXTS[lang];
  const langQuery = lang === "de" ? "" : `?lang=${lang}`;
  const loc = LANGS.find((x) => x.id === lang)!.loc;
  /* Preise: Tausendertrennzeichen je Sprache (EN Komma, FR geschütztes Leerzeichen, sonst Punkt), Euro dahinter, wie auf der Startseite */
  const fmt = useCallback((n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS[lang]) + "\u00A0€", [lang]);
  /* Sichtbare Preise: „ab“ und Sternchen, Fußnote unter der Liste */
  const priceTag = (n: number) => `${fmt(n)}*`;
  const dfmt = useCallback((key: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { ...o, timeZone: TZ }).format(keyToNoon(key)), [loc]);
  const dayWd = (key: string) => cap(dfmt(key, { weekday: "short" }).replace(/\.$/, ""));
  const dayN = (key: string) => Number(key.slice(8));
  const dayLabel = (key: string) => cap(dfmt(key, { weekday: "long", day: "numeric", month: "long" }));

  useEffect(() => {
    const detected = detectLang(initialLang);
    setLangState(detected);
    document.documentElement.lang = detected;
    setReady(true);
  }, [initialLang]);

  const setLang = (id: Lang) => {
    setLangState(id);
    document.documentElement.lang = id;
    try {
      localStorage.setItem("paloLang", id);
    } catch {}
  };

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
    if (n === 1) {
      if (!visitChosen) e.visit = "eVisit";
      if (!treatmentChosen) e.treat = "eTreat";
    }
    if (n === 2 && !s.slot) e.slot = "eSlot";
    if (n === 3) {
      if (!f.vorname.trim()) e.vorname = "eVorname";
      if (!f.nachname.trim()) e.nachname = "eNachname";
      if (!normalizePhoneE164(f.handy)) e.handy = "eHandy";
      if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "eEmail";
      if (!f.consent) e.consent = "eConsent";
    }
    setS((p) => ({ ...p, errors: e }));
    return Object.keys(e);
  }
  const target = (k: string) => ({ visit: "sec-visit", treat: "sec-treat", slot: "sec-slot" } as Record<string, string>)[k] || k;

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
    if (book.status === "error" || book.status === "conflict") setBook({ status: "idle" });
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

  /* ---------- Bausteine ---------- */
  const miss = (key: string) => (s.errors[key] ? <div className="missing">{String(l[s.errors[key]!])}</div> : null);

  const field = (id: keyof Form & string, label: React.ReactNode, type: string, extra: React.InputHTMLAttributes<HTMLInputElement>, hint?: React.ReactNode) => {
    const inv = s.errors[id];
    return (
      <label className={`field ${inv ? "invalid" : ""}`} htmlFor={id}>
        <span className="l">{label}</span>
        <input id={id} type={type} value={String(s.f[id])} onChange={(e) => setS((p) => ({ ...p, f: { ...p.f, [id]: e.target.value } }))} {...extra} />
        {inv ? <span className="err">{String(l[inv])}</span> : null}
        {hint}
      </label>
    );
  };

  /* ---------- Kopf ---------- */
  const brand = (
    <>
      <div className="band" />
      <header className="brand">
        <a href="/">
          <div className="wm">PALO SKIN</div>
          <div className="by">by Dr. Vogel</div>
        </a>
        <div className="claim">Goodbye wrinkles.</div>
        <div className="spec">{l.spec}</div>
      </header>
      <div className="langs2">
        <span>{l.say}</span>
        <div className="flags" role="group" aria-label={l.say}>
          {LANGS.map((x) => (
            <button key={x.id} type="button" className="flag" aria-pressed={x.id === lang} aria-label={x.name} title={x.name} lang={x.id} onClick={() => setLang(x.id)} dangerouslySetInnerHTML={{ __html: FLAGS[x.id] }} />
          ))}
        </div>
      </div>
    </>
  );

  const stepper = (
    <nav className="steps">
      {([[1, l.stepTreat], [2, l.stepSlot], [3, l.stepData]] as [Step, string][])
        .filter(([n]) => n >= firstStep)
        .map(([n, t], i) => {
          const cur = n === s.step;
          const can = n <= s.maxStep && !cur;
          return (
            <button key={n} type="button" className={`st ${cur ? "cur" : ""}`} disabled={!can} aria-current={cur ? "step" : undefined} onClick={() => can && goto(n)}>
              <span className="num">{i + 1}</span>
              {t}
            </button>
          );
        })}
    </nav>
  );

  /* ---------- Schritt 1: Behandlung ---------- */
  const stepTreat = () => {
    const botChosen = [...s.zoneIds.map((z) => l.zoneNames[z]), s.otherOn ? s.otherText.trim() || l.zoneOther : "", s.zonesUnknown ? l.zoneUnknown : "", s.kaumuskel ? l.kaumuskel : "", s.nefertiti ? l.nefertiti : "", s.achsel ? l.achsel : ""]
      .filter(Boolean)
      .join(", ");
    const boostChosen = s.lachs === "single" ? l.lachs : s.lachs === "pack" ? l.lachsPack : "";
    const zoneN = zoneCount({ zones: s.zoneIds, otherZone: s.otherOn ? s.otherText : null });
    return (
      <section className="sec" id="sec-treat">
        <div className="block" id="sec-persons">
          <span className="lbl">{l.personsQ}</span>
          <div className="seg" role="radiogroup">
            <button type="button" className="segb" role="radio" aria-checked={s.persons === 1} onClick={() => setS((p) => ({ ...p, persons: 1 }))}>{l.persons1}</button>
            <button type="button" className="segb" role="radio" aria-checked={s.persons === 2} onClick={() => setS((p) => ({ ...p, persons: 2 }))}>{l.persons2}</button>
          </div>
          <p className="hint" style={{ margin: 0 }}>{l.personsMore} <a className="walink" href={WA} target="_blank" rel="noopener">{l.personsWa}</a></p>
          {s.persons === 2 ? <p className="hint" style={{ margin: 0, color: "var(--ink)" }}>{l.secondPerson}</p> : null}
        </div>
        <div className="block" id="sec-visit">
          <span className="lbl">{l.visitQ}</span>
          {miss("visit")}
          <div className="seg" role="radiogroup">
            <button type="button" className="segb" role="radio" aria-checked={s.visit === "return"} onClick={() => setVisit("return")}>{l.yesBeen}</button>
            <button type="button" className="segb" role="radio" aria-checked={s.visit === "first"} onClick={() => setVisit("first")}>{l.noFirst}</button>
          </div>
        </div>
        <div className="block">
          <h2>{l.treatQ}</h2>
          <p className="nb">{l.noCommitTag}</p>
          <p className="lead">{l.noCommit}</p>
          {miss("treat")}
          <div className="opts">
            <Opt t={l.unsureT} d={l.unsureD} p={l.consultPrice} on={s.beratung} onClick={toggleBeratung} />
          </div>
          <Acc open={s.open.bot} onToggle={() => toggleAcc("bot")} title={l.botGroup} meta={priceTag(PRICES.zone1)} chosen={botChosen}>
            <div className="interest">{l.interestL}</div>
            <div className="zones" role="group" aria-label={l.botGroup}>
              {ZONE_IDS.map((z) => (
                <button key={z} type="button" className="chip" aria-pressed={s.zoneIds.includes(z)} onClick={() => toggleZone(z)}>{l.zoneNames[z]}</button>
              ))}
              <button type="button" className="chip" id="otherChip" aria-pressed={s.otherOn} onClick={toggleOther}>{l.zoneOther}</button>
              <button type="button" className="chip" id="unknownChip" aria-pressed={s.zonesUnknown} onClick={toggleUnknown}>{l.zoneUnknown}</button>
              {s.otherOn ? <input id="otherText" type="text" value={s.otherText} placeholder={l.otherPh} maxLength={80} autoFocus onChange={(e) => setS((p) => ({ ...p, otherText: e.target.value }))} /> : null}
            </div>
            {zoneN > 0 || s.zonesUnknown ? (
              <div className="zsum" aria-live="polite">
                <b>
                  {zoneN > 0 ? l.zoneCountLabel(zoneN) : l.zonesOpen}
                  <small>{l.zoneTiers(priceTag(PRICES.zone1), priceTag(PRICES.zone2), priceTag(PRICES.zone3), priceTag(PRICES.zoneMore))}</small>
                </b>
                {zoneN > 0 ? <span className="zp">{priceTag(zonePrice(zoneN))}</span> : null}
              </div>
            ) : null}
            <div className="sub"><span>{l.moreGroup}</span></div>
            <div className="opts">
              <Opt t={l.kaumuskel} d={l.kaumuskelD} p={priceTag(PRICES.kaumuskel)} on={s.kaumuskel} kind="checkbox" onClick={() => toggleFlag("kaumuskel")} />
              <Opt t={l.nefertiti} d={l.nefertitiD} p={priceTag(PRICES.nefertiti)} on={s.nefertiti} kind="checkbox" onClick={() => toggleFlag("nefertiti")} />
              <Opt t={l.achsel} d={l.achselD} p={priceTag(PRICES.achsel)} on={s.achsel} kind="checkbox" onClick={() => toggleFlag("achsel")} />
            </div>
          </Acc>
          <Acc open={s.open.boost} onToggle={() => toggleAcc("boost")} title="Skin Booster" meta={priceTag(PRICES.lachs)} chosen={boostChosen}>
            <div className="interest">{l.interestL}</div>
            <div className="opts">
              <Opt t={l.lachs} d={l.lachsD} p={priceTag(PRICES.lachs)} on={s.lachs === "single"} onClick={() => toggleLachs("single")} />
              <Opt t={l.lachsPack} d={l.lachsPackD} p={priceTag(PRICES.lachsPack)} on={s.lachs === "pack"} onClick={() => toggleLachs("pack")} />
            </div>
          </Acc>
        </div>
        {!NOTE_ENABLED ? null : s.noteOpen || s.note ? (
          <label className="field" htmlFor="note">
            <span className="l">{l.noteL}</span>
            <textarea id="note" rows={2} placeholder={l.notePh} value={s.note} maxLength={600} autoFocus={s.noteOpen && !s.note} onChange={(e) => setS((p) => ({ ...p, note: e.target.value }))} />
          </label>
        ) : (
          <button type="button" className="addlink" onClick={() => setS((p) => ({ ...p, noteOpen: true }))}>+ {l.noteAdd}</button>
        )}
        <p className="hint">{l.priceHint}</p>
      </section>
    );
  };

  /* ---------- Schritt 2: Termin ---------- */
  const firstFree = (): { day: string; slot: Slot } | null => {
    for (const d of slots.days) if (d.slots.length) return { day: d.date, slot: d.slots[0] };
    return null;
  };

  const stepSlot = () => {
    const title = checkup ? l.slotQCheckup : l.slotQ;
    const chk = checkup ? <div className="note"><strong>{l.checkupLbl}</strong>{l.checkupP}</div> : null;
    let body: React.ReactNode;
    if (slots.status === "down") {
      body = (
        <div className="fallback">
          <strong>{l.downT}</strong>
          <p className="hint" style={{ margin: "6px 0 0" }}>{l.downP}</p>
          <div className="num" ref={numRef}><a href={PHONE_TEL} style={{ color: "inherit", textDecoration: "none" }}>{PHONE}</a></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn-ghost" type="button" onClick={copyNumber}>{l[copyLabel]}</button>
            <a className="btn-ghost" style={{ textDecoration: "none", display: "inline-block" }} href={WA} target="_blank" rel="noopener">WhatsApp</a>
          </div>
        </div>
      );
    } else if (slots.status !== "ready") {
      body = <p className="slots-wait" aria-live="polite">{l.loading}</p>;
    } else if (!slots.days.length || !slots.days.some((d) => d.slots.length)) {
      body = (
        <div className="note">
          <strong>{l.fullT}</strong>
          {l.noneFree} <a href={WA} target="_blank" rel="noopener">{PHONE}</a>
        </div>
      );
    } else {
      const ff = firstFree();
      const day = slots.days.find((d) => d.date === s.day) ?? slots.days[0];
      const quick = ff ? (
        <button type="button" className="quick" onClick={() => setS((p) => clearErr({ ...p, day: ff.day, slot: ff.slot }, "slot"))}>
          <div><strong>{l.nextFree}</strong><span>{dayLabel(ff.day)}, {l.at(ff.slot.time)}</span></div>
          <span aria-hidden="true">→</span>
        </button>
      ) : null;
      const slotsBody = day.holiday ? (
        <div className="note"><strong>{l.closed}</strong>{l.holiday}</div>
      ) : day.slots.length ? (
        <div className="slots">
          {day.slots.map((t) => (
            <button key={t.start} type="button" className="slot" aria-pressed={s.slot?.start === t.start} onClick={() => setS((p) => clearErr({ ...p, slot: t, day: day.date }, "slot"))}>{t.time}</button>
          ))}
        </div>
      ) : (
        <div className="note"><strong>{l.fullT}</strong>{l.fullP}</div>
      );
      body = (
        <>
          {quick}
          <div className="lbl">{l.orDay}</div>
          <div className="days" role="group" aria-label={l.dayAria}>
            {slots.days.map((d) => (
              <button key={d.date} type="button" className={`day ${d.holiday || !d.slots.length ? "closed" : ""}`} aria-pressed={d.date === day.date} aria-label={`${dayLabel(d.date)}${d.holiday ? ", " + l.closedAria : ""}`} onClick={() => setS((p) => ({ ...p, day: d.date, slot: null, maxStep: Math.min(p.maxStep, 2) as Step }))}>
                <div className="w">{dayWd(d.date)}</div>
                <div className="n">{dayN(d.date)}</div>
              </button>
            ))}
          </div>
          <div>
            <div className="lbl" style={{ marginBottom: 10 }}>{dayLabel(day.date)}</div>
            {slotsBody}
          </div>
        </>
      );
    }
    return (
      <section className="sec" id="sec-slot">
        {chk}
        <h2>{title}</h2>
        {book.status === "conflict" ? (
          <div className="missing">
            {l.conflict}
            <div style={{ marginTop: 10 }}><button type="button" className="btn-ghost" onClick={() => setBook({ status: "idle" })}>{l.otherTime}</button></div>
          </div>
        ) : null}
        {miss("slot")}
        {body}
        <p className="hint">{withLink(l.noSlotHint, l.noSlotLink, WA)}</p>
      </section>
    );
  };

  /* ---------- Schritt 3: Angaben mit kompakter Übersicht ---------- */
  const overviewItems = (): string[] => {
    const out: string[] = [];
    if (s.persons === 2) out.push(l.personsSum);
    const n = zoneCount({ zones: s.zoneIds, otherZone: s.otherOn ? s.otherText : null });
    const names = [...s.zoneIds.map((z) => l.zoneNames[z]), ...(s.otherOn ? [s.otherText.trim() ? `${l.zoneOther}: ${s.otherText.trim()}` : l.zoneOther] : [])];
    if (n > 0) out.push(`${l.botRow}${l.zoneCountLabel(n)}: ${names.join(", ")}`);
    else if (s.zonesUnknown) out.push(`${l.botRow}${l.zonesOpen}`);
    if (s.kaumuskel) out.push(`${l.botRow}${l.kaumuskel}`);
    if (s.nefertiti) out.push(`${l.botRow}${l.nefertiti}`);
    if (s.achsel) out.push(`${l.botRow}${l.achsel}`);
    if (s.lachs === "single") out.push(`${l.boostRow}${l.lachsRow}`);
    if (s.lachs === "pack") out.push(`${l.boostRow}${l.lachsPack}`);
    return out;
  };

  const overview = (
    <div className="overview">
      <div className="ov-h">{l.sumHead}</div>
      <div className="ov-row">
        <span>{s.day && s.slot ? `${dayLabel(s.day)}, ${l.at(s.slot.time)}` : ""}</span>
        <button type="button" className="chg" onClick={() => goto(2)}>{l.change}</button>
      </div>
      {!checkup ? (
        <div className="ov-row">
          <div className="ov-lines">
            <div className="ov-line nb" style={{ margin: 0, fontSize: 14 }}><span>{l.noCommitTag}</span></div>
            {s.beratung ? <div className="ov-line"><span>{l.beratungRow}</span></div> : null}
            {overviewItems().map((n, i) => <div key={i} className="ov-line"><span>{n}</span></div>)}
          </div>
          <button type="button" className="chg" onClick={() => goto(1)}>{l.change}</button>
        </div>
      ) : null}
    </div>
  );

  const stepData = () => {
    if (book.status === "pending") {
      return (
        <section className="sec" id="sec-data">
          <h2>{l.dataH}</h2>
          {overview}
          <div className="pending" role="status">
            <strong>{l.pendingT}</strong>
            <span>{l.pendingP}</span>
            <span>WhatsApp <a href={WA} target="_blank" rel="noopener">{PHONE}</a></span>
          </div>
        </section>
      );
    }
    const phoneHint = s.visit === "return" ? <span className="hint">{l.phoneReturn}</span> : null;
    return (
      <section className="sec" id="sec-data">
        <h2>{l.dataH}</h2>
        {overview}
        {field("vorname", l.vorname, "text", { autoComplete: "given-name", maxLength: 60 })}
        {field("nachname", l.nachname, "text", { autoComplete: "family-name", maxLength: 60 })}
        {field("handy", l.handyWhy ? <>{l.handy} <em>{l.handyWhy}</em></> : l.handy, "tel", { autoComplete: "tel", inputMode: "tel", placeholder: "0151 …", maxLength: 30 }, phoneHint)}
        {field("email", l.emailWhy ? <>{l.email} <em>{l.emailWhy}</em></> : l.email, "email", { autoComplete: "email", maxLength: 120 })}
        <div className="hp" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        <label className={`check ${s.errors.consent ? "invalid" : ""}`} htmlFor="consent">
          <input id="consent" type="checkbox" checked={s.f.consent} onChange={(e) => setS((p) => clearErr({ ...p, f: { ...p.f, consent: e.target.checked } }, e.target.checked ? "consent" : ""))} />
          <span>{withPrivacyLink(l.consent, l.legalPrivacy, `/datenschutz${langQuery}`)}</span>
        </label>
        <label className="check" htmlFor="reminder">
          <input id="reminder" type="checkbox" checked={s.f.reminder} onChange={(e) => setS((p) => ({ ...p, f: { ...p.f, reminder: e.target.checked } }))} />
          <span>{l.reminderOpt}</span>
        </label>
        {s.errors.consent ? <div className="missing">{l.eConsent}</div> : null}
        {book.status === "error" ? <div className="missing">{l.bookErr}</div> : null}
        <div className="note"><strong>{l.cancelT}</strong>{l.cancelP}<br />{l.cancelP2}</div>
      </section>
    );
  };

  /* ---------- Bestätigung (Block 3): keine Buchungsnummer, keine Behandlung, keine Dauer ---------- */
  const screenDone = (b: Booking) => {
    const dayKey = b.start.slice(0, 10);
    const time = b.start.slice(11, 16);
    return (
      <>
        <div className="band" />
        <div className="confirm">
          <h1>{b.binding ? l.doneBindingH : l.doneH}</h1>
          {b.binding ? <p>{l.doneBindingP}</p> : null}
          <p style={{ fontWeight: 500, fontSize: 20 }}>{dayLabel(dayKey)}, {l.at(time)}</p>
          <p style={{ margin: 0, lineHeight: 1.2 }}>
            <span style={{ display: "block", fontSize: 22, letterSpacing: ".09em" }}>PALO SKIN</span>
            <span style={{ display: "block", fontSize: 14, letterSpacing: ".04em", opacity: 0.85 }}>by Dr. Vogel</span>
          </p>
          <p style={{ margin: 0 }}>{ADDRESS}</p>
          <p style={{ margin: 0 }}><a href={MAPS} target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>{l.mapL}</a></p>
          {b.calendar ? (
            <>
              <p style={{ marginTop: 10 }}>{l.saveQ}</p>
              <div className="cal" style={{ marginTop: 0 }}>
                <a href={b.calendar.google} target="_blank" rel="noopener">{l.gcal} <span aria-hidden="true">↗</span></a>
                <a href={b.calendar.ics}>{l.ical} <span aria-hidden="true">↓</span></a>
                <a href={b.calendar.outlook} target="_blank" rel="noopener">{l.ocal} <span aria-hidden="true">↗</span></a>
              </div>
            </>
          ) : null}
        </div>
        <div className="after">
          <div className="note"><strong>{l.cancelT}</strong>{l.cancelP}{b.canManage !== false ? <><br />{l.cancelP2}</> : null}</div>
          {s.refSent ? (
            <p className="hint" style={{ margin: 0 }}>{l.refThanks}</p>
          ) : (
            <div className="refbox">
              <label className="field" htmlFor="empfohlen">
                <span className="l">{l.refQ}</span>
                <input id="empfohlen" type="text" value={s.f.empfohlen} placeholder={l.refPh} maxLength={120} onChange={(e) => setS((p) => ({ ...p, f: { ...p.f, empfohlen: e.target.value } }))} />
              </label>
              <button type="button" className="btn-ghost" onClick={sendReferral}>{l.refSend}</button>
            </div>
          )}
        </div>
      </>
    );
  };

  /* ---------- Leiste unten ---------- */
  const bar = () => {
    const label = s.step === 1 ? l.next1 : s.step === 2 ? l.next2 : l.book;
    const pct = Math.round((100 * (s.step - firstStep + 1)) / (3 - firstStep + 1));
    const hideNext = (s.step === 2 && slots.status === "down") || book.status === "pending";
    const sending = book.status === "sending";
    return (
      <div className="bar">
        <div className="prog" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
        {s.step > firstStep && !sending ? <button className="back" type="button" onClick={() => goto(Math.max(firstStep, s.step - 1) as Step)}>{l.back}</button> : null}
        {hideNext ? null : (
          <button className="primary" type="button" disabled={sending || (s.step === 2 && slots.status !== "ready")} aria-busy={sending} onClick={next}>{label}</button>
        )}
      </div>
    );
  };

  const foot = (
    <nav className="foot" aria-label="Palo Skin">
      <a href={`/${langQuery}`}>{l.home}</a>
      <a href={`/impressum${langQuery}`}>{l.legalImprint}</a>
      <a href={`/datenschutz${langQuery}`}>{l.legalPrivacy}</a>
    </nav>
  );

  return (
    <div className="shell">
      {testMode ? <div className="testbar" role="note"><b>Test.</b> {l.testBanner}</div> : null}
      <main className="app" id="app" ref={appRef} aria-live="polite">
        {!ready ? (
          <div className="band" />
        ) : book.status === "done" ? (
          screenDone(book.booking)
        ) : (
          <>
            {brand}
            {stepper}
            <div className="page">{s.step === 1 ? stepTreat() : s.step === 2 ? stepSlot() : stepData()}</div>
            {bar()}
          </>
        )}
      </main>
      {ready ? foot : null}
    </div>
  );
}
