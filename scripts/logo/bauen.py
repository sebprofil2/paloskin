#!/usr/bin/env python3
"""
Logo-Dateien aus den Original-Vektorpfaden des Schildes bauen (design/vektordateien, Quelle unverändert).
  python3 scripts/logo/bauen.py
Erzeugt in public/assets/logo/ und public/:
  zeichen.svg, zeichen-weiss.svg         das geschwungene S allein (Blau bzw. Weiß)
  wortmarke.svg                          „PALO SKIN“ gesperrt wie auf den Visitenkarten, „by Dr. Vogel“ darunter
  logo-kopf.svg                          Kopf: Zeichen blau links, Wortmarke rechts (Text in Anthrazit der Seite)
  favicon.svg                            Zeichen weiß auf Blau
  og-1200x630.svg, og-1200x1200.svg      Vorlagen für die Vorschaubilder (PNG erzeugt scripts/logo/rendern.mjs)
Pfade werden nur verschoben und gleichmäßig skaliert, nie verändert.
"""
import re, os, math

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCHILD = os.path.join(ROOT, "design/vektordateien/07-Vektordateien/02-Schild/PALO-SKIN-Schild-40x30cm.svg")
OUT = os.path.join(ROOT, "public/assets/logo")
BLAU = "#002FA7"
TINTE = "#1D1F22"
WEISS = "#FFFFFF"
SPERRUNG_EM = 0.09          # Buchstabenabstand der Wortmarke wie auf Visitenkarten und Seite
BY_ZU_PALO = 0.62           # Großbuchstabenhöhe „by Dr. Vogel“ im Verhältnis zu „PALO SKIN“ (Visitenkarten)
GOODBYE_ZU_PALO = 0.62

src = open(SCHILD, encoding="utf-8").read()

def path_d(label):
    m = re.search(r'<path[^>]*aria-label="' + re.escape(label) + r'"[^>]*\sd="([^"]*)"', src)
    assert m, label
    return m.group(1)

TOKEN = re.compile(r"[MLQCZ]|-?\d+(?:\.\d+)?")

def parse(d):
    """Liste von Teilpfaden; jeder Teilpfad ist eine Liste (Befehl, [Punkte])."""
    toks = TOKEN.findall(d)
    subs, cur, i, cmd = [], None, 0, None
    n = {"M": 1, "L": 1, "Q": 2, "C": 3, "Z": 0}
    while i < len(toks):
        t = toks[i]
        if t in n:
            cmd = t; i += 1
            if cmd == "Z":
                cur.append(("Z", [])); continue
        pts = []
        for _ in range(n[cmd]):
            pts.append((float(toks[i]), float(toks[i + 1]))); i += 2
        if cmd == "M":
            cur = [("M", pts)]; subs.append(cur)
        else:
            cur.append((cmd, pts))
    return subs

def bbox(subs):
    """Genaue Grenzen über Abtastung der Kurven."""
    xs, ys = [], []
    for sp in subs:
        last = None
        for cmd, pts in sp:
            if cmd in ("M", "L"):
                last = pts[0]; xs.append(last[0]); ys.append(last[1])
            elif cmd == "Q":
                p0, p1, p2 = last, pts[0], pts[1]
                for k in range(21):
                    t = k / 20; a = (1 - t) ** 2; b = 2 * (1 - t) * t; c = t * t
                    xs.append(a * p0[0] + b * p1[0] + c * p2[0]); ys.append(a * p0[1] + b * p1[1] + c * p2[1])
                last = p2
            elif cmd == "C":
                p0, p1, p2, p3 = last, pts[0], pts[1], pts[2]
                for k in range(31):
                    t = k / 30; a = (1 - t) ** 3; b = 3 * (1 - t) ** 2 * t; c = 3 * (1 - t) * t * t; e = t ** 3
                    xs.append(a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0]); ys.append(a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1])
                last = p3
    return min(xs), min(ys), max(xs), max(ys)

def fmt(v):
    s = f"{v:.3f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

def emit(subs, dx=0.0, dy=0.0, s=1.0):
    """Teilpfade verschoben und skaliert als d-Text: x' = (x + dx) * s."""
    out = []
    for sp in subs:
        for cmd, pts in sp:
            out.append(cmd + "".join(" " + fmt((x + dx) * s) + " " + fmt((y + dy) * s) for x, y in pts))
    return " ".join(out)

