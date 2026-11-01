#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Download ALL Oman GED (G11-G12) materials: books, math, exams, summaries, guides."""

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

# Focus categories for G11/G12 everything
CATEGORY_IDS = {
    # curriculum books
    122,  # class-11 books
    118,  # class-12 books
    75,   # oman books school library (filter by title later)
    # teacher guides
    402,  # teacherbook-g11
    410,  # teacherbook-g12
    # workbooks
    2163,  # g11-workbooks
    2167,  # g12-workbooks
    # lessons / summaries / revisions / exams / reports
    611,  # g11-lessons
    544,  # g12-lessons
    1262,  # g11-summaries
    542,  # g12-summaries
    2651,  # g11-revisions
    1961,  # g12-revisions
    968,  # g11 tests
    417,  # g12 tests
    2628,  # g11 mock
    2623,  # g12 mock
    2059,  # g11 short tests
    2003,  # g12 short tests
    2737,  # g11 final
    2624,  # g12 final
    1452,  # g11 reports
    1643,  # g12 reports
    2110,  # g12 memorization
    2193,  # ict moe ebooks
}

G_HINTS = (
    "?????? ???",
    "?????? ???",
    "???? ???",
    "???? ???",
    "grade 11",
    "grade 12",
    "grade-11",
    "grade-12",
    "g11",
    "g12",
    "cls11",
    "cls12",
    "?????",
    "11a",
    "11b",
    "12a",
    "12b",
    "?? 11",
    "?? 12",
)


