#!/usr/bin/env python3
"""Download Oman MoE GED (Grades 11-12) textbooks and curriculum docs."""

from __future__ import annotations

import json
import re
import time
import hashlib
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1] / "books"
RAW = ROOT / "_raw"
MANIFEST = ROOT / "manifest.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

INDEX_PAGES = [
    "https://oman-school.com/oman-g11-curriculum/",
    "https://oman-school.com/omani-curricula-for-grade-12-pdf/",
    "https://oman-school.com/grade-11-files-oman/",
    "https://oman-school.com/grade-12-files-oman/",
    "https://www.omanedubooks.com/p/all-books.html",
    "https://www.omanedubooks.com/p/grade-11-semester-1.html",
    "https://www.omanedubooks.com/p/grade-11-semester-2.html",
    "https://www.omanedubooks.com/p/grade-12-semester-1.html",
    "https://www.omanedubooks.com/p/grade-12-semester-2.html",
    "https://afidni.com/%d8%ac%d9%85%d9%8a%d8%b9-%d9%83%d8%aa%d8%a8-%d9%85%d9%86%d9%87%d8%ac-%d8%a7%d9%84%d8%af%d8%a8%d9%84%d9%88%d9%85-%d8%a7%d9%84%d8%b9%d8%a7%d9%85/",
    "https://afidni.com/%D9%83%d8%AA%D8%A8-%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A-%D8%B9%D8%B4%D8%B1/",
    "https://afidni.com/%d8%a3%d8%af%d9%84%d8%a9-%d9%85%d8%b9%d9%84%d9%85-%d8%ac%d9%85%d9%8a%d8%b9-%d9%85%d9%88%d8%a7%d8%af-%d8%a7%d9%84%d8%af%d8%a8%d9%84%d9%88%d9%85-%d8%a7%d9%84%d8%b9%d8%a7%d9%85/",
]

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

# Known MoE direct textbook PDFs (official portal)
MOE_PDFS = [
    "https://ict.moe.gov.om/book/PDF/11/english_courseb_g11p1_Classical/files/downloads/english_courseb_g11p1_Classical.pdf",
]

# Candidate MoE path probes based on known naming conventions
MOE_CANDIDATES = []
for grade in (11, 12):
    for sem, sem_label in (("p1", "A"), ("p2", "B"), ("1", "1"), ("2", "2")):
        for name in (
            f"english_courseb_g{grade}{sem}_Classical",
            f"english_courseb_g{grade}p{sem[-1]}_Classical",
            f"english_workbook_g{grade}{sem}_Classical",
            f"english_workbook_g{grade}p{sem[-1]}_Classical",
            f"Engage_with_English_Coursebook_{grade}{sem_label}",
            f"Engage_with_English_Workbook_{grade}{sem_label}",
        ):
            MOE_CANDIDATES.append(
                f"https://ict.moe.gov.om/book/PDF/{grade}/{name}/files/downloads/{name}.pdf"
            )


class LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[str] = []
        self.iframes: list[str] = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "a" and "href" in d:
            self.links.append(d["href"])
        if tag == "iframe" and "src" in d:
            self.iframes.append(d["src"])
        if tag == "embed" and "src" in d:
            self.iframes.append(d["src"])
        if tag == "source" and "src" in d:
            self.links.append(d["src"])
        if tag == "meta" and d.get("property") in {"og:url", "og:image"}:
            pass


