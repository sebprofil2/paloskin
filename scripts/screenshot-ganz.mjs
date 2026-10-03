/*
 * Ganze Seite als Bild bei einer Breite, dazu Seitenhöhe und Maße der Abschnitte.
 *   node scripts/screenshot-ganz.mjs <URL> <Breite> <Datei.jpg>
 * Unter 768 Pixel mit iPhone-Darstellung, sonst Desktop. Der feste Knopf unten wird für das Bild ausgeblendet nicht verändert.
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const [url, widthArg, file] = process.argv.slice(2);
const width = Number(widthArg);
const mobile = width < 768;
mkdirSync(dirname(file), { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "palo-chrome-"));
const port = 9400 + (width % 97);
const proc = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "--lang=de", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 50 && !wsUrl; i++) { await sleep(200); try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = l.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null; } catch { /* wartet */ } }
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded = 0;
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method === "Page.loadEventFired") loaded++; };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
await send("Emulation.setUserAgentOverride", { userAgent: mobile ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0 Safari/537.36", acceptLanguage: "de-DE,de" });
await send("Page.navigate", { url });
for (let i = 0; i < 100 && !loaded; i++) await sleep(100);
await sleep(900);
const info = await evalJs(`(() => {
  const H = Math.ceil(document.documentElement.scrollHeight);
  const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), h: Math.round(b.height) }; };
  const firstText = document.querySelector(".hero h1").getBoundingClientRect();
  return { H, links: Math.round(firstText.left), hero: r(".hero"), preise: r("#preise"), ablauf: r("#ablauf"), studio: r("#studio"), fragen: r("#fragen"), footer: r("footer") };
})()`);
const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 80, captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: info.H, scale: 1 } });
writeFileSync(file, Buffer.from(shot.result.data, "base64"));
console.log(JSON.stringify({ width, file, ...info }));
ws.close(); proc.kill(); await sleep(400);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* egal */ }
