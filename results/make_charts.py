"""Draws the three charts on research.html from thesis_results.csv.

    python results/make_charts.py

Writes SVGs to images/research/. Every plotted value comes from the CSV, which is
copied from Tables 5.1 and 5.2 of the thesis.
"""
import csv
import logging
from pathlib import Path

import matplotlib

matplotlib.use("svg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "research"

# Site palette: white for the point of the chart, grey for context, amber for the
# popularity reference.
BG = "#0a0a0a"
TEXT = "#fafafa"
MUTED = "#a3a3a3"
GRID = "#262626"
CONTEXT = "#6b6b6b"
REF = "#e8a33d"

# Random floor for one positive among 101 candidates (10/101), as stated in Section 5.1.
RANDOM_FLOOR = 10 / 101

# The SVGs name Inter and keep text as text, so the browser picks the font. Inter
# needn't be installed here, and matplotlib complains on every glyph when it isn't.
logging.getLogger("matplotlib.font_manager").setLevel(logging.ERROR)

plt.rcParams.update({
    "svg.fonttype": "none",
    "font.family": ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
    "font.size": 11,
    "figure.facecolor": BG,
    "axes.facecolor": BG,
    "axes.edgecolor": GRID,
    "axes.labelcolor": MUTED,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "text.color": TEXT,
})


def load():
    with open(ROOT / "results" / "thesis_results.csv", newline="") as f:
        return list(csv.DictReader(f))


def style(ax):
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.tick_params(length=0)


def hr_overview(rows):
    # One bar per configuration. The classical models were scored at both scales;
    # the full population (N = 6,040) is the headline, so it wins.
    best = {}
    for r in rows:
        if r["table"] != "5.1":
            continue
        if r["method"] not in best or r["n"] == "6040":
            best[r["method"]] = r
    configs = sorted(best.values(), key=lambda r: float(r["overall"]))

    fig, ax = plt.subplots(figsize=(8, 7.2))
    y = range(len(configs))
    pop = float(best["Popularity (prior)"]["overall"])
    colors = []
    for r in configs:
        v = float(r["overall"])
        if r["method"] == "Popularity (prior)":
            colors.append(REF)
        elif v > pop:
            colors.append(TEXT)
        else:
            colors.append(CONTEXT)
    ax.barh(list(y), [float(r["overall"]) for r in configs], height=0.68, color=colors)
    ax.axvline(pop, color=REF, lw=1.5, ls=(0, (4, 3)))
    ax.text(pop + 0.008, len(configs) - 0.3, f"popularity {best['Popularity (prior)']['overall']}",
            color=REF, fontsize=10, va="bottom")
    ax.axvline(RANDOM_FLOOR, color=MUTED, lw=1, ls=(0, (1, 3)))
    ax.text(RANDOM_FLOOR + 0.008, -0.9, "random ≈ 0.099", color=MUTED, fontsize=9, va="center")

    labels = []
    for r in configs:
        name = r["method"]
        if r["n"] == "1500":
            name += "  ·  N=1,500"
        labels.append(name)
    ax.set_yticks(list(y), labels)
    for i, r in enumerate(configs):
        # The background patch keeps a value readable where it crosses the reference line.
        ax.text(float(r["overall"]) + 0.008, i, r["overall"], va="center", fontsize=9,
                color=TEXT if colors[i] == TEXT else MUTED, zorder=3,
                bbox=dict(facecolor=BG, edgecolor="none", pad=1))

    ax.set_xlim(0, 0.92)
    ax.set_ylim(-1.4, len(configs) - 0.1)
    ax.set_xlabel("HR@10, overall")
    ax.xaxis.grid(True, color=GRID, lw=0.8)
    ax.set_axisbelow(True)
    style(ax)
    fig.tight_layout()
    fig.savefig(OUT / "hr10_configs.svg", facecolor=BG)
    plt.close(fig)


def density(rows):
    shown = ["GRU4Rec", "BPR", "GenreBPR", "V3+Pop (α = 0.5)", "Popularity (prior)",
             "V3 SBERT", "V2 ReLLa-SUBR"]
    picked = {r["method"]: r for r in rows if r["table"] == "5.1" and r["n"] == "6040"}

    fig, ax = plt.subplots(figsize=(8, 5))
    x = [0, 1, 2]
    # Spread the right-hand labels so close dense values don't print on top of each other.
    label_y = {}
    floor = None
    for name in sorted(shown, key=lambda n: -float(picked[n]["dense"])):
        y = float(picked[name]["dense"])
        if floor is not None and y > floor:
            y = floor
        label_y[name] = y
        floor = y - 0.035
    for name in shown:
        r = picked[name]
        vals = [float(r[k]) for k in ("sparse", "mid", "dense")]
        if name == "GRU4Rec":
            color, lw = TEXT, 2.5
        elif name == "Popularity (prior)":
            color, lw = REF, 2
        else:
            color, lw = CONTEXT, 1.6
        ax.plot(x, vals, color=color, lw=lw, marker="o", ms=6,
                markeredgecolor=BG, markeredgewidth=1.5)
        label = name.replace(" (prior)", "")
        ax.text(2.08, label_y[name], f"{label}  {r['dense']}", va="center", fontsize=9,
                color=TEXT if color == TEXT else (REF if color == REF else MUTED))
    g = picked["GRU4Rec"]
    ax.text(-0.08, float(g["sparse"]), g["sparse"], ha="right", va="center", fontsize=9, color=TEXT)

    ax.set_xticks(x, ["sparse\n≤ 42 ratings", "mid", "dense\n> 206 ratings"])
    ax.set_xlim(-0.35, 2.95)
    ax.set_ylim(0, 1)
    ax.set_ylabel("HR@10")
    ax.yaxis.grid(True, color=GRID, lw=0.8)
    ax.set_axisbelow(True)
    style(ax)
    fig.tight_layout()
    fig.savefig(OUT / "density.svg", facecolor=BG)
    plt.close(fig)


def curriculum(rows):
    by_method = {r["method"]: r for r in rows if r["table"] == "5.2"}
    order = [("LLaRA V2a", "forward\n(published)"), ("LLaRA V2b", "none"),
             ("LLaRA V2c", "reverse")]
    pop = next(r for r in rows if r["method"] == "Popularity (prior)")

    fig, ax = plt.subplots(figsize=(6.4, 4.4))
    vals = [float(by_method[m]["overall"]) for m, _ in order]
    colors = [CONTEXT, TEXT, CONTEXT]
    ax.bar(range(3), vals, width=0.56, color=colors)
    for i, (m, _) in enumerate(order):
        # The tall bar ends just under the popularity line, so its label goes inside.
        if colors[i] == TEXT:
            ax.text(i, vals[i] - 0.03, by_method[m]["overall"], ha="center", fontsize=10,
                    color=BG, fontweight="bold")
        else:
            ax.text(i, vals[i] + 0.012, by_method[m]["overall"], ha="center", fontsize=10,
                    color=MUTED)
    ax.axhline(float(pop["overall"]), color=REF, lw=1.5, ls=(0, (4, 3)))
    ax.text(2.32, float(pop["overall"]) + 0.012, f"popularity {pop['overall']}",
            ha="right", color=REF, fontsize=9)

    ax.set_xticks(range(3), [f"{label}\n{m}" for m, label in order])
    ax.set_ylim(0, 0.55)
    ax.set_ylabel("HR@10, overall (N = 1,500)")
    ax.yaxis.grid(True, color=GRID, lw=0.8)
    ax.set_axisbelow(True)
    style(ax)
    fig.tight_layout()
    fig.savefig(OUT / "curriculum.svg", facecolor=BG)
    plt.close(fig)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    rows = load()
    hr_overview(rows)
    density(rows)
    curriculum(rows)