def fetch(url: str, timeout: int = 90) -> bytes:
    req = Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_text(url: str, timeout: int = 90) -> str:
    data = fetch(url, timeout=timeout)
    for enc in ("utf-8", "windows-1256", "latin-1"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def head_ok(url: str, timeout: int = 30) -> tuple[bool, int | None, str | None]:
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": UA})
        with urlopen(req, timeout=timeout) as resp:
            length = resp.headers.get("Content-Length")
            ctype = resp.headers.get("Content-Type")
            return True, int(length) if length and length.isdigit() else None, ctype
    except Exception:
        # Some servers reject HEAD; try ranged GET
        try:
            req = Request(
                url,
                headers={"User-Agent": UA, "Range": "bytes=0-0"},
            )
            with urlopen(req, timeout=timeout) as resp:
                ctype = resp.headers.get("Content-Type")
                return True, None, ctype
        except Exception:
            return False, None, None


def sanitize(name: str) -> str:
    name = unquote(name)
    name = re.sub(r"[<>:\"/\\|?*\x00-\x1f]", "_", name)
    name = re.sub(r"\s+", " ", name).strip(" ._")
    return name[:180] or "file"


def guess_grade_sem(url: str, title: str = "") -> tuple[str, str]:
    text = f"{url} {title}".lower()
    grade = "shared"
    if any(x in text for x in ("g12", "grade-12", "grade12", "صف-الثاني-عشر", "الثاني عشر", "cls12", "/12/")):
        grade = "grade-12"
    elif any(x in text for x in ("g11", "grade-11", "grade11", "صف-الحادي", "الحادي عشر", "cls11", "/11/")):
        grade = "grade-11"

    sem = "general"
    if any(x in text for x in ("p1", "semester-1", "term-1", "فصل-أول", "الفصل الأول", "الفصل الدراسي الأول", "11a", "12a", "_a.", "semester a")):
        sem = "semester-1"
    elif any(x in text for x in ("p2", "semester-2", "term-2", "فصل-ثاني", "الفصل الثاني", "الفصل الدراسي الثاني", "11b", "12b", "_b.", "semester b")):
        sem = "semester-2"
    return grade, sem


def dest_for(url: str, filename: str, title: str = "") -> Path:
    grade, sem = guess_grade_sem(url + " " + filename, title)
    if "teacher" in (url + filename + title).lower() or "دليل" in (filename + title) or "معلم" in (filename + title):
        return ROOT / "teacher-guides" / sanitize(filename)
    if grade == "shared":
        return ROOT / "_raw" / sanitize(filename)
    if sem == "general":
        return ROOT / grade / sanitize(filename)
    return ROOT / grade / sem / sanitize(filename)


def download_file(url: str, dest: Path, meta: dict) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        meta["status"] = "exists"
        meta["path"] = str(dest.relative_to(ROOT))
        meta["bytes"] = dest.stat().st_size
        print(f"  SKIP exists ({dest.stat().st_size} bytes): {dest.name}")
        return True
    try:
        data = fetch(url, timeout=180)
        if not data.startswith(b"%PDF") and "pdf" in url.lower():
            # might still be valid if gzipped wrongly; keep if large
            if len(data) < 5000:
                meta["status"] = "not_pdf"
                print(f"  FAIL not pdf: {url}")
                return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        meta["status"] = "downloaded"
        meta["path"] = str(dest.relative_to(ROOT))
        meta["bytes"] = len(data)
        meta["sha256"] = hashlib.sha256(data).hexdigest()
        print(f"  OK {len(data):,} bytes -> {dest.relative_to(ROOT)}")
        return True
    except Exception as e:
        meta["status"] = "error"
        meta["error"] = str(e)
        print(f"  ERR {url}: {e}")
        return False


def extract_links(html: str, base: str) -> list[str]:
    p = LinkExtractor()
    try:
        p.feed(html)
    except Exception:
        pass
    out = []
    for href in p.links + p.iframes:
        full = urljoin(base, href)
        out.append(full)
    # also regex for direct pdfs in scripts / data attrs
    for m in re.finditer(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", html, re.I):
        out.append(m.group(0).rstrip(").,;"))
    for m in re.finditer(r"/wp-content/uploads/[^\s\"'<>]+\.pdf", html, re.I):
        out.append(urljoin(base, m.group(0)))
    # google drive / drive viewers
    for m in re.finditer(r"https?://drive\.google\.com/[^\s\"'<>]+", html, re.I):
        out.append(m.group(0).rstrip(").,;"))
    return list(dict.fromkeys(out))


def looks_like_book_page(url: str) -> bool:
    u = url.lower()
    if "oman-school.com" not in u and "afidni.com" not in u and "omanedubooks.com" not in u:
        return False
    if any(x in u for x in ("#", "facebook", "twitter", "whatsapp", "telegram", "category", "tag/", "author")):
        return False
    keys = (
        "book",
        "pdf",
        "كتاب",
        "cls11",
        "cls12",
        "grade-11",
        "grade-12",
        "curriculum",
        "muunis",
        "islamic",
        "chemistry",
        "physics",
        "biology",
        "math",
        "english",
        "engage",
        "insight",
        "geography",
        "دليل",
    )
    return any(k in u for k in keys) or "%d9%83%d8%aa%d8%a7%d8%a8" in u


def drive_to_direct(url: str) -> str | None:
    # https://drive.google.com/file/d/FILEID/view
    m = re.search(r"/file/d/([^/]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    m = re.search(r"[?&]id=([^&]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    return None


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)

    manifest: dict = {
        "source": "Oman Ministry of Education / educational mirrors",
        "programme": "General Education Diploma (GED) / دبلوم التعليم العام — Grades 11-12",
        "downloaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "files": [],
        "stats": {},
    }

    print("=== 1) Curriculum programme documents ===")
    for fname, url in CURRICULUM_DOCS:
        dest = ROOT / "curriculum-docs" / fname
        meta = {"url": url, "title": fname, "category": "curriculum-doc"}
        download_file(url, dest, meta)
        manifest["files"].append(meta)
        time.sleep(0.3)

    print("\n=== 2) Probe known MoE PDF candidates ===")
    moe_found = []
    # Start with known good
    for url in MOE_PDFS + MOE_CANDIDATES:
        ok, length, ctype = head_ok(url)
        if ok and ctype and "pdf" in ctype.lower():
            moe_found.append(url)
            print(f"  FOUND MoE: {url} ({length})")
        elif ok and length and length > 50000:
            moe_found.append(url)
            print(f"  FOUND MoE (len): {url} ({length})")
    moe_found = list(dict.fromkeys(moe_found))

    # Light MoE English naming probes only (full catalog comes from mirrors)
    for grade in (11, 12):
        for kind in ("english_courseb", "english_workbook"):
            for part in ("g11p1", "g11p2", "g12p1", "g12p2"):
                if f"g{grade}" not in part:
                    continue
                for suffix in ("_Classical", ""):
                    name = f"{kind}_{part}{suffix}"
                    url = f"https://ict.moe.gov.om/book/PDF/{grade}/{name}/files/downloads/{name}.pdf"
                    ok, length, ctype = head_ok(url, timeout=15)
                    if ok and ((ctype and "pdf" in (ctype or "").lower()) or (length and length > 40000)):
                        moe_found.append(url)
                        print(f"  FOUND MoE probe: {url}")

    moe_found = list(dict.fromkeys(moe_found))
    print(f"MoE PDFs discovered: {len(moe_found)}")

    for url in moe_found:
        fname = sanitize(Path(urlparse(url).path).name)
        dest = dest_for(url, fname)
        meta = {"url": url, "title": fname, "category": "moe-official"}
        download_file(url, dest, meta)
        manifest["files"].append(meta)
        time.sleep(0.2)

    print("\n=== 3) Crawl index pages for book links ===")
    book_pages: list[str] = []
    seed_pdfs: list[str] = []
    for idx in INDEX_PAGES:
        print(f"  Index: {idx}")
        try:
            html = fetch_text(idx)
            links = extract_links(html, idx)
            for link in links:
                if link.lower().endswith(".pdf") or ".pdf?" in link.lower():
                    seed_pdfs.append(link)
                elif looks_like_book_page(link):
                    book_pages.append(link)
            print(f"    -> {len(links)} links, book pages so far {len(book_pages)}")
        except Exception as e:
            print(f"    index fail: {e}")
        time.sleep(0.4)

    book_pages = list(dict.fromkeys(book_pages))
    seed_pdfs = list(dict.fromkeys(seed_pdfs))
    print(f"Book pages to visit: {len(book_pages)}")
    print(f"Seed PDFs: {len(seed_pdfs)}")

    # Cap to avoid infinite crawl while still being thorough
    MAX_PAGES = 250
    book_pages = book_pages[:MAX_PAGES]

    print("\n=== 4) Visit book pages for PDF URLs ===")
    pdf_urls: list[tuple[str, str]] = [(u, "seed") for u in seed_pdfs]
    for i, page in enumerate(book_pages, 1):
        print(f"  [{i}/{len(book_pages)}] {page}")
        try:
            html = fetch_text(page)
            title_m = re.search(r"<title>(.*?)</title>", html, re.I | re.S)
            title = re.sub(r"\s+", " ", title_m.group(1)).strip() if title_m else Path(urlparse(page).path).name
            links = extract_links(html, page)
            found_here = 0
            for link in links:
                low = link.lower()
                if low.endswith(".pdf") or ".pdf?" in low or "uc?export=download" in low:
                    pdf_urls.append((link, title))
                    found_here += 1
                elif "drive.google.com" in low:
                    direct = drive_to_direct(link)
                    if direct:
                        pdf_urls.append((direct, title))
                        found_here += 1
                elif "ict.moe.gov.om" in low and ("/book/" in low or "/PDF/" in low):
                    # may be flipbook; try downloads path guess later
                    if low.endswith(".pdf"):
                        pdf_urls.append((link, title))
                        found_here += 1
            # common button patterns: data-download, onclick window.open
            for m in re.finditer(r"(?:href|data-url|data-file|data-link)=['\"]([^'\"]+)['\"]", html, re.I):
                cand = urljoin(page, m.group(1))
                if ".pdf" in cand.lower():
                    pdf_urls.append((cand, title))
                    found_here += 1
            print(f"    PDFs on page: {found_here}")
        except Exception as e:
            print(f"    page fail: {e}")
        time.sleep(0.25)

    # Deduplicate by URL
    seen = set()
    unique_pdfs: list[tuple[str, str]] = []
    for url, title in pdf_urls:
        if url in seen:
            continue
        seen.add(url)
        unique_pdfs.append((url, title))

    print(f"\n=== 5) Download {len(unique_pdfs)} PDF URLs ===")
    for url, title in unique_pdfs:
        # skip non-book junk
        if any(x in url.lower() for x in ("logo", "icon", "sprite", "banner")):
            continue
        parsed = urlparse(url)
        fname = sanitize(Path(parsed.path).name)
        if not fname.lower().endswith(".pdf"):
            # invent name from title
            fname = sanitize(title) + ".pdf"
            if not fname.lower().endswith(".pdf"):
                fname += ".pdf"
        dest = dest_for(url + " " + title, fname, title)
        meta = {"url": url, "title": title, "category": "mirror"}
        download_file(url, dest, meta)
        manifest["files"].append(meta)
        time.sleep(0.15)

    # Stats
    ok_files = [f for f in manifest["files"] if f.get("status") in {"downloaded", "exists"}]
    total_bytes = sum(f.get("bytes", 0) for f in ok_files)
    manifest["stats"] = {
        "total_attempted": len(manifest["files"]),
        "successful": len(ok_files),
        "total_bytes": total_bytes,
        "moe_official_found": len(moe_found),
        "book_pages_crawled": len(book_pages),
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # Human-readable index
    index_lines = [
        "# Oman GED Curriculum Books",
        "",
        "Programme: **General Education Diploma (دبلوم التعليم العام)** — Grades 11–12, Ministry of Education, Sultanate of Oman.",
        "",
        f"Downloaded: {manifest['downloaded_at']}",
        f"Successful files: **{len(ok_files)}** ({total_bytes/1_000_000:.1f} MB)",
        "",
        "## Curriculum documents",
        "",
    ]
    for f in manifest["files"]:
        if f.get("category") == "curriculum-doc" and f.get("path"):
            index_lines.append(f"- [{f.get('title')}]({f['path']}) — {f.get('url')}")
    index_lines += ["", "## Textbooks", ""]
    for f in sorted(ok_files, key=lambda x: x.get("path") or ""):
        if f.get("category") == "curriculum-doc":
            continue
        index_lines.append(
            f"- `{f.get('path')}` — {f.get('title','')}  \n  Source: {f.get('url')}"
        )
    (ROOT / "README.md").write_text("\n".join(index_lines), encoding="utf-8")

    print("\n=== DONE ===")
    print(json.dumps(manifest["stats"], indent=2))
    print(f"Manifest: {MANIFEST}")


if __name__ == "__main__":
    main()
