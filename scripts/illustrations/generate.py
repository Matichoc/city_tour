#!/usr/bin/env python3
"""
Genera las ilustraciones vectoriales (SVG) de la guía.

Son ilustraciones CREADAS POR IA (dibujadas en código por el asistente), no
fotos: escenas genéricas de la costa y el campo, sin un lugar real concreto. En
la interfaz siempre se muestran con el rótulo «Ilustración IA»
(src/components/ui/ai-badge.tsx). Ver docs/IMAGENES.md.

Uso:  python3 scripts/illustrations/generate.py
Salida: public/ilustraciones/<nombre>.svg  (1200 × 675)
"""
import math
import os
import random

W, H = 1200, 675
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "ilustraciones")


# ── piezas básicas ────────────────────────────────────────────────────────
def grad(gid, stops, x1=0, y1=0, x2=0, y2=1):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{gid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def rgrad(gid, stops):
    s = "".join(
        f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops
    )
    return f'<radialGradient id="{gid}">{s}</radialGradient>'


def rect(x, y, w, h, fill, rx=0, op=1, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" opacity="{op}" {extra}/>'


def circle(cx, cy, r, fill, op=1):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" opacity="{op}"/>'


def ellipse(cx, cy, rx, ry, fill, op=1, extra=""):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" opacity="{op}" {extra}/>'


def path(d, fill="none", stroke="none", sw=0, op=1, extra=""):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}" {extra}/>'


def poly(points, fill, op=1):
    pts = " ".join(f"{x},{y}" for x, y in points)
    return f'<polygon points="{pts}" fill="{fill}" opacity="{op}"/>'


def line(x1, y1, x2, y2, stroke, sw=2, op=1, cap="round"):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}" opacity="{op}"/>'


def g(content, transform=""):
    return f'<g transform="{transform}">{content}</g>'


def wavy(y, amp, wl, color, op=1, x0=-40, x1=W + 40, bottom=H):
    """Banda ondulada que llena hasta `bottom`."""
    d = f"M{x0} {y}"
    x = x0
    up = True
    while x < x1:
        d += f" Q{x + wl / 2} {y + (-amp if up else amp)} {x + wl} {y}"
        x += wl
        up = not up
    d += f" L{x1 + wl} {bottom} L{x0} {bottom}Z"
    return path(d, fill=color, op=op)


def hills(y, amp, color, seed, op=1, bottom=H, step=180):
    rnd = random.Random(seed)
    d = f"M-20 {y}"
    x = -20
    while x < W + 40:
        d += f" Q{x + step / 2} {y - amp * rnd.uniform(0.4, 1)} {x + step} {y - rnd.uniform(-amp / 4, amp / 4)}"
        x += step
    d += f" L{W + 40} {bottom} L-20 {bottom}Z"
    return path(d, fill=color, op=op)


def sun(cx, cy, r, core="#fff3c4", mid="#ffb454", glow=2.6, gid="sun"):
    defs = rgrad(gid, [(0, core, 1), (0.35, mid, 0.95), (1, mid, 0)])
    return defs, circle(cx, cy, r * glow, f"url(#{gid})") + circle(cx, cy, r, core)


def cloud(x, y, s=1, color="#ffffff", op=0.7):
    return g(
        ellipse(0, 0, 70, 20, color, op)
        + ellipse(-35, -12, 36, 22, color, op)
        + ellipse(20, -18, 40, 26, color, op),
        f"translate({x} {y}) scale({s})",
    )


def bird(x, y, s=1, color="#ffffff", op=0.85):
    return path(
        "M0 0 Q8 -9 16 0 Q24 -9 32 0",
        stroke=color,
        sw=2.4,
        op=op,
        extra=f'transform="translate({x} {y}) scale({s})" stroke-linecap="round"',
    )


def sparkles(y0, y1, n, seed, color="#ffffff", op=0.55):
    rnd = random.Random(seed)
    out = ""
    for _ in range(n):
        x = rnd.uniform(40, W - 40)
        y = rnd.uniform(y0, y1)
        w = rnd.uniform(14, 42)
        out += line(x, y, x + w, y, color, 2, op)
    return out


def person(x, y, s=1, shirt="#e0553a", pants="#33465a", hat=None, arms_up=False, skin="#e8b48a"):
    body = (
        rect(-9, 14, 18, 30, shirt, 7)
        + rect(-8, 42, 7, 26, pants, 3)
        + rect(1, 42, 7, 26, pants, 3)
        + circle(0, 4, 9, skin)
    )
    if hat:
        body += ellipse(0, -2, 14, 4, hat) + path("M-8 -2 Q0 -14 8 -2Z", fill=hat)
    if arms_up:
        body += line(-8, 20, -18, 0, skin, 5) + line(8, 20, 18, 0, skin, 5)
    else:
        body += line(-9, 20, -12, 40, skin, 5) + line(9, 20, 12, 40, skin, 5)
    return g(body, f"translate({x} {y}) scale({s})")


def silhouette(x, y, s=1, color="#1b2a3a", arms_up=False):
    body = (
        rect(-9, 14, 18, 32, color, 7)
        + rect(-8, 44, 7, 26, color, 3)
        + rect(1, 44, 7, 26, color, 3)
        + circle(0, 4, 9, color)
    )
    if arms_up:
        body += line(-8, 20, -20, -4, color, 5) + line(8, 20, 20, -4, color, 5)
    return g(body, f"translate({x} {y}) scale({s})")


def boat(x, y, s=1, hull="#2f6f9f", trim="#ffffff", cabin="#f5e6c8", flag=None):
    parts = (
        path("M-70 0 L70 0 L52 26 L-52 26Z", fill=hull)
        + rect(-70, -4, 140, 8, trim, 3)
        + rect(-18, -34, 36, 32, cabin, 3)
        + rect(-12, -28, 10, 12, "#7fb3c8", 2)
        + line(34, -2, 34, -70, "#5b3a1e", 4)
    )
    if flag:
        parts += poly([(34, -70), (62, -62), (34, -52)], flag)
    parts += ellipse(0, 30, 62, 5, "#000000", 0.12)
    return g(parts, f"translate({x} {y}) scale({s})")


