#!/usr/bin/env python3
"""Render PRIVACY_POLICY.md into index.html using template.html.

    python3 render.py           # write index.html
    python3 render.py --check   # exit 1 if index.html is stale (what CI runs)

index.html is generated, never hand-edited. This page is linked from the Play listing and
is the copy users actually read; the markdown beside it is a copy of docs/PRIVACY_POLICY.md
in the app repo. Editing the HTML directly is how the two drifted far enough apart that the
published page still described an app with no accounts, months after accounts shipped.

The markdown is deliberately plain: headings, paragraphs, and bullets whose continuation
lines are indented two spaces. A bullet may hold several paragraphs, separated by a blank
line and indented the same way.
"""
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
MARKDOWN = HERE / "PRIVACY_POLICY.md"
TEMPLATE = HERE / "template.html"
OUTPUT = HERE / "index.html"


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


def build() -> str:
    return TEMPLATE.read_text().replace("{{BODY}}", render(MARKDOWN.read_text()))


if __name__ == "__main__":
    page = build()
    if "--check" in sys.argv:
        current = OUTPUT.read_text() if OUTPUT.exists() else ""
        if current != page:
            print(
                "index.html is out of date with PRIVACY_POLICY.md.\n"
                "Run: python3 render.py",
                file=sys.stderr,
            )
            sys.exit(1)
        print("index.html is up to date")
    else:
        OUTPUT.write_text(page)
        print(f"wrote {OUTPUT.name}")
