"""Generate the CodeItAll Python Learning Projects Jupyter notebook."""
import json
from pathlib import Path

NOTEBOOK_PATH = Path(__file__).parent / "CodeItAll_Python_Projects.ipynb"


def md(source: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": source.splitlines(keepends=True)}


def code(source: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source.splitlines(keepends=True),
    }


cells = []

# ── Title & intro ──────────────────────────────────────────────────────────
cells.append(
    md(
        """# CodeItAll — 20 Interactive Python Projects

**Learn Python by building real things.**

Each project below is a self-contained mini-app. Run cells **top to bottom** in each section.
Every project produces a tangible output: an image, file, chart, map, or printable artifact.

| Symbol | Difficulty |
|--------|------------|
| 🟢 | **Beginner** — core syntax, loops, functions |
| 🟡 | **Intermediate** — files, APIs, OOP, libraries |
| 🔴 | **Advanced** — composition, data pipelines, interactivity |

---

### Setup (run once)

Install dependencies, then restart the kernel if prompted."""
    )
)

cells.append(
    code(
        """# Run this cell once to install all libraries used across 20 projects.
!pip install pillow numpy matplotlib wordcloud qrcode[pil] python-barcode fpdf2 jinja2 folium plotly pandas --quiet
print("✅ Dependencies installed. You are ready to CodeItAll!")"""
    )
)

cells.append(
    code(
        """# Shared imports used in many projects
import os
from pathlib import Path

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)
print(f"Outputs will be saved to: {OUTPUT_DIR.resolve()}")"""
    )
)

# ── Helper to add a project section ─────────────────────────────────────────
def add_project(
    number: int,
    name: str,
    difficulty: str,
    emoji: str,
    description: str,
    libraries: str,
    concepts: str,
    param_variations: str,
    setup_code: str,
    step_cells: list[tuple[str, str]],
):
    cells.append(md(f"---\n## Project {number}: {name} {emoji}\n**Difficulty:** {difficulty}\n"))
    cells.append(
        md(
            f"""### Description
{description}

### Libraries & Modules
{libraries}

### Python Concepts You'll Practice
{concepts}

### 🎛️ Parameter Variations (change these to get different outputs)
{param_variations}
"""
        )
    )
    if setup_code:
        cells.append(code(setup_code))
    for step_title, step_code in step_cells:
        cells.append(md(f"#### {step_title}"))
        cells.append(code(step_code))


# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 1
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    1,
    "Pixel Palette Pop",
    "🟢 Beginner",
    "🎨",
    "Generate vibrant gradient artwork and save it as a PNG. You'll learn how images are just grids of colored pixels.",
    """- `PIL` (Pillow): `Image`, `ImageDraw`
- Built-in: `math`, `Path`""",
    "Variables, loops, RGB tuples, saving files, functions",
    """- `WIDTH`, `HEIGHT` — try 400×400 vs 1200×800
- `COLOR_A`, `COLOR_B` — swap hex colors (`#FF6B6B`, `#4ECDC4`, `#FFE66D`)
- `STEPS` — more steps = smoother gradient (50 vs 200)
- `DIRECTION` — `"horizontal"`, `"vertical"`, or `"diagonal"`""",
    "",
    [
        (
            "Step 1 — Define your canvas parameters",
            """from PIL import Image, ImageDraw

# 🎛️ TWEAK THESE
WIDTH, HEIGHT = 800, 500
COLOR_A = (255, 107, 107)   # coral red (R, G, B)
COLOR_B = (78, 205, 196)    # teal
STEPS = 120
DIRECTION = "horizontal"    # "horizontal" | "vertical" | "diagonal"

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

img = Image.new("RGB", (WIDTH, HEIGHT))
draw = ImageDraw.Draw(img)
print(f"Canvas: {WIDTH}×{HEIGHT}, direction={DIRECTION}")""",
        ),
        (
            "Step 2 — Paint the gradient pixel by pixel",
            """for i in range(STEPS):
    color = lerp(COLOR_A, COLOR_B, i / max(STEPS - 1, 1))
    if DIRECTION == "horizontal":
        x0 = int(i * WIDTH / STEPS)
        x1 = int((i + 1) * WIDTH / STEPS)
        draw.rectangle([x0, 0, x1, HEIGHT], fill=color)
    elif DIRECTION == "vertical":
        y0 = int(i * HEIGHT / STEPS)
        y1 = int((i + 1) * HEIGHT / STEPS)
        draw.rectangle([0, y0, WIDTH, y1], fill=color)
    else:  # diagonal bands
        offset = int(i * (WIDTH + HEIGHT) / STEPS)
        draw.polygon([(0, offset), (offset, 0), (WIDTH, offset - WIDTH), (WIDTH, HEIGHT), (0, HEIGHT)], fill=color)

out = OUTPUT_DIR / "pixel_palette_pop.png"
img.save(out)
img""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 2
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    2,
    "ASCII Art Machine",
    "🟢 Beginner",
    "🖼️",
    "Turn any image into retro terminal-style ASCII art saved as a `.txt` file you can print or share.",
    """- `PIL.Image`
- Built-in: `string` (character ramp)""",
    "Nested loops, luminance math, reading/writing text files",
    """- `ASCII_WIDTH` — 40 (blocky) vs 120 (detailed)
- `CHARS` — try `"@%#*+=-:. "` or `"█▓▒░ "` for different moods
- Replace the sample image path with your own photo""",
    "",
    [
        (
            "Step 1 — Create a sample image (or skip if you have your own)",
            """from PIL import Image, ImageDraw

sample = Image.new("RGB", (200, 200), (30, 30, 40))
d = ImageDraw.Draw(sample)
d.ellipse([30, 30, 170, 170], fill=(255, 200, 80))
d.rectangle([60, 100, 140, 180], fill=(100, 180, 255))
sample_path = OUTPUT_DIR / "ascii_source.png"
sample.save(sample_path)
sample""",
        ),
        (
            "Step 2 — Convert pixels to ASCII characters",
            """# 🎛️ TWEAK THESE
ASCII_WIDTH = 80
CHARS = "@%#*+=-:. "  # dark → light

img = Image.open(sample_path).convert("L")  # grayscale
w, h = img.size
ratio = h / w
new_h = int(ASCII_WIDTH * ratio * 0.55)  # 0.55 corrects char aspect ratio
img = img.resize((ASCII_WIDTH, new_h))

lines = []
for y in range(new_h):
    row = ""
    for x in range(ASCII_WIDTH):
        pixel = img.getpixel((x, y))
        idx = int(pixel / 255 * (len(CHARS) - 1))
        row += CHARS[idx]
    lines.append(row)

ascii_art = "\\n".join(lines)
print(ascii_art[:500] + ("\\n..." if len(ascii_art) > 500 else ""))""",
        ),
        (
            "Step 3 — Save your masterpiece",
            """out = OUTPUT_DIR / "ascii_art.txt"
out.write_text(ascii_art, encoding="utf-8")
print(f"Saved {len(lines)} lines to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 3
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    3,
    "Password Fortress",
    "🟢 Beginner",
    "🔐",
    "Build a cryptographically secure password generator — a practical first project that produces instantly useful output.",
    """- `secrets` — cryptographically strong randomness
- `string` — character sets (`ascii_letters`, `digits`, `punctuation`)""",
    "Functions, f-strings, list comprehensions, `join()`",
    """- `LENGTH` — 8 (weak demo) vs 24 (strong)
- Toggle `USE_UPPER`, `USE_DIGITS`, `USE_SYMBOLS`
- `COUNT` — generate 1 vs 10 passwords at once""",
    "",
    [
        (
            "Step 1 — Build the generator function",
            """import secrets
import string

# 🎛️ TWEAK THESE
LENGTH = 16
USE_UPPER = True
USE_DIGITS = True
USE_SYMBOLS = True
COUNT = 5

def generate_password(length=16, upper=True, digits=True, symbols=True):
    alphabet = string.ascii_lowercase
    if upper:
        alphabet += string.ascii_uppercase
    if digits:
        alphabet += string.digits
    if symbols:
        alphabet += "!@#$%^&*-_=+?"
    if not alphabet:
        raise ValueError("At least one character set must be enabled")
    return "".join(secrets.choice(alphabet) for _ in range(length))

passwords = [generate_password(LENGTH, USE_UPPER, USE_DIGITS, USE_SYMBOLS) for _ in range(COUNT)]
for i, p in enumerate(passwords, 1):
    print(f"{i}. {p}")""",
        ),
        (
            "Step 2 — Export to a file",
            """out = OUTPUT_DIR / "passwords.txt"
out.write_text("\\n".join(passwords), encoding="utf-8")
print(f"Saved {len(passwords)} passwords to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 4
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    4,
    "QR Code Crafter",
    "🟢 Beginner",
    "📱",
    "Encode URLs, Wi-Fi credentials, or secret messages into scannable QR code images.",
    """- `qrcode` — QR generation
- `qrcode.constants` — error correction levels""",
    "Object-oriented library usage, saving images, constants/enums",
    """- `DATA` — URL, plain text, or `WIFI:T:WPA;S:MyNetwork;P:secret;;`
- `BOX_SIZE` — 5 (small) vs 15 (poster-size)
- `FILL_COLOR` / `BACK_COLOR` — brand colors
- `ERROR_CORRECTION` — `L`, `M`, `Q`, or `H` (more damage tolerance)""",
    "",
    [
        (
            "Step 1 — Configure and generate",
            """import qrcode
from qrcode.constants import ERROR_CORRECT_H, ERROR_CORRECT_M

# 🎛️ TWEAK THESE
DATA = "https://codeitall.dev — Built with Python!"
BOX_SIZE = 10
BORDER = 4
FILL_COLOR = "#1a1a2e"
BACK_COLOR = "#eaeaea"
ERROR_CORRECTION = ERROR_CORRECT_M  # try ERROR_CORRECT_H for logos overlay later

qr = qrcode.QRCode(
    version=None,
    error_correction=ERROR_CORRECTION,
    box_size=BOX_SIZE,
    border=BORDER,
)
qr.add_data(DATA)
qr.make(fit=True)
img = qr.make_image(fill_color=FILL_COLOR, back_color=BACK_COLOR)
out = OUTPUT_DIR / "qr_code.png"
img.save(out)
print(f"Encoded {len(DATA)} chars → {out}")
img""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 5
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    5,
    "Word Cloud Weaver",
    "🟢 Beginner",
    "☁️",
    "Transform any block of text into a beautiful word cloud image — great for speeches, lyrics, or journal entries.",
    """- `wordcloud.WordCloud`
- `matplotlib.pyplot` — display images""",
    "Dictionaries, keyword arguments, displaying plots inline",
    """- `TEXT` — paste your own paragraph
- `MAX_WORDS` — 50 vs 200
- `COLormap` — `'viridis'`, `'plasma'`, `'Set2'`, `'Pastel1'`
- `BACKGROUND` — `'white'`, `'black'`, or `'#f0f0f0'`""",
    "",
    [
        (
            "Step 1 — Prepare text and generate cloud",
            """from wordcloud import WordCloud
import matplotlib.pyplot as plt

# 🎛️ TWEAK THESE
TEXT = '''
Python is versatile powerful readable elegant fast growing community data science web
automation machine learning scripting glue language batteries included zen beautiful
explicit simple complex hierarchy namespaces flat better than ugly sparse dense
'''
MAX_WORDS = 100
COLORMAP = "plasma"
BACKGROUND = "white"
WIDTH, HEIGHT = 900, 500

wc = WordCloud(
    width=WIDTH,
    height=HEIGHT,
    max_words=MAX_WORDS,
    colormap=COLORMAP,
    background_color=BACKGROUND,
).generate(TEXT)

out = OUTPUT_DIR / "word_cloud.png"
wc.to_file(out)
plt.figure(figsize=(12, 6))
plt.imshow(wc, interpolation="bilinear")
plt.axis("off")
plt.title("Word Cloud Weaver", fontsize=16)
plt.tight_layout()
plt.show()
print(f"Saved to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 6
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    6,
    "Morse Code Messenger",
    "🟢 Beginner",
    "📡",
    "Encode messages into International Morse Code and visualize the dot-dash pattern — the original digital protocol.",
    """- Built-in: `dict`, `str` methods
- Optional: `winsound.Beep` (Windows audio)""",
    "Dictionaries, string processing, list comprehensions",
    """- `MESSAGE` — any A-Z 0-9 string
- `DOT` / `DASH` — try `'.'`/`'-'` vs `'●'`/`'━'`
- `PLAY_SOUND` — True on Windows for beeps
- `WPM` — words per minute (affects beep timing)""",
    "",
    [
        (
            "Step 1 — Morse lookup table & encoder",
            """MORSE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.',
}

# 🎛️ TWEAK THESE
MESSAGE = "CODE IT ALL"
DOT, DASH = "●", "━"
PLAY_SOUND = False  # set True on Windows
WPM = 20

def encode(text):
    text = text.upper()
    words = []
    for word in text.split():
        letters = [MORSE.get(ch, '?') for ch in word if ch.isalnum()]
        words.append(" ".join(letters))
    return " / ".join(words)

encoded = encode(MESSAGE)
visual = encoded.replace(".", DOT).replace("-", DASH)
print("Raw Morse:", encoded)
print("Visual:   ", visual)""",
        ),
        (
            "Step 2 — Save & optional audio",
            """out = OUTPUT_DIR / "morse_message.txt"
out.write_text(f"Message: {MESSAGE}\\nMorse: {encoded}\\nVisual: {visual}\\n", encoding="utf-8")
print(f"Saved to {out}")

if PLAY_SOUND:
    try:
        import winsound
        unit = int(1200 / WPM)
        for ch in encoded:
            if ch == '.':
                winsound.Beep(800, unit)
            elif ch == '-':
                winsound.Beep(800, unit * 3)
            elif ch == ' ':
                import time; time.sleep(unit / 1000)
        print("🔊 Playback complete")
    except Exception as e:
        print(f"Audio skipped: {e}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 7
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    7,
    "Haiku Composer",
    "🟢 Beginner",
    "🌸",
    "Randomly compose 5-7-5 syllable haiku poems from themed word banks — a gentle intro to data structures and randomness.",
    """- `random` — `choice`, `shuffle`
- Built-in: `list`, f-strings""",
    "Lists, random selection, string formatting, loops",
    """- Edit word banks: `NATURE`, `EMOTIONS`, `SEASONS`
- `HAIKU_COUNT` — 1 vs 10 poems
- `SEED` — set for reproducible poems (`random.seed(42)`)""",
    "",
    [
        (
            "Step 1 — Word banks & syllable templates",
            """import random

# 🎛️ TWEAK THESE — add your own words (syllable count matters!)
NATURE = ["cherry", "river", "moonlight", "frog", "mist", "bamboo", "rain", "stone"]
EMOTIONS = ["quiet", "gentle", "fleeting", "deep", "still", "soft", "ancient"]
SEASONS = ["autumn", "winter", "spring", "summer", "dawn", "dusk", "twilight"]
HAIKU_COUNT = 5
SEED = None  # try 42 for same results every run

if SEED is not None:
    random.seed(SEED)

def pick(pool, n=1):
    return random.choice(pool) if n == 1 else [random.choice(pool) for _ in range(n)]

templates = [
    (5, 7, 5),
]

haikus = []
for _ in range(HAIKU_COUNT):
    lines = []
    for syllables in templates[0]:
        if syllables == 5:
            line = f"{pick(NATURE)} {pick(EMOTIONS)}"
        else:
            line = f"{pick(SEASONS)} {pick(NATURE)} {pick(EMOTIONS)} flows"
        lines.append(line)
    haikus.append("\\n".join(lines))

for i, h in enumerate(haikus, 1):
    print(f"--- Haiku {i} ---\\n{h}\\n")""",
        ),
        (
            "Step 2 — Export collection",
            """out = OUTPUT_DIR / "haiku_collection.txt"
out.write_text("\\n\\n".join(haikus), encoding="utf-8")
print(f"Saved {HAIKU_COUNT} haiku to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 8
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    8,
    "Spiral Art Generator",
    "🟢 Beginner",
    "🌀",
    "Draw mesmerizing golden-ratio spirals and colorful archimedean spirals using `matplotlib` — math becomes art.",
    """- `numpy` — `linspace`, trigonometry
- `matplotlib.pyplot`""",
    "NumPy arrays, polar-like parametric curves, plotting",
    """- `SPIRAL_TYPE` — `'golden'` or `'archimedean'`
- `TURNS` — 3 vs 12 rotations
- `COLOR` / `LINEWIDTH` — visual style
- `DPI` — export resolution""",
    "",
    [
        (
            "Step 1 — Generate spiral coordinates",
            """import numpy as np
import matplotlib.pyplot as plt

# 🎛️ TWEAK THESE
SPIRAL_TYPE = "golden"  # "golden" | "archimedean"
TURNS = 8
POINTS = 2000
COLOR = "#e94560"
LINEWIDTH = 1.5
DPI = 150
PHI = (1 + 5**0.5) / 2

theta = np.linspace(0, TURNS * 2 * np.pi, POINTS)
if SPIRAL_TYPE == "golden":
    r = np.exp(theta / (2 * np.pi) * np.log(PHI))
else:
    r = theta

x = r * np.cos(theta)
y = r * np.sin(theta)
print(f"{SPIRAL_TYPE} spiral: {TURNS} turns, {POINTS} points")""",
        ),
        (
            "Step 2 — Plot and save",
            """fig, ax = plt.subplots(figsize=(8, 8), facecolor="#0f0f23")
ax.set_facecolor("#0f0f23")
ax.plot(x, y, color=COLOR, linewidth=LINEWIDTH)
ax.set_aspect("equal")
ax.axis("off")
ax.set_title("Spiral Art Generator — CodeItAll", color="white", fontsize=14, pad=12)

out = OUTPUT_DIR / f"spiral_{SPIRAL_TYPE}.png"
fig.savefig(out, dpi=DPI, bbox_inches="tight", facecolor=fig.get_facecolor())
plt.show()
print(f"Saved to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 9
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    9,
    "Barcode Factory",
    "🟢 Beginner",
    "🏷️",
    "Generate retail-style barcodes (Code128) for products, inventory tags, or event tickets.",
    """- `barcode` — `get_barcode_class`
- `barcode.writer.ImageWriter`""",
    "Third-party class factories, file I/O",
    """- `CODE` — alphanumeric product ID
- `BARCODE_TYPE` — `'code128'`, `'ean13'` (needs 12 digits), `'ean8'`
- `MODULE_WIDTH` — bar thickness
- `FONT_SIZE` — label text size""",
    "",
    [
        (
            "Step 1 — Generate barcode image",
            """import barcode
from barcode.writer import ImageWriter

# 🎛️ TWEAK THESE
CODE = "CODEITALL-2026"
BARCODE_TYPE = "code128"
MODULE_WIDTH = 0.4
MODULE_HEIGHT = 15.0
FONT_SIZE = 12
QUIET_ZONE = 6.5

writer = ImageWriter()
writer.set_options({
    "module_width": MODULE_WIDTH,
    "module_height": MODULE_HEIGHT,
    "font_size": FONT_SIZE,
    "quiet_zone": QUIET_ZONE,
    "text_distance": 5,
})

bc_class = barcode.get_barcode_class(BARCODE_TYPE)
bc = bc_class(CODE, writer=writer)
filename = bc.save(str(OUTPUT_DIR / "barcode"), options={"write_text": True})
print(f"Barcode saved: {filename}")
from PIL import Image
Image.open(filename + ".png")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 10
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    10,
    "CSV Story Explorer",
    "🟢 Beginner",
    "📊",
    "Create a dataset, analyze it with pandas, and render a chart — your first data storytelling pipeline.",
    """- `pandas` — `DataFrame`, `read_csv`
- `matplotlib.pyplot`
- Built-in: `csv`, `random`""",
    "CSV files, DataFrames, basic plotting, aggregation",
    """- `NUM_STUDENTS` — 10 vs 100 rows
- `CHART_TYPE` — `'bar'`, `'scatter'`, `'hist'`
- `SUBJECT` — column to visualize
- `COLOR` — matplotlib color name or hex""",
    "",
    [
        (
            "Step 1 — Generate sample CSV data",
            """import csv
import random
import pandas as pd

# 🎛️ TWEAK THESE
NUM_STUDENTS = 30
SUBJECTS = ["Python", "Math", "Art", "Music", "Science"]
csv_path = OUTPUT_DIR / "student_scores.csv"

rows = [["name", "subject", "score"]]
names = [f"Student_{i:02d}" for i in range(1, NUM_STUDENTS + 1)]
for name in names:
    subject = random.choice(SUBJECTS)
    score = random.randint(55, 100)
    rows.append([name, subject, score])

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerows(rows)

df = pd.read_csv(csv_path)
df.head(10)""",
        ),
        (
            "Step 2 — Analyze and visualize",
            """import matplotlib.pyplot as plt

# 🎛️ TWEAK THESE
CHART_TYPE = "bar"  # "bar" | "scatter" | "hist"
SUBJECT_FILTER = None  # e.g. "Python" or None for all
COLOR = "#6c5ce7"

plot_df = df if SUBJECT_FILTER is None else df[df["subject"] == SUBJECT_FILTER]
avg_by_subject = plot_df.groupby("subject")["score"].mean()

fig, ax = plt.subplots(figsize=(10, 5))
if CHART_TYPE == "bar":
    avg_by_subject.plot(kind="bar", ax=ax, color=COLOR, edgecolor="white")
    ax.set_ylabel("Average Score")
elif CHART_TYPE == "scatter":
    ax.scatter(range(len(plot_df)), plot_df["score"], c=COLOR, alpha=0.7)
    ax.set_ylabel("Score")
else:
    ax.hist(plot_df["score"], bins=10, color=COLOR, edgecolor="white")
    ax.set_xlabel("Score")

ax.set_title("CSV Story Explorer — CodeItAll")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
out = OUTPUT_DIR / "csv_story_chart.png"
fig.savefig(out, dpi=120)
plt.show()
print(f"Chart saved to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 11
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    11,
    "Fractal Tree Garden",
    "🟡 Intermediate",
    "🌳",
    "Recursively draw fractal trees — a classic demo of recursion, trigonometry, and procedural generation.",
    """- `matplotlib.pyplot`
- `numpy` — `cos`, `sin`, `radians`
- Built-in: recursion""",
    "Recursion, base cases, trigonometry, procedural graphics",
    """- `DEPTH` — 6 (fast) vs 12 (detailed, slower)
- `ANGLE` — branch spread in degrees (20 vs 45)
- `RATIO` — branch length shrink factor (0.65–0.8)
- `COLOR` — trunk/leaf color gradient""",
    "",
    [
        (
            "Step 1 — Recursive tree drawer",
            """import numpy as np
import matplotlib.pyplot as plt

# 🎛️ TWEAK THESE
DEPTH = 10
ANGLE = 25
RATIO = 0.72
TRUNK_LENGTH = 100
ORIGIN = (0, 0)
START_ANGLE = 90  # degrees up

def draw_branch(ax, x, y, length, angle_deg, depth):
    if depth == 0 or length < 1:
        return
    rad = np.radians(angle_deg)
    x2 = x + length * np.cos(rad)
    y2 = y + length * np.sin(rad)
    green = 0.2 + 0.6 * (depth / DEPTH)
    ax.plot([x, x2], [y, y2], color=(0.4, green, 0.2), linewidth=depth * 0.4)
    draw_branch(ax, x2, y2, length * RATIO, angle_deg + ANGLE, depth - 1)
    draw_branch(ax, x2, y2, length * RATIO, angle_deg - ANGLE, depth - 1)

fig, ax = plt.subplots(figsize=(10, 8), facecolor="#1a1a2e")
ax.set_facecolor("#1a1a2e")
draw_branch(ax, ORIGIN[0], ORIGIN[1], TRUNK_LENGTH, START_ANGLE, DEPTH)
ax.set_aspect("equal")
ax.axis("off")
ax.set_title("Fractal Tree Garden — CodeItAll", color="white")
out = OUTPUT_DIR / "fractal_tree.png"
fig.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
plt.show()
print(f"Saved to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 12
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    12,
    "Audio Waveform Painter",
    "🟡 Intermediate",
    "🎵",
    "Synthesize audio waveforms (sine, square, sawtooth) and visualize them — no external audio file needed.",
    """- `numpy` — signal generation
- `matplotlib.pyplot`
- `scipy.io.wavfile` or built-in `wave` — WAV export""",
    "NumPy vectorization, sampling rate, wave types, file export",
    """- `FREQUENCY` — 220 Hz (A3) vs 880 Hz (A5)
- `DURATION` — seconds of audio
- `WAVE_TYPE` — `'sine'`, `'square'`, `'sawtooth'`
- `SAMPLE_RATE` — 44100 (CD quality)""",
    "",
    [
        (
            "Step 1 — Synthesize waveform",
            """import numpy as np
import matplotlib.pyplot as plt

# 🎛️ TWEAK THESE
FREQUENCY = 440       # Hz (A4 note)
DURATION = 2.0        # seconds
SAMPLE_RATE = 44100
WAVE_TYPE = "sine"    # "sine" | "square" | "sawtooth"
AMPLITUDE = 0.5

t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), endpoint=False)

if WAVE_TYPE == "sine":
    signal = AMPLITUDE * np.sin(2 * np.pi * FREQUENCY * t)
elif WAVE_TYPE == "square":
    signal = AMPLITUDE * np.sign(np.sin(2 * np.pi * FREQUENCY * t))
else:
    signal = AMPLITUDE * (2 * (t * FREQUENCY % 1) - 1)

print(f"{WAVE_TYPE} wave: {FREQUENCY}Hz, {DURATION}s, {len(signal)} samples")""",
        ),
        (
            "Step 2 — Visualize & export WAV",
            """fig, axes = plt.subplots(2, 1, figsize=(12, 5), sharex=True)
axes[0].plot(t[:2000], signal[:2000], color="#00d2ff", linewidth=0.8)
axes[0].set_title(f"Waveform Painter — {WAVE_TYPE} @ {FREQUENCY}Hz")
axes[0].set_ylabel("Amplitude")
axes[1].specgram(signal, Fs=SAMPLE_RATE, NFFT=1024, noverlap=512, cmap="magma")
axes[1].set_xlabel("Time (s)")
axes[1].set_ylabel("Frequency (Hz)")
plt.tight_layout()
chart_out = OUTPUT_DIR / f"waveform_{WAVE_TYPE}.png"
fig.savefig(chart_out, dpi=120)
plt.show()

# Export WAV (16-bit PCM)
from scipy.io import wavfile
audio = np.int16(signal / AMPLITUDE * 32767)
wav_out = OUTPUT_DIR / f"tone_{WAVE_TYPE}_{int(FREQUENCY)}hz.wav"
wavfile.write(wav_out, SAMPLE_RATE, audio)
print(f"Chart: {chart_out}\\nAudio: {wav_out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 13
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    13,
    "GIF Animation Studio",
    "🟡 Intermediate",
    "🎬",
    "Build a frame-by-frame animated GIF — understand timing, loops, and image sequences.",
    """- `PIL.Image`, `ImageDraw`
- Built-in: `math`""",
    "Loops, frame lists, image compositing, animation timing",
    """- `FRAMES` — 20 vs 60 (smoothness)
- `SIZE` — 200 vs 500 px
- `DURATION_MS` — milliseconds per frame (50 = fast, 200 = slow)
- `ANIMATION` — `'pulse'`, `'orbit'`, `'rainbow'`""",
    "",
    [
        (
            "Step 1 — Generate animation frames",
            """from PIL import Image, ImageDraw
import math

# 🎛️ TWEAK THESE
FRAMES = 30
SIZE = 300
DURATION_MS = 80
ANIMATION = "orbit"  # "orbit" | "pulse" | "rainbow"
LOOP = 0  # 0 = infinite loop

frames = []
for i in range(FRAMES):
    img = Image.new("RGB", (SIZE, SIZE), (15, 15, 35))
    draw = ImageDraw.Draw(img)
    t = i / FRAMES * 2 * math.pi

    if ANIMATION == "orbit":
        cx = SIZE // 2 + int(80 * math.cos(t))
        cy = SIZE // 2 + int(80 * math.sin(t))
        r = 40
        color = (int(128 + 127 * math.sin(t)), 100, int(128 + 127 * math.cos(t)))
    elif ANIMATION == "pulse":
        cx, cy = SIZE // 2, SIZE // 2
        r = int(30 + 25 * math.sin(t * 2))
        color = (255, int(100 + 100 * math.sin(t)), 80)
    else:  # rainbow
        cx, cy = SIZE // 2, SIZE // 2
        r = 50
        hue = int(i / FRAMES * 255)
        color = ((hue * 3) % 256, (hue * 5) % 256, (hue * 7) % 256)

    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    frames.append(img)

print(f"Generated {len(frames)} frames for '{ANIMATION}' animation")""",
        ),
        (
            "Step 2 — Save animated GIF",
            """out = OUTPUT_DIR / f"animation_{ANIMATION}.gif"
frames[0].save(
    out,
    save_all=True,
    append_images=frames[1:],
    duration=DURATION_MS,
    loop=LOOP,
)
print(f"Saved GIF: {out}")
frames[0]  # first frame preview""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 14
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    14,
    "PDF Certificate Maker",
    "🟡 Intermediate",
    "📜",
    "Generate a printable achievement certificate PDF — perfect for workshops, courses, or fun awards.",
    """- `fpdf` (fpdf2) — `FPDF`
- Built-in: `datetime`""",
    "PDF layout, fonts, coordinates, text positioning",
    """- `RECIPIENT_NAME`, `COURSE_TITLE`, `INSTRUCTOR`
- `ACCENT_COLOR` — RGB tuple for borders
- `ORIENTATION` — `'P'` portrait vs `'L'` landscape""",
    "",
    [
        (
            "Step 1 — Design and render certificate",
            """from fpdf import FPDF
from datetime import date

# 🎛️ TWEAK THESE
RECIPIENT_NAME = "Alex Chen"
COURSE_TITLE = "Python Foundations — CodeItAll"
INSTRUCTOR = "CodeItAll Academy"
ACCENT_COLOR = (108, 92, 231)  # RGB purple
ORIENTATION = "L"  # Landscape
DATE_STR = date.today().strftime("%B %d, %Y")

class Certificate(FPDF):
    def header(self):
        pass

pdf = Certificate(orientation=ORIENTATION, unit="mm", format="A4")
pdf.add_page()
pdf.set_fill_color(*ACCENT_COLOR)

# Border
pdf.set_line_width(2)
pdf.rect(10, 10, 277, 190)

# Title
pdf.set_font("Helvetica", "B", 36)
pdf.set_text_color(*ACCENT_COLOR)
pdf.ln(40)
pdf.cell(0, 20, "Certificate of Achievement", align="C", ln=True)

pdf.set_font("Helvetica", "", 16)
pdf.set_text_color(60, 60, 60)
pdf.ln(10)
pdf.cell(0, 10, "This certifies that", align="C", ln=True)

pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(30, 30, 30)
pdf.ln(5)
pdf.cell(0, 15, RECIPIENT_NAME, align="C", ln=True)

pdf.set_font("Helvetica", "", 14)
pdf.set_text_color(80, 80, 80)
pdf.ln(8)
pdf.cell(0, 10, f"has successfully completed", align="C", ln=True)
pdf.set_font("Helvetica", "BI", 18)
pdf.cell(0, 12, COURSE_TITLE, align="C", ln=True)

pdf.ln(20)
pdf.set_font("Helvetica", "", 12)
pdf.cell(0, 8, f"Instructor: {INSTRUCTOR}  |  Date: {DATE_STR}", align="C")

out = OUTPUT_DIR / "certificate.pdf"
pdf.output(str(out))
print(f"Certificate saved to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 15
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    15,
    "Email HTML Renderer",
    "🟡 Intermediate",
    "✉️",
    "Use Jinja2 templates to render beautiful HTML emails from data — the backbone of newsletters and notifications.",
    """- `jinja2` — `Template`, `Environment`
- Built-in: `json`, `Path`""",
    "Template engines, variable substitution, HTML generation",
    """- `USER_NAME`, `CTA_URL`, `CTA_TEXT`
- `THEME_PRIMARY`, `THEME_BG` — brand colors
- Edit the HTML template structure for layout changes""",
    "",
    [
        (
            "Step 1 — Define template & context",
            '''from jinja2 import Template

# 🎛️ TWEAK THESE
USER_NAME = "Sam"
CTA_URL = "https://codeitall.dev/start"
CTA_TEXT = "Continue Learning"
THEME_PRIMARY = "#6c5ce7"
THEME_BG = "#f8f9fa"
HEADLINE = "Your weekly Python progress is here!"

TEMPLATE = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>CodeItAll</title></head>
<body style="margin:0;font-family:Arial,sans-serif;background:{{ theme_bg }};">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr><td style="background:{{ theme_primary }};padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;">CodeItAll</h1>
        </td></tr>
        <tr><td style="padding:30px;">
          <p>Hi <strong>{{ user_name }}</strong>,</p>
          <h2 style="color:{{ theme_primary }};">{{ headline }}</h2>
          <p>You completed <strong>{{ lessons_done }}</strong> lessons this week. Keep going!</p>
          <p style="text-align:center;margin-top:30px;">
            <a href="{{ cta_url }}" style="background:{{ theme_primary }};color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">{{ cta_text }}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""

context = dict(
    user_name=USER_NAME,
    headline=HEADLINE,
    lessons_done=7,
    cta_url=CTA_URL,
    cta_text=CTA_TEXT,
    theme_primary=THEME_PRIMARY,
    theme_bg=THEME_BG,
)
html = Template(TEMPLATE).render(**context)
print(html[:400] + "...")''',
        ),
        (
            "Step 2 — Save HTML (open in browser)",
            """out = OUTPUT_DIR / "email_preview.html"
out.write_text(html, encoding="utf-8")
print(f"Open in browser: {out.resolve()}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 16
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    16,
    "Stock Sparkline Dashboard",
    "🟡 Intermediate",
    "📈",
    "Simulate stock price data and build a sparkline dashboard — learn time series without needing a live API.",
    """- `pandas` — time series, `date_range`
- `numpy` — random walk
- `matplotlib.pyplot`""",
    "Time series, random walks, subplots, moving averages",
    """- `DAYS` — 30 vs 365 trading days
- `START_PRICE`, `VOLATILITY` — market character
- `TICKER` — display name
- `SHOW_MA` — moving average window (0 to disable)""",
    "",
    [
        (
            "Step 1 — Simulate price history",
            """import numpy as np
import pandas as pd

# 🎛️ TWEAK THESE
TICKER = "PYTH"
DAYS = 90
START_PRICE = 100.0
VOLATILITY = 0.02
SEED = 7

np.random.seed(SEED)
returns = np.random.normal(0.0005, VOLATILITY, DAYS)
prices = START_PRICE * np.cumprod(1 + returns)
dates = pd.date_range(end=pd.Timestamp.today(), periods=DAYS, freq="B")

df = pd.DataFrame({"date": dates, "close": prices})
df["ma20"] = df["close"].rolling(20, min_periods=1).mean()
df.tail()""",
        ),
        (
            "Step 2 — Sparkline dashboard",
            """import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# 🎛️ TWEAK THESE
SHOW_MA = 20
COLOR_UP = "#00b894"
COLOR_MA = "#fdcb6e"

fig, axes = plt.subplots(2, 1, figsize=(12, 6), gridspec_kw={"height_ratios": [3, 1]})

# Main price chart
ax1 = axes[0]
ax1.plot(df["date"], df["close"], color=COLOR_UP, linewidth=2, label="Close")
if SHOW_MA:
    ax1.plot(df["date"], df["ma20"], color=COLOR_MA, linewidth=1.5, linestyle="--", label=f"MA{SHOW_MA}")
ax1.fill_between(df["date"], df["close"], alpha=0.15, color=COLOR_UP)
ax1.set_title(f"{TICKER} — Stock Sparkline Dashboard (CodeItAll)", fontsize=14)
ax1.legend()
ax1.grid(alpha=0.3)

# Daily returns sparkline
daily_ret = df["close"].pct_change().fillna(0)
colors = ["#d63031" if r < 0 else "#00b894" for r in daily_ret]
axes[1].bar(df["date"], daily_ret * 100, color=colors, width=0.8)
axes[1].set_ylabel("Return %")
axes[1].xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))

plt.tight_layout()
out = OUTPUT_DIR / "stock_sparkline.png"
fig.savefig(out, dpi=120)
plt.show()
csv_out = OUTPUT_DIR / "stock_data.csv"
df.to_csv(csv_out, index=False)
print(f"Chart: {out}\\nData: {csv_out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 17
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    17,
    "Color Extractor Lens",
    "🟡 Intermediate",
    "🎨",
    "Extract dominant colors from any image and build a palette swatch — essential for design and data viz.",
    """- `PIL.Image`
- `collections.Counter`
- `matplotlib.pyplot`""",
    "Image quantization, counting, sorting, color theory",
    """- `N_COLORS` — 3 vs 8 dominant colors
- `RESIZE` — speed vs accuracy (50 vs 200 px wide)
- Use your own image path instead of the generated sample""",
    "",
    [
        (
            "Step 1 — Create or load an image",
            """from PIL import Image, ImageDraw
import random

# 🎛️ TWEAK — set IMAGE_PATH to your photo, or None for sample
IMAGE_PATH = None
N_COLORS = 5
RESIZE = 100

if IMAGE_PATH is None:
    img = Image.new("RGB", (300, 200))
    draw = ImageDraw.Draw(img)
    palette = [(255,99,71), (65,105,225), (50,205,50), (255,215,0), (138,43,226)]
    for _ in range(40):
        x, y = random.randint(0, 280), random.randint(0, 180)
        draw.ellipse([x, y, x+40, y+40], fill=random.choice(palette))
    sample_path = OUTPUT_DIR / "color_sample.png"
    img.save(sample_path)
    IMAGE_PATH = sample_path

img = Image.open(IMAGE_PATH).convert("RGB")
w, h = img.size
new_w = RESIZE
img = img.resize((new_w, int(h * new_w / w)))
img""",
        ),
        (
            "Step 2 — Extract & visualize palette",
            """from collections import Counter
import matplotlib.pyplot as plt

# Quantize to reduce unique colors
img_q = img.quantize(colors=64).convert("RGB")
pixels = list(img_q.getdata())
# Round to nearest 16 for grouping
rounded = [((r//16)*16, (g//16)*16, (b//16)*16) for r, g, b in pixels]
top = Counter(rounded).most_common(N_COLORS)

print("Dominant colors (RGB):")
for i, (rgb, count) in enumerate(top, 1):
    pct = count / len(rounded) * 100
    hex_c = "#{:02x}{:02x}{:02x}".format(*rgb)
    print(f"  {i}. {rgb} {hex_c} — {pct:.1f}%")

fig, axes = plt.subplots(1, 2, figsize=(12, 4))
axes[0].imshow(Image.open(IMAGE_PATH))
axes[0].set_title("Source Image")
axes[0].axis("off")

swatch = Image.new("RGB", (N_COLORS * 80, 80))
for i, (rgb, _) in enumerate(top):
    for x in range(80):
        for y in range(80):
            swatch.putpixel((i * 80 + x, y), rgb)
axes[1].imshow(swatch)
axes[1].set_title("Extracted Palette")
axes[1].axis("off")
plt.tight_layout()
out = OUTPUT_DIR / "color_palette.png"
fig.savefig(out, dpi=120)
plt.show()
print(f"Saved to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 18
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    18,
    "Sentiment Mood Ring",
    "🟡 Intermediate",
    "💭",
    "Analyze text sentiment with a lightweight lexicon scorer and visualize the mood as a color ring.",
    """- Built-in: `re`, `str`
- `matplotlib.pyplot` — polar plot mood ring
- Optional upgrade: `textblob` for NLP""",
    "Text processing, scoring algorithms, polar plots",
    """- `TEXT` — reviews, tweets, journal entries
- Extend `POSITIVE` / `NEGATIVE` word lists
- `RING_SEGMENTS` — visual granularity""",
    "",
    [
        (
            "Step 1 — Lexicon-based sentiment scorer",
            '''import re

# 🎛️ TWEAK THESE
TEXT = """
I absolutely love learning Python! The projects are creative and fun.
Sometimes debugging is frustrating, but the results are amazing and rewarding.
CodeItAll makes programming feel approachable and exciting.
"""

POSITIVE = {"love", "creative", "fun", "amazing", "rewarding", "approachable", "exciting", "great", "good", "happy", "excellent"}
NEGATIVE = {"frustrating", "bad", "hate", "terrible", "boring", "difficult", "awful", "sad", "angry", "worst"}

def score_sentiment(text):
    words = re.findall(r"[a-zA-Z']+", text.lower())
    pos = sum(1 for w in words if w in POSITIVE)
    neg = sum(1 for w in words if w in NEGATIVE)
    total = pos + neg or 1
    compound = (pos - neg) / total  # -1 to 1
    label = "Positive 😊" if compound > 0.15 else "Negative 😔" if compound < -0.15 else "Neutral 😐"
    return {"positive": pos, "negative": neg, "compound": compound, "label": label, "word_count": len(words)}

result = score_sentiment(TEXT)
print(result)
print(f"Mood: {result['label']}")''',
        ),
        (
            "Step 2 — Mood ring visualization",
            """import numpy as np
import matplotlib.pyplot as plt

# 🎛️ TWEAK THESE
RING_SEGMENTS = 36

compound = result["compound"]
# Map compound (-1..1) to hue: red → yellow → green
mood_color = plt.cm.RdYlGn((compound + 1) / 2)

fig, ax = plt.subplots(subplot_kw={"projection": "polar"}, figsize=(6, 6))
theta = np.linspace(0, 2 * np.pi, RING_SEGMENTS, endpoint=False)
radii = np.ones(RING_SEGMENTS)
colors = [plt.cm.RdYlGn((compound + 1) / 2 + 0.05 * np.sin(i)) for i in range(RING_SEGMENTS)]
ax.bar(theta, radii, width=2*np.pi/RING_SEGMENTS, bottom=0.5, color=colors, edgecolor="white", linewidth=0.5)
ax.set_ylim(0, 1.5)
ax.axis("off")
ax.set_title(f"Sentiment Mood Ring\\n{result['label']} (score: {compound:+.2f})", fontsize=13, pad=20)

out = OUTPUT_DIR / "sentiment_mood_ring.png"
fig.savefig(out, dpi=120, bbox_inches="tight")
plt.show()
print(f"Saved to {out}")""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 19
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    19,
    "GeoMap Storyteller",
    "🔴 Advanced",
    "🗺️",
    "Plot an interactive world map with markers and popups using Folium — share it as a standalone HTML file.",
    """- `folium` — `Map`, `Marker`, `CircleMarker`, `Icon`
- Built-in: `list`, `dict`""",
    "Geo data structures, layered maps, HTML export, coordinates",
    """- `LOCATIONS` — add cities with (lat, lon, label)
- `ZOOM_START` — world view (2) vs city view (12)
- `TILE_STYLE` — `'OpenStreetMap'`, `'CartoDB positron'`, `'Stamen Terrain'`
- `MARKER_COLOR` — icon color per location""",
    "",
    [
        (
            "Step 1 — Define locations & build map",
            """import folium

# 🎛️ TWEAK THESE
LOCATIONS = [
    {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503, "color": "red"},
    {"name": "Paris", "lat": 48.8566, "lon": 2.3522, "color": "blue"},
    {"name": "New York", "lat": 40.7128, "lon": -74.0060, "color": "green"},
    {"name": "Sydney", "lat": -33.8688, "lon": 151.2093, "color": "purple"},
    {"name": "Cairo", "lat": 30.0444, "lon": 31.2357, "color": "orange"},
]
ZOOM_START = 2
TILE_STYLE = "CartoDB positron"

center_lat = sum(l["lat"] for l in LOCATIONS) / len(LOCATIONS)
center_lon = sum(l["lon"] for l in LOCATIONS) / len(LOCATIONS)

m = folium.Map(location=[center_lat, center_lon], zoom_start=ZOOM_START, tiles=TILE_STYLE)

for loc in LOCATIONS:
    folium.Marker(
        location=[loc["lat"], loc["lon"]],
        popup=f"<b>{loc['name']}</b><br>CodeItAll GeoMap",
        tooltip=loc["name"],
        icon=folium.Icon(color=loc["color"], icon="info-sign"),
    ).add_to(m)
    folium.CircleMarker(
        location=[loc["lat"], loc["lon"]],
        radius=8,
        color=loc["color"],
        fill=True,
        fill_opacity=0.4,
    ).add_to(m)

out = OUTPUT_DIR / "geomap_storyteller.html"
m.save(str(out))
print(f"Interactive map saved: {out.resolve()}")
m""",
        ),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════
# PROJECT 20
# ═══════════════════════════════════════════════════════════════════════════
add_project(
    20,
    "Plotly Data Dashboard",
    "🔴 Advanced",
    "📊",
    "Build a multi-chart interactive dashboard with Plotly — hover, zoom, and pan across linked visualizations.",
    """- `plotly.graph_objects`, `plotly.subplots.make_subplots`
- `pandas` — data manipulation
- `numpy` — synthetic dataset""",
    "Subplots, interactive widgets, HTML export, data pipelines",
    """- `NUM_ROWS` — dataset size
- `CATEGORIES` — pie/bar segments
- `COLOR_SCALE` — `'Viridis'`, `'Plasma'`, `'Tealrose'`
- `CHART_THEME` — `'plotly'`, `'plotly_dark'`, `'ggplot2'`""",
    "",
    [
        (
            "Step 1 — Build synthetic dataset",
            """import numpy as np
import pandas as pd

# 🎛️ TWEAK THESE
NUM_ROWS = 200
CATEGORIES = ["Python", "Data", "Web", "ML", "Automation"]
SEED = 42

np.random.seed(SEED)
df = pd.DataFrame({
    "day": pd.date_range("2026-01-01", periods=NUM_ROWS, freq="D"),
    "users": np.cumsum(np.random.poisson(15, NUM_ROWS)) + np.random.randint(50, 100),
    "revenue": np.cumsum(np.random.normal(120, 40, NUM_ROWS)).clip(0),
    "category": np.random.choice(CATEGORIES, NUM_ROWS),
    "satisfaction": np.random.uniform(3.5, 5.0, NUM_ROWS).round(1),
})
df.head()""",
        ),
        (
            "Step 2 — Interactive multi-panel dashboard",
            """import plotly.graph_objects as go
from plotly.subplots import make_subplots

# 🎛️ TWEAK THESE
COLOR_SCALE = "Tealrose"
CHART_THEME = "plotly_dark"

cat_counts = df["category"].value_counts()

fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=("User Growth", "Revenue Trend", "Category Mix", "Satisfaction Distribution"),
    specs=[[{"type": "scatter"}, {"type": "scatter"}],
           [{"type": "pie"}, {"type": "histogram"}]],
)

fig.add_trace(go.Scatter(x=df["day"], y=df["users"], mode="lines", name="Users",
    line=dict(color="#00d2ff", width=2)), row=1, col=1)
fig.add_trace(go.Scatter(x=df["day"], y=df["revenue"], mode="lines", name="Revenue",
    line=dict(color="#ff6b6b", width=2), fill="tozeroy"), row=1, col=2)
fig.add_trace(go.Pie(labels=cat_counts.index, values=cat_counts.values, hole=0.4,
    marker=dict(colors=["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#74b9ff"])), row=2, col=1)
fig.add_trace(go.Histogram(x=df["satisfaction"], nbinsx=15, marker_color="#a29bfe"), row=2, col=2)

fig.update_layout(
    title_text="CodeItAll — Interactive Data Dashboard",
    template=CHART_THEME,
    height=700,
    showlegend=False,
)

out = OUTPUT_DIR / "plotly_dashboard.html"
fig.write_html(str(out))
print(f"Dashboard saved: {out.resolve()}")
fig.show()""",
        ),
    ],
)

# ── Closing ──────────────────────────────────────────────────────────────────
cells.append(
    md(
        """---

## 🎓 Congratulations — You've CodeItAll!

You completed **20 projects** spanning:
- Image & GIF generation
- Security tools & encoders
- Data analysis & visualization
- PDF & HTML document generation
- Audio synthesis & maps
- Interactive dashboards

### Next Steps
1. **Combine projects** — e.g., generate a QR code inside a PDF certificate
2. **Add `input()`** — make parameters user-interactive at runtime
3. **Package as CLI** — use `argparse` to accept command-line flags
4. **Publish outputs** — share your `outputs/` folder creations

*Built with ❤️ by **CodeItAll** — learn by building.*"""
    )
)

notebook = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.11.0",
        },
    },
    "cells": cells,
}

NOTEBOOK_PATH.write_text(json.dumps(notebook, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"Generated {NOTEBOOK_PATH} with {len(cells)} cells")
