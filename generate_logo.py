# -*- coding: utf-8 -*-
"""Render Code It All logo PNGs (full wordmark + favicon) with tight geometric spacing."""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent / "docs" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

STROKE = 6
WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 255)
TRANSPARENT = (0, 0, 0, 0)


def draw_wordmark(stroke_color, bg, size=(780, 144)):
    """Tighter letter spacing than the first version."""
    w, h = size
    img = Image.new("RGBA", (w, h), bg)
    d = ImageDraw.Draw(img)
    sw = STROKE
    cy = h // 2
    top, bot = 36, h - 36
    letter_h = bot - top

    def line(a, b):
        d.line([a, b], fill=stroke_color, width=sw)

    def thick_circle(cx, r):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=stroke_color, width=sw)

    # Cursor advances after each glyph. Letter gap ~14px, word gap ~28px.
    x = 28
    gap = 14
    word = 28

    # C = <
    line((x + 28, top), (x, cy))
    line((x, cy), (x + 28, bot))
    x += 28 + gap

    # O = circle
    r = letter_h // 2 - 2
    thick_circle(x + r, r)
    x += r * 2 + gap

    # D = | >
    line((x, top), (x, bot))
    line((x + 12, top), (x + 40, cy))
    line((x + 40, cy), (x + 12, bot))
    x += 40 + gap

    # E = three bars
    ew = 36
    for yy in (top + 6, cy, bot - 6):
        line((x, yy), (x + ew, yy))
    x += ew + word

    # I = |
    line((x, top), (x, bot))
    x += gap

    # T
    tw = 44
    line((x, top), (x + tw, top))
    line((x + tw // 2, top), (x + tw // 2, bot))
    x += tw + word

    # A = / \
    aw = 44
    line((x, bot), (x + aw // 2, top))
    line((x + aw // 2, top), (x + aw, bot))
    x += aw + gap

    # L
    lw = 30
    line((x, top), (x, bot))
    line((x, bot), (x + lw, bot))
    x += lw + gap

    # L
    line((x, top), (x, bot))
    line((x, bot), (x + lw, bot))

    return img


def draw_favicon(size=256):
    img = Image.new("RGBA", (size, size), BLACK)
    d = ImageDraw.Draw(img)
    sw = max(8, size // 18)
    m = size * 0.18
    top, bot = m, size - m
    cy = size / 2

    def line(a, b):
        d.line([a, b], fill=WHITE, width=sw)

    line((size * 0.32, top), (size * 0.18, cy))
    line((size * 0.18, cy), (size * 0.32, bot))
    r = size * 0.12
    d.ellipse([size * 0.40 - r, cy - r, size * 0.40 + r, cy + r], outline=WHITE, width=sw)
    x = size * 0.56
    line((x, top), (x, bot))
    line((x + size * 0.05, top), (x + size * 0.16, cy))
    line((x + size * 0.16, cy), (x + size * 0.05, bot))
    return img


draw_wordmark(BLACK, TRANSPARENT).save(OUT / "logo-black.png")
draw_wordmark(WHITE, TRANSPARENT).save(OUT / "logo-white.png")
draw_wordmark(WHITE, BLACK).save(OUT / "logo-on-black.png")

fav = draw_favicon(256)
fav.save(OUT / "favicon-256.png")
fav.resize((64, 64), Image.Resampling.LANCZOS).save(OUT / "favicon-64.png")
fav.resize((32, 32), Image.Resampling.LANCZOS).save(OUT / "favicon-32.png")
fav.resize((32, 32), Image.Resampling.LANCZOS).save(
    OUT / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)

print("Saved tighter logos to", OUT)
