#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Deep-fetch remaining G11/G12 PDFs from post pages + WP media library."""

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

CATS = [
    122, 118, 402, 410, 2163, 2167, 611, 544, 1262, 542, 2651, 1961,
    968, 417, 2628, 2623, 2059, 2003, 2737, 2624, 1452, 1643, 2110,
]

G_HINTS = (
    "?????? ???", "?????? ???", "???? ???", "???? ???",
    "grade 11", "grade 12", "grade-11", "grade-12",
    "g11", "g12", "cls11", "cls12", "?????", "11a", "11b", "12a", "12b",
)


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


def extract_pdfs(html: str) -> list[str]:
    out = []
    out += re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", html, re.I)
    out += ["https://oman-school.com" + m for m in re.findall(r"/wp-content/uploads/[^\s\"'<>]+\.pdf", html, re.I)]
    # dFlip source fields
    out += re.findall(r'"(?:source|pdfUrl|pdfURL|file)"\s*:\s*"(https?://[^"]+\.pdf[^"]*)"', html, re.I)
    out += re.findall(r"'(?:source|pdfUrl|pdfURL|file)'\s*:\s*'(https?://[^']+\.pdf[^']*)'", html, re.I)
    out += re.findall(r'data-(?:src|url|file|link)=["\']([^"\']+\.pdf[^"\']*)["\']', html, re.I)
    # clean escapes
    cleaned = []
    for u in out:
        u = u.replace("\\/", "/").rstrip(").,;")
        if u.startswith("/"):
            u = "https://oman-school.com" + u
        cleaned.append(u)
    return list(dict.fromkeys(cleaned))


def bucket(title: str, url: str) -> Path:
    text = f"{title} {url}"
    low = text.lower()
    if any(x in text for x in ("???? ??????", "teacher")) or "teachers" in low:
        base = ROOT / "teacher-guides"
    elif any(x in text for x in ("??????", "??????", "?????", "?????", "????")) or any(x in low for x in ("exam", "test", "mock")):
        base = ROOT / "exams"
    elif any(x in text for x in ("????", "??????", "????", "?? ")):
        base = ROOT / "summaries-solutions"
    elif "???" in text or "lesson" in low:
        base = ROOT / "lessons"
    elif any(x in text for x in ("???????",)) or "math" in low:
        # keep math extras with textbooks
        if any(x in text for x in ("?????? ???", "g12", "grade 12", "cls12")):
            return ROOT / "grade-12" / "math-extra"
        return ROOT / "grade-11" / "math-extra"
    else:
        if any(x in text for x in ("?????? ???", "g12", "grade 12", "cls12")):
            base = ROOT / "grade-12"
        elif any(x in text for x in ("?????? ???", "g11", "grade 11", "cls11")):
            base = ROOT / "grade-11"
        else:
            base = ROOT / "extras"
        return base

    if any(x in text for x in ("?????? ???", "g12", "grade 12", "cls12")):
        return base / "grade-12"
    if any(x in text for x in ("?????? ???", "g11", "grade 11", "cls11")):
        return base / "grade-11"
    return base