def glyphs(subs):
    """Teilpfade zu Buchstaben bündeln: eine Innenform (P, A, O, D, o, g, e) gehört zu dem Umriss, der sie umschließt.
    Überlappende x-Bereiche reichen nicht, weil die Unterschneidung P und A oder V und o überlappen lässt."""
    boxes = [bbox([sp]) for sp in subs]
    def inside(i, j):
        a, b = boxes[i], boxes[j]
        return i != j and a[0] >= b[0] - 0.01 and a[2] <= b[2] + 0.01 and a[1] >= b[1] - 0.01 and a[3] <= b[3] + 0.01 and (a[2] - a[0]) < (b[2] - b[0])
    outers = [i for i in range(len(subs)) if not any(inside(i, j) for j in range(len(subs)))]
    groups = {i: {"subs": [subs[i]], "x0": boxes[i][0], "x1": boxes[i][2]} for i in outers}
    for i in range(len(subs)):
        if i in groups: continue
        host = min((j for j in outers if inside(i, j)), key=lambda j: boxes[j][2] - boxes[j][0])
        groups[host]["subs"].append(subs[i])
    return sorted(groups.values(), key=lambda g: g["x0"])

def track(subs, em, sperrung):
    """Buchstaben um einen festen Abstand je Zwischenraum auseinanderrücken (Sperrung in em)."""
    out = []
    for k, g in enumerate(glyphs(subs)):
        shift = k * sperrung * em
        out.extend([[(cmd, [(x + shift, y) for x, y in pts]) for cmd, pts in sp] for sp in g["subs"]])
    return out

def shift(subs, dx, dy, s=1.0):
    return [[(cmd, [((x + dx) * s, (y + dy) * s) for x, y in pts]) for cmd, pts in sp] for sp in subs]

zeichen = parse(path_d("PS logo"))
palo = parse(path_d("PALO SKIN"))
by = parse(path_d("by Dr. Vogel"))
goodbye = parse(path_d("Goodbye wrinkles."))

# Großbuchstabenhöhe von PALO SKIN (P bis Grundlinie) und Geviert (Helvetica: Versalhöhe 0,717 em)
px0, py0, px1, py1 = bbox(palo)
cap = py1 - py0
em = cap / 0.717
palo_t = track(palo, em, SPERRUNG_EM)

# „by Dr. Vogel“: Höhe des D (Versal) als Maß, auf 62 Prozent der Wortmarke bringen
by_glyphs = glyphs(by)
d_glyph = by_glyphs[2]["subs"]          # b, y, D, ...
dx0, dy0, dx1, dy1 = bbox(d_glyph)
by_scale = (cap * BY_ZU_PALO) / (dy1 - dy0)
by_base = dy1                            # Grundlinie von „by Dr. Vogel“

gd = glyphs(goodbye)
g_cap = bbox(gd[0]["subs"])              # G
gb_scale = (cap * GOODBYE_ZU_PALO) / (g_cap[3] - g_cap[1])
gb_base = g_cap[3]

def wortmarke_teile(zeilenabstand=0.55):
    """PALO SKIN ab (0,0) oben links, by Dr. Vogel darunter; Rückgabe: Teilpfade je Zeile und Gesamtmaße."""
    a = shift(palo_t, -px0, -py0)
    ax = bbox(a)
    by_x0 = bbox(by)[0]
    b_line_top = cap + cap * zeilenabstand           # Oberkante der Versalien von „by Dr. Vogel“
    b = shift(by, -by_x0, -(by_base - (dy1 - dy0)), by_scale)
    b = shift(b, 0, b_line_top)
    return a, b

