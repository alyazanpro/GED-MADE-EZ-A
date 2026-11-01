#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fill gaps: Arabic (mufeed teacher guide, solutions) + science extras from more hubs."""

from __future__ import annotations

import hashlib
import json
import re
import time
from pathlib import Path
from urllib.parse import unquote, urlsplit, urlunsplit, quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1] / "books"
RAW = ROOT / "_raw"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

INDEX_PAGES = [
    "https://oman-school.com/oman-g11-curriculum/",
    "https://oman-school.com/omani-curricula-for-grade-12-pdf/",
    "https://www.omanedubooks.com/p/grade-11-book-s2.html",
    "https://www.omanedubooks.com/p/grade-12-semester-1.html",
    "https://www.omanedubooks.com/p/grade-12-semester-2.html",
    "https://www.omanedubooks.com/p/grade-11-book-s1.html",
    "https://afidni.com/%D9%83%d8%AA%D8%A8-%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A-%D8%B9%D8%B4%D8%B1/",
    "https://afidni.com/%d8%ac%d9%85%d9%8a%d8%b9-%d9%83%d8%aa%d8%a8-%d9%85%d9%86%d9%87%d8%ac-%d8%a7%d9%84%d8%af%d8%a8%d9%84%d9%88%d9%85-%d8%a7%d9%84%d8%b9%d8%a7%d9%85/",
    "https://afidni.com/%d8%a3%d8%af%d9%84%d8%a9-%d9%85%d8%b9%d9%84%d9%85-%d8%ac%d9%85%d9%8a%d8%b9-%d9%85%d9%88%d8%a7%d8%af-%d8%a7%d9%84%d8%af%d8%a8%d9%84%d9%88%d9%85-%d8%a7%d9%84%d8%b9%d8%a7%d9%85/",
]

# Targeted WP searches for gaps
SEARCHES = [
    "%D8%AF%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%20%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF",
    "%D8%AF%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%20%D8%A7%D9%84%D9%85%D8%A4%D9%86%D8%B3",
    "%D8%AF%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%20%D8%A7%D9%84%D9%84%D8%BA%D8%A9%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9",
    "%D8%AD%D9%84%D9%88%D9%84%20%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%84%D9%81%D9%8A%D8%B2%D9%8A%D8%A7%D8%A1",
    "%D8%AD%D9%84%D9%88%D9%84%20%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1",
    "%D8%AD%D9%84%D9%88%D9%84%20%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%84%D8%A3%D8%AD%D9%8A%D8%A7%D8%A1",
    "%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D9%85%D8%A4%D9%86%D8%B3",
    "%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF",
    "teacher%20arabic%20grade%2011",
    "teacher%20arabic%20grade%2012",
]

G_HINTS = (
    "?????? ???", "?????? ???", "???? ???", "???? ???",
    "grade 11", "grade 12", "g11", "g12", "cls11", "cls12", "?????",
)
FOCUS = (
    "?????", "???????", "????", "????", "arabic",
    "??????", "physics", "??????", "chemistry",
    "?????", "?????", "biology", "?????", "????", "environment",
)


def encode_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, quote(unquote(parts.path), safe="/"), parts.query, parts.fragment))


