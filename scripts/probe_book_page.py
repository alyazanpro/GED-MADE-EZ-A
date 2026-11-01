from pathlib import Path
from urllib.request import Request, urlopen
import re

ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
url = "https://oman-school.com/engage-with-english-coursebook-11a-pdf/"
req = Request(
    url,
    headers={
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
    },
)
html = urlopen(req, timeout=60).read().decode("utf-8", "replace")
Path("books/_raw/probe_page.html").write_text(html, encoding="utf-8")

pdfs = re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", html, re.I)
drives = re.findall(r"https?://drive\.google\.com/[^\s\"'<>]+", html, re.I)
moe = re.findall(r"https?://ict\.moe\.gov\.om/[^\s\"'<>]+", html, re.I)
uploads = re.findall(r"/wp-content/uploads/[^\s\"'<>]+", html, re.I)

out = []
out.append(f"pdfs={len(pdfs)} drives={len(drives)} moe={len(moe)} uploads={len(uploads)}")
out.append("PDFS")
out.extend(pdfs)
out.append("DRIVES")
out.extend(drives)
out.append("MOE")
out.extend(moe)
out.append("UPLOADS")
out.extend(uploads[:40])

# around download word
for key in ("تحميل", "download", "pdfjs", "iframe", "viewer"):
    idx = html.lower().find(key.lower()) if key.isascii() else html.find(key)
    out.append(f"\nKEY {key} idx={idx}")
    if idx >= 0:
        out.append(html[max(0, idx - 400) : idx + 600])

Path("books/_raw/probe_links.txt").write_text("\n".join(out), encoding="utf-8")
print("wrote probe files", len(pdfs), len(drives), len(moe))