def house(x, y, w, h, wall, roof, door="#7a4a24", win="#bfe3ee", shutters="#2a6a8a", chimney=False):
    rh = h * 0.45
    parts = rect(0, 0, w, h, wall) + poly([(-10, 0), (w / 2, -rh), (w + 10, 0)], roof)
    if chimney:
        parts += rect(w * 0.7, -rh * 0.85, 14, rh * 0.6, roof)
    parts += rect(w * 0.42, h * 0.45, w * 0.16, h * 0.55, door, 3)
    for wx in (w * 0.12, w * 0.7):
        parts += rect(wx, h * 0.2, w * 0.18, h * 0.25, win, 2)
        parts += rect(wx - 6, h * 0.2, 6, h * 0.25, shutters)
        parts += rect(wx + w * 0.18, h * 0.2, 6, h * 0.25, shutters)
    return g(parts, f"translate({x} {y})")


def palm(x, y, s=1, trunk="#7a4a24", leaf="#2f7d4a"):
    parts = path("M0 0 Q-10 -80 6 -150", stroke=trunk, sw=11, extra='stroke-linecap="round"')
    for ang, ln in [(-160, 80), (-130, 90), (-95, 80), (-60, 90), (-25, 80), (10, 70)]:
        rad = math.radians(ang)
        ex, ey = 6 + math.cos(rad) * ln, -150 + math.sin(rad) * ln * 0.7 + 30
        parts += path(
            f"M6 -150 Q{6 + math.cos(rad) * ln * 0.5} {-150 + math.sin(rad) * ln * 0.2 - 30} {ex} {ey}",
            stroke=leaf,
            sw=9,
            extra='stroke-linecap="round"',
        )
    return g(parts, f"translate({x} {y}) scale({s})")


def parasol(x, y, s=1, c1="#e0553a", c2="#ffffff"):
    parts = line(0, 0, 0, 110, "#7a4a24", 5)
    r = 70
    parts += path(f"M{-r} 0 Q0 {-r * 0.9} {r} 0Z", fill=c1)
    for i in range(-2, 3, 2):
        parts += path(
            f"M{i * r / 3} {-r * 0.78 + abs(i) * 4} L{(i - 1) * r / 3 + r / 3 * 0.1} 0 L{(i + 1) * r / 3} 0Z",
            fill=c2,
            op=0.9,
        )
    parts += ellipse(0, 112, 40, 6, "#000000", 0.1)
    return g(parts, f"translate({x} {y}) scale({s})")


def lounger(x, y, s=1, color="#ffffff"):
    return g(
        path("M0 0 L70 -22 L96 -22 L96 -14 L72 -14 L8 8Z", fill=color)
        + line(8, 8, 8, 24, "#7a4a24", 4)
        + line(88, -14, 88, 8, "#7a4a24", 4),
        f"translate({x} {y}) scale({s})",
    )


def awning(x, y, w, c1, c2, h=50, n=8):
    sw = w / n
    parts = ""
    for i in range(n):
        parts += poly(
            [(x + i * sw, y), (x + (i + 1) * sw, y), (x + (i + 1) * sw - 5, y + h), (x + i * sw + 5, y + h)],
            c1 if i % 2 == 0 else c2,
        )
    parts += path(
        f"M{x} {y + h} " + "".join(f"Q{x + i * sw + sw / 2} {y + h + 14} {x + (i + 1) * sw} {y + h} " for i in range(n)),
        fill="none",
        stroke="#00000022",
        sw=2,
    )
    return parts


def bunting(x1, y1, x2, y2, colors, n=10, sag=26, size=20):
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2 + sag
    parts = path(f"M{x1} {y1} Q{cx} {cy} {x2} {y2}", stroke="#5b3a1e", sw=2)
    for i in range(1, n):
        t = i / n
        bx = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t**2 * x2
        by = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t**2 * y2
        parts += poly([(bx - size / 2, by), (bx + size / 2, by), (bx, by + size * 1.3)], colors[i % len(colors)])
    return parts


def stars_field(n, seed, y_max=330):
    rnd = random.Random(seed)
    return "".join(
        circle(rnd.uniform(10, W - 10), rnd.uniform(10, y_max), rnd.uniform(0.8, 2.2), "#ffffff", rnd.uniform(0.4, 1))
        for _ in range(n)
    )


def horse(x, y, s=1, color="#2a1810", rider=True, rider_color="#1b2a3a"):
    parts = ellipse(0, 0, 62, 26, color)  # cuerpo
    parts += path("M40 -14 Q62 -42 74 -62 L92 -52 Q72 -34 60 -2Z", fill=color)  # cuello
    parts += path("M70 -64 Q92 -80 112 -56 Q108 -48 92 -48 Q84 -50 76 -52Z", fill=color)  # cabeza
    parts += poly([(80, -64), (86, -80), (92, -62)], color)  # oreja
    parts += path("M-58 -10 Q-92 0 -86 50 Q-80 22 -56 10Z", fill=color)  # cola
    for lx in (-44, -26, 28, 46):
        parts += rect(lx, 14, 9, 52, color, 3)
    if rider:
        parts += silhouette(8, -92, 0.9, rider_color)
        parts += path("M-10 -32 Q8 -44 26 -32", stroke=rider_color, sw=6)
    return g(parts, f"translate({x} {y}) scale({s})")


def sea_with_horizon(y, top, bottom, gid):
    return grad(gid, [(0, top), (1, bottom)]), rect(0, y, W, H - y, f"url(#{gid})")


def wrap(defs, body, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img">'
        f"<title>{title}</title><defs>{defs}</defs>{body}</svg>"
    )