def svg(w, h, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" width="{fmt(w)}" height="{fmt(h)}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

os.makedirs(OUT, exist_ok=True)

# 1. Zeichen allein
zx0, zy0, zx1, zy1 = bbox(zeichen)
zw, zh = zx1 - zx0, zy1 - zy0
for name, farbe in (("zeichen.svg", BLAU), ("zeichen-weiss.svg", WEISS)):
    open(os.path.join(OUT, name), "w").write(svg(zw, zh, f'<path fill="{farbe}" d="{emit(zeichen, -zx0, -zy0)}"/>', "PALO SKIN"))

# 2. Wortmarke allein
a, b = wortmarke_teile()
ab = bbox(a + b)
open(os.path.join(OUT, "wortmarke.svg"), "w").write(svg(ab[2], ab[3], f'<path fill="{TINTE}" d="{emit(a)}"/><path fill="{TINTE}" d="{emit(b)}"/>', "PALO SKIN by Dr. Vogel"))

# 3. Kopf: Zeichen so hoch wie der Textblock (Oberkante PALO bis Unterlänge von by Dr. Vogel), Abstand wie auf dem Schild
text_h = ab[3]
z_s = text_h / zh
gap = 0.18 * text_h
kopf_w = zw * z_s + gap + ab[2]
body = (f'<path fill="{BLAU}" d="{emit(zeichen, -zx0, -zy0, z_s)}"/>'
        f'<path fill="{TINTE}" d="{emit(shift(a, zw * z_s + gap, 0))}"/>'
        f'<path fill="{TINTE}" d="{emit(shift(b, zw * z_s + gap, 0))}"/>')
open(os.path.join(OUT, "logo-kopf.svg"), "w").write(svg(kopf_w, text_h, body, "PALO SKIN by Dr. Vogel"))

# 4. Favicon: Zeichen weiß auf Blau, Zeichen 64 Prozent der Höhe
def icon(size, anteil=0.64, rund=0.0):
    s = size * anteil / zh
    ox = (size - zw * s) / 2; oy = (size - zh * s) / 2
    bg = f'<rect width="{size}" height="{size}" rx="{fmt(size * rund)}" fill="{BLAU}"/>'
    return svg(size, size, bg + f'<path fill="{WEISS}" d="{emit(shift(zeichen, -zx0, -zy0), ox / s, oy / s, s)}"/>', "PALO SKIN")
open(os.path.join(ROOT, "public/assets/favicon.svg"), "w").write(icon(64, 0.66, 0.18))
open(os.path.join(OUT, "icon-quadrat.svg"), "w").write(icon(512, 0.58, 0))

# 5. Vorschaubilder: Blau, mittig weiß Zeichen, PALO SKIN, by Dr. Vogel, Goodbye wrinkles. (Aufbau wie das Profilbild)
def og(w, h, hoehe_anteil):
    a2, b2 = wortmarke_teile(0.5)
    # „by Dr. Vogel“ unter PALO SKIN mittig, „Goodbye wrinkles.“ mit größerem Abstand
    gx0 = bbox(goodbye)[0]
    g2 = shift(goodbye, -gx0, -(gb_base - (g_cap[3] - g_cap[1])), gb_scale)
    aw = bbox(a2)[2]; bw = bbox(b2)[2] - bbox(b2)[0]; gw = bbox(g2)[2]
    b2 = shift(b2, (aw - bw) / 2 - bbox(b2)[0], 0)
    g_top = bbox(b2)[3] + cap * 1.05
    g2 = shift(g2, (aw - gw) / 2, g_top)
    block = a2 + b2 + g2
    bb = bbox(block)
    # Zeichen über dem Text, Höhe 1,9 Versalhöhen der Wortmarke wie auf dem Profilbild
    zs = (cap * 3.2) / zh
    z_w = zw * zs
    z_top = -(zh * zs) - cap * 1.25
    zeichen2 = shift(zeichen, -zx0, -zy0, zs)
    zeichen2 = shift(zeichen2, (aw - z_w) / 2, z_top)
    alles = zeichen2 + block
    tb = bbox(alles)
    total_h = tb[3] - tb[1]
    s = (h * hoehe_anteil) / total_h
    ox = (w - (tb[2] - tb[0]) * s) / 2 - tb[0] * s
    oy = (h - total_h * s) / 2 - tb[1] * s
    def put(subs): return emit(shift(subs, ox / s, oy / s, s))
    body = f'<rect width="{w}" height="{h}" fill="{BLAU}"/><path fill="{WEISS}" d="{put(zeichen2)}"/><path fill="{WEISS}" d="{put(a2)}"/><path fill="{WEISS}" d="{put(b2)}"/><path fill="{WEISS}" d="{put(g2)}"/>'
    return svg(w, h, body, "PALO SKIN by Dr. Vogel, Goodbye wrinkles.")
open(os.path.join(OUT, "og-1200x630.svg"), "w").write(og(1200, 630, 0.74))
open(os.path.join(OUT, "og-1200x1200.svg"), "w").write(og(1200, 1200, 0.62))

print("Versalhöhe Wortmarke", fmt(cap), "| Kopf", fmt(kopf_w), "x", fmt(text_h), "| Seitenverhältnis", round(kopf_w / text_h, 3))
print("Buchstaben PALO SKIN:", len(glyphs(palo)), "| by Dr. Vogel:", len(by_glyphs), "| Goodbye:", len(gd))
