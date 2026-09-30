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
     "A ballistics calculator for Android. Live wind and weather from your Bluetooth sensors, "
     "a shot log, groups from a photo, load development and more."),
    ("privacy/index.html", "PRIVACY_POLICY.md", "../",
     "Privacy policy · Bullseye Ballistics",
     "What Bullseye Ballistics accesses on your phone, what an optional backup contains, and how "
     "to delete it."),
    ("delete-account/index.html", "_pages/delete-account.html", "../",
     "Delete your account · Bullseye Ballistics",
     "How to delete your Bullseye Ballistics account and everything backed up to it."),
    ("404.html", "_pages/404.html", "/",
     "Page not found · Bullseye Ballistics",
     "There is no page at this address."),
]

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
        "{{URL}}": SITE + ("" if output == "404.html" else path),
        "{{CURRENT_PRIVACY}}": ' aria-current="page"' if output.startswith("privacy/") else "",
        "{{CURRENT_DELETE}}": ' aria-current="page"' if output.startswith("delete-account/") else "",
    }
    for key, value in fields.items():
        page = page.replace(key, value)
    # Last, so a {{ROOT}} inside a body is filled in too.
    return page.replace("{{ROOT}}", root)


if __name__ == "__main__":
    check = "--check" in sys.argv
    stale = []
    for output, *spec in PAGES:
        page = build(output, *spec)
        target = HERE / output
        if check:
            if not target.exists() or target.read_text() != page:
                stale.append(output)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(page)
            print(f"wrote {output}")
    if check:
        if stale:
            print("Out of date: " + ", ".join(stale) + "\nRun: python3 render.py", file=sys.stderr)
            sys.exit(1)
        print("every page is up to date")