# ── escenas ──────────────────────────────────────────────────────────────
def scene_caleta():
    d = grad("sky", [(0, "#ff8a5c"), (0.55, "#ffc07a"), (1, "#ffe3a8")])
    sd, sn = sun(820, 330, 64, gid="sun")
    sea_d, sea = sea_with_horizon(360, "#f0a368", "#0b7285", "sea")
    b = rect(0, 0, W, 360, "url(#sky)") + sd and ""
    body = rect(0, 0, W, 360, "url(#sky)") + sn + sea
    body += sparkles(372, 470, 14, 1, "#fff3c4", 0.6)
    body += wavy(430, 10, 90, "#1c8fa3", 0.55) + wavy(455, 8, 70, "#0b7285", 0.5)
    body += hills(380, 40, "#8a5a3a", 3, 0.9, bottom=400, step=240)
    for hx, hw, hc, rc in [(920, 90, "#f5e6c8", "#c6553a"), (1030, 76, "#e8b48a", "#2f6f9f"), (800, 70, "#cfe4ea", "#8a3b2a")]:
        body += house(hx, 336, hw, 54, hc, rc)
    body += path(f"M-20 520 Q300 470 620 510 T1240 490 L1240 {H} L-20 {H}Z", fill="#ecd29a")
    body += path(f"M-20 580 Q360 540 700 575 T1240 560 L1240 {H} L-20 {H}Z", fill="#d9b676")
    body += boat(250, 520, 1.5, "#2f6f9f", "#ffffff", "#f5e6c8", "#ff7a59")
    body += boat(560, 545, 1.2, "#c6553a", "#ffffff", "#f5e6c8")
    body += boat(930, 530, 1.35, "#e8a23a", "#ffffff", "#f5e6c8", "#0b7285")
    body += person(410, 480, 0.9, "#ff7a59", "#2a3a4a", "#f5e6c8") + person(700, 505, 0.8, "#2f6f9f", "#2a3a4a")
    body += person(140, 520, 0.85, "#e8c23a", "#2a3a4a", "#c6553a")
    body += path("M60 640 Q180 600 300 640", stroke="#7a4a24", sw=3, op=0.7)
    for bx, by in [(300, 160), (360, 190), (440, 150)]:
        body += bird(bx, by, 1.1)
    return wrap(d + sea_d + sd, body, "Caleta de pescadores al atardecer")


