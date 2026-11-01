#!/usr/bin/env python3
"""Download Oman GED (G11-G12) textbooks discovered via WordPress API + MoE docs."""

from __future__ import annotations

import hashlib
import json
import re
import time
from pathlib import Path
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1] / "books"
RAW = ROOT / "_raw"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

CURRICULUM_DOCS = [
    (
        "post-basic-education-programme-moe.pdf",
        "https://home.moe.gov.om/file/top-menu/system/genral-school/dis/1.pdf",
    ),
    (
        "math-newsletter-approved-series.pdf",
        "https://home.moe.gov.om/images/library/file/Book322793.pdf",
    ),
    (
        "english-newsletter-2022-2023.pdf",
        "https://home.moe.gov.om/images/library/file/1e.pdf",
    ),
]

MOE_PDFS = [
    "https://ict.moe.gov.om/book/PDF/11/english_courseb_g11p1_Classical/files/downloads/english_courseb_g11p1_Classical.pdf",
]

G11_G12_HINTS = (
    "الحادي عشر",
    "الثاني عشر",
    "حادي عشر",
    "ثاني عشر",
    "grade 11",
    "grade 12",
    "grade-11",
    "grade-12",
    "g11",
    "g12",
    "cls11",
    "cls12",
    "دبلوم",
    "11a",
    "11b",
    "12a",
    "12b",
    "صف 11",
    "صف 12",
)

BOOKISH = (
    "كتاب",
    "book",
    "coursebook",
    "workbook",
    "دليل المعلم",
    "teacher",
    "طالب",
    "نشاط",
    "تجارب",
    "engage",
    "insight",
    "المؤنس",
    "المفيد",
)

SKIP = (
    "اختبار",
    "امتحان",
    "تجريبي",
    "نموذ",
    "جدول",
    "نتيجة",
    "نتائج",
    "مراجعة نتائج",
    "exam",
    "test",
    "quiz",
    "schedule",
    "ملخص",  # keep summaries? user asked for books - skip summaries to save space/noise
    "حلول",
    "حل كتاب",
    "worksheet",
)


