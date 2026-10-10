/*
 * Logo für die Website im Knopf-Blau #1534A6 (Entscheidung Dr. Vogel, 5. Oktober 2026) als eigene Web-Dateien.
 * Die bisherigen Logo-Dateien bleiben unverändert (Linkvorschau, Unterlagen); hier wird nur das Blau des Zeichens ersetzt.
 *   node scripts/logo/web-blau.mjs
 * Erzeugt in public/assets/logo/web/: logo-kopf.svg, zeichen.svg, favicon.svg, favicon-16.svg und favicon.ico
 * (16 Pixel aus der eigenen 16-Pixel-Fassung, 32 und 48 Pixel aus favicon.svg; PNG in ICO wie scripts/logo/rendern.mjs).
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ALT = /#002FA7/gi;
const NEU = "#1534A6";
const root = fileURLToPath(new URL("../../", import.meta.url));
const src = (p) => join(root, "public/assets", p);
const out = join(root, "public/assets/logo/web");
mkdirSync(out, { recursive: true });
const files = { "logo-kopf.svg": "logo/logo-kopf.svg", "zeichen.svg": "logo/zeichen.svg", "favicon.svg": "favicon.svg", "favicon-16.svg": "logo/favicon-16-vorschlag.svg" };
const svgs = {};
for (const [name, from] of Object.entries(files)) {
  const s = readFileSync(src(from), "utf8");
  if (!ALT.test(s)) throw new Error(`${from}: kein #002FA7 gefunden`);
  svgs[name] = s.replace(ALT, NEU);
  writeFileSync(join(out, name), svgs[name]);
  console.log("logo/web/" + name);
}

const profile = mkdtempSync(join(tmpdir(), "palo-chrome-"));
const port = 9489;
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
await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
const parts = [];
for (const [name, size] of [["favicon-16.svg", 16], ["favicon.svg", 32], ["favicon.svg", 48]]) {
  await send("Emulation.setDeviceMetricsOverride", { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  const svg = svgs[name].replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*"/, `<svg $1width="${size}" height="${size}"`);
  const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`;
  await send("Page.navigate", { url: "data:text/html;base64," + Buffer.from(html).toString("base64") });
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: size, height: size, scale: 1 } });
  parts.push({ size, png: Buffer.from(shot.result.data, "base64") });
}
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(parts.length, 4);
let offset = 6 + 16 * parts.length;
const dir = parts.map((p) => { const e = Buffer.alloc(16); e.writeUInt8(p.size, 0); e.writeUInt8(p.size, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(p.png.length, 8); e.writeUInt32LE(offset, 12); offset += p.png.length; return e; });
writeFileSync(join(out, "favicon.ico"), Buffer.concat([head, ...dir, ...parts.map((p) => p.png)]));
console.log("logo/web/favicon.ico", parts.map((p) => p.size).join(", "));
ws.close(); proc.kill(); await sleep(400);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* egal */ }