def scene_cabalgata():
    d = grad("sky", [(0, "#6a4c93"), (0.4, "#e0707a"), (0.8, "#ffb27a"), (1, "#ffe3a8")])
    sd, sn = sun(300, 360, 80, gid="sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn
    body += cloud(700, 120, 1.4, "#ffd1c4", 0.5) + cloud(960, 200, 1, "#ffd1c4", 0.45)
    body += hills(400, 36, "#9e5a63", 5, 0.8, step=260)
    body += hills(450, 40, "#c4854a", 7, 1, step=300)
    body += hills(520, 34, "#a86a38", 9, 1, step=340)
    body += hills(585, 28, "#8a5430", 11, 1, step=260)
    body += wavy(640, 6, 60, "#6e4326", 0.6)
    body += horse(760, 500, 1.35) + horse(560, 540, 1.05, "#3a2214", True, "#2a2030")
    body += ellipse(760, 560, 110, 10, "#000000", 0.18) + ellipse(560, 590, 90, 8, "#000000", 0.15)
    for bx, by in [(180, 140), (230, 170), (900, 130), (980, 160)]:
        body += bird(bx, by, 1.1, "#3a2a3a", 0.7)
    for gx in range(60, 1180, 90):
        body += path(f"M{gx} 650 Q{gx - 6} 625 {gx - 12} 612 M{gx} 650 Q{gx + 2} 622 {gx + 6} 608", stroke="#5b3a1e", sw=3, op=0.7)
    return wrap(d + sd, body, "Cabalgata al atardecer entre dunas")


def scene_surf():
    d = grad("sky", [(0, "#4ec3e0"), (1, "#e8f7fa")])
    sd, sn = sun(950, 130, 46, "#fffbe0", "#ffd36a", 2.4, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + cloud(220, 120, 1.3) + cloud(620, 80, 1)
    body += rect(0, 300, W, H - 300, "#14a3bd")
    body += wavy(330, 8, 80, "#1fb6c9", 0.7, bottom=420) + wavy(360, 9, 100, "#0f8aa3", 0.8, bottom=470)
    # ola grande
    body += path(
        "M120 560 Q220 330 520 290 Q760 270 880 380 Q810 340 720 360 Q600 400 560 470 Q500 560 380 600 Q250 620 120 560Z",
        fill="#0a6f8a",
    )
    body += path("M520 290 Q700 270 820 340 Q700 320 600 350 Q540 380 520 290Z", fill="#e8fbff", op=0.95)
    body += path("M300 560 Q420 480 560 470 Q620 440 700 380", stroke="#bdeaf2", sw=5, op=0.8)
    body += wavy(600, 12, 90, "#0b7285", 1, bottom=H)
    body += sparkles(480, 600, 10, 4, "#ffffff", 0.5)
    # surfista
    sx, sy = 640, 400
    body += g(
        path("M-70 28 Q0 12 70 28 Q0 38 -70 28Z", fill="#ff7a59")
        + line(-60, 28, 60, 28, "#ffe3a8", 3)
        + rect(-6, -30, 12, 52, "#1b3a5a", 5)
        + circle(0, -42, 10, "#e8b48a")
        + line(-4, -20, -34, -34, "#e8b48a", 5)
        + line(4, -20, 40, -26, "#e8b48a", 5)
        + path("M-4 22 L-18 50 M4 22 L22 46", stroke="#1b3a5a", sw=8, extra='stroke-linecap="round"'),
        f"translate({sx} {sy}) rotate(-12)",
    )
    body += g(
        path("M-60 22 Q0 10 60 22 Q0 32 -60 22Z", fill="#ffd36a") + circle(0, -10, 9, "#e8b48a") + rect(-5, -4, 10, 22, "#e0553a", 4),
        "translate(330 470) rotate(6)",
    )
    # arena y tablas
    body += path(f"M-20 640 Q300 600 640 630 T1240 615 L1240 {H} L-20 {H}Z", fill="#ecd29a")
    for tx, col in [(900, "#ff7a59"), (960, "#ffd36a"), (1020, "#1fb6c9"), (1080, "#e0553a")]:
        body += g(
            path("M0 0 Q18 -70 0 -120 Q-18 -70 0 0Z", fill=col) + line(0, -110, 0, -6, "#ffffff", 3, 0.7),
            f"translate({tx} 650) rotate({(tx - 990) / 12})",
        )
    body += bird(180, 190, 1.1, "#3a5a6a", 0.8) + bird(250, 215, 0.9, "#3a5a6a", 0.8)
    return wrap(d + sd, body, "Surfistas en una ola grande")


def scene_parador():
    d = grad("sky", [(0, "#6fd0ea"), (1, "#f2fbfd")])
    sd, sn = sun(1020, 110, 44, "#fffbe0", "#ffd36a", 2.4, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + cloud(240, 120, 1.2) + cloud(620, 90, 0.9)
    body += rect(0, 280, W, 130, "#19a9c4") + wavy(300, 7, 70, "#35c6dc", 0.7, bottom=380) + wavy(340, 8, 90, "#0f8aa3", 0.6, bottom=410)
    body += sparkles(290, 400, 10, 2, "#ffffff", 0.6)
    body += path(f"M-20 420 Q300 395 640 415 T1240 405 L1240 {H} L-20 {H}Z", fill="#f2dfb0")
    body += path(f"M-20 520 Q360 490 700 515 T1240 500 L1240 {H} L-20 {H}Z", fill="#ecd29a")
    # kiosco
    body += rect(840, 360, 260, 130, "#fff4dc") + awning(826, 340, 288, "#ff7a59", "#ffffff", 54, 9)
    body += rect(870, 410, 80, 80, "#bfe3ee", 4) + rect(980, 410, 90, 80, "#7a4a24", 4)
    body += rect(860, 456, 100, 12, "#7a4a24", 3)
    for jx, jc in [(880, "#ff9a3a"), (910, "#e8445a"), (940, "#7bc05a")]:
        body += rect(jx, 436, 18, 22, jc, 4, 0.95) + line(jx + 9, 426, jx + 14, 410, "#ffffff", 2)
    # sombrillas y reposeras
    body += parasol(150, 470, 1.3, "#e0553a", "#ffffff") + parasol(400, 500, 1.15, "#1fb6c9", "#ffffff") + parasol(640, 470, 1.25, "#ffd36a", "#ffffff")
    body += lounger(250, 590, 1.2, "#ffffff") + lounger(520, 600, 1.15, "#ffd1c4") + lounger(740, 590, 1.1, "#ffffff")
    body += person(300, 520, 0.8, "#ff7a59", "#2a3a4a", "#ffd36a") + person(560, 535, 0.75, "#1fb6c9", "#c6553a")
    # castillo de arena y balde
    body += poly([(940, 610), (1000, 610), (990, 570), (950, 570)], "#d9b676") + poly([(960, 570), (980, 570), (970, 545)], "#d9b676")
    body += rect(1030, 598, 28, 26, "#e0553a", 4) + path("M1030 598 Q1044 580 1058 598", stroke="#e0553a", sw=3)
    body += palm(60, 520, 1.1) + bird(300, 160, 1, "#3a5a6a", 0.8) + bird(360, 185, 0.9, "#3a5a6a", 0.8)
    return wrap(d + sd, body, "Parador de playa con sombrillas")


def scene_casas():
    d = grad("sky", [(0, "#72c7e6"), (1, "#f6efd9")])
    body = rect(0, 0, W, H, "url(#sky)") + cloud(200, 110, 1.2) + cloud(900, 80, 1)
    body += hills(330, 50, "#7bb06a", 3, 1, step=300, bottom=480) + hills(370, 36, "#5e9a58", 8, 1, step=260, bottom=480)
    # mar lejano
    body += rect(0, 330, 360, 14, "#5fc3da", 0, 0.8)
    # casas
    body += house(60, 270, 250, 190, "#f0c27a", "#b8462f", chimney=True)
    body += house(340, 300, 220, 160, "#8fc5d9", "#6b4a3a", shutters="#e0553a")
    body += house(590, 260, 260, 200, "#f2b8b0", "#7a3a2a", shutters="#2a6a8a", chimney=True)
    body += house(880, 295, 240, 165, "#cfe08a", "#b8462f", shutters="#6b4a3a")
    # balcón
    body += rect(590, 330, 260, 8, "#7a4a24", 2) + "".join(line(600 + i * 22, 338, 600 + i * 22, 362, "#7a4a24", 3) for i in range(11))
    # calle empedrada
    body += path(f"M-20 470 L1220 470 L1220 {H} L-20 {H}Z", fill="#cdbf9e")
    body += path(f"M-20 500 Q600 480 1220 500 L1220 {H} L-20 {H}Z", fill="#bfae86")
    rnd = random.Random(5)
    for _ in range(90):
        sx, sy = rnd.uniform(0, W), rnd.uniform(500, 660)
        body += ellipse(sx, sy, rnd.uniform(14, 28), rnd.uniform(5, 9), "#a8966e", 0.55)
    # faroles
    for lx in (330, 870):
        body += rect(lx - 3, 360, 6, 170, "#2a3a4a") + path(f"M{lx - 16} 360 L{lx + 16} 360 L{lx + 10} 340 L{lx - 10} 340Z", fill="#2a3a4a") + circle(lx, 350, 8, "#ffe3a8")
    body += person(500, 520, 1.1, "#e0553a", "#2a3a4a", "#f5e6c8") + person(560, 524, 0.95, "#1fb6c9", "#c6553a") + person(780, 530, 1, "#e8c23a", "#2a3a4a")
    body += palm(1130, 470, 0.9) + bird(420, 150, 1, "#3a5a6a", 0.8)
    return wrap(d, body, "Calle con casas antiguas del pueblo")


def scene_cocineria():
    d = grad("sky", [(0, "#4a3a8a"), (0.5, "#e0707a"), (1, "#ffc27a")])
    sd, sn = sun(900, 300, 56, "#fff0c0", "#ffb454", 2.6, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn
    body += rect(0, 330, W, 160, "#26567a") + wavy(340, 8, 80, "#3a7a9a", 0.7, bottom=420) + sparkles(345, 430, 14, 6, "#ffe3a8", 0.6)
    body += rect(0, 480, W, H - 480, "#7a4a24") + "".join(line(0, 500 + i * 34, W, 500 + i * 34, "#5b3a1e", 3, 0.5) for i in range(6))
    # baranda
    body += rect(0, 440, W, 12, "#5b3a1e") + "".join(rect(40 + i * 120, 400, 12, 60, "#5b3a1e", 3) for i in range(10))
    # luces
    body += bunting(0, 90, W, 90, ["#ffd36a"], 14, 50, 0)
    for i in range(1, 14):
        t = i / 14
        lx = t * W
        ly = 90 + 4 * 50 * t * (1 - t)
        body += circle(lx, ly + 8, 9, "#fff3c4") + circle(lx, ly + 8, 22, "#ffd36a", 0.25)
    # mesa
    body += rect(240, 520, 720, 24, "#c6553a", 8) + path("M240 544 L960 544 L930 640 L270 640Z", fill="#e8e0d0")
    body += "".join(rect(260 + i * 50, 544, 25, 96, "#c6553a", 0, 0.7) for i in range(14))
    # plato con pescado
    body += ellipse(600, 505, 200, 30, "#ffffff") + ellipse(600, 500, 170, 22, "#f2f2ee")
    body += path("M470 498 Q540 460 640 480 Q700 490 740 498 Q700 520 640 518 Q540 532 470 498Z", fill="#e0a36a")
    body += poly([(740, 498), (790, 470), (790, 526)], "#d98a4a") + circle(500, 494, 5, "#2a1810")
    for i in range(6):
        body += path(f"M{560 + i * 28} 480 Q{570 + i * 28} 498 {560 + i * 28} 514", stroke="#b87a3a", sw=3, op=0.7)
    body += circle(660, 498, 20, "#ffe14a") + circle(660, 498, 12, "#fff3a0")  # limón
    # copas y botella
    for cx_ in (330, 880):
        body += path(f"M{cx_} 470 L{cx_ + 34} 470 L{cx_ + 28} 510 Q{cx_ + 17} 520 {cx_ + 6} 510Z", fill="#ffffff", op=0.5) + rect(cx_ + 15, 510, 4, 16, "#ffffff", 0, 0.6)
    body += rect(980, 430, 34, 90, "#2f7d4a", 8) + rect(990, 400, 14, 36, "#2f7d4a", 4)
    body += bird(200, 190, 1.1, "#fff3d6", 0.8) + bird(270, 225, 0.9, "#fff3d6", 0.8)
    return wrap(d + sd, body, "Terraza de cocinería frente al mar")


def scene_mariscos():
    d = grad("sky", [(0, "#7fd3ea"), (1, "#fff4dc")])
    body = rect(0, 0, W, H, "url(#sky)") + cloud(220, 120, 1.3) + cloud(820, 90, 1)
    body += rect(0, 250, W, 130, "#1c93ad") + wavy(270, 7, 70, "#35c6dc", 0.7, bottom=350) + sparkles(260, 370, 12, 8, "#ffffff", 0.6)
    body += boat(240, 330, 1.2, "#e0553a", "#ffffff", "#f5e6c8", "#ffd36a") + boat(930, 320, 1, "#2f6f9f", "#ffffff", "#f5e6c8")
    body += rect(0, 380, W, H - 380, "#b98a52") + "".join(line(0, 410 + i * 40, W, 410 + i * 40, "#8a6334", 3, 0.5) for i in range(7))
    # toldo
    body += awning(180, 40, 840, "#e0553a", "#ffffff", 86, 14) + bunting(180, 140, 1020, 140, ["#ffd36a", "#1fb6c9", "#ff7a59"], 16, 24, 18)
    body += rect(190, 40, 8, 380, "#7a4a24") + rect(1002, 40, 8, 380, "#7a4a24")
    # mesa y cajones
    body += rect(200, 470, 800, 30, "#8a5a30", 6) + rect(230, 500, 14, 140, "#6a4220") + rect(956, 500, 14, 140, "#6a4220")
    body += rect(240, 440, 220, 36, "#d9b676", 4) + rect(500, 440, 220, 36, "#d9b676", 4) + rect(760, 440, 200, 36, "#d9b676", 4)
    rnd = random.Random(12)
    for bx in (260, 520, 780):
        for _ in range(7):
            ex, ey = bx + rnd.uniform(10, 190), 430 + rnd.uniform(-8, 6)
            col = rnd.choice(["#e0553a", "#ff7a59", "#e8b48a", "#b53a2a"])
            body += circle(ex, ey, rnd.uniform(11, 16), col) + circle(ex - 8, ey - 12, 4, col) + circle(ex + 8, ey - 12, 4, col)
    # conchas
    for cx_, cy_ in [(330, 585), (430, 610), (560, 590), (700, 612), (820, 588), (900, 606)]:
        body += path(f"M{cx_ - 24} {cy_} Q{cx_} {cy_ - 40} {cx_ + 24} {cy_}Z", fill="#f0d9b0") + "".join(
            line(cx_, cy_, cx_ + i * 8, cy_ - 24, "#c9a26a", 2) for i in (-2, -1, 0, 1, 2)
        )
    body += person(120, 470, 1.3, "#2f6f9f", "#33465a", "#f5e6c8") + person(1090, 475, 1.25, "#e8c23a", "#33465a", "#c6553a")
    return wrap(d, body, "Puesto de mariscos en la caleta")


def scene_huerta():
    d = grad("sky", [(0, "#78c8ec"), (1, "#f7f1d8")])
    sd, sn = sun(1000, 120, 48, "#fffbe0", "#ffd36a", 2.4, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + cloud(240, 100, 1.4) + cloud(680, 150, 1)
    body += hills(330, 46, "#8ec36a", 4, 1, step=300) + hills(380, 40, "#6fa856", 9, 1, step=260)
    body += rect(0, 380, W, H - 380, "#7cb25a")
    # surcos
    for i in range(-6, 14):
        x0 = 100 * i + 200
        body += path(f"M{x0} 660 L{600 + (x0 - 600) * 0.12} 400", stroke="#5f9a42", sw=26, op=0.8)
        body += path(f"M{x0 + 30} 660 L{600 + (x0 + 30 - 600) * 0.12} 400", stroke="#8fc86e", sw=10, op=0.7)
    for i in range(10):
        for j in range(6):
            t = j / 6
            px = (150 + i * 110) * (1 - t) + 600 * t * 1 + (i - 5) * 6 * t
            body += circle(px, 640 - t * 220, 9 - t * 5, "#e0553a" if (i + j) % 2 else "#ff9a3a")
    # granero
    body += rect(90, 250, 220, 150, "#c6453a") + poly([(70, 250), (200, 170), (330, 250)], "#8a2f28") + rect(160, 310, 80, 90, "#f5e6c8", 3)
    body += line(160, 310, 240, 400, "#c6453a", 4) + line(240, 310, 160, 400, "#c6453a", 4)
    body += rect(330, 200, 46, 200, "#cfcfc8") + path("M326 200 Q353 160 380 200Z", fill="#9a9a94")
    # vaca y cerca
    cow = (
        rect(-50, -24, 100, 48, "#ffffff", 14) + ellipse(-14, -6, 16, 12, "#2a2a2a") + ellipse(22, 6, 14, 10, "#2a2a2a")
        + rect(40, -34, 30, 30, "#ffffff", 8) + ellipse(60, -22, 6, 5, "#e8b4a8")
        + "".join(rect(lx, 18, 8, 34, "#ffffff", 3) for lx in (-40, -22, 14, 32)) + line(-50, -10, -66, 10, "#2a2a2a", 4)
    )
    body += g(cow, "translate(900 520) scale(1.3)")
    body += "".join(rect(700 + i * 70, 470, 8, 70, "#8a5a30", 2) for i in range(7)) + rect(690, 490, 460, 8, "#8a5a30", 3) + rect(690, 516, 460, 8, "#8a5a30", 3)
    # canasta
    body += path("M520 590 Q590 560 660 590 L645 650 L535 650Z", fill="#b8803a") + "".join(line(540 + i * 22, 596, 545 + i * 22, 648, "#8a5a24", 3) for i in range(5))
    for fx, fy, fc in [(555, 585, "#e0553a"), (590, 575, "#ff9a3a"), (625, 585, "#7bc05a"), (575, 560, "#e8445a")]:
        body += circle(fx, fy, 15, fc)
    body += bird(500, 130, 1.1, "#3a5a6a", 0.8)
    return wrap(d + sd, body, "Huerta y granja en el campo")


def scene_cabanas():
    d = grad("sky", [(0, "#3b2f7a"), (0.45, "#d96a7a"), (0.85, "#ffb27a"), (1, "#ffe3a8")])
    sd, sn = sun(260, 400, 58, gid="sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + stars_field(40, 3, 200)
    body += rect(0, 400, W, 80, "#2a5a8a") + sparkles(405, 470, 9, 2, "#ffe3a8", 0.6)
    body += hills(450, 40, "#a8703a", 6, 1, step=300) + hills(500, 34, "#8a5a30", 14, 1, step=260)
    body += rect(0, 500, W, H - 500, "#7d9a4a") + hills(520, 20, "#6a8a3e", 2, 1, step=200)
    body += path(f"M600 {H} Q640 560 760 520 Q820 505 900 500", stroke="#d9b676", sw=40, op=0.9)

    def cabin(x, y, s, wall, roof):
        parts = rect(0, 0, 200, 120, wall, 4) + "".join(line(0, k, 200, k, "#00000022", 2) for k in range(20, 120, 20))
        parts += poly([(-18, 0), (100, -80), (218, 0)], roof) + rect(78, 50, 44, 70, "#5b3a1e", 3) + circle(114, 86, 3, "#ffd36a")
        for wx in (14, 142):
            parts += rect(wx, 34, 44, 44, "#ffe08a", 3) + line(wx + 22, 34, wx + 22, 78, "#5b3a1e", 3) + line(wx, 56, wx + 44, 56, "#5b3a1e", 3)
            parts += circle(wx + 22, 56, 40, "#ffd36a", 0.18)
        parts += rect(-10, 118, 220, 10, "#5b3a1e", 3)
        return g(parts, f"translate({x} {y}) scale({s})")

    body += cabin(120, 470, 1.2, "#c98a4a", "#7a3a2a") + cabin(500, 440, 1.0, "#8fb0c8", "#4a3a6a") + cabin(860, 470, 1.15, "#e0b070", "#8a4a2a")
    for tx, ts in [(40, 1.0), (440, 0.8), (800, 0.9), (1150, 1.1)]:
        body += g(rect(-5, 0, 10, 40, "#5b3a1e") + circle(0, -10, 34, "#4a7a3a") + circle(-20, 6, 24, "#3f6a32") + circle(22, 6, 24, "#3f6a32"), f"translate({tx} 520) scale({ts})")
    body += bird(700, 150, 1.1, "#fff3d6", 0.8)
    return wrap(d + sd, body, "Cabañas entre el campo y el mar")


def scene_musica():
    d = grad("sky", [(0, "#0a1630"), (0.6, "#26206a"), (1, "#7a3a8a")])
    mg = rgrad("moon", [(0, "#fffbe0", 1), (0.5, "#fff3c4", 0.5), (1, "#fff3c4", 0)])
    body = rect(0, 0, W, H, "url(#sky)") + stars_field(90, 4, 330)
    body += circle(1000, 120, 150, "url(#moon)") + circle(1000, 120, 46, "#fffbe0")
    body += rect(0, 360, W, 120, "#0f2a5a") + sparkles(370, 470, 16, 9, "#ffd36a", 0.5)
    body += path(f"M0 480 L{W} 480 L{W} {H} L0 {H}Z", fill="#1a1030")
    # escenario
    body += rect(250, 330, 700, 160, "#2a2040") + rect(230, 322, 740, 14, "#4a3a6a", 3)
    for lx, col in [(300, "#ff7a59"), (450, "#ffd36a"), (600, "#1fb6c9"), (750, "#e0553a"), (900, "#9b8cf0")]:
        body += poly([(lx, 336), (lx - 70, 160), (lx + 70, 160)], col, 0.16) + circle(lx, 330, 9, col)
    # banda
    for bx, col, inst in [(420, "#ffd36a", "g"), (600, "#ff7a59", "v"), (780, "#1fb6c9", "g")]:
        body += silhouette(bx, 380, 1.2, "#0b0b18", arms_up=(inst == "v"))
        if inst == "g":
            body += path(f"M{bx - 30} 430 L{bx + 40} 410", stroke="#c98a4a", sw=7) + ellipse(bx - 20, 430, 16, 11, "#c98a4a")
        else:
            body += line(bx + 18, 420, bx + 18, 470, "#9a9aa8", 3)
    body += rect(300, 440, 90, 50, "#171528", 3) + rect(840, 440, 90, 50, "#171528", 3) + circle(620, 470, 22, "#ffffff", 0.15)
    # luces colgantes
    body += bunting(0, 60, W, 110, ["#ffd36a"], 16, 54, 0)
    for i in range(1, 16):
        t = i / 16
        lx = t * W
        ly = 60 + 50 * t + 4 * 54 * t * (1 - t) * 0.5
        body += circle(lx, ly + 6, 8, "#fff3c4") + circle(lx, ly + 6, 22, "#ffd36a", 0.22)
    # público
    rnd = random.Random(14)
    for i in range(26):
        px = 20 + i * 46 + rnd.uniform(-10, 10)
        body += silhouette(px, rnd.uniform(560, 590), rnd.uniform(1.15, 1.5), rnd.choice(["#070712", "#0e0a1e"]), arms_up=rnd.random() < 0.4)
    for i in range(8):
        body += circle(rnd.uniform(60, W - 60), rnd.uniform(500, 560), 5, rnd.choice(["#ff7a59", "#ffd36a", "#1fb6c9"]), 0.8)
    return wrap(d + mg, body, "Noche de bandas en vivo frente al mar")


def scene_feria():
    d = grad("sky", [(0, "#6fcdea"), (1, "#fdf3d6")])
    sd, sn = sun(1040, 100, 42, "#fffbe0", "#ffd36a", 2.4, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + cloud(220, 100, 1.2) + cloud(700, 70, 0.9)
    body += rect(0, 230, W, 100, "#19a9c4") + wavy(250, 6, 70, "#35c6dc", 0.7, bottom=320)
    body += path(f"M-20 330 L1240 330 L1240 {H} L-20 {H}Z", fill="#e8d4a8") + path(f"M-20 520 Q600 495 1240 520 L1240 {H} L-20 {H}Z", fill="#d9c08c")
    flags = ["#e0553a", "#ffffff", "#1fb6c9", "#ffd36a", "#7bc05a", "#9b8cf0"]
    body += bunting(0, 120, W, 120, flags, 26, 40, 22) + bunting(0, 170, W, 150, flags[::-1], 26, 30, 18)
    stalls = [(40, "#e0553a", "#ffffff"), (330, "#1fb6c9", "#ffffff"), (620, "#ffd36a", "#ffffff"), (910, "#9b8cf0", "#ffffff")]
    for sx, c1, c2 in stalls:
        body += rect(sx + 10, 290, 8, 230, "#7a4a24") + rect(sx + 242, 290, 8, 230, "#7a4a24") + awning(sx, 280, 260, c1, c2, 56, 8)
        body += rect(sx + 20, 450, 220, 70, "#a8743a", 4) + rect(sx + 14, 440, 232, 14, "#c98a4a", 4)
    # mercadería
    body += "".join(path(f"M{110 + i * 36} 440 Q{100 + i * 36} 396 {128 + i * 36} 396 Q{150 + i * 36} 400 {146 + i * 36} 440Z", fill=c) for i, c in enumerate(["#c6553a", "#e8a23a", "#8a3b2a", "#e0553a"]))
    body += "".join(ellipse(430 + i * 40, 430, 22, 10, c) + rect(412 + i * 40, 412, 36, 18, c, 4) for i, c in enumerate(["#e8c27a", "#d9a05a", "#f0d9a0"]))
    body += "".join(rect(700 + i * 34, 400, 22, 40, c, 5) for i, c in enumerate(["#7bc05a", "#ffffff", "#e0553a", "#1fb6c9", "#ffd36a"]))
    body += "".join(path(f"M{960 + i * 40} 438 L{975 + i * 40} 392 L{990 + i * 40} 438Z", fill=c) for i, c in enumerate(["#9b8cf0", "#ff7a59", "#7bc05a", "#ffd36a"]))
    body += person(300, 520, 1.1, "#ff7a59", "#2a3a4a", "#f5e6c8") + person(590, 530, 1, "#1fb6c9", "#c6553a") + person(880, 524, 1.15, "#e8c23a", "#2a3a4a", "#c6553a") + person(1130, 530, 1, "#9b8cf0", "#33465a")
    body += palm(1160, 330, 0.8) + palm(20, 340, 0.7)
    return wrap(d + sd, body, "Feria artesanal con puestos y banderines")


def scene_buque():
    d = grad("sky", [(0, "#4a6a8a"), (0.6, "#a9c0d0"), (1, "#f3e2c0")])
    sd, sn = sun(900, 300, 52, "#fff6d0", "#ffd9a0", 3, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + cloud(200, 110, 1.5, "#ffffff", 0.55) + cloud(620, 160, 1.1, "#ffffff", 0.5)
    sea_d, sea = sea_with_horizon(340, "#6f93ac", "#14405a", "sea")
    body += sea + sparkles(350, 450, 12, 1, "#fff6d0", 0.5)
    body += wavy(430, 12, 120, "#2a5a7a", 0.6) + wavy(480, 14, 140, "#1a4a6a", 0.8) + wavy(540, 16, 160, "#103a56", 0.95)
    # corbeta
    ship = (
        path("M-210 0 L220 0 L180 52 L-170 52 Q-200 30 -210 0Z", fill="#1a2a3a")
        + rect(-210, -10, 430, 12, "#cfd8de", 2)
        + "".join(rect(-120 + i * 70, 14, 22, 12, "#cfd8de", 2) for i in range(5))
        + rect(-100, -34, 190, 26, "#2a3a4a", 3)
    )
    for mx, mh in [(-110, 220), (0, 260), (110, 220)]:
        ship += line(mx, -10, mx, -mh, "#3a2a1a", 6)
        ship += path(f"M{mx + 4} {-mh + 30} Q{mx + 60} {-mh + 90} {mx + 4} {-mh + 170}Z", fill="#f2ead8") + path(f"M{mx - 4} {-mh + 40} Q{mx - 56} {-mh + 100} {mx - 4} {-mh + 168}Z", fill="#e8dfc8")
    ship += line(-210, -2, -300, -60, "#3a2a1a", 5)
    # bandera chilena
    ship += rect(0, -mh - 36, 66, 22, "#ffffff") + rect(0, -mh - 14, 66, 14, "#d52b1e") + rect(0, -mh - 36, 24, 22, "#0039a6") + circle(12, -mh - 25, 4, "#ffffff")
    body += g(ship, "translate(560 440) scale(0.95)")
    body += ellipse(560, 500, 260, 12, "#000000", 0.2)
    # espuma
    body += path("M300 492 Q420 470 520 492 T740 492 T900 494", stroke="#ffffff", sw=5, op=0.7) + path("M330 505 Q440 488 540 505 T760 504", stroke="#ffffff", sw=3, op=0.5)
    for bx, by in [(260, 220), (330, 250), (400, 205), (980, 190)]:
        body += bird(bx, by, 1.1, "#2a3a4a", 0.7)
    return wrap(d + sd + sea_d, body, "Corbeta con bandera chilena en el mar")


def scene_procesion():
    d = grad("sky", [(0, "#7fd0ec"), (1, "#fdf0d0")])
    sd, sn = sun(180, 130, 42, "#fffbe0", "#ffd36a", 2.4, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + cloud(520, 110, 1.3) + cloud(900, 160, 1)
    body += rect(0, 290, W, H - 290, "#1c93ad") + wavy(310, 8, 80, "#35c6dc", 0.7, bottom=420) + wavy(420, 10, 100, "#0f8aa3", 0.6, bottom=520) + wavy(540, 12, 120, "#0b7285", 0.9)
    body += sparkles(300, 600, 22, 7, "#ffffff", 0.45)
    # colina e iglesia
    body += hills(300, 40, "#7bb06a", 5, 1, bottom=330, step=300)
    body += path("M880 300 L1240 300 L1240 220 Q1100 200 960 250Z", fill="#7bb06a")
    body += rect(1030, 180, 90, 120, "#f5e6c8") + poly([(1020, 180), (1075, 120), (1130, 180)], "#c6553a") + rect(1066, 90, 18, 40, "#f5e6c8") + poly([(1062, 90), (1075, 60), (1088, 90)], "#c6553a") + rect(1056, 230, 38, 70, "#7a4a24", 18)
    body += "".join(rect(1040 + i * 28, 190, 14, 28, "#bfe3ee", 3) for i in range(3))
    flags = ["#e0553a", "#ffffff", "#1fb6c9", "#ffd36a", "#ff7a59"]
    # botes con banderines
    body += boat(300, 470, 1.5, "#2f6f9f", "#ffffff", "#f5e6c8", "#ff7a59") + bunting(250, 360, 380, 420, flags, 8, 12, 12)
    body += boat(640, 520, 1.9, "#c6553a", "#ffffff", "#ffe3a8", "#ffd36a")
    body += bunting(540, 380, 740, 380, flags, 12, 22, 14) + line(540, 380, 560, 480, "#5b3a1e", 3) + line(740, 380, 725, 480, "#5b3a1e", 3)
    # figura sobre el bote central (la imagen del santo, con aureola)
    body += circle(640, 390, 26, "#ffd36a", 0.45) + circle(640, 392, 15, "#e8b48a") + path("M622 408 Q640 400 658 408 L664 462 L616 462Z", fill="#2f6f9f") + path("M622 408 Q640 424 658 408", stroke="#ffd36a", sw=4)
    body += boat(980, 560, 1.3, "#e8a23a", "#ffffff", "#f5e6c8", "#7bc05a") + boat(100, 590, 1.2, "#1fb6c9", "#ffffff", "#f5e6c8", "#ffd36a")
    for bx, by in [(420, 200), (480, 230), (800, 190)]:
        body += bird(bx, by, 1.1, "#3a5a6a", 0.8)
    return wrap(d + sd, body, "Procesión de botes con banderines hacia la caleta")


def scene_fondas():
    d = grad("sky", [(0, "#4fb8e6"), (1, "#f4f0d8")])
    sd, sn = sun(1060, 100, 44, "#fffbe0", "#ffd36a", 2.4, "sun")
    body = rect(0, 0, W, H, "url(#sky)") + sn + cloud(240, 100, 1.3) + cloud(640, 70, 1)
    body += hills(300, 48, "#8ec36a", 6, 1, step=300, bottom=420) + rect(0, 380, W, H - 380, "#d8c08a")
    body += path(f"M-20 520 Q600 495 1240 520 L1240 {H} L-20 {H}Z", fill="#c8ad78")
    rb = ["#d52b1e", "#ffffff", "#0039a6"]
    body += bunting(0, 90, W, 90, rb, 30, 56, 24) + bunting(0, 150, W, 140, rb[::-1], 30, 40, 20)
    for rx in (80, 470, 860):  # ramadas
        body += rect(rx, 250, 8, 230, "#7a4a24") + rect(rx + 262, 250, 8, 230, "#7a4a24")
        body += poly([(rx - 30, 260), (rx + 135, 190), (rx + 300, 260)], "#c9a050") + "".join(
            path(f"M{rx - 20 + i * 26} {260 - i % 2 * 4} l10 24", stroke="#a67e34", sw=3) for i in range(13)
        )
        body += line(rx + 135, 190, rx + 135, 130, "#5b3a1e", 3) + rect(rx + 135, 130, 36, 12, "#ffffff") + rect(rx + 135, 142, 36, 12, "#d52b1e") + rect(rx + 135, 130, 14, 12, "#0039a6")
        body += rect(rx + 20, 430, 230, 14, "#8a5a30", 3) + rect(rx + 34, 444, 8, 40, "#6a4220") + rect(rx + 228, 444, 8, 40, "#6a4220")
        for k in range(4):
            body += path(f"M{rx + 50 + k * 50} 428 Q{rx + 70 + k * 50} 396 {rx + 90 + k * 50} 428Z", fill="#e0a85a") + path(f"M{rx + 56 + k * 50} 420 l8 -3 M{rx + 70 + k * 50} 414 l8 -3", stroke="#b87a3a", sw=2)
    # cueca
    body += person(360, 520, 1.25, "#ffffff", "#2a3a4a", "#f5e6c8", arms_up=True) + person(430, 524, 1.2, "#d52b1e", "#2a3a4a", None, arms_up=True)
    body += line(380, 540, 400, 520, "#ffffff", 4) + line(414, 540, 395, 520, "#ffffff", 4)
    body += person(760, 530, 1.1, "#0039a6", "#2a3a4a", "#d9a05a") + person(1010, 526, 1.15, "#e8c23a", "#2a3a4a", "#c6553a")
    body += horse(170, 560, 0.7, "#5b3a1e", True, "#2a2030") + bird(560, 210, 1.1, "#3a5a6a", 0.8)
    return wrap(d + sd, body, "Fondas y ramadas con banderines en fiestas patrias")


SCENES = {
    "caleta": scene_caleta,
    "cabalgata": scene_cabalgata,
    "surf": scene_surf,
    "parador": scene_parador,
    "casas": scene_casas,
    "cocineria": scene_cocineria,
    "mariscos": scene_mariscos,
    "huerta": scene_huerta,
    "cabanas": scene_cabanas,
    "musica": scene_musica,
    "feria": scene_feria,
    "buque": scene_buque,
    "procesion": scene_procesion,
    "fondas": scene_fondas,
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, fn in SCENES.items():
        svg = fn()
        with open(os.path.join(OUT, f"{name}.svg"), "w", encoding="utf-8") as f:
            f.write(svg)
        print(f"{name}.svg  {len(svg) / 1024:.1f} KB")
