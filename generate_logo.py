"""Render Code It All logo PNGs (full wordmark + favicon) matching the CODED geometric style."""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent / "docs" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

STROKE = 6
WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 255)
TRANSPARENT = (0, 0, 0, 0)


def draw_wordmark(stroke_color, bg, size=(1040, 144), pad=0):
    w, h = size
    img = Image.new("RGBA", (w, h), bg)
    d = ImageDraw.Draw(img)
    sw = STROKE
    cy = h // 2
    top, bot = 36, h - 36

    def line(a, b):
        d.line([a, b], fill=stroke_color, width=sw)

    def thick_circle(cx, cy, r):
        # Outline circle via ellipse ring
        bbox = [cx - r, cy - r, cx + r, cy + r]
        d.ellipse(bbox, outline=stroke_color, width=sw)

    # C = <
    x = 44
    line((x + 40, top), (x, cy))
    line((x, cy), (x + 40, bot))

    # O = ?
    x = 144
    thick_circle(x, cy, 32)

    # D = | >
    x = 208
    line((x, top), (x, bot))
    line((x + 16, top), (x + 56, cy))
    line((x + 56, cy), (x + 16, bot))

    # E = ?
    x = 296
    for yy in (top + 8, cy, bot - 8):
        line((x, yy), (x + 64, yy))

    # I = |
    x = 440
    line((x, top), (x, bot))

    # T
    x = 492
    line((x, top), (x + 80, top))
    line((x + 40, top), (x + 40, bot))

    # A = / \
    x = 660
    line((x, bot), (x + 40, top))
    line((x + 40, top), (x + 80, bot))

    # L
    x = 792
    line((x, top), (x, bot))
    line((x, bot), (x + 56, bot))

    # L
    x = 900
    line((x, top), (x, bot))
    line((x, bot), (x + 56, bot))

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

    # C = <
    line((size * 0.34, top), (size * 0.18, cy))
    line((size * 0.18, cy), (size * 0.34, bot))
    # O
    r = size * 0.125
    d.ellipse([size * 0.42 - r, cy - r, size * 0.42 + r, cy + r], outline=WHITE, width=sw)
    # D = | >
    x = size * 0.58
    line((x, top), (x, bot))
    line((x + size * 0.06, top), (x + size * 0.18, cy))
    line((x + size * 0.18, cy), (x + size * 0.06, bot))
    return img


# Full wordmarks
draw_wordmark(BLACK, TRANSPARENT).save(OUT / "logo-black.png")
draw_wordmark(WHITE, TRANSPARENT).save(OUT / "logo-white.png")
draw_wordmark(WHITE, BLACK).save(OUT / "logo-on-black.png")

# Favicons
fav = draw_favicon(256)
fav.save(OUT / "favicon-256.png")
fav.resize((64, 64), Image.Resampling.LANCZOS).save(OUT / "favicon-64.png")
fav.resize((32, 32), Image.Resampling.LANCZOS).save(OUT / "favicon-32.png")
# Multi-size ICO for broad browser support
fav.resize((32, 32), Image.Resampling.LANCZOS).save(
    OUT / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)

print("Saved logos + favicons to", OUT)
