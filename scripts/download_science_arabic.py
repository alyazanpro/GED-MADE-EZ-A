#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Focused download: Science + Arabic extras for Oman GED G11/G12."""

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

# URL-encoded Arabic search terms
SEARCHES = [
    # Arabic language
    "%D8%A7%D9%84%D9%84%D8%BA%D8%A9%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A",
    "%D8%A7%D9%84%D9%84%D8%BA%D8%A9%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9%20%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A",
    "%D8%A7%D9%84%D9%85%D8%A4%D9%86%D8%B3",
    "%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF",
    "%D9%85%D9%84%D8%AE%D8%B5%20%D8%A7%D9%84%D9%84%D8%BA%D8%A9%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9",
    "%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D9%85%D8%A4%D9%86%D8%B3",
    "%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF",
    # Physics
    "%D8%A7%D9%84%D9%81%D9%8A%D8%B2%D9%8A%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A",
    "%D8%A7%D9%84%D9%81%D9%8A%D8%B2%D9%8A%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A",
    "%D9%85%D9%84%D8%AE%D8%B5%20%D8%A7%D9%84%D9%81%D9%8A%D8%B2%D9%8A%D8%A7%D8%A1",
    "%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D9%81%D9%8A%D8%B2%D9%8A%D8%A7%D8%A1",
    # Chemistry
    "%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A",
    "%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A",
    "%D9%85%D9%84%D8%AE%D8%B5%20%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1",
    "%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1",
    # Biology
    "%D8%A7%D9%84%D8%A3%D8%AD%D9%8A%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A",
    "%D8%A7%D9%84%D8%A3%D8%AD%D9%8A%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A",
    "%D9%85%D9%84%D8%AE%D8%B5%20%D8%A7%D9%84%D8%A3%D8%AD%D9%8A%D8%A7%D8%A1",
    "%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D8%A3%D8%AD%D9%8A%D8%A7%D8%A1",
    # Environmental science
    "%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85%20%D8%A7%D9%84%D8%A8%D9%8A%D8%A6%D9%8A%D8%A9",
    "%D9%85%D9%84%D8%AE%D8%B5%20%D8%A7%D9%84%D8%B9%D9%84%D9%88%D9%85%20%D8%A7%D9%84%D8%A8%D9%8A%D8%A6%D9%8A%D8%A9",
]

G_HINTS = (
    "?????? ???", "?????? ???", "???? ???", "???? ???",
    "grade 11", "grade 12", "g11", "g12", "cls11", "cls12", "?????",
)

SUBJECT_KEYS = {
    "arabic": ("?????", "???????", "????", "????", "arabic", "muunis", "mufeed"),
    "physics": ("??????", "physics"),
    "chemistry": ("??????", "chemistry"),
    "biology": ("?????", "?????", "biology"),
    "env": ("?????", "????", "environment"),
}


def encode_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, quote(unquote(parts.path), safe="/"), parts.query, parts.fragment))


