/** Textbook RAG types — user IndexedDB + optional shared MoE corpus. */

import type { CorpusSourceType } from "./shared-corpus-types";

export type BookStatus = "extracting" | "ready" | "failed";

export type TextbookChunk = {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  subjectId: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
  text: string;
  /** Sparse/local embedding vector (term-hash or remote dims). */
  embedding: number[];
};

export type PageText = {
  page: number;
  text: string;
};

export type RetrievedChunk = TextbookChunk & {
  score: number;
  sourceType?: CorpusSourceType;
};

export type Citation = {
  bookId: string;
  title: string;
  subjectId: string;
  pageStart: number;
  pageEnd: number;
  /** upload = personal IndexedDB; moe = shared MoE library */
  sourceType?: CorpusSourceType;
};

export type GroundedTutorResult = {
  answer: string;
  grounded: boolean;
  citations: Citation[];
  relatedTopic?: { subjectId: string; topic: string; slug: string };
  bookCount: number;
  chunkCountUsed: number;
};

export const RAG_SIMILARITY_THRESHOLD = 0.22;
export const RAG_TOP_K = 5;
/** Require at least one overlapping content token for grounded answers (blocks nonsense→fake cites). */
export const RAG_MIN_LEXICAL = 0.08;
export const CHUNK_TARGET_CHARS = 2800; // ~700 tokens
export const CHUNK_OVERLAP_CHARS = 280;
