/** Shared MoE textbook corpus — pre-indexed static artifacts under public/corpus/. */

export type CorpusSourceType = "upload" | "moe";

export type SharedCorpusBookMeta = {
  id: string;
  title: string;
  subjectId: string;
  grade: number | null;
  sourcePath: string;
  pageCount: number;
  chunkCount: number;
  needsOCR: boolean;
  /** Content fingerprint for resume / skip. */
  contentKey: string;
};

export type SharedCorpusChunk = {
  id: string;
  bookId: string;
  title: string;
  subjectId: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
  text: string;
  embedding: number[];
};

export type SharedCorpusManifest = {
  version: 1;
  generatedAt: string;
  subjects: Record<
    string,
    {
      bookCount: number;
      chunkCount: number;
      file: string;
    }
  >;
  books: SharedCorpusBookMeta[];
  skipped: {
    path: string;
    reason: string;
    needsOCR?: boolean;
  }[];
};

export type SharedSubjectCorpus = {
  subjectId: string;
  books: SharedCorpusBookMeta[];
  chunks: SharedCorpusChunk[];
};

export const MOE_CORPUS_USER_ID = "moe-shared";
export const CORPUS_MANIFEST_URL = "/corpus/manifest.json";

export function sharedChunkId(bookId: string, chunkIndex: number) {
  return `${MOE_CORPUS_USER_ID}::${bookId}::${chunkIndex}`;
}

export function moeBookIdFromContentKey(contentKey: string) {
  return `moe-${contentKey.slice(0, 16)}`;
}
