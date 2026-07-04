#!/usr/bin/env bash
# One-command, self-contained, validation-clean build of the course DOCX
# from the 8 markdown files (README + 01..07).
#   Usage:  bash build/build_docx.sh
#   Requires: python3, pandoc (>=3). No external skill scripts needed.
set -euo pipefail

COURSE="/Users/bibo/навчання промтів"
OUT="$COURSE/promt-inzhiniring-haiku-kurs.docx"
cd "$COURSE"

# 1) Combine README + 01..07 into one document: strip cross-file .md links
#    (meaningless in a single doc) and insert page breaks between parts.
python3 build/build_docx.py            # writes _combined.md (ORDER includes 07)

# 2) Convert to DOCX with a navigable TOC and code highlighting.
pandoc _combined.md -o "$OUT" --toc --toc-depth=2 --syntax-highlighting=tango

# 3) Remove the stray <w:shd> pandoc emits INSIDE the SourceCode style's <w:pPr>,
#    which fails strict OOXML validation (Word opens it either way). Self-contained
#    zip rewrite — keeps the valid run-level (<w:rPr>) shd that shades code blocks.
python3 - "$OUT" <<'PY'
import sys, re, zipfile, os
p = sys.argv[1]; tmp = p + ".tmp"
with zipfile.ZipFile(p) as z:
    names = z.namelist()
    data = {n: z.read(n) for n in names}
s = data['word/styles.xml'].decode('utf-8')
# Drop any <w:shd .../> that sits directly inside a <w:pPr> (invalid position).
s = re.sub(r'(<w:pPr>(?:(?!</w:pPr>).)*?)<w:shd\b[^>]*/>', r'\1', s, flags=re.S)
data['word/styles.xml'] = s.encode('utf-8')
with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, data[n])
os.replace(tmp, p)
print("cleaned <w:shd> in styles.xml")
PY

# 4) Cleanup intermediate file.
rm -f _combined.md
echo "Built: $OUT"
echo "NOTE: open in Word and refresh the Table of Contents (F9 / right-click -> Update field)."