def fetch(url: str, timeout: int = 120) -> bytes:
    req = Request(
        encode_url(url),
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/json,application/pdf,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        return resp.read()


def sanitize(name: str) -> str:
    name = unquote(name)
    name = re.sub(r"[<>:\"/\\|?*\x00-\x1f]", "_", name)
    name = re.sub(r"\s+", " ", name).strip(" ._")
    return name[:160] or "file"


def ok_text(text: str) -> bool:
    g = any(h.lower() in text.lower() if h.isascii() else h in text for h in G_HINTS)
    f = any(k.lower() in text.lower() if k.isascii() else k in text for k in FOCUS)
    return g and f


def extract_pdfs(html: str, base: str = "https://oman-school.com") -> list[str]:
    out = re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", html, re.I)
    out += [base.rstrip("/") + m if m.startswith("/") else m for m in re.findall(r"/[^\s\"'<>]+\.pdf", html, re.I)]
    cleaned = []
    for u in out:
        u = u.replace("\\/", "/").rstrip(").,;")
        cleaned.append(u)
    return list(dict.fromkeys(cleaned))


def extract_links(html: str, base: str) -> list[str]:
    from html.parser import HTMLParser
    from urllib.parse import urljoin

    class P(HTMLParser):
        def __init__(self):
            super().__init__()
            self.hrefs = []

        def handle_starttag(self, tag, attrs):
            d = dict(attrs)
            if tag == "a" and "href" in d:
                self.hrefs.append(urljoin(base, d["href"]))

    p = P()
    try:
        p.feed(html)
    except Exception:
        pass
    return p.hrefs


def bucket(title: str, url: str) -> Path:
    text = f"{title} {url}"
    if any(x in text for x in ("????", "teacher")):
        return ROOT / "teacher-guides"
    if any(x in text for x in ("????", "????", "?? ", "??????", "??????", "??????")):
        grade = "grade-12" if "????" in text or "g12" in text.lower() else "grade-11"
        return ROOT / "summaries-solutions" / grade
    grade = "grade-12" if any(x in text for x in ("?????? ???", "g12", "grade 12")) else "grade-11"
    return ROOT / grade


def main():
    (ROOT / "summaries-solutions" / "grade-11").mkdir(parents=True, exist_ok=True)
    (ROOT / "summaries-solutions" / "grade-12").mkdir(parents=True, exist_ok=True)
    known_names = {p.name for p in ROOT.rglob("*.pdf")}
    known_urls = set()
    man = ROOT / "manifest.json"
    if man.exists():
        for f in json.loads(man.read_text(encoding="utf-8")).get("files", []):
            if f.get("url"):
                known_urls.add(f["url"])

    found: dict[str, str] = {}

    print("=== Index pages ===")
    book_pages = []
    for idx in INDEX_PAGES:
        print(f"  {idx}")
        try:
            html = fetch(idx).decode("utf-8", "replace")
            for pdf in extract_pdfs(html, idx):
                if ok_text(pdf) or True:
                    # keep all pdfs from curriculum indexes; filter later
                    found.setdefault(pdf, Path(urlsplit(pdf).path).name)
            for link in extract_links(html, idx):
                low = link.lower()
                if any(k in low for k in ("arabic", "muunis", "mufeed", "physics", "chemistry", "biology", "environment", "???", "????", "????", "??????", "??????", "?????", "???", "????", "book", "pdf", "????")):
                    book_pages.append(link)
                if ".pdf" in low:
                    found.setdefault(link, Path(urlsplit(link).path).name)
        except Exception as e:
            print(f"  fail: {e}")
        time.sleep(0.2)

    book_pages = list(dict.fromkeys(book_pages))[:200]
    print(f"Book pages to visit: {len(book_pages)}")

    print("=== WP searches ===")
    for q in SEARCHES:
        url = f"https://oman-school.com/wp-json/wp/v2/posts?search={q}&per_page=50&_fields=id,link,title,content"
        try:
            data = json.loads(fetch(url).decode("utf-8", "replace"))
        except Exception as e:
            print(f"  search fail {e}")
            continue
        if not isinstance(data, list):
            continue
        for p in data:
            title = re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", ""))
            content = p.get("content", {}).get("rendered", "")
            link = p.get("link") or ""
            if not ok_text(f"{title} {link}"):
                continue
            for pdf in extract_pdfs(content):
                found[pdf] = title
            if link:
                book_pages.append(link)
        print(f"  search ok, found pdfs now {len(found)}")
        time.sleep(0.15)

    book_pages = list(dict.fromkeys(book_pages))
    print(f"=== Visit {len(book_pages)} pages ===")
    for i, page in enumerate(book_pages, 1):
        try:
            html = fetch(page).decode("utf-8", "replace")
            title_m = re.search(r"<title>(.*?)</title>", html, re.I | re.S)
            title = re.sub(r"\s+", " ", title_m.group(1)).strip() if title_m else page
            pdfs = extract_pdfs(html, page)
            for pdf in pdfs:
                if ok_text(f"{title} {pdf}") or ok_text(title) or ok_text(pdf):
                    found[pdf] = title
            if i % 20 == 0:
                print(f"  [{i}/{len(book_pages)}] pdfs={len(found)}")
        except Exception as e:
            print(f"  page fail: {e}")
        time.sleep(0.1)

    # Filter to science/arabic + grade
    filtered = {u: t for u, t in found.items() if ok_text(f"{t} {u}") or (ok_text(t) and u.lower().endswith(".pdf"))}
    # Also keep if filename itself indicates subject+grade
    for u, t in found.items():
        if u not in filtered and ok_text(u):
            filtered[u] = t

    print(f"Filtered science/arabic PDFs: {len(filtered)}")

    print("=== Download ===")
    new_files = []
    attempted = 0
    for url, title in filtered.items():
        if url in known_urls:
            continue
        fname = sanitize(Path(urlsplit(url).path).name)
        if not fname.lower().endswith(".pdf"):
            fname = sanitize(title) + ".pdf"
        if fname in known_names:
            continue
        # skip tiny non-book junk
        if any(x in fname.lower() for x in ("logo", "icon", "banner")):
            continue
        dest = bucket(title, url) / fname
        attempted += 1
        print(f"[{attempted}] {title[:70]}")
        try:
            data = fetch(url, timeout=180)
            if len(data) < 1500 or not (data.startswith(b"%PDF") or len(data) > 50000):
                print("  FAIL not pdf")
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists():
                dest = dest.with_name(f"{dest.stem}_{hashlib.md5(url.encode()).hexdigest()[:6]}{dest.suffix}")
            dest.write_bytes(data)
            known_names.add(dest.name)
            known_urls.add(url)
            meta = {
                "url": url,
                "title": title,
                "category": "science-arabic-fill",
                "status": "downloaded",
                "path": str(dest.relative_to(ROOT)).replace("\\", "/"),
                "bytes": len(data),
            }
            new_files.append(meta)
            print(f"  OK {len(data):,} -> {meta['path']}")
        except Exception as e:
            print(f"  ERR {e}")
        time.sleep(0.1)

    if man.exists():
        manifest = json.loads(man.read_text(encoding="utf-8"))
    else:
        manifest = {"files": []}
    manifest["files"].extend(new_files)
    manifest["science_arabic_fill_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    all_pdfs = list(ROOT.rglob("*.pdf"))
    total = sum(p.stat().st_size for p in all_pdfs)
    manifest["stats"] = {
        "pdf_count": len(all_pdfs),
        "total_mb": round(total / 1e6, 1),
        "new_this_run": len(new_files),
        "attempted_this_run": attempted,
    }
    man.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # Write subject index
    lines = [
        "# Science + Arabic inventory",
        "",
        f"Updated: {manifest['science_arabic_fill_at']}",
        f"Library total: {len(all_pdfs)} PDFs ({manifest['stats']['total_mb']} MB)",
        f"New this run: {len(new_files)}",
        "",
    ]
    for label, keys in [
        ("Arabic", ["???", "????", "????", "arabic"]),
        ("Physics", ["??????", "physics"]),
        ("Chemistry", ["??????", "chemistry"]),
        ("Biology", ["?????", "?????", "biology"]),
        ("Environmental", ["?????", "????", "environment"]),
    ]:
        hits = [p for p in all_pdfs if any(k in p.name or k in str(p) for k in keys)]
        lines.append(f"## {label} ({len(hits)})")
        for p in sorted(hits):
            lines.append(f"- `{p.relative_to(ROOT)}`")
        lines.append("")
    (ROOT / "SCIENCE_ARABIC_INDEX.md").write_text("\n".join(lines), encoding="utf-8")
    print("=== DONE ===", json.dumps(manifest["stats"], indent=2))


if __name__ == "__main__":
    main()
