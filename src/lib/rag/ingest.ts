"use client";

import { chunkPages } from "./chunk";
import { embedTexts } from "./embed";
import { extractPdfPages } from "./pdf-extract";
import { chunkId, deleteChunksForBook, putChunks } from "./textbook-db";
import type { TextbookChunk } from "./types";

export type IngestProgress = {
  phase: "extracting" | "embedding" | "storing";
  pageDone?: number;
  pageTotal?: number;
};

export type IngestResult = {
  pageCount: number;
  chunkCount: number;
};

/**
 * Full PDF → text → chunk → embed → IndexedDB pipeline for one book.
 */
export async function ingestPdfForUser(
  userId: string,
  book: { id: string; title: string; subjectId: string },
  file: File,
  onProgress?: (p: IngestProgress) => void
): Promise<IngestResult> {
  onProgress?.({ phase: "extracting", pageDone: 0, pageTotal: 0 });

  const pages = await extractPdfPages(file, (done, total) => {
    onProgress?.({ phase: "extracting", pageDone: done, pageTotal: total });
  });

  const drafts = chunkPages(pages);
  if (drafts.length === 0) {
    throw new Error("Could not create text chunks from this PDF.");
  }

  onProgress?.({ phase: "embedding" });
  // Replace any previous chunks for this book id (re-upload safety)
  await deleteChunksForBook(userId, book.id);

  const embeddings = await embedTexts(drafts.map((d) => d.text));

  onProgress?.({ phase: "storing" });
  const chunks: TextbookChunk[] = drafts.map((d, i) => ({
    id: chunkId(userId, book.id, d.chunkIndex),
    userId,
    bookId: book.id,
    title: book.title,
    subjectId: book.subjectId,
    pageStart: d.pageStart,
    pageEnd: d.pageEnd,
    chunkIndex: d.chunkIndex,
    text: d.text,
    embedding: embeddings[i] || [],
  }));

  await putChunks(chunks);

  return {
    pageCount: pages.length,
    chunkCount: chunks.length,
  };
}

export async function removeBookChunks(userId: string, bookId: string) {
  await deleteChunksForBook(userId, bookId);
}
