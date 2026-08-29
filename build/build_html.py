#!/usr/bin/env python3
"""Build a single self-contained index.html reader for the course.

Renders each markdown part to an HTML fragment with pandoc, namespaces ids so
per-file anchors don't collide, rewrites cross-file .md links to in-page jumps,
and assembles everything into one offline file (inline CSS/JS, no external deps).
Run:  python3 build/build_html.py
"""
import os
import re
import subprocess

BASE = "/Users/bibo/навчання промтів"

# (filename, part-id-number, short sidebar title)
PARTS = [
    ("README.md", "00", "Огляд курсу"),
    ("01-data-science.md", "01", "1 · Data Science"),
    ("02-software-engineering.md", "02", "2 · Software Engineering"),
    ("03-metodologiya-ta-syri-rezultaty.md", "03", "3 · Методологія"),
    ("04-top-sajty-i-shpargalka.md", "04", "4 · Сайти + шпаргалка"),
    ("05-rozshyrennya-haiku-vs-sonnet-uk.md", "05", "5 · Haiku vs Sonnet"),
    ("06-stabilnist-ta-antypaterny.md", "06", "6 · Надійність + антипатерни"),
    ("07-synthez-praktychnyj-freymvork.md", "07", "7 · Синтез"),
    ("08-vybir-modeli-haiku-opus-fable.md", "08", "8 · Вибір моделі"),
    ("09-promt-inzhyniring-2026-reasoning.md", "09", "9 · Промптинг 2026"),
    ("10-avtomatyzovana-rozrobka-z-shi.md", "10", "10 · Розробка з ШІ"),
    ("11-multyagentna-rozrobka.md", "11", "11 · Мультиагенти"),
    ("12-keruvannya-kontekstom-agentiv.md", "12", "12 · Контекст агентів"),
    ("13-lokalni-llm.md", "13", "13 · Локальні LLM"),
]


def md_to_fragment(path):
    return subprocess.run(
        ["pandoc", path, "-f", "gfm", "-t", "html", "--no-highlight", "--wrap=none"],
        capture_output=True, text=True, check=True,
    ).stdout


def externalize_links(frag):
    # external links open in a new tab on the published site
    return __import__("re").sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', frag)


def namespace_and_link(frag, num):
    pid = "p" + num
    # 1) namespace in-file ids and same-page anchors so parts don't collide
    frag = re.sub(r'\bid="([^"]+)"', lambda m: f'id="{pid}-{m.group(1)}"', frag)
    frag = re.sub(r'href="#([^"]+)"', lambda m: f'href="#{pid}-{m.group(1)}"', frag)
    # 2) cross-file .md links -> jump to that part's section (drop sub-anchor)
    frag = re.sub(r'href="(0[1-9]|1[0-3])-[^"]*?\.md(?:#[^"]*)?"', r'href="#part-\1"', frag)
    frag = re.sub(r'href="README\.md(?:#[^"]*)?"', r'href="#part-00"', frag)
    return externalize_links(frag)


def build():
    sections, nav = [], []
    for fname, num, title in PARTS:
        frag = namespace_and_link(md_to_fragment(os.path.join(BASE, fname)), num)
        sections.append(f'<section id="part-{num}" class="part" data-title="{title}">\n{frag}\n</section>')
        nav.append(f'<a href="#part-{num}" class="navlink" data-target="part-{num}">{title}</a>')
    html = (TEMPLATE
            .replace("%%NAV%%", "\n".join(nav))
            .replace("%%CONTENT%%", "\n".join(sections)))
    out = os.path.join(BASE, "index.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", out, len(html), "bytes,", len(PARTS), "parts")