def encode_url(url: str) -> str:
    from urllib.parse import urlsplit, urlunsplit, quote

    parts = urlsplit(url)
    # Encode path segments but keep slashes; don't double-encode
    path = quote(unquote(parts.path), safe="/")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def fetch(url: str, timeout: int = 180) -> bytes:
    req = Request(
        encode_url(url),
        headers={
            "User-Agent": UA,
            "Accept": "application/pdf,application/octet-stream,*/*;q=0.8",
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


def is_g11_g12_book(title: str, url: str) -> bool:
    text = f"{title} {url}".lower()
    # Arabic lower doesn't change much; also check original
    text_raw = f"{title} {url}"
    if any(s in text_raw for s in SKIP) or any(s in text for s in SKIP):
        # allow if clearly a textbook title with كتاب and grade
        if not (("كتاب" in text_raw or "book" in text) and any(h in text_raw.lower() or h in text_raw for h in G11_G12_HINTS)):
            return False
        # still skip pure exams
        if any(s in text_raw for s in ("اختبار", "امتحان", "exam", "test ")):
            return False
    grade_ok = any(h.lower() in text if h.isascii() else h in text_raw for h in G11_G12_HINTS)
    book_ok = any(b.lower() in text if b.isascii() else b in text_raw for b in BOOKISH)
    # path itself often has grade words
    return grade_ok and (book_ok or url.lower().endswith(".pdf"))


def dest_for(title: str, url: str, filename: str) -> Path:
    text = f"{title} {url} {filename}"
    low = text.lower()
    if any(x in text for x in ("دليل المعلم", "teacher")) or "teachers" in low:
        folder = ROOT / "teacher-guides"
    elif any(x in text for x in ("الثاني عشر", "grade 12", "grade-12", "g12", "cls12", "12a", "12b")) or "/12/" in low:
        grade = ROOT / "grade-12"
        if any(x in text for x in ("الفصل الأول", "الفصل الدراسي الأول", "semester-1", "term-1", "p1", "12a", " فصل أول")):
            folder = grade / "semester-1"
        elif any(x in text for x in ("الفصل الثاني", "الفصل الدراسي الثاني", "semester-2", "term-2", "p2", "12b", " فصل ثاني")):
            folder = grade / "semester-2"
        else:
            folder = grade
    elif any(x in text for x in ("الحادي عشر", "grade 11", "grade-11", "g11", "cls11", "11a", "11b")) or "/11/" in low:
        grade = ROOT / "grade-11"
        if any(x in text for x in ("الفصل الأول", "الفصل الدراسي الأول", "semester-1", "term-1", "p1", "11a", " فصل أول")):
            folder = grade / "semester-1"
        elif any(x in text for x in ("الفصل الثاني", "الفصل الدراسي الثاني", "semester-2", "term-2", "p2", "11b", " فصل ثاني")):
            folder = grade / "semester-2"
        else:
            folder = grade
    else:
        folder = ROOT / "_raw"
    return folder / sanitize(filename if filename.lower().endswith(".pdf") else filename + ".pdf")


def download(url: str, dest: Path, meta: dict) -> bool:
    if dest.exists() and dest.stat().st_size > 2000:
        meta["status"] = "exists"
        meta["path"] = str(dest.relative_to(ROOT)).replace("\\", "/")
        meta["bytes"] = dest.stat().st_size
        print(f"  SKIP {dest.name} ({dest.stat().st_size:,} bytes)")
        return True
    try:
        data = fetch(url)
        if len(data) < 1500:
            meta["status"] = "too_small"
            print(f"  FAIL small {url}")
            return False
        # Accept PDF magic or large binary (some servers omit header)
        if not (data.startswith(b"%PDF") or len(data) > 50_000):
            meta["status"] = "not_pdf"
            print(f"  FAIL not pdf {url}")
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        # avoid collisions
        if dest.exists():
            stem, suf = dest.stem, dest.suffix
            dest = dest.with_name(f"{stem}_{hashlib.md5(url.encode()).hexdigest()[:6]}{suf}")
        dest.write_bytes(data)
        meta["status"] = "downloaded"
        meta["path"] = str(dest.relative_to(ROOT)).replace("\\", "/")
        meta["bytes"] = len(data)
        meta["sha256"] = hashlib.sha256(data).hexdigest()
        print(f"  OK {len(data):,} -> {meta['path']}")
        return True
    except Exception as e:
        meta["status"] = "error"
        meta["error"] = str(e)
        print(f"  ERR {e} :: {url[:120]}")
        return False


def fetch_more_category_pdfs() -> list[dict]:
    """Pull dedicated book categories if present."""
    items = []
    # Known from earlier: 122 = class-11-oman-books
    # Discover class-12 book category via slug search
    endpoints = [
        "https://oman-school.com/wp-json/wp/v2/categories?search=class-12&per_page=20",
        "https://oman-school.com/wp-json/wp/v2/categories?search=12-oman&per_page=20",
        "https://oman-school.com/wp-json/wp/v2/categories?search=%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A%20%D8%B9%D8%B4%D8%B1&per_page=50",
        "https://oman-school.com/wp-json/wp/v2/categories?per_page=100&page=1",
        "https://oman-school.com/wp-json/wp/v2/categories?per_page=100&page=2",
    ]
    cat_ids = {122}
    for ep in endpoints:
        try:
            data = json.loads(fetch(ep).decode("utf-8", "replace"))
            if isinstance(data, list):
                for c in data:
                    slug = c.get("slug", "")
                    name = c.get("name", "")
                    if any(
                        k in slug + name
                        for k in (
                            "class-12",
                            "class-11",
                            "ثاني عشر",
                            "حادي عشر",
                            "مناهج الصف",
                            "كتب",
                        )
                    ):
                        cat_ids.add(c["id"])
                        print(f"cat {c['id']} {slug} {name}")
        except Exception as e:
            print("cat discover fail", e)

    for cid in sorted(cat_ids):
        for page in range(1, 10):
            url = f"https://oman-school.com/wp-json/wp/v2/posts?categories={cid}&per_page=100&page={page}"
            try:
                posts = json.loads(fetch(url).decode("utf-8", "replace"))
            except Exception:
                break
            if not isinstance(posts, list) or not posts:
                break
            for p in posts:
                title = re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", ""))
                content = p.get("content", {}).get("rendered", "")
                link = p.get("link", "")
                pdfs = re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", content, re.I)
                pdfs += ["https://oman-school.com" + m for m in re.findall(r"/wp-content/uploads/[^\s\"'<>]+\.pdf", content, re.I)]
                for pdf in pdfs:
                    items.append({"title": title, "pdf": pdf, "post": link})
            print(f"category {cid} page {page}: {len(posts)} posts")
            if len(posts) < 100:
                break
            time.sleep(0.2)
    return items


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for p in [
        ROOT / "grade-11" / "semester-1",
        ROOT / "grade-11" / "semester-2",
        ROOT / "grade-12" / "semester-1",
        ROOT / "grade-12" / "semester-2",
        ROOT / "curriculum-docs",
        ROOT / "teacher-guides",
        RAW,
    ]:
        p.mkdir(parents=True, exist_ok=True)

    manifest = {
        "programme": "Oman General Education Diploma (GED) / دبلوم التعليم العام — Grades 11–12",
        "downloaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "files": [],
    }

    print("=== Curriculum docs ===")
    for fname, url in CURRICULUM_DOCS:
        meta = {"url": url, "title": fname, "category": "curriculum-doc"}
        download(url, ROOT / "curriculum-docs" / fname, meta)
        manifest["files"].append(meta)

    print("=== MoE official samples ===")
    for url in MOE_PDFS:
        # probe siblings
        candidates = [url]
        for grade in (11, 12):
            for kind in ("english_courseb", "english_workbook"):
                for part in (f"g{grade}p1", f"g{grade}p2"):
                    name = f"{kind}_{part}_Classical"
                    candidates.append(
                        f"https://ict.moe.gov.om/book/PDF/{grade}/{name}/files/downloads/{name}.pdf"
                    )
        for u in dict.fromkeys(candidates):
            fname = sanitize(Path(urlparse(u).path).name)
            meta = {"url": u, "title": fname, "category": "moe-official"}
            # try download; ignore 404
            download(u, dest_for(fname, u, fname), meta)
            if meta.get("status") in {"downloaded", "exists"}:
                manifest["files"].append(meta)
            time.sleep(0.15)

    print("=== Collect PDF list ===")
    items = []
    wp_path = RAW / "wp_pdfs.json"
    if wp_path.exists():
        items.extend(json.loads(wp_path.read_text(encoding="utf-8")))
    items.extend(fetch_more_category_pdfs())

    # dedupe
    by_url = {}
    for it in items:
        pdf = it.get("pdf") or it.get("url")
        if not pdf:
            continue
        by_url[pdf] = it

    filtered = []
    for pdf, it in by_url.items():
        title = it.get("title") or ""
        if is_g11_g12_book(title, pdf):
            filtered.append((title, pdf))
    print(f"Filtered G11/G12 book PDFs: {len(filtered)} (from {len(by_url)} unique)")

    print("=== Download books ===")
    for i, (title, pdf) in enumerate(filtered, 1):
        fname = sanitize(Path(urlparse(pdf).path).name)
        if not fname.lower().endswith(".pdf"):
            fname = sanitize(title) + ".pdf"
        dest = dest_for(title, pdf, fname)
        meta = {"url": pdf, "title": title, "category": "textbook"}
        print(f"[{i}/{len(filtered)}] {title[:70]}")
        download(pdf, dest, meta)
        manifest["files"].append(meta)
        time.sleep(0.12)

    ok = [f for f in manifest["files"] if f.get("status") in {"downloaded", "exists"}]
    total = sum(f.get("bytes", 0) for f in ok)
    manifest["stats"] = {
        "successful": len(ok),
        "attempted": len(manifest["files"]),
        "total_bytes": total,
        "total_mb": round(total / 1_000_000, 1),
    }
    (ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Oman GED Curriculum Books",
        "",
        "Official programme: **General Education Diploma (دبلوم التعليم العام)** — Grades 11–12, Ministry of Education, Oman.",
        "",
        f"Downloaded: `{manifest['downloaded_at']}`",
        f"Files: **{len(ok)}** ({manifest['stats']['total_mb']} MB)",
        "",
        "Sources: [MoE ICT Book Portal](https://ict.moe.gov.om/book), educational mirrors hosting MoE PDFs.",
        "",
        "## Layout",
        "",
        "- `curriculum-docs/` — MoE programme / newsletter PDFs",
        "- `grade-11/`, `grade-12/` — student textbooks (+ semester folders when known)",
        "- `teacher-guides/` — teacher books",
        "",
        "## Files",
        "",
    ]
    for f in sorted(ok, key=lambda x: x.get("path") or ""):
        lines.append(f"- `{f.get('path')}` — {f.get('title','')}")
    (ROOT / "README.md").write_text("\n".join(lines), encoding="utf-8")
    print("=== DONE ===", json.dumps(manifest["stats"], indent=2))


if __name__ == "__main__":
    main()
