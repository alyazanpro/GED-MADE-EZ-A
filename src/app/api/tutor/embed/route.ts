import { NextRequest, NextResponse } from "next/server";
import { requireUser, withAuthErrorHandler } from "@/lib/auth-request";
import { getClientIP, strictRateLimiter } from "@/lib/rate-limiter";

/**
 * Optional remote embeddings.
 * Env (see .env.example):
 *   OPENAI_API_KEY — uses text-embedding-3-small
 *   GEMINI_API_KEY — uses text-embedding-004
 * Without keys, client falls back to local hashed embeddings.
 */

export const runtime = "nodejs";

type Body = { text?: string; texts?: string[] };

async function embedOpenAI(texts: string[]): Promise<number[][] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function embedGemini(texts: string[]): Promise<number[][] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const out: number[][] = [];
  for (const text of texts) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] },
        }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { embedding?: { values?: number[] } };
    if (!data.embedding?.values) return null;
    out.push(data.embedding.values);
  }
  return out;
}

export async function POST(req: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireUser(req);
    await strictRateLimiter.checkByUser(auth.user.id || auth.user.email);
    await strictRateLimiter.checkByIP(getClientIP(req));

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

  const texts =
    body.texts?.filter((t) => typeof t === "string" && t.trim()) ||
    (body.text?.trim() ? [body.text.trim()] : []);

    if (!texts.length) {
      return NextResponse.json({ error: "text or texts required" }, { status: 400 });
    }

  // Cap batch size for safety
    const limited = texts.slice(0, 32).map((t) => t.slice(0, 8000));

    try {
      const openai = await embedOpenAI(limited);
      if (openai) {
        return NextResponse.json(
          limited.length === 1
            ? { embedding: openai[0], provider: "openai" }
            : { embeddings: openai, provider: "openai" }
        );
      }
      const gemini = await embedGemini(limited);
      if (gemini) {
        return NextResponse.json(
          limited.length === 1
            ? { embedding: gemini[0], provider: "gemini" }
            : { embeddings: gemini, provider: "gemini" }
        );
      }
    } catch {
      // client will use local embeddings
    }

    return NextResponse.json({ provider: "none", embedding: null, embeddings: null });
  });
}
