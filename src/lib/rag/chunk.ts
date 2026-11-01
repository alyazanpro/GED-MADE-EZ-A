import type { PageText } from "./types";
import { CHUNK_OVERLAP_CHARS, CHUNK_TARGET_CHARS } from "./types";

export type ChunkDraft = {
  text: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
};

/**
 * Build ~500–800 token chunks with page metadata.
 * Walks page text sequentially so pageStart/pageEnd stay accurate.
 */
export function chunkPages(pages: PageText[]): ChunkDraft[] {
  const units: { page: number; text: string }[] = [];
  for (const p of pages) {
    if (!p.text.trim()) continue;
    // Split long pages into sentences/paragraphs for cleaner boundaries.
    const parts = p.text.split(/(?<=[.!?۔؟])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) {
      units.push({ page: p.page, text: p.text.trim() });
    } else {
      for (const part of parts) {
        units.push({ page: p.page, text: part });
      }
    }
  }

  if (units.length === 0) return [];

  const chunks: ChunkDraft[] = [];
  let buf: { page: number; text: string }[] = [];
  let bufLen = 0;

  const flush = () => {
    if (!buf.length) return;
    const text = buf.map((u) => u.text).join(" ").replace(/\s+/g, " ").trim();
    if (!text) {
      buf = [];
      bufLen = 0;
      return;
    }
    chunks.push({
      text,
      pageStart: buf[0].page,
      pageEnd: buf[buf.length - 1].page,
      chunkIndex: chunks.length,
    });

    // Overlap: keep trailing units until ~OVERLAP chars
    const overlap: { page: number; text: string }[] = [];
    let ol = 0;
    for (let i = buf.length - 1; i >= 0; i--) {
      overlap.unshift(buf[i]);
      ol += buf[i].text.length + 1;
      if (ol >= CHUNK_OVERLAP_CHARS) break;
    }
    buf = overlap;
    bufLen = ol;
  };

  for (const unit of units) {
    if (bufLen + unit.text.length > CHUNK_TARGET_CHARS && buf.length > 0) {
      flush();
    }
    buf.push(unit);
    bufLen += unit.text.length + 1;
  }
  flush();

  return chunks;
}
