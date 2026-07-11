#!/usr/bin/env python3
import os
import re

BASE = "/Users/bibo/навчання промтів"

# In a single combined document, cross-file .md links point nowhere → strip them
# to plain text. Keep external http(s) links as real hyperlinks.
def strip_internal_links(text):
    return re.sub(r'\[([^\]]+)\]\((?!https?://)[^)]*\)', r'\1', text)
ORDER = [
    "README.md",
    "01-data-science.md",
    "02-software-engineering.md",
    "03-metodologiya-ta-syri-rezultaty.md",
    "04-top-sajty-i-shpargalka.md",
    "05-rozshyrennya-haiku-vs-sonnet-uk.md",
    "06-stabilnist-ta-antypaterny.md",
    "07-synthez-praktychnyj-freymvork.md",
    "08-vybir-modeli-haiku-opus-fable.md",
]

PAGEBREAK = '\n\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n\n'

YAML = (
    "---\n"
    'title: "Промт-інжиніринг для Data Science та Software Engineering"\n'
    'subtitle: "Курс, валідований на Claude Haiku 4.5 — 104 реальні прогони моделей"\n'
    "lang: uk\n"
    "---\n\n"
)

parts = []
for i, name in enumerate(ORDER):
    with open(os.path.join(BASE, name), encoding="utf-8") as fh:
        parts.append(strip_internal_links(fh.read().rstrip()))

combined = YAML + PAGEBREAK.join(parts) + "\n"
out = os.path.join(BASE, "_combined.md")
with open(out, "w", encoding="utf-8") as fh:
    fh.write(combined)
print("wrote", out, len(combined), "chars,", len(parts), "parts")