TEMPLATE = r"""<!doctype html>
<html lang="uk" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Промт-інжиніринг на Haiku — курс</title>
<style>
:root{
  --bg:#0f1115; --panel:#171a21; --panel2:#1e222b; --text:#e6e8ee; --muted:#9aa3b2;
  --border:#2a2f3a; --accent:#6ea8fe; --accent2:#8b7bff; --code:#0b0d12; --mark:#ffd76a; --markfg:#231b00;
}
:root[data-theme="light"]{
  --bg:#f6f7f9; --panel:#ffffff; --panel2:#eef1f6; --text:#1c2330; --muted:#5b6675;
  --border:#dfe3ea; --accent:#2f6bff; --accent2:#6a4dff; --code:#f2f4f8; --mark:#ffe08a; --markfg:#3a2c00;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--text);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.topbar{position:sticky;top:0;z-index:20;display:flex;gap:12px;align-items:center;padding:10px 16px;background:var(--panel);border-bottom:1px solid var(--border)}
.brand{font-weight:700;letter-spacing:.2px;white-space:nowrap}
.brand small{color:var(--muted);font-weight:400}
.search{flex:1;max-width:520px;margin-left:auto}
.search input{width:100%;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--panel2);color:var(--text);font-size:14px}
.btn{padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--panel2);color:var(--text);cursor:pointer;font-size:14px}
.btn:hover{border-color:var(--accent)}
.hits{color:var(--muted);font-size:13px;white-space:nowrap}
.layout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:0;max-width:1240px;margin:0 auto}
.sidebar{position:sticky;top:53px;align-self:start;height:calc(100vh - 53px);overflow:auto;padding:16px 10px;border-right:1px solid var(--border)}
.navlink{display:block;padding:8px 12px;border-radius:8px;color:var(--muted);font-size:14px;margin:2px 0}
.navlink:hover{background:var(--panel2);color:var(--text);text-decoration:none}
.navlink.active{background:linear-gradient(90deg,var(--accent),var(--accent2));color:#fff;font-weight:600}
main{padding:28px 32px 120px;min-width:0}
.part{border-bottom:1px dashed var(--border);padding-bottom:28px;margin-bottom:28px}
.part:last-child{border-bottom:none}
h1{font-size:1.9rem;line-height:1.25;margin:.2em 0 .5em}
h2{font-size:1.4rem;margin:1.4em 0 .5em;padding-top:.2em}
h3{font-size:1.15rem;margin:1.2em 0 .4em}
h1,h2,h3{scroll-margin-top:70px}
p,li{overflow-wrap:anywhere}
code{background:var(--code);padding:.12em .38em;border-radius:6px;font:13.5px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
pre{background:var(--code);border:1px solid var(--border);border-radius:12px;padding:14px 16px;overflow:auto}
pre code{background:none;padding:0}
blockquote{margin:1em 0;padding:.4em 1em;border-left:4px solid var(--accent);background:var(--panel2);border-radius:0 10px 10px 0;color:var(--text)}
table{border-collapse:collapse;width:100%;display:block;overflow:auto;margin:1em 0}
th,td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--panel2)}
hr{border:none;border-top:1px solid var(--border);margin:1.5em 0}
mark.s{background:var(--mark);color:var(--markfg);border-radius:3px;padding:0 1px}
.footer{color:var(--muted);font-size:13px;padding:24px 32px;max-width:1240px;margin:0 auto;border-top:1px solid var(--border)}
@media(max-width:860px){
  .layout{grid-template-columns:1fr}
  .sidebar{position:static;height:auto;border-right:none;border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:4px}
  .navlink{margin:0}
  main{padding:20px 18px 80px}
}
</style>
</head>
<body>
<div class="topbar">
  <div class="brand">Промт-інжиніринг на Haiku <small>· 13 частин · 118 прогонів</small></div>
  <div class="search"><input id="q" type="search" placeholder="Пошук по всьому курсу…" autocomplete="off"></div>
  <span class="hits" id="hits"></span>
  <button class="btn" id="theme" title="Перемкнути тему">☾ / ☀</button>
</div>
<div class="layout">
  <nav class="sidebar">%%NAV%%</nav>
  <main id="content">%%CONTENT%%</main>
</div>
<div class="footer">Самодостатня офлайн-версія курсу (Markdown → HTML, без зовнішніх залежностей). Джерело правди — файли <code>*.md</code> у репозиторії. Згенеровано <code>build/build_html.py</code>.</div>

<script>
// ---- theme ----
var root=document.documentElement, tbtn=document.getElementById('theme');
try{var saved=localStorage.getItem('theme'); if(saved) root.setAttribute('data-theme',saved);}catch(e){}
tbtn.onclick=function(){var t=root.getAttribute('data-theme')==='dark'?'light':'dark';root.setAttribute('data-theme',t);try{localStorage.setItem('theme',t);}catch(e){}};

// ---- active section in sidebar ----
var links=[].slice.call(document.querySelectorAll('.navlink'));
var byId={}; links.forEach(function(l){byId[l.dataset.target]=l;});
var obs=new IntersectionObserver(function(es){
  es.forEach(function(e){ if(e.isIntersecting){ links.forEach(function(l){l.classList.remove('active');}); var a=byId[e.target.id]; if(a)a.classList.add('active'); }});
},{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('.part').forEach(function(s){obs.observe(s);});

// ---- search highlight (safe text-node walk) ----
var content=document.getElementById('content'), qi=document.getElementById('q'), hits=document.getElementById('hits');
function clearMarks(){
  var ms=content.querySelectorAll('mark.s');
  ms.forEach(function(m){var t=document.createTextNode(m.textContent);m.parentNode.replaceChild(t,m);});
  if(ms.length){content.normalize();}
}
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
var tmo;
qi.addEventListener('input',function(){clearTimeout(tmo);tmo=setTimeout(runSearch,140);});
function runSearch(){
  clearMarks();
  var q=qi.value.trim();
  if(q.length<2){hits.textContent='';return;}
  var rx=new RegExp(esc(q),'gi'), count=0, first=null;
  var walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT,null);
  var targets=[],n;
  while((n=walker.nextNode())){
    var p=n.parentNode; if(!p) continue;
    if(p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||p.nodeName==='MARK') continue;
    if(rx.test(n.nodeValue)) targets.push(n);
    rx.lastIndex=0;
  }
  targets.forEach(function(node){
    var s=node.nodeValue, frag=document.createDocumentFragment(), last=0, m;
    rx.lastIndex=0;
    while((m=rx.exec(s))){
      if(m.index>last) frag.appendChild(document.createTextNode(s.slice(last,m.index)));
      var mk=document.createElement('mark'); mk.className='s'; mk.textContent=m[0];
      frag.appendChild(mk); if(!first)first=mk; last=m.index+m[0].length; count++;
      if(m.index===rx.lastIndex) rx.lastIndex++;
    }
    if(last<s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    node.parentNode.replaceChild(frag,node);
  });
  hits.textContent=count?('знайдено: '+count):'нічого не знайдено';
  if(first) first.scrollIntoView({block:'center',behavior:'smooth'});
}
qi.addEventListener('keydown',function(e){if(e.key==='Escape'){qi.value='';clearMarks();hits.textContent='';}});
</script>
</body>
</html>
"""

if __name__ == "__main__":
    build()
