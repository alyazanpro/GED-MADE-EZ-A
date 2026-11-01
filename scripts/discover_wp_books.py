"""Discover Oman School book posts via WP REST API and category pages."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json
import re

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
OUT = Path("books/_raw")
OUT.mkdir(parents=True, exist_ok=True)


def get(url: str) -> bytes:
    req = Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "application/json,text/html,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        },
    )
    with urlopen(req, timeout=90) as r:
        return r.read()


urls = []
# Category IDs from probe: class-11-oman-books (122), and search for 12
api_bases = [
    "https://oman-school.com/wp-json/wp/v2/posts?categories=122&per_page=100&page={}",
    "https://oman-school.com/wp-json/wp/v2/posts?search=الثاني%20عشر&per_page=100&page={}",
    "https://oman-school.com/wp-json/wp/v2/posts?search=الحادي%20عشر&per_page=100&page={}",
    "https://oman-school.com/wp-json/wp/v2/posts?search=دبلوم&per_page=100&page={}",
    "https://oman-school.com/wp-json/wp/v2/posts?search=PDF&per_page=100&page={}",
]

# Also list categories
try:
    cats = json.loads(get("https://oman-school.com/wp-json/wp/v2/categories?per_page=100").decode("utf-8"))
    (OUT / "categories.json").write_text(json.dumps(cats, ensure_ascii=False, indent=2), encoding="utf-8")
    print("categories", len(cats))
    for c in cats:
        name = c.get("name", "")
        slug = c.get("slug", "")
        if any(k in name + slug for k in ("11", "12", "حادي", "ثاني", "دبلوم", "مناهج", "كتب", "class-11", "class-12")):
            print(f"  cat {c['id']} {slug} {name} count={c.get('count')}")
            api_bases.append(
                f"https://oman-school.com/wp-json/wp/v2/posts?categories={c['id']}&per_page=100&page={{}}"
            )
except Exception as e:
    print("cats fail", e)

posts = {}
for base in api_bases:
    for page in range(1, 20):
        url = base.format(page)
        try:
            data = json.loads(get(url).decode("utf-8"))
        except HTTPError as e:
            print("http", e.code, url)
            break
        except Exception as e:
            print("fail", e, url)
            break
        if not isinstance(data, list) or not data:
            break
        for p in data:
            posts[p["id"]] = {
                "id": p["id"],
                "link": p.get("link"),
                "title": re.sub("<[^>]+>", "", p.get("title", {}).get("rendered", "")),
                "content": p.get("content", {}).get("rendered", ""),
            }
        print(f"fetched page {page} from {base[:60]}... -> {len(data)} posts, total unique {len(posts)}")
        if len(data) < 100:
            break

# Extract PDFs from content
pdfs = []
for p in posts.values():
    found = re.findall(r"https?://[^\s\"'<>]+\.pdf(?:\?[^\s\"'<>]*)?", p["content"], re.I)
    found += re.findall(r"/wp-content/uploads/[^\s\"'<>]+\.pdf", p["content"], re.I)
    for f in found:
        if f.startswith("/"):
            f = "https://oman-school.com" + f
        pdfs.append({"post": p["link"], "title": p["title"], "pdf": f})

# dedupe
seen = set()
unique = []
for item in pdfs:
    if item["pdf"] in seen:
        continue
    seen.add(item["pdf"])
    unique.append(item)

(OUT / "wp_posts.json").write_text(
    json.dumps(list(posts.values()), ensure_ascii=False, indent=2)[:5_000_000],
    encoding="utf-8",
)
(OUT / "wp_pdfs.json").write_text(json.dumps(unique, ensure_ascii=False, indent=2), encoding="utf-8")
print("posts", len(posts), "pdfs", len(unique))
for u in unique[:15]:
    print("-", u["title"][:60], "=>", u["pdf"][:100])