def main():
    for p in [
        ROOT / "exams" / "grade-11", ROOT / "exams" / "grade-12",
        ROOT / "summaries-solutions" / "grade-11", ROOT / "summaries-solutions" / "grade-12",
        ROOT / "lessons" / "grade-11", ROOT / "lessons" / "grade-12",
        ROOT / "grade-11" / "math-extra", ROOT / "grade-12" / "math-extra",
        ROOT / "extras", RAW,
    ]:
        p.mkdir(parents=True, exist_ok=True)

    known_names = {p.name for p in ROOT.rglob("*.pdf")}
    known_urls = set()
    man = ROOT / "manifest.json"
    if man.exists():
        for f in json.loads(man.read_text(encoding="utf-8")).get("files", []):
            if f.get("url"):
                known_urls.add(f["url"])

    # 1) Collect all G11/G12 post links
    posts = {}
    print("=== Collect post links ===")
    for cid in CATS:
        for page in range(1, 20):
            url = f"https://oman-school.com/wp-json/wp/v2/posts?categories={cid}&per_page=100&page={page}&_fields=id,link,title"
            try:
                data = json.loads(fetch(url).decode("utf-8", "replace"))
            except Exception as e:
                print(f"  fail cat {cid}: {e}")
                break
            if not isinstance(data, list) or not data:
                break
            for p in data:
                title = re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", ""))
                link = p.get("link")
                if link and is_g(title + " " + link):
                    posts[p["id"]] = {"title": title, "link": link}
            print(f"  cat {cid} p{page}: +{len(data)} (tracked {len(posts)})")
            if len(data) < 100:
                break
            time.sleep(0.1)

    # math search posts
    for q in (
        "%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A",
        "%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A",
        "math%20grade%2011",
        "math%20grade%2012",
    ):
        for page in range(1, 6):
            url = f"https://oman-school.com/wp-json/wp/v2/posts?search={q}&per_page=100&page={page}&_fields=id,link,title"
            try:
                data = json.loads(fetch(url).decode("utf-8", "replace"))
            except Exception:
                break
            if not isinstance(data, list) or not data:
                break
            for p in data:
                title = re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", ""))
                link = p.get("link")
                if link and is_g(title + " " + link):
                    posts[p["id"]] = {"title": title, "link": link}
            if len(data) < 100:
                break

    print(f"Posts to deep-scan: {len(posts)}")

    # 2) WP media library PDF search
    print("=== Media library PDFs ===")
    media_pdfs = []
    for page in range(1, 30):
        url = (
            "https://oman-school.com/wp-json/wp/v2/media"
            f"?media_type=application&per_page=100&page={page}&_fields=id,source_url,title,mime_type"
        )
        # also try mime
        url2 = f"https://oman-school.com/wp-json/wp/v2/media?search=.pdf&per_page=100&page={page}&_fields=id,source_url,title,mime_type"
        for u in (url2,):
            try:
                data = json.loads(fetch(u).decode("utf-8", "replace"))
            except Exception as e:
                print(f"  media fail: {e}")
                data = []
            if not isinstance(data, list) or not data:
                continue
            for m in data:
                src = m.get("source_url") or ""
                title = re.sub("<[^>]+>", "", m.get("title", {}).get("rendered", ""))
                if src.lower().endswith(".pdf") and is_g(title + " " + src):
                    media_pdfs.append((title or Path(urlsplit(src).path).name, src))
            print(f"  media page {page}: {len(data)} items, g-pdfs {len(media_pdfs)}")
            if len(data) < 100:
                break
        else:
            continue
        break

    # Also paginate application/pdf via mime_type query if supported
    for page in range(1, 40):
        url = f"https://oman-school.com/wp-json/wp/v2/media?mime_type=application/pdf&per_page=100&page={page}&_fields=id,source_url,title"
        try:
            data = json.loads(fetch(url).decode("utf-8", "replace"))
        except Exception as e:
            print(f"  mime pdf fail page {page}: {e}")
            break
        if not isinstance(data, list) or not data:
            break
        for m in data:
            src = m.get("source_url") or ""
            title = re.sub("<[^>]+>", "", m.get("title", {}).get("rendered", ""))
            if src.lower().endswith(".pdf") and is_g(title + " " + src):
                media_pdfs.append((title or Path(urlsplit(src).path).name, src))
        print(f"  mime-pdf page {page}: {len(data)}, total g {len(media_pdfs)}")
        if len(data) < 100:
            break
        time.sleep(0.1)

    # 3) Deep scan each post HTML for PDF links
    print("=== Deep scan posts ===")
    found = {}
    for title, url in media_pdfs:
        found[url] = title

    post_list = list(posts.values())
    for i, p in enumerate(post_list, 1):
        try:
            html = fetch(p["link"]).decode("utf-8", "replace")
            pdfs = extract_pdfs(html)
            for pdf in pdfs:
                found[pdf] = p["title"]
            if i % 20 == 0 or pdfs:
                print(f"  [{i}/{len(post_list)}] {p['title'][:50]} -> {len(pdfs)} pdfs")
        except Exception as e:
            print(f"  post fail {p['link']}: {e}")
        time.sleep(0.12)

    print(f"Total unique PDFs discovered: {len(found)}")
    (RAW / "deep_pdfs.json").write_text(
        json.dumps([{"title": t, "pdf": u} for u, t in found.items()], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # 4) Download missing
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
                "category": "deep",
                "status": "downloaded",
                "path": str(dest.relative_to(ROOT)).replace("\\", "/"),
                "bytes": len(data),
            }
            new_files.append(meta)
            print(f"  OK {len(data):,} -> {meta['path']}")
        except Exception as e:
            print(f"  ERR {e}")
        time.sleep(0.1)

    # update manifest
    if man.exists():
        manifest = json.loads(man.read_text(encoding="utf-8"))
    else:
        manifest = {"files": []}
    manifest["files"].extend(new_files)
    manifest["deep_fetch_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
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
    (ROOT / "README.md").write_text(
        "\n".join(
            [
                "# Oman GED Curriculum Library",
                "",
                "Programme: General Education Diploma (GED) - Grades 11-12.",
                "",
                f"Updated: `{manifest['deep_fetch_at']}`",
                f"Total PDFs: **{len(all_pdfs)}** ({manifest['stats']['total_mb']} MB)",
                f"New this run: **{len(new_files)}**",
                "",
                "Includes student textbooks (math basic + advanced), teacher guides, exams, summaries, lessons.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print("=== DONE ===", json.dumps(manifest["stats"], indent=2))


if __name__ == "__main__":
    main()