def encode_url(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def fetch(url: str, timeout: int = 180) -> bytes:
    req = Request(
        encode_url(url),
        headers={
            "User-Agent": UA,
            "Accept": "application/pdf,application/json,text/html,*/*;q=0.8",
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


def is_g11_g12(title: str, url: str) -> bool:
    text = f"{title} {url}"
    return any(h.lower() in text.lower() if h.isascii() else h in text for h in G_HINTS)


def bucket_for(title: str, url: str, filename: str) -> Path:
    text = f"{title} {url} {filename}"
    low = text.lower()

    if any(x in text for x in ("???? ??????", "teacher")) or "teachers" in low:
        base = ROOT / "teacher-guides"
    elif any(x in text for x in ("??????", "??????", "?????", "?????", "????")) or any(
        x in low for x in ("exam", "test", "mock", "quiz")
    ):
        base = ROOT / "exams"
    elif any(x in text for x in ("????", "??????", "????", "?? ")) or "summary" in low or "revision" in low:
        base = ROOT / "summaries-solutions"
    elif any(x in text for x in ("???", "????")) or "lesson" in low:
        base = ROOT / "lessons"
    else:
        # textbooks / misc curriculum
        if any(x in text for x in ("?????? ???", "grade 12", "g12", "cls12", "12a", "12b")):
            grade = ROOT / "grade-12"
        elif any(x in text for x in ("?????? ???", "grade 11", "g11", "cls11", "11a", "11b")):
            grade = ROOT / "grade-11"
        else:
            grade = ROOT / "extras"
        if any(x in text for x in ("????? ?????", "????? ??????? ?????", "semester-1", "p1", "11a", "12a", " ??? ???")):
            return grade / "semester-1"
        if any(x in text for x in ("????? ??????", "????? ??????? ??????", "semester-2", "p2", "11b", "12b", " ??? ????")):
            return grade / "semester-2"
        return grade

    # subfolder by grade for non-book buckets
    if any(x in text for x in ("?????? ???", "grade 12", "g12", "cls12")):
        return base / "grade-12"
    if any(x in text for x in ("?????? ???", "grade 11", "g11", "cls11")):
        return base / "grade-11"
    return base


def existing_urls() -> set[str]:
    urls = set()
    man = ROOT / "manifest.json"
    if man.exists():
        try:
            data = json.loads(man.read_text(encoding="utf-8"))
            for f in data.get("files", []):
                if f.get("url") and f.get("status") in {"downloaded", "exists"}:
                    urls.add(f["url"])
        except Exception:
            pass
    # also fingerprint by filename already on disk
    return urls


def existing_names() -> set[str]:
    return {p.name for p in ROOT.rglob("*.pdf")}


def download(url: str, dest: Path, meta: dict, known_names: set[str]) -> bool:
    if dest.exists() and dest.stat().st_size > 2000:
        meta["status"] = "exists"
        meta["path"] = str(dest.relative_to(ROOT)).replace("\\", "/")
        meta["bytes"] = dest.stat().st_size
        print(f"  SKIP exists {dest.name}")
        return True
    # skip if same filename already somewhere
    if dest.name in known_names:
        meta["status"] = "exists_elsewhere"
        print(f"  SKIP name {dest.name}")
        return True
    try:
        data = fetch(url)
        if len(data) < 1500 or not (data.startswith(b"%PDF") or len(data) > 50_000):
            meta["status"] = "not_pdf"
            print(f"  FAIL not pdf")
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists():
            dest = dest.with_name(f"{dest.stem}_{hashlib.md5(url.encode()).hexdigest()[:6]}{dest.suffix}")
        dest.write_bytes(data)
        known_names.add(dest.name)
        meta["status"] = "downloaded"
        meta["path"] = str(dest.relative_to(ROOT)).replace("\\", "/")
        meta["bytes"] = len(data)
        print(f"  OK {len(data):,} -> {meta['path']}")
        return True
    except Exception as e:
        meta["status"] = "error"
        meta["error"] = str(e)
        print(f"  ERR {e}")
        return False


def collect_from_categories() -> list[dict]:
    items = []
    for cid in sorted(CATEGORY_IDS):
        for page in range(1, 15):
            url = f"https://oman-school.com/wp-json/wp/v2/posts?categories={cid}&per_page=100&page={page}"
            try:
                posts = json.loads(fetch(url).decode("utf-8", "replace"))
            except Exception as e:
                print(f"cat {cid} page {page} fail: {e}")
                break
            if not isinstance(posts, list) or not posts:
                break
            for p in posts:
                title = re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", ""))
                content = p.get("content", {}).get("rendered", "")
                link = p.get("link", "")
                pdfs = re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", content, re.I)
                pdfs += [
                    "https://oman-school.com" + m
                    for m in re.findall(r"/wp-content/uploads/[^\s\"'<>]+\.pdf", content, re.I)
                ]
                for pdf in dict.fromkeys(pdfs):
                    items.append({"title": title, "pdf": pdf, "post": link, "cat": cid})
            print(f"cat {cid} page {page}: {len(posts)} posts (+{sum(1 for _ in posts)} scanned)")
            if len(posts) < 100:
                break
            time.sleep(0.15)
    return items


def collect_math_search() -> list[dict]:
    """Extra math-focused searches."""
    items = []
    queries = [
        "%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA",  # ?????????
        "math",
        "mathematics",
        "%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A3%D8%B3%D8%A7%D8%B3%D9%8A%D8%A9",
        "%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%84%D9%85%D8%AA%D9%82%D8%AF%D9%85%D8%A9",
    ]
    for q in queries:
        for page in range(1, 8):
            url = f"https://oman-school.com/wp-json/wp/v2/posts?search={q}&per_page=100&page={page}"
            try:
                posts = json.loads(fetch(url).decode("utf-8", "replace"))
            except Exception as e:
                print(f"search fail {q} p{page}: {e}")
                break
            if not isinstance(posts, list) or not posts:
                break
            for p in posts:
                title = re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", ""))
                content = p.get("content", {}).get("rendered", "")
                pdfs = re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", content, re.I)
                pdfs += [
                    "https://oman-school.com" + m
                    for m in re.findall(r"/wp-content/uploads/[^\s\"'<>]+\.pdf", content, re.I)
                ]
                for pdf in dict.fromkeys(pdfs):
                    items.append({"title": title, "pdf": pdf, "post": p.get("link", ""), "cat": f"search:{q}"})
            print(f"search {q[:20]} page {page}: {len(posts)}")
            if len(posts) < 100:
                break
            time.sleep(0.15)
    return items


def main():
    for p in [
        ROOT / "exams" / "grade-11",
        ROOT / "exams" / "grade-12",
        ROOT / "summaries-solutions" / "grade-11",
        ROOT / "summaries-solutions" / "grade-12",
        ROOT / "lessons" / "grade-11",
        ROOT / "lessons" / "grade-12",
        ROOT / "extras",
        ROOT / "grade-11" / "semester-1",
        ROOT / "grade-11" / "semester-2",
        ROOT / "grade-12" / "semester-1",
        ROOT / "grade-12" / "semester-2",
        ROOT / "teacher-guides",
        RAW,
    ]:
        p.mkdir(parents=True, exist_ok=True)

    print("=== Discovering all G11/G12 PDFs ===")
    items = collect_from_categories()
    items.extend(collect_math_search())

    # merge previous wp list
    wp = RAW / "wp_pdfs.json"
    if wp.exists():
        items.extend(json.loads(wp.read_text(encoding="utf-8")))

    by_url = {}
    for it in items:
        pdf = it.get("pdf")
        if pdf:
            by_url[pdf] = it

    filtered = []
    for pdf, it in by_url.items():
        title = it.get("title") or ""
        if is_g11_g12(title, pdf):
            filtered.append((title, pdf))

    print(f"Unique G11/G12 PDFs to consider: {len(filtered)}")

    known_urls = existing_urls()
    known_names = existing_names()
    print(f"Already have {len(known_names)} PDF files on disk")

    new_files = []
    attempted = 0
    for i, (title, pdf) in enumerate(filtered, 1):
        if pdf in known_urls:
            continue
        fname = sanitize(Path(urlsplit(pdf).path).name)
        if not fname.lower().endswith(".pdf"):
            fname = sanitize(title) + ".pdf"
        if fname in known_names:
            continue
        dest_dir = bucket_for(title, pdf, fname)
        dest = dest_dir / fname
        meta = {"url": pdf, "title": title, "category": "expanded"}
        attempted += 1
        print(f"[{attempted} new | scan {i}/{len(filtered)}] {title[:75]}")
        ok = download(pdf, dest, meta, known_names)
        if ok:
            known_urls.add(pdf)
            new_files.append(meta)
        time.sleep(0.1)

    # update manifest
    man_path = ROOT / "manifest.json"
    if man_path.exists():
        manifest = json.loads(man_path.read_text(encoding="utf-8"))
    else:
        manifest = {"files": [], "programme": "Oman GED Grades 11-12"}
    manifest["files"].extend(new_files)
    manifest["expanded_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    all_pdfs = list(ROOT.rglob("*.pdf"))
    total = sum(p.stat().st_size for p in all_pdfs)
    manifest["stats"] = {
        "pdf_count": len(all_pdfs),
        "total_mb": round(total / 1e6, 1),
        "new_this_run": len(new_files),
        "attempted_this_run": attempted,
    }
    man_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # refresh README summary
    lines = [
        "# Oman GED Curriculum Library",
        "",
        "Programme: General Education Diploma (GED) - Grades 11-12.",
        "",
        f"Updated: `{manifest['expanded_at']}`",
        f"Total PDFs: **{len(all_pdfs)}** ({manifest['stats']['total_mb']} MB)",
        f"New this run: **{len(new_files)}**",
        "",
        "## Folders",
        "",
        "- `curriculum-docs/` - MoE programme documents",
        "- `grade-11/`, `grade-12/` - student textbooks (incl. all math basic + advanced)",
        "- `teacher-guides/` - teacher books",
        "- `exams/` - past papers / mocks / short tests",
        "- `summaries-solutions/` - summaries and worked solutions",
        "- `lessons/` - lesson PDFs",
        "",
    ]
    (ROOT / "README.md").write_text("\n".join(lines), encoding="utf-8")
    print("=== DONE ===", json.dumps(manifest["stats"], indent=2))


if __name__ == "__main__":
    main()
