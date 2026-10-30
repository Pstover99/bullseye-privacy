#!/usr/bin/env python3
"""Build every page of the site from _layout.html.

    python3 render.py           # write the pages
    python3 render.py --check   # exit 1 if any page is stale (what CI runs)

Every .html page here is generated, never hand-edited. One layout carries the header, footer
and <head> for all of them, so a page cannot drift out of step with the others; the bodies live
in _pages/, and the privacy policy's body is rendered from PRIVACY_POLICY.md, a copy of
docs/PRIVACY_POLICY.md in the app repo. Editing the HTML directly is how the published policy
once still described an app with no accounts, months after accounts shipped.

The markdown is deliberately plain: headings, paragraphs, and bullets whose continuation
lines are indented two spaces. A bullet may hold several paragraphs, separated by a blank
line and indented the same way.

Underscored files and folders are not published: GitHub Pages' Jekyll build skips them.
"""
import hashlib
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
LAYOUT = HERE / "_layout.html"
MARKDOWN = HERE / "PRIVACY_POLICY.md"
SITE = "https://bullseyeballisticscalculator.com/"

# (output, body source, root prefix, title, description). The root prefix is how a page reaches
# the site root with a relative link, so the pages also work under a project URL. 404.html is
# served at whatever path was missed, so only an absolute root works for it.
PAGES = [
    ("index.html", "_pages/home.html", "",
     "Bullseye Ballistics Calculator",
     "A ballistics calculator for Android that learns your rifle. Sagitta Ballistics AI that "
     "explains why you missed, live wind and weather from your Bluetooth sensors, hit "
     "probability, a gun number for every load, a shot log that trues the load, groups from a "
     "photo, matches, load development, Hunting Zero, Hunt Mode and an external HUD."),
    ("features/index.html", "_pages/features.html", "../",
     "Features · Bullseye Ballistics",
     "Every feature, screen by screen: Sagitta Ballistics AI, the solution card, live sensors, "
     "Live Wind, the solver, rifles and loads, the shot log, groups, matches, voice calls, the "
     "external HUD, the stability calculator, backup, the gun number, barrel care, load "
     "development, Hunting Zero and Hunt Mode."),
    ("comparison/index.html", "_pages/comparison.html", "../",
     "Comparison · Bullseye Ballistics",
     "Compare Bullseye Ballistics to other popular solver apps, feature by feature: firing "
     "solutions, sensors, the External Display, shot logging and analysis, truing, groups, "
     "matches, load development, barrel care and Sagitta AI."),
    ("external-display/index.html", "_pages/external-display.html", "../",
     "Bullseye Ballistics External Display",
     "The optional Bullseye Ballistics External Display mounts to your rifle or scope and shows "
     "your elevation and windage holds during the trigger press, with built-in level and angle "
     "sensors. Try it in the simulator."),
    ("wind-corridor/index.html", "_pages/wind-corridor.html", "../",
     "Wind Corridor · Bullseye Ballistics",
     "Pair Bullseye Ballistics with Calypso LoRa wind meters downrange and see the wind between "
     "you and the target, live. Learn what it looks like in the mirage, leaves, trees and grass."),
    ("hunting/index.html", "_pages/hunting.html", "../",
     "Hunting · Bullseye Ballistics",
     "Hunting Zero works out exactly how high to sight in for your load, the animal's vital "
     "zone, your group size and the conditions where you hunt. Hunt Mode then tells you to hold "
     "center or gives the exact hold, and checks every shot is ethical."),
    ("matches/index.html", "_pages/matches.html", "../",
     "Matches · Bullseye Ballistics",
     "Upload a match book or photograph a stage card, and Sagitta sets up the match in Bullseye "
     "Ballistics: every stage, position, target, distance and size, with the Match Director's "
     "notes. Then step through every target at the line."),
    ("live-wind/index.html", "_pages/live-wind.html", "../",
     "Live Wind · Bullseye Ballistics",
     "Live Wind streams your Calypso wind meter into the Bullseye Ballistics solver: a wind "
     "clock, a 2-minute speed bar and a hold for every condition, updated in real time."),
    ("under-the-hood/index.html", "_pages/under-the-hood.html", "../",
     "Under the Hood · Bullseye Ballistics",
     "How Bullseye Ballistics turns live wind into a hold: smoothing matched to your target "
     "distance, wind direction averaged as a vector, a full flight simulation in 1 ms steps, and "
     "air density that changes as an angled shot climbs or drops."),
    ("truing/index.html", "_pages/truing.html", "../",
     "Truing · Bullseye Ballistics",
     "Truing in Bullseye Ballistics: enter what you dialed to hit at two distances, and it "
     "corrects your velocity and drag together so every other distance matches too. With a "
     "before-and-after example, and how adaptive wind smoothing keeps your hold steady in gusts."),
    ("hit-probability/index.html", "_pages/hit-probability.html", "../",
     "Hit Probability · Bullseye Ballistics",
     "How Bullseye Ballistics works out your Hit Probability: today's conditions, the errors it "
     "plans for in wind, range, BC and muzzle velocity, and your own accuracy from measured "
     "groups, called shots or an estimate."),
    ("sagitta/index.html", "_pages/sagitta.html", "../",
     "Sagitta Ballistics AI · Bullseye Ballistics",
     "Sagitta Ballistics AI connects what the solver predicted, what the environment did, what "
     "you called and what actually happened, then explains why you missed and how to fix it."),
    ("sensors/index.html", "_pages/sensors.html", "../",
     "Sensors · Bullseye Ballistics",
     "Bluetooth wind and weather sensors that work with Bullseye Ballistics: Calypso and "
     "WeatherFlow Tempest, several at once."),
    ("get-the-app/index.html", "_pages/get-the-app.html", "../",
     "Get the app · Bullseye Ballistics",
     "Bullseye Ballistics is available now on Google Play for Android, and coming soon to the "
     "App Store for iPhone."),
    ("privacy/index.html", "PRIVACY_POLICY.md", "../",
     "Privacy policy · Bullseye Ballistics",
     "What Bullseye Ballistics accesses on your phone, what an optional backup contains, and how "
     "to delete it."),
    ("terms/index.html", "_pages/terms.html", "../",
     "Terms of Use · Bullseye Ballistics",
     "The terms for using Bullseye Ballistics, Sagitta AI, the External Display and this website, "
     "including firearm and reloading safety, ballistic estimates and subscriptions."),
    ("delete-account/index.html", "_pages/delete-account.html", "../",
     "Delete your account · Bullseye Ballistics",
     "How to delete your Bullseye Ballistics account and everything backed up to it."),
    ("delete-data/index.html", "_pages/delete-data.html", "../",
     "Delete data · Bullseye Ballistics",
     "How to delete data from Bullseye Ballistics without deleting your account."),
    ("404.html", "_pages/404.html", "/",
     "Page not found · Bullseye Ballistics",
     "There is no page at this address."),
]

