/**
 * Index Oman MoE PDFs under books/ into public/corpus/ for shared RAG.
 *
 * Usage:
 *   npx tsx scripts/index_moe_books.ts
 *   npx tsx scripts/index_moe_books.ts --subject=chemistry
 *   npx tsx scripts/index_moe_books.ts --limit=3 --force
 *
 * Resumable: skips books already recorded in books/_raw/corpus_index_state.json
 * when contentKey matches. Output is split by subject for lazy client load.
 */

import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chunkPages } from "../src/lib/rag/chunk";
import { embedLocal } from "../src/lib/rag/embed";
import {
  moeBookIdFromContentKey,
  sharedChunkId,
  type SharedCorpusBookMeta,
  type SharedCorpusChunk,
  type SharedCorpusManifest,
  type SharedSubjectCorpus,
} from "../src/lib/rag/shared-corpus-types";
import {
  guessGrade,
  guessSubjectId,
  titleFromFilename,
} from "../src/lib/rag/subject-guess";
import type { PageText } from "../src/lib/rag/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const BOOKS_DIR = path.join(ROOT, "books");
const OUT_DIR = path.join(ROOT, "public", "corpus");
const SUBJECTS_DIR = path.join(OUT_DIR, "subjects");
const RAW_DIR = path.join(BOOKS_DIR, "_raw");
const STATE_PATH = path.join(RAW_DIR, "corpus_index_state.json");
const REPORT_PATH = path.join(RAW_DIR, "corpus_index_report.md");

/** Average extractable chars/page below this → scanned / needs OCR. */
const MIN_CHARS_PER_PAGE = 40;
/** Absolute minimum total text to keep a book. */
const MIN_TOTAL_CHARS = 400;

const SCAN_ROOTS = [
  "grade-11",
  "grade-12",
  "teacher-guides",
  "curriculum-docs",
  "summaries-solutions",
];

type IndexState = {
  version: 1;
  books: Record<
    string,
    {
      contentKey: string;
      bookId: string;
      subjectId: string;
      title: string;
      sourcePath: string;
      pageCount: number;
      chunkCount: number;
      indexedAt: string;
    }
  >;
  skipped: Record<string, { reason: string; needsOCR?: boolean; at: string }>;
};

type CliOpts = {
  subject?: string;
  limit?: number;
  force?: boolean;
};

function parseArgs(argv: string[]): CliOpts {
  const opts: CliOpts = {};
  for (const a of argv) {
    if (a.startsWith("--subject=")) opts.subject = a.slice("--subject=".length);
    else if (a.startsWith("--limit=")) opts.limit = Number(a.slice("--limit=".length));
    else if (a === "--force") opts.force = true;
  }
  return opts;
}

function loadState(): IndexState {
  if (!existsSync(STATE_PATH)) return { version: 1, books: {}, skipped: {} };
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8")) as IndexState;
  } catch {
    return { version: 1, books: {}, skipped: {} };
  }
}

