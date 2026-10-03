/*
 * Randprüfung bei Handybreite: Nichts darf links näher am Rand beginnen oder rechts näher enden als der Fließtext.
 *   node scripts/randpruefung.mjs <Breite> <Zielordner> <Schrittdatei.json>
 * Schrittdatei: [{ "url": "..." }, { "goto": "JS-Ausdruck, der eine Adresse liefert" }, { "js": "..." }, { "until": "Selektor", "timeout": 20000 }, { "wait": 500 }, { "check": "Bezeichnung" }, { "shot": "Dateiname", "sel": "Selektor oder viewport" }]
 * Chrome ohne Fenster über das DevTools-Protokoll mit iPhone-Darstellung. Ausgabe als JPEG, Befund als Text.
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [widthArg, outDir, stepsFile] = process.argv.slice(2);
const width = Number(widthArg);
const steps = JSON.parse(readFileSync(stepsFile, "utf8"));
mkdirSync(outDir, { recursive: true });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "palo-chrome-"));
const port = 9340 + (width % 100);
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "--lang=de", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 50 && !wsUrl; i++) { await sleep(200); try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null; } catch { /* wartet */ } }
if (!wsUrl) { proc.kill(); throw new Error("Chrome nicht erreichbar"); }
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded = 0;
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method === "Page.loadEventFired") loaded++; };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", acceptLanguage: "de-DE,de" });

/* Im Browser: Fließtext-Rand bestimmen und alle sichtbaren Elemente dagegen prüfen */
const CHECK = `(() => {
  const W = document.documentElement.clientWidth;
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const paras = [...document.querySelectorAll("main p, .legal p, p, h1")].filter((p) => vis(p) && p.getBoundingClientRect().width > W * 0.5);
  if (!paras.length) return { error: "kein Fließtext gefunden" };
  const left = Math.min(...paras.map((p) => p.getBoundingClientRect().left));
  const right = Math.max(...paras.map((p) => p.getBoundingClientRect().right));
  const FULL = new Set(["HTML", "BODY", "MAIN", "HEADER", "FOOTER", "SECTION", "NAV", "FORM", "UL", "OL", "DL", "DIV", "BLOCKQUOTE", "DETAILS", "FIELDSET", "ARTICLE", "ASIDE", "TABLE", "TBODY", "TR"]);
  const paints = (el) => {
    if (!FULL.has(el.tagName)) return true;
    const cs = getComputedStyle(el);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    return hasText || cs.boxShadow !== "none" || ["Top", "Right", "Bottom", "Left"].some((s) => parseFloat(cs["border" + s + "Width"]) > 0 && cs["border" + s + "Style"] !== "none");
  };
  const bg = (el) => { const cs = getComputedStyle(el); return cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.backgroundImage !== "none"; };
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width >= W - 1 && FULL.has(el.tagName) && !paints(el)) continue; // volle Breite, nur Hintergrund
    if (FULL.has(el.tagName) && !paints(el)) continue;
    if (r.width >= W - 1 && bg(el) && !paints(el)) continue;
    const tooLeft = r.left < left - 1, tooRight = r.right > right + 1;
    if (!tooLeft && !tooRight) continue;
    const scroller = el.closest("[style*=overflow], .days");
    out.push({ tag: el.tagName.toLowerCase(), cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 40), text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40).replace(/\\s+/g, " "), left: Math.round(r.left), right: Math.round(r.right), scroller: !!scroller && el !== scroller });
  }
  return { W, left: Math.round(left), right: Math.round(right), findings: out };
})()`;

for (const st of steps) {
  const target = st.url ?? (st.goto ? await evalJs(st.goto) : null);
  if (st.goto && !target) { console.log(`[${width}] Ziel nicht gefunden: ${st.goto}`); continue; }
  if (target) { const before = loaded; await send("Page.navigate", { url: target }); for (let i = 0; i < 100 && loaded === before; i++) await sleep(100); await sleep(700); }
  if (st.until) { let ok = false; for (let i = 0; i < (st.timeout ?? 20000) / 200 && !ok; i++) { ok = await evalJs(`!!document.querySelector(${JSON.stringify(st.until)})`); if (!ok) await sleep(200); } if (!ok) console.log(`[${width}] nicht erschienen: ${st.until}`); await sleep(300); }
  if (st.js) await evalJs(st.js);
  if (st.wait) await sleep(st.wait);
  if (st.check) {
    const r = await evalJs(CHECK);
    if (!r || r.error) { console.log(`[${width}] ${st.check}: ${r?.error ?? "Prüfung fehlgeschlagen"}`); continue; }
    const f = (r.findings || []).filter((x) => !x.scroller);
    console.log(`[${width}] ${st.check}: Fließtext ${r.left} bis ${r.right}, Befunde: ${f.length}`);
    for (const x of f) console.log(`   ${x.tag}.${x.cls} „${x.text}“ ${x.left} bis ${x.right}`);
  }
  if (st.shot) {
    let clip = null;
    if (st.sel && st.sel !== "viewport") clip = await evalJs(`(() => { const el = document.querySelector(${JSON.stringify(st.sel)}); if (!el) return null; const b = el.getBoundingClientRect(); return { x: 0, y: b.top + window.scrollY, w: ${width}, h: Math.ceil(b.height) }; })()`);
    const params = { format: "jpeg", quality: 88 };
    if (clip) Object.assign(params, { captureBeyondViewport: true, clip: { x: 0, y: clip.y, width: clip.w, height: clip.h, scale: 1 } });
    else if (st.sel === "viewport") { const y = await evalJs("window.scrollY"); Object.assign(params, { captureBeyondViewport: true, clip: { x: 0, y, width, height: 844, scale: 1 } }); }
    const shot = await send("Page.captureScreenshot", params);
    const file = join(outDir, `${st.shot}-${width}.jpg`);
    writeFileSync(file, Buffer.from(shot.result.data, "base64"));
    console.log(`   ${file}`);
  }
}
ws.close(); proc.kill(); await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome räumt noch auf */ }
