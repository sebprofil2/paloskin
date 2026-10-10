/*
 * Screenshots einzelner Abschnitte bei Handybreite (375 Pixel, iPhone-Darstellung) über Chrome ohne Fenster.
 *   node scripts/screenshot-375.mjs <URL> <Zielordner> <Name>=<CSS-Selektor> ...
 * Beispiel: node scripts/screenshot-375.mjs "http://127.0.0.1:8765/index.html?lang=de" docs/shots 01-einstieg=.hero
 * Jeder Abschnitt wird vollständig aufgenommen (auch über die Bildschirmhöhe hinaus). Ausgabe als JPEG.
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, outDir, ...specs] = process.argv.slice(2);
if (!url || !outDir || !specs.length) { console.error("Aufruf: node scripts/screenshot-375.mjs <URL> <Zielordner> <Name>=<Selektor> ..."); process.exit(1); }
mkdirSync(outDir, { recursive: true });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "palo-chrome-"));
const port = 9333;
const proc = spawn(chrome, [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "--lang=de", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 50 && !wsUrl; i++) {
  await sleep(200);
  try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null; } catch { /* noch nicht bereit */ }
}
if (!wsUrl) { proc.kill(); throw new Error("Chrome nicht erreichbar"); }
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d.method); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", acceptLanguage: "de-DE,de" });
await send("Page.navigate", { url });
for (let i = 0; i < 50 && !events.includes("Page.loadEventFired"); i++) await sleep(100);
await sleep(600);
for (const spec of specs) {
  const [name, selector] = spec.split("=");
  const r = await send("Runtime.evaluate", { expression: `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const b = el.getBoundingClientRect(); return { x: 0, y: b.top + window.scrollY, w: 375, h: Math.ceil(b.height) }; })()`, returnByValue: true });
  const box = r.result?.result?.value;
  if (!box) { console.log(`${name}: Selektor nicht gefunden (${selector})`); continue; }
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 88, captureBeyondViewport: true, clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } });
  const file = join(outDir, `${name}-375.jpg`);
  writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  console.log(`${file} (${box.w} x ${box.h})`);
}
ws.close();
proc.kill();
await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome räumt noch auf */ }
