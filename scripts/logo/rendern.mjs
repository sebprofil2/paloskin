/*
 * PNG-Dateien aus den SVG-Vorlagen rendern (Chrome ohne Fenster, genau die verlangte Pixelgröße).
 *   node scripts/logo/rendern.mjs
 * Erzeugt: public/assets/og-1200x630.png, og-1200x1200.png, apple-touch-icon.png (180), icon-192.png, icon-512.png,
 * favicon.ico (16, 32, 48; PNG in ICO). Vorher python3 scripts/logo/bauen.py ausführen.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const asset = (p) => join(root, "public/assets", p);
const svgOf = (p) => readFileSync(asset(p), "utf8");
const jobs = [
  { svg: "logo/og-1200x630.svg", w: 1200, h: 630, out: "og-1200x630.png" },
  { svg: "logo/og-1200x630-b.svg", w: 1200, h: 630, out: "og-1200x630-b.png" },
  { svg: "logo/og-1200x1200.svg", w: 1200, h: 1200, out: "og-1200x1200.png" },
  { svg: "logo/icon-quadrat.svg", w: 180, h: 180, out: "apple-touch-icon.png" },
  { svg: "logo/icon-quadrat.svg", w: 192, h: 192, out: "icon-192.png" },
  { svg: "logo/icon-quadrat.svg", w: 512, h: 512, out: "icon-512.png" },
  { svg: "favicon.svg", w: 16, h: 16, out: null, ico: true },
  { svg: "favicon.svg", w: 32, h: 32, out: null, ico: true },
  { svg: "favicon.svg", w: 48, h: 48, out: null, ico: true },
  /* nur zur Ansicht in der Vorschau, nicht ausgeliefert */
  { svg: "favicon.svg", w: 16, h: 16, out: "../../design/favicon-16.png" },
  { svg: "favicon.svg", w: 32, h: 32, out: "../../design/favicon-32.png" },
  { svg: "logo/favicon-16-vorschlag.svg", w: 16, h: 16, out: "../../design/favicon-16-vorschlag.png" },
];

const profile = mkdtempSync(join(tmpdir(), "palo-chrome-"));
const port = 9488;
const proc = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 50 && !wsUrl; i++) { await sleep(200); try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = l.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null; } catch { /* wartet */ } }
const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
// Durchsichtiger Hintergrund, sonst bekommen die abgerundeten Ecken des Favicons weiße Pixel
await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });

const icoParts = [];
for (const j of jobs) {
  await send("Emulation.setDeviceMetricsOverride", { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: false });
  const svg = svgOf(j.svg).replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*"/, `<svg $1width="${j.w}" height="${j.h}"`);
  const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`;
  await send("Page.navigate", { url: "data:text/html;base64," + Buffer.from(html).toString("base64") });
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: j.w, height: j.h, scale: 1 } });
  const png = Buffer.from(shot.result.data, "base64");
  if (j.out) { writeFileSync(asset(j.out), png); console.log(j.out, j.w, "x", j.h); }
  if (j.ico) icoParts.push({ size: j.w, png });
}
// ICO mit eingebetteten PNG-Bildern
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(icoParts.length, 4);
let offset = 6 + 16 * icoParts.length;
const dir = icoParts.map((p) => { const e = Buffer.alloc(16); e.writeUInt8(p.size >= 256 ? 0 : p.size, 0); e.writeUInt8(p.size >= 256 ? 0 : p.size, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(p.png.length, 8); e.writeUInt32LE(offset, 12); offset += p.png.length; return e; });
writeFileSync(join(root, "public/favicon.ico"), Buffer.concat([head, ...dir, ...icoParts.map((p) => p.png)]));
console.log("favicon.ico", icoParts.map((p) => p.size).join(", "));
ws.close(); proc.kill(); await sleep(400);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* egal */ }
