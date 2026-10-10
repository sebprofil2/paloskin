/*
 * Ganzseitige Aufnahmen über Chrome ohne Fenster, für Vorher-nachher-Vergleiche und Vorschauen.
 *   node scripts/aufnahmen.mjs <Basis-URL> <Zielordner> [breiten=390,1280] [sprachen=de,en,es,fr,pt] [seiten=start,buchung,...] [dpr=1]
 * Seiten: start, menue (Startseite mit offener Sprachauswahl, nur sichtbarer Bereich), buchung, impressum, datenschutz, fehlt (404).
 * Dateien: <seite>-<sprache>-<breite>.png. Die Sprache kommt über ?lang=, gespeicherte Wahl gibt es im frischen Profil nicht.
 *
 * Vergleich zweier Ordner (Pixel für Pixel, gleiche Dateinamen):
 *   node scripts/aufnahmen.mjs vergleich <Ordner A> <Ordner B> [Differenzordner]
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);

if (args[0] === "vergleich") {
  const sharp = (await import("sharp")).default;
  const [, a, b, diffDir] = args;
  if (diffDir) mkdirSync(diffDir, { recursive: true });
  let bad = 0;
  for (const f of readdirSync(a).filter((x) => x.endsWith(".png")).sort()) {
    if (!existsSync(join(b, f))) { console.log(`FEHLT  ${f}`); bad++; continue; }
    const [ia, ib] = await Promise.all([join(a, f), join(b, f)].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
    if (ia.info.width !== ib.info.width || ia.info.height !== ib.info.height) {
      console.log(`GRÖSSE ${f}: ${ia.info.width}x${ia.info.height} gegen ${ib.info.width}x${ib.info.height}`);
      bad++;
      continue;
    }
    let n = 0;
    const out = Buffer.alloc(ia.data.length);
    for (let i = 0; i < ia.data.length; i += 4) {
      const d = ia.data[i] !== ib.data[i] || ia.data[i + 1] !== ib.data[i + 1] || ia.data[i + 2] !== ib.data[i + 2];
      if (d) n++;
      out[i] = d ? 255 : ia.data[i] >> 2; out[i + 1] = d ? 0 : ia.data[i + 1] >> 2; out[i + 2] = d ? 0 : ia.data[i + 2] >> 2; out[i + 3] = 255;
    }
    console.log(`${n ? "ANDERS" : "gleich"} ${f}${n ? `: ${n} Pixel` : ""}`);
    if (n) {
      bad++;
      if (diffDir) await sharp(out, { raw: { width: ia.info.width, height: ia.info.height, channels: 4 } }).png().toFile(join(diffDir, f));
    }
  }
  console.log(bad ? `${bad} Abweichungen` : "Alle Aufnahmen gleich");
  process.exit(bad ? 1 : 0);
}

const [base, outDir, ...rest] = args;
if (!base || !outDir) { console.error("Aufruf: node scripts/aufnahmen.mjs <Basis-URL> <Zielordner> [breiten=…] [sprachen=…] [seiten=…] [dpr=…]"); process.exit(1); }
const opt = Object.fromEntries(rest.map((x) => x.split("=")));
const widths = (opt.breiten ?? "390,1280").split(",").map(Number);
const langs = (opt.sprachen ?? "de,en,es,fr,pt").split(",");
const pages = (opt.seiten ?? "start,menue,buchung,impressum,datenschutz,fehlt").split(",");
const dpr = Number(opt.dpr ?? 1);
const PATHS = { start: "/", menue: "/", buchung: "/booking", impressum: "/impressum", datenschutz: "/datenschutz", fehlt: "/gibt-es-nicht" };
mkdirSync(outDir, { recursive: true });

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "palo-chrome-"));
const port = 9334;
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "--font-render-hinting=none", "--lang=de", "about:blank"], { stdio: "ignore" });
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
ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });

for (const w of widths) {
  const mobile = w < 768;
  for (const page of pages) {
    for (const lang of langs) {
      await send("Network.clearBrowserCookies");
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: mobile ? 844 : 900, deviceScaleFactor: dpr, mobile });
      await send("Network.setUserAgentOverride", { userAgent: mobile ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36", acceptLanguage: "de-DE,de" });
      const url = `${base}${PATHS[page]}?lang=${lang}`;
      await send("Page.navigate", { url });
      await sleep(400);
      await evalJs("new Promise(r => { const go = () => document.fonts.ready.then(() => setTimeout(r, 900)); document.readyState === 'complete' ? go() : addEventListener('load', go); })");
      await evalJs("(() => { try { localStorage.clear(); } catch (e) {} })()");
      let clip;
      if (page === "menue") {
        await evalJs("document.querySelector('.lang-btn')?.click()");
        await sleep(300);
        clip = { x: 0, y: 0, width: w, height: mobile ? 844 : 900, scale: 1 };
      } else {
        const h = await evalJs("Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))");
        clip = { x: 0, y: 0, width: w, height: h, scale: 1 };
      }
      const shot = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: true });
      const file = join(outDir, `${page}-${lang}-${w}.png`);
      writeFileSync(file, Buffer.from(shot.result.data, "base64"));
      console.log(file);
    }
  }
}
ws.close();
proc.kill();
await sleep(300);
rmSync(profile, { recursive: true, force: true });
