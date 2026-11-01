import { cosineSimilarity, embedText } from "./embed";
import {
  isMoeChunk,
  loadCorpusManifest,
  loadSharedChunksForSubjects,
} from "./shared-corpus";
import { getChunksForUser } from "./textbook-db";
import { guessSubjectId } from "./subject-guess";
import {
  RAG_SIMILARITY_THRESHOLD,
  RAG_MIN_LEXICAL,
  RAG_TOP_K,
  type RetrievedChunk,
  type TextbookChunk,
} from "./types";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

/** Hybrid score: embedding cosine + lexical overlap (helps MoE textbook Q&A). */
function hybridScore(query: string, queryVec: number[], chunkText: string, chunkVec: number[]) {
  const cos = cosineSimilarity(queryVec, chunkVec);
  const qTokens = tokenize(query);
  const cTokens = tokenize(chunkText);
  if (qTokens.size === 0) return cos;
  let overlap = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) overlap += 1;
  }
  const lexical = overlap / qTokens.size;
  return cos * 0.55 + lexical * 0.45;
}


function lexicalOverlap(query: string, chunkText: string): number {
  const qTokens = tokenize(query);
  const cTokens = tokenize(chunkText);
  if (qTokens.size === 0) return 0;
  let overlap = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) overlap += 1;
  }
  return overlap / qTokens.size;
}

/** Drop OCR/binary garbage that would produce fake-looking citations. */
function isUsableChunkText(text: string): boolean {
  if (!text || text.trim().length < 40) return false;
  const sample = text.slice(0, 800);
  let bad = 0;
  for (const ch of sample) {
    const c = ch.charCodeAt(0);
    if (c < 9 || (c > 13 && c < 32) || c === 0xfffd) bad += 1;
  }
  if (bad / sample.length > 0.08) return false;
  const letters = (sample.match(/\p{L}/gu) || []).length;
  return letters / sample.length >= 0.35;
}

function withSourceType(chunk: TextbookChunk): RetrievedChunk {
  return {
    ...chunk,
    score: 0,
    sourceType: isMoeChunk(chunk) ? "moe" : "upload",
  };
}

const CATALOG_SUBJECTS = [
  "math",
  "physics",
  "chemistry",
  "biology",
  "english",
  "arabic",
  "islamic",
  "social",
  "ict",
];

/** Infer which MoE subject shards to lazy-load (never the full mega-corpus). */
function subjectsToLoad(subjectId: string | undefined, query: string): string[] {
  if (subjectId) return [subjectId];
  const guessed = guessSubjectId(query);
  if (guessed !== "general") return [guessed];
  // Light keyword pass for English topic words
  const q = query.toLowerCase();
  const hits: string[] = [];
  if (/chem|mole|atom|bond|acid|كيمياء|مول/.test(q)) hits.push("chemistry");
  if (/phys|force|newton|velocity|فيزياء|قوة/.test(q)) hits.push("physics");
  if (/biol|cell|photo|أحياء|خلية/.test(q)) hits.push("biology");
  if (/math|algebra|equation|رياضيات|معادلة/.test(q)) hits.push("math");
  if (hits.length) return [...new Set(hits)];
  // Last resort: math + chemistry (common GED asks) — still not full corpus
  return ["math", "chemistry"];
}

/**
 * Retrieve from personal uploads and (optionally) the shared MoE corpus.
 * User uploads and MoE chunks are scored together; top-k + threshold unchanged.
 */
export async function retrieveRelevantChunks(
  userId: string,
  query: string,
  opts?: {
    subjectId?: string;
    topK?: number;
    threshold?: number;
    minLexical?: number;
    useMoeLibrary?: boolean;
  }
): Promise<{ hits: RetrievedChunk[]; bookCount: number }> {
  const subjectId = opts?.subjectId;
  const useMoe = opts?.useMoeLibrary !== false;

  let userChunks = await getChunksForUser(userId, { subjectId });
  if (userChunks.length === 0 && subjectId) {
    userChunks = await getChunksForUser(userId);
  }

  let moeChunks: TextbookChunk[] = [];
  if (useMoe) {
    const manifest = await loadCorpusManifest();
    if (manifest) {
      const wanted = subjectsToLoad(subjectId, query).filter(
        (id) => !!manifest.subjects[id] || CATALOG_SUBJECTS.includes(id)
      );
      const available = wanted.filter((id) => manifest.subjects[id]);
      if (available.length > 0) {
        moeChunks = await loadSharedChunksForSubjects(available);
      }
    }
  }

  const chunks = [...userChunks, ...moeChunks];
  const bookCount = new Set(chunks.map((c) => c.bookId)).size;
  if (chunks.length === 0) {
    return { hits: [], bookCount: 0 };
  }

  const queryVec = await embedText(query);
  const scored: RetrievedChunk[] = chunks.map((c) => {
    const base = withSourceType(c);
    return {
      ...base,
      score: hybridScore(query, queryVec, c.text, c.embedding),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topK = opts?.topK ?? RAG_TOP_K;
  const threshold = opts?.threshold ?? RAG_SIMILARITY_THRESHOLD;
  const minLexical = opts?.minLexical ?? RAG_MIN_LEXICAL;
  const hits = scored
    .slice(0, topK)
    .filter((h) => h.score >= threshold)
    .filter((h) => isUsableChunkText(h.text))
    .filter((h) => lexicalOverlap(query, h.text) >= minLexical);

  return { hits, bookCount };
}
