#!/usr/bin/env python3
"""Deterministic pre-scan of the course 'app' for the multi-agent audit."""
import os, re, glob

BASE = "/Users/bibo/навчання промтів"
md_files = sorted(glob.glob(os.path.join(BASE, "*.md")))

print("=" * 70)
print("1. FILE INVENTORY")
print("=" * 70)
for f in md_files + sorted(glob.glob(os.path.join(BASE, "*.docx"))):
    n = os.path.basename(f)
    size = os.path.getsize(f)
    lines = sum(1 for _ in open(f, "rb")) if f.endswith(".md") else "-"
    print(f"  {n:45} {size:>7}B  lines={lines}")

texts = {os.path.basename(f): open(f, encoding="utf-8").read() for f in md_files}

print("\n" + "=" * 70)
print("2. QUANTITATIVE CLAIMS (lines with digits + прогон/агент/runs)")
print("=" * 70)
pat = re.compile(r".*\d.*(прогон|агент|runs|run|семпл|×\s*\d|/5|/3).*", re.IGNORECASE)
for name, t in texts.items():
    hits = [ln.strip() for ln in t.splitlines() if pat.match(ln)]
    if hits:
        print(f"\n--- {name} ({len(hits)} lines) ---")
        for h in hits[:30]:
            print(f"  • {h[:150]}")

print("\n" + "=" * 70)
print("3. INTERNAL LINK CHECK (.md targets + anchors)")
print("=" * 70)

def slug(h):
    s = h.strip().lower()
    s = re.sub(r"[^\w\sЀ-ӿ-]", "", s)  # keep word chars, cyrillic, spaces, hyphen
    s = re.sub(r"\s+", "-", s)
    return s

# build heading slug set per file
heading_slugs = {}
for name, t in texts.items():
    sl = set()
    for ln in t.splitlines():
        m = re.match(r"#{1,6}\s+(.*)", ln)
        if m:
            sl.add(slug(m.group(1)))
    heading_slugs[name] = sl

link_re = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
broken = []
total_local = 0
for name, t in texts.items():
    for m in link_re.finditer(t):
        target = m.group(2)
        if target.startswith("http"):
            continue
        total_local += 1
        filepart, _, anchor = target.partition("#")
        filepart = filepart or name
        if filepart not in texts:
            # non-.md target (file or directory) — verify it exists on disk, don't assume broken
            disk = os.path.join(BASE, filepart)
            if not os.path.exists(disk):
                broken.append(f"{name}: missing target '{filepart}'  (link text: {m.group(1)[:30]})")
            continue  # non-.md target has no headings to anchor-check
        if anchor and slug(anchor) not in heading_slugs[filepart]:
            broken.append(f"{name}: anchor '#{anchor}' not found in {filepart}")
print(f"  local links checked: {total_local}")
if broken:
    print(f"  BROKEN ({len(broken)}):")
    for b in broken[:40]:
        print(f"    ✗ {b}")
else:
    print("  ✓ all internal links resolve (file + anchor)")

print("\n" + "=" * 70)
print("4. EXTERNAL URLs")
print("=" * 70)
urls = set()
for t in texts.values():
    for m in re.finditer(r"https?://[^\s)\]]+", t):
        urls.add(m.group(0).rstrip(".,"))
for u in sorted(urls):
    print(f"  {u}")
print(f"  total unique external URLs: {len(urls)}")

print("\n" + "=" * 70)
print("5. HEADING STRUCTURE (per file)")
print("=" * 70)
for name, t in texts.items():
    h1 = len(re.findall(r"^#\s", t, re.M))
    h2 = len(re.findall(r"^##\s", t, re.M))
    h3 = len(re.findall(r"^###\s", t, re.M))
    print(f"  {name:45} H1={h1} H2={h2} H3={h3}")

print("\n" + "=" * 70)
print("6. RAW VALIDATION ARTIFACTS (reproducibility)")
print("=" * 70)
runs_dir = os.path.join(BASE, "raw-outputs", "model-runs")
expected = [
    "batch1-30runs-16sites.json",
    "batch2-25runs-haiku-vs-sonnet-uk.json",
    "batch3-49runs-stability-antipatterns.json",
    "batch4-14runs-opus-fable.json",
    "audit-liveness.json",
]
for name in expected:
    p = os.path.join(runs_dir, name)
    ok = os.path.exists(p)
    print(f"  {'✓' if ok else '✗'} {name}  {os.path.getsize(p) if ok else 0}B")
manifest = os.path.join(BASE, "raw-outputs", "runs-manifest.json")
if os.path.exists(manifest):
    import json
    m = json.load(open(manifest, encoding="utf-8"))
    s = sum(b.get("model_runs", 0) for b in m.get("batches", []))
    total = m.get("total_model_runs")
    ok = s == total
    print(f"  {'✓' if ok else '✗'} runs-manifest.json (SSOT): sum(model_runs)={s} vs total_model_runs={total}")
else:
    print("  ✗ runs-manifest.json MISSING")
