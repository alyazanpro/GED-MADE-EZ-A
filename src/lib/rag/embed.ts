/**
 * Local embedding via hashed bag-of-words (no API key required).
 * Optional OpenAI/Gemini embeddings via /api/tutor/embed when env keys exist.
 */

const EMBED_DIM = 256;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % EMBED_DIM;
}

/** Deterministic local embedding — good enough for textbook lexical retrieval. */
export function embedLocal(text: string): number[] {
  const vec = new Array<number>(EMBED_DIM).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vec;

  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

  for (const [token, count] of tf) {
    const idx = hashToken(token);
    // log-TF weighted
    vec[idx] += 1 + Math.log(count);
  }

  // L2 normalize
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Prefer remote embeddings when the API reports them available; else local.
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const res = await fetch("/api/tutor/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 8000) }),
    });
    if (res.ok) {
      const data = (await res.json()) as { embedding?: number[] | null; provider?: string };
      if (data.embedding?.length) return data.embedding;
    }
  } catch {
    // fall through to local
  }
  return embedLocal(text);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  // Batch remotely when possible
  try {
    const res = await fetch("/api/tutor/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: texts.map((t) => t.slice(0, 8000)) }),
    });
    if (res.ok) {
      const data = (await res.json()) as { embeddings?: number[][] | null };
      if (data.embeddings?.length === texts.length) return data.embeddings;
    }
  } catch {
    // local fallback
  }
  return texts.map(embedLocal);
}