function saveState(state: IndexState) {
  mkdirSync(RAW_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

function walkPdfs(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "_raw" || name === "by-subject" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkPdfs(full, acc);
    else if (name.toLowerCase().endsWith(".pdf")) acc.push(full);
  }
  return acc;
}

function collectUniquePdfs(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const root of SCAN_ROOTS) {
    const dir = path.join(BOOKS_DIR, root);
    for (const full of walkPdfs(dir)) {
      const st = statSync(full);
      const key = `${st.dev}:${st.ino}:${st.size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(full);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

async function hashFilePrefix(filePath: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    hash.update(`size:${size}|`);
    const stream = createReadStream(filePath, { start: 0, end: Math.min(size, 2 * 1024 * 1024) - 1 });
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function extractPagesNode(filePath: string): Promise<PageText[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(filePath));
  const doc = await pdfjs.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const pages: PageText[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const strings: string[] = [];
    for (const item of content.items) {
      if (item && typeof item === "object" && "str" in item) {
        const str = (item as { str: string }).str;
        if (str) strings.push(str);
      }
    }
    const text = strings.join(" ").replace(/\s+/g, " ").trim();
    pages.push({ page: pageNum, text });
  }
  return pages;
}

function roundEmbedding(vec: number[]): number[] {
  return vec.map((v) => Math.round(v * 1e5) / 1e5);
}

function relativeBooksPath(full: string): string {
  return path.relative(BOOKS_DIR, full).replace(/\\/g, "/");
}

async function indexOne(
  full: string,
  state: IndexState,
  opts: CliOpts
): Promise<"indexed" | "skipped" | "resumed"> {
  const rel = relativeBooksPath(full);
  const st = statSync(full);
  if (st.size < 1024) {
    state.skipped[rel] = { reason: "File too small / corrupt", at: new Date().toISOString() };
    return "skipped";
  }

  const contentKey = await hashFilePrefix(full, st.size);
  const existing = state.books[rel];
  if (!opts.force && existing && existing.contentKey === contentKey && existing.chunkCount > 0) {
    return "resumed";
  }

  const subjectId = guessSubjectId(rel);
  if (opts.subject && subjectId !== opts.subject && !rel.toLowerCase().includes(opts.subject)) {
    return "skipped";
  }

  let pages: PageText[];
  try {
    pages = await extractPagesNode(full);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.skipped[rel] = { reason: `PDF open/extract failed: ${msg}`, at: new Date().toISOString() };
    delete state.books[rel];
    return "skipped";
  }

  if (pages.length === 0) {
    state.skipped[rel] = { reason: "Zero pages", at: new Date().toISOString() };
    return "skipped";
  }

  const totalChars = pages.reduce((n, p) => n + p.text.length, 0);
  const nonEmpty = pages.filter((p) => p.text.length > 0).length;
  const avg = totalChars / pages.length;
  const needsOCR =
    totalChars < MIN_TOTAL_CHARS || avg < MIN_CHARS_PER_PAGE || nonEmpty / pages.length < 0.05;

  if (needsOCR) {
    state.skipped[rel] = {
      reason: `Near-zero extractable text (avg ${avg.toFixed(1)} chars/page, ${totalChars} total) — needs OCR`,
      needsOCR: true,
      at: new Date().toISOString(),
    };
    delete state.books[rel];
    return "skipped";
  }

  const drafts = chunkPages(pages);
  if (drafts.length === 0) {
    state.skipped[rel] = { reason: "No chunks after text split", at: new Date().toISOString() };
    return "skipped";
  }

  const bookId = moeBookIdFromContentKey(contentKey);
  const title = titleFromFilename(path.basename(full));
  const grade = guessGrade(rel);
  const chunks: SharedCorpusChunk[] = drafts.map((d) => ({
    id: sharedChunkId(bookId, d.chunkIndex),
    bookId,
    title,
    subjectId,
    pageStart: d.pageStart,
    pageEnd: d.pageEnd,
    chunkIndex: d.chunkIndex,
    text: d.text,
    embedding: roundEmbedding(embedLocal(d.text)),
  }));

  // Persist per-book sidecar for rebuild (subject files assembled at end)
  const sidecarDir = path.join(RAW_DIR, "corpus-sidecars", subjectId);
  mkdirSync(sidecarDir, { recursive: true });
  const meta: SharedCorpusBookMeta = {
    id: bookId,
    title,
    subjectId,
    grade,
    sourcePath: rel,
    pageCount: pages.length,
    chunkCount: chunks.length,
    needsOCR: false,
    contentKey,
  };
  writeFileSync(
    path.join(sidecarDir, `${bookId}.json`),
    JSON.stringify({ meta, chunks }, null, 0),
    "utf8"
  );

  state.books[rel] = {
    contentKey,
    bookId,
    subjectId,
    title,
    sourcePath: rel,
    pageCount: pages.length,
    chunkCount: chunks.length,
    indexedAt: new Date().toISOString(),
  };
  delete state.skipped[rel];
  console.log(`  ✓ ${rel} → ${subjectId} (${pages.length}p / ${chunks.length} chunks)`);
  return "indexed";
}

function assembleOutputs(state: IndexState): SharedCorpusManifest {
  mkdirSync(SUBJECTS_DIR, { recursive: true });

  const bySubject = new Map<string, { books: SharedCorpusBookMeta[]; chunks: SharedCorpusChunk[] }>();

  const sidecarRoot = path.join(RAW_DIR, "corpus-sidecars");
  if (existsSync(sidecarRoot)) {
    for (const subjectId of readdirSync(sidecarRoot)) {
      const dir = path.join(sidecarRoot, subjectId);
      if (!statSync(dir).isDirectory()) continue;
      for (const file of readdirSync(dir)) {
        if (!file.endsWith(".json")) continue;
        try {
          const parsed = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as {
            meta: SharedCorpusBookMeta;
            chunks: SharedCorpusChunk[];
          };
          // Prefer live state — drop sidecar if book was later skipped/OCR
          const stillIndexed = Object.values(state.books).some((b) => b.bookId === parsed.meta.id);
          if (!stillIndexed) continue;
          const bucket = bySubject.get(parsed.meta.subjectId) || { books: [], chunks: [] };
          bucket.books.push(parsed.meta);
          bucket.chunks.push(...parsed.chunks);
          bySubject.set(parsed.meta.subjectId, bucket);
        } catch {
          // ignore corrupt sidecar
        }
      }
    }
  }

  const subjects: SharedCorpusManifest["subjects"] = {};
  const allBooks: SharedCorpusBookMeta[] = [];

  for (const [subjectId, bucket] of [...bySubject.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    // Dedupe books by id
    const bookMap = new Map<string, SharedCorpusBookMeta>();
    for (const b of bucket.books) bookMap.set(b.id, b);
    const books = [...bookMap.values()].sort((a, b) => a.title.localeCompare(b.title));
    const chunkMap = new Map<string, SharedCorpusChunk>();
    for (const c of bucket.chunks) chunkMap.set(c.id, c);
    const chunks = [...chunkMap.values()];

    const payload: SharedSubjectCorpus = { subjectId, books, chunks };
    const file = `subjects/${subjectId}.json`;
    writeFileSync(path.join(OUT_DIR, file), JSON.stringify(payload), "utf8");
    subjects[subjectId] = {
      bookCount: books.length,
      chunkCount: chunks.length,
      file,
    };
    allBooks.push(...books);
  }

  const skipped = Object.entries(state.skipped).map(([p, info]) => ({
    path: p,
    reason: info.reason,
    needsOCR: info.needsOCR,
  }));

  const manifest: SharedCorpusManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    subjects,
    books: allBooks.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.title.localeCompare(b.title)),
    skipped,
  };

  writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

function writeReport(manifest: SharedCorpusManifest, state: IndexState) {
  const ocrSkipped = manifest.skipped.filter((s) => s.needsOCR);
  const otherSkipped = manifest.skipped.filter((s) => !s.needsOCR);
  const lines: string[] = [
    "# MoE corpus index report",
    "",
    `Generated: ${manifest.generatedAt}`,
    "",
    "## Summary",
    "",
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Indexed books | ${manifest.books.length} |`,
    `| Subjects with chunks | ${Object.keys(manifest.subjects).length} |`,
    `| Total chunks | ${Object.values(manifest.subjects).reduce((n, s) => n + s.chunkCount, 0)} |`,
    `| Skipped (needs OCR) | ${ocrSkipped.length} |`,
    `| Skipped (other) | ${otherSkipped.length} |`,
    "",
    "## By subject",
    "",
    `| Subject | Books | Chunks | Artifact |`,
    `| --- | ---: | ---: | --- |`,
  ];

  for (const [id, s] of Object.entries(manifest.subjects).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${id} | ${s.bookCount} | ${s.chunkCount} | \`public/corpus/${s.file}\` |`);
  }

  lines.push("", "## Indexed titles", "");
  for (const b of manifest.books) {
    lines.push(
      `- **${b.title}** (\`${b.subjectId}\`${b.grade ? `, G${b.grade}` : ""}) — ${b.pageCount} pages, ${b.chunkCount} chunks — \`${b.sourcePath}\``
    );
  }

  lines.push("", "## Skipped — needs OCR (scanned / near-zero text)", "");
  if (ocrSkipped.length === 0) {
    lines.push("_None_");
  } else {
    for (const s of ocrSkipped) {
      lines.push(`- \`${s.path}\` — ${s.reason}`);
    }
  }

  lines.push("", "## Skipped — other", "");
  if (otherSkipped.length === 0) {
    lines.push("_None_");
  } else {
    for (const s of otherSkipped) {
      lines.push(`- \`${s.path}\` — ${s.reason}`);
    }
  }

  lines.push(
    "",
    "## Resume state",
    "",
    `State file: \`books/_raw/corpus_index_state.json\` (${Object.keys(state.books).length} remembered paths).`,
    "Re-run `npm run index:moe-corpus` to continue; use `--force` to re-extract.",
    ""
  );

  mkdirSync(RAW_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
  // Also publish under public/ so the report survives when books/ is gitignored
  writeFileSync(path.join(OUT_DIR, "index_report.md"), lines.join("\n"), "utf8");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log("MoE corpus indexer");
  console.log(`  books: ${BOOKS_DIR}`);
  console.log(`  out:   ${OUT_DIR}`);
  if (opts.subject) console.log(`  filter subject: ${opts.subject}`);
  if (opts.limit) console.log(`  limit: ${opts.limit}`);
  if (opts.force) console.log(`  force: true`);

  mkdirSync(SUBJECTS_DIR, { recursive: true });
  mkdirSync(RAW_DIR, { recursive: true });

  const pdfs = collectUniquePdfs();
  console.log(`Found ${pdfs.length} unique PDFs (hardlink-deduped)`);

  const state = loadState();
  let indexed = 0;
  let resumed = 0;
  let skipped = 0;
  let processed = 0;

  for (const full of pdfs) {
    const rel = relativeBooksPath(full);
    const subjectId = guessSubjectId(rel);
    if (opts.subject && subjectId !== opts.subject) {
      // Also allow path substring match for env→biology etc.
      if (!rel.toLowerCase().includes(opts.subject) && !subjectId.includes(opts.subject)) {
        continue;
      }
    }
    if (opts.limit != null && processed >= opts.limit) break;
    processed += 1;
    process.stdout.write(`[${processed}] ${rel}\n`);
    try {
      const result = await indexOne(full, state, opts);
      if (result === "indexed") indexed += 1;
      else if (result === "resumed") {
        resumed += 1;
        console.log(`  · skip (already indexed)`);
      } else skipped += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      state.skipped[rel] = { reason: msg, at: new Date().toISOString() };
      skipped += 1;
      console.log(`  ✗ ${msg}`);
    }
    saveState(state);
  }

  const manifest = assembleOutputs(state);
  writeReport(manifest, state);
  saveState(state);

  console.log("");
  console.log(`Done. indexed=${indexed} resumed=${resumed} skipped=${skipped}`);
  console.log(`Manifest: public/corpus/manifest.json`);
  console.log(`Report:   books/_raw/corpus_index_report.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Ensure ESM resolution works when invoked via tsx
void pathToFileURL;
