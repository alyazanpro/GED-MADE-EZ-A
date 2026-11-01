"use client";

import type { TextbookChunk } from "./types";
import {
  CORPUS_MANIFEST_URL,
  MOE_CORPUS_USER_ID,
  type SharedCorpusChunk,
  type SharedCorpusManifest,
  type SharedSubjectCorpus,
} from "./shared-corpus-types";

const subjectCache = new Map<string, SharedSubjectCorpus | null>();
let manifestPromise: Promise<SharedCorpusManifest | null> | null = null;

export async function loadCorpusManifest(): Promise<SharedCorpusManifest | null> {
  if (typeof window === "undefined") return null;
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const res = await fetch(CORPUS_MANIFEST_URL, { cache: "force-cache" });
        if (!res.ok) return null;
        return (await res.json()) as SharedCorpusManifest;
      } catch {
        return null;
      }
    })();
  }
  return manifestPromise;
}

/**
 * Lazy-load pre-indexed MoE chunks for one subject (and optional extras).
 * Does not load the full mega-corpus.
 */
export async function loadSharedChunksForSubjects(
  subjectIds: string[]
): Promise<TextbookChunk[]> {
  const unique = [...new Set(subjectIds.filter(Boolean))];
  if (unique.length === 0) return [];

  const manifest = await loadCorpusManifest();
  if (!manifest) return [];

  const out: TextbookChunk[] = [];
  for (const subjectId of unique) {
    const entry = manifest.subjects[subjectId];
    if (!entry?.file) continue;

    let corpus = subjectCache.get(subjectId);
    if (corpus === undefined) {
      try {
        const res = await fetch(`/corpus/${entry.file}`, { cache: "force-cache" });
        if (!res.ok) {
          subjectCache.set(subjectId, null);
          continue;
        }
        corpus = (await res.json()) as SharedSubjectCorpus;
        subjectCache.set(subjectId, corpus);
      } catch {
        subjectCache.set(subjectId, null);
        continue;
      }
    }
    if (!corpus?.chunks?.length) continue;

    for (const c of corpus.chunks) {
      out.push(sharedToTextbookChunk(c));
    }
  }
  return out;
}

function sharedToTextbookChunk(c: SharedCorpusChunk): TextbookChunk {
  return {
    id: c.id,
    userId: MOE_CORPUS_USER_ID,
    bookId: c.bookId,
    title: c.title,
    subjectId: c.subjectId,
    pageStart: c.pageStart,
    pageEnd: c.pageEnd,
    chunkIndex: c.chunkIndex,
    text: c.text,
    embedding: c.embedding,
  };
}

export function isMoeChunk(chunk: { userId?: string; bookId?: string }): boolean {
  return (
    chunk.userId === MOE_CORPUS_USER_ID ||
    (!!chunk.bookId && chunk.bookId.startsWith("moe-"))
  );
}

export function clearSharedCorpusCache() {
  subjectCache.clear();
  manifestPromise = null;
}