# The header's links, by the {{CURRENT_...}} key in _layout.html, and the folder each opens.
NAV = {
    "FEATURES": "features/", "SAGITTA": "sagitta/", "SENSORS": "sensors/",
    "WIND": "wind-corridor/", "EXTERNAL": "external-display/",
    "HUNTING": "hunting/", "MATCHES": "matches/", "LIVEWIND": "live-wind/",
    "TRUING": "truing/", "HOOD": "under-the-hood/", "HITPROB": "hit-probability/", "COMPARISON": "comparison/", "GET": "get-the-app/",
}
# The dropdowns, by the {{GROUP_...}} key: the group of the page you're on is marked too.
NAV_GROUPS = {
    "FEATURES": ["FEATURES", "SAGITTA", "SENSORS", "WIND", "EXTERNAL"],
    "FIELD": ["HUNTING", "MATCHES", "LIVEWIND"],
    "HOOD": ["TRUING", "HOOD", "HITPROB"],
}

# Pages not linked from anywhere yet, kept out of search results until they are.
NOINDEX = set()


def inline(text: str) -> str:
    text = html.escape(text, quote=False)
    # Bold first, so the single-asterisk pass cannot chew through a ** pair.
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*(?!\s)([^*]+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", text)
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', text)


def render(md: str) -> str:
    lines = md.split("\n")
    out, i = [], 0
    while i < len(lines):
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        if line.startswith("# "):
            out.append(f"  <h1>{inline(line[2:].strip())}</h1>")
            i += 1
            continue

        if line.startswith("## "):
            out.append(f"  <h2>{inline(line[3:].strip())}</h2>")
            i += 1
            continue

        if line.startswith("- "):
            out.append("  <ul>")
            while i < len(lines) and lines[i].startswith("- "):
                paras = [[lines[i][2:].strip()]]
                i += 1
                while i < len(lines):
                    nxt = lines[i]
                    if nxt.startswith("  ") and nxt.strip():
                        paras[-1].append(nxt.strip())
                        i += 1
                    elif not nxt.strip():
                        # A blank line continues the item only if indented text follows.
                        j = i + 1
                        if j < len(lines) and lines[j].startswith("  ") and lines[j].strip():
                            paras.append([])
                            i = j
                        else:
                            i += 1
                            break
                    else:
                        break
                body = "".join(
                    f"<p>{inline(' '.join(p))}</p>" if n else inline(" ".join(p))
                    for n, p in enumerate(paras)
                )
                out.append(f"    <li>{body}</li>")
            out.append("  </ul>")
            continue

        para = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", "- ")):
            para.append(lines[i].strip())
            i += 1
        text = " ".join(para)
        cls = ' class="updated"' if text.startswith("Last updated:") else ""
        out.append(f"  <p{cls}>{inline(text)}</p>")

    return "\n\n".join(out)


# British spellings, the same list as the app's CopySpellingTest
# (Bullseye-VC: app/src/test/kotlin/com/ballistics/app/ui/CopySpellingTest.kt). docs/COPY_STYLE.md
# rule 10: US spelling, because testers read the British forms as odd. Keep the two lists in step.
BRITISH = {
    "centre": "center", "centres": "centers", "centred": "centered", "centring": "centering",
    "dialled": "dialed", "dialling": "dialing",
    "cancelled": "canceled", "cancelling": "canceling",
    "labelled": "labeled", "labelling": "labeling",
    "levelled": "leveled", "travelled": "traveled", "modelled": "modeled",
    "colour": "color", "colours": "colors", "coloured": "colored",
    "favour": "favor", "favours": "favors", "favoured": "favored",
    "behaviour": "behavior", "neighbour": "neighbor", "honour": "honor",
    "metre": "meter", "metres": "meters",
    "centimetre": "centimeter", "centimetres": "centimeters",
    "millimetre": "millimeter", "millimetres": "millimeters",
    "kilometre": "kilometer", "kilometres": "kilometers",
    "litre": "liter", "litres": "liters",
    "calibre": "caliber", "calibres": "calibers",
    "analyse": "analyze", "analysed": "analyzed", "analysing": "analyzing",
    "licence": "license", "catalogue": "catalog", "defence": "defense",
    "grey": "gray", "aluminium": "aluminum",
    "recognise": "recognize", "recognised": "recognized", "recogniser": "recognizer",
    "organise": "organize", "organised": "organized",
    "customise": "customize", "customised": "customized",
    "optimise": "optimize", "optimised": "optimized",
    "minimise": "minimize", "maximise": "maximize",
    "initialise": "initialize", "initialised": "initialized",
    "normalise": "normalize", "normalised": "normalized",
    "summarise": "summarize", "visualise": "visualize",
    "synchronise": "synchronize", "synchronised": "synchronized",
    "prioritise": "prioritize", "realise": "realize", "stabilise": "stabilize",
    "authorise": "authorize", "authorised": "authorized",
}

# Product names are spelled the way their makers spell them, British form or not.
BRAND_NAMES = ["Gunship Grey"]


def british_spellings(page: str) -> list[str]:
    """British spellings in a page's visible text: tags, comments, styles and scripts removed."""
    text = re.sub(r"<!--.*?-->|<(style|script)\b.*?</\1>", " ", page, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\b(?:%s)\b" % "|".join(BRAND_NAMES), " ", text)
    words = re.findall(r"[A-Za-z]+", text)
    return sorted({f"{w} -> {BRITISH[w.lower()]}" for w in words if w.lower() in BRITISH})


COPYRIGHT = "&copy; 2026 Core Bridge, LLC. All rights reserved."


def visible_text(page: str) -> str:
    text = re.sub(r"<!--.*?-->|<(style|script)\b.*?</\1>", " ", page, flags=re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text))


def company_slips(page: str) -> list[str]:
    """The owner's rules for every page: the copyright line is in the footer, and the company is
    always "Core Bridge, LLC." in full. An address such as appdevcorebridge@ is not a name."""
    slips = [] if COPYRIGHT in page else ["missing the footer line: " + html.unescape(COPYRIGHT)]
    for m in re.finditer(r"(?<![A-Za-z])core\s*bridge(?!, LLC\.)", visible_text(page), flags=re.I):
        slips.append(f'"{m.group(0)}" should read "Core Bridge, LLC."')
    return slips


def version(asset: str) -> str:
    """A short hash of an asset, added to its URL. GitHub Pages lets browsers keep a file for ten
    minutes, so without it a fresh page can run against last version's script: the External
    Display simulator once kept its fixed holds that way, right after the solver shipped."""
    # Line endings normalized, so a Windows checkout and CI agree.
    return hashlib.sha256((HERE / asset).read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:10]


def body_for(source: str) -> str:
    if source.endswith(".md"):
        doc = re.sub(r"\n +\n", "\n\n", render((HERE / source).read_text()).replace("\n", "\n  "))
        return (
            '<section class="doc">\n  <div class="wrap">\n    <div class="label">Legal</div>\n'
            f"  {doc}\n  </div>\n</section>\n"
        )
    return (HERE / source).read_text()


def build(output: str, source: str, root: str, title: str, description: str) -> str:
    path = "" if output == "index.html" else output.removesuffix("index.html")
    page = LAYOUT.read_text()
    fields = {
        "{{BODY}}": body_for(source).rstrip("\n"),
        "{{TITLE}}": html.escape(title),
        "{{DESCRIPTION}}": html.escape(description),
        "{{ROBOTS}}": '\n<meta name="robots" content="noindex">' if output in NOINDEX else "",
        "{{CSS_V}}": version("assets/site.css"),
        "{{JS_V}}": version("assets/site.js"),
        "{{URL}}": SITE + ("" if output == "404.html" else path),
    }
    # The nav: mark the page you're on, and the group its link sits in.
    here = output.split("/")[0] + "/"
    for key, prefix in NAV.items():
        fields["{{CURRENT_" + key + "}}"] = ' aria-current="page"' if here == prefix else ""
    for key, members in NAV_GROUPS.items():
        fields["{{GROUP_" + key + "}}"] = " gn-current" if here in [NAV[m] for m in members] else ""
    for key, value in fields.items():
        page = page.replace(key, value)
    # Last, so a {{ROOT}} inside a body is filled in too.
    return page.replace("{{ROOT}}", root)


if __name__ == "__main__":
    check = "--check" in sys.argv
    stale = []
    spelling = []
    company = []
    for output, *spec in PAGES:
        page = build(output, *spec)
        spelling += [f"{output}: {hit}" for hit in british_spellings(page)]
        company += [f"{output}: {slip}" for slip in company_slips(page)]
        target = HERE / output
        if check:
            if not target.exists() or target.read_text() != page:
                stale.append(output)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(page)
            print(f"wrote {output}")
    if company:
        print("Company name and copyright:\n  " + "\n  ".join(company), file=sys.stderr)
        sys.exit(1)
    if spelling:
        print("British spelling (docs/COPY_STYLE.md rule 10 is US spelling):\n  " + "\n  ".join(spelling), file=sys.stderr)
        sys.exit(1)
    if check:
        if stale:
            print("Out of date: " + ", ".join(stale) + "\nRun: python3 render.py", file=sys.stderr)
            sys.exit(1)
        print("every page is up to date")