def fetch(url: str, timeout: int = 120) -> bytes:
    req = Request(
        encode_url(url),
        headers={
            "User-Agent": UA,
            "Accept": "application/json,text/html,application/pdf,*/*;q=0.8",
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


def is_g(text: str) -> bool:
    return any(h.lower() in text.lower() if h.isascii() else h in text for h in G_HINTS)


def subject_of(text: str) -> str | None:
    low = text.lower()
    for subj, keys in SUBJECT_KEYS.items():
        if any(k.lower() in low if k.isascii() else k in text for k in keys):
            return subj
    return None


def extract_pdfs(html: str) -> list[str]:
    out = re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", html, re.I)
    out += ["https://oman-school.com" + m for m in re.findall(r"/wp-content/uploads/[^\s\"'<>]+\.pdf", html, re.I)]
    out += re.findall(r'"(?:source|pdfUrl|pdfURL|file)"\s*:\s*"(https?://[^"]+\.pdf[^"]*)"', html, re.I)
    cleaned = []
    for u in out:
        u = u.replace("\\/", "/").rstrip(").,;")
        if u.startswith("/"):
            u = "https://oman-school.com" + u
        cleaned.append(u)
    return list(dict.fromkeys(cleaned))


def bucket(title: str, url: str) -> Path:
    text = f"{title} {url}"
    subj = subject_of(text) or "misc"
    grade = "grade-12" if any(x in text for x in ("?????? ???", "g12", "grade 12", "cls12")) else "grade-11"

    if any(x in text for x in ("???? ??????", "teacher")) or "teachers" in text.lower():
        return ROOT / "teacher-guides"
    if any(x in text for x in ("????", "??????", "????", "?? ", "??????", "??????")):
        return ROOT / "summaries-solutions" / grade / subj
    if "???" in text or "lesson" in text.lower():
        return ROOT / "lessons" / grade / subj
    if any(x in text for x in ("??????", "??????")) or any(x in text.lower() for x in ("exam", "test", "mock")):
        return ROOT / "exams" / grade / subj

    # textbooks
    base = ROOT / grade / subj
    if any(x in text for x in ("????? ?????", "????? ??????? ?????", "p1", "11a", "12a")):
        return base / "semester-1"
    if any(x in text for x in ("????? ??????", "????? ??????? ??????", "p2", "11b", "12b")):
        return base / "semester-2"
    return base


def main():
    for subj in SUBJECT_KEYS:
        for grade in ("grade-11", "grade-12"):
            for kind in ("summaries-solutions", "lessons", "exams"):
                (ROOT / kind / grade / subj).mkdir(parents=True, exist_ok=True)
            (ROOT / grade / subj / "semester-1").mkdir(parents=True, exist_ok=True)
            (ROOT / grade / subj / "semester-2").mkdir(parents=True, exist_ok=True)

    known_names = {p.name for p in ROOT.rglob("*.pdf")}
    known_urls = set()
    man = ROOT / "manifest.json"
    if man.exists():
        for f in json.loads(man.read_text(encoding="utf-8")).get("files", []):
            if f.get("url"):
                known_urls.add(f["url"])

    posts = {}
    print("=== Search science + Arabic posts ===")
    for q in SEARCHES:
        for page in range(1, 8):
            url = f"https://oman-school.com/wp-json/wp/v2/posts?search={q}&per_page=100&page={page}&_fields=id,link,title,content"
            try:
                data = json.loads(fetch(url).decode("utf-8", "replace"))
            except Exception as e:
                print(f"  search fail: {e}")
                break
            if not isinstance(data, list) or not data:
                break
            added = 0
            for p in data:
                title = re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", ""))
                link = p.get("link") or ""
                content = p.get("content", {}).get("rendered", "")
                blob = f"{title} {link} {content}"
                if not is_g(blob):
                    continue
                if not subject_of(blob):
                    continue
                posts[p["id"]] = {"title": title, "link": link, "content": content}
                added += 1
            print(f"  q=...{q[-20:]} p{page}: {len(data)} posts, kept+={added}, total={len(posts)}")
            if len(data) < 100:
                break
            time.sleep(0.12)

    print(f"Relevant posts: {len(posts)}")

    found = {}
    # PDFs from API content first
    for p in posts.values():
        for pdf in extract_pdfs(p.get("content") or ""):
            found[pdf] = p["title"]

    # Deep HTML for posts missing pdf in content
    print("=== Deep-scan posts without embedded PDF ===")
    need_scan = [p for p in posts.values() if not extract_pdfs(p.get("content") or "")]
    for i, p in enumerate(need_scan, 1):
        try:
            html = fetch(p["link"]).decode("utf-8", "replace")
            pdfs = extract_pdfs(html)
            for pdf in pdfs:
                found[pdf] = p["title"]
            if i % 25 == 0 or pdfs:
                print(f"  [{i}/{len(need_scan)}] {p['title'][:55]} -> {len(pdfs)}")
        except Exception as e:
            print(f"  fail {p['link']}: {e}")
        time.sleep(0.12)

    print(f"Unique PDFs found: {len(found)}")
    (RAW / "science_arabic_pdfs.json").write_text(
        json.dumps([{"title": t, "pdf": u} for u, t in found.items()], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("=== Download missing ===")
    new_files = []
    attempted = 0
    for url, title in found.items():
        if url in known_urls:
            continue
        fname = sanitize(Path(urlsplit(url).path).name)
        if not fname.lower().endswith(".pdf"):
            fname = sanitize(title) + ".pdf"
        if fname in known_names:
            continue
        dest = bucket(title, url) / fname
        attempted += 1
        print(f"[{attempted}] {title[:75]}")
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
                "category": "science-arabic",
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
    manifest["science_arabic_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    all_pdfs = list(ROOT.rglob("*.pdf"))
    total = sum(p.stat().st_size for p in all_pdfs)
    manifest["stats"] = {
        "pdf_count": len(all_pdfs),
        "total_mb": round(total / 1e6, 1),
        "new_this_run": len(new_files),
        "attempted_this_run": attempted,
        "discovered": len(found),
    }
    man.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("=== DONE ===", json.dumps(manifest["stats"], indent=2))


if __name__ == "__main__":
    main()
