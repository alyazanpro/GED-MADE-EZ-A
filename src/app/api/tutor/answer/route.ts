import { NextRequest, NextResponse } from "next/server";
import { requireUser, withAuthErrorHandler } from "@/lib/auth-request";
import { getClientIP, strictRateLimiter } from "@/lib/rate-limiter";

/**
 * Optional grounded LLM answer.
 * Env (see .env.example):
 *   OPENAI_API_KEY — gpt-4o-mini
 *   GEMINI_API_KEY — gemini-2.0-flash
 * Without keys, client uses extractive synthesis from retrieved chunks.
 */

export const runtime = "nodejs";

type ChunkIn = {
  title: string;
  subjectId: string;
  pageStart: number;
  pageEnd: number;
  text: string;
};

type Body = {
  question?: string;
  subjectId?: string;
  learningLanguage?: "en" | "ar" | "mixed";
  languageInstruction?: string;
  chunks?: ChunkIn[];
};

function buildPrompt(
  question: string,
  chunks: ChunkIn[],
  subjectId?: string,
  languageInstruction?: string
) {
  const context = chunks
    .map((c, i) => {
      const pages =
        c.pageStart === c.pageEnd
          ? `p. ${c.pageStart}`
          : `p. ${c.pageStart}–${c.pageEnd}`;
      return `Chunk ${i + 1} — ${c.title} (${pages}):\n${c.text}`;
    })
    .join("\n\n");

  const langLine =
    languageInstruction ||
    "Answer in the same language as the student's question (Arabic or English).";

  return `You are a GED study tutor for Oman's Ministry of Education syllabus.
Answer ONLY using the textbook excerpts below. Do not invent facts or page numbers.
If the excerpts do not contain enough information, say you could not find it in the uploaded textbooks.
Language preference (independent of retrieval): ${langLine}
${subjectId ? `Focus subject id: ${subjectId}.` : ""}

Format:
1) Direct answer in clear student language.
2) Step-by-step when the question is math/science.
3) End with citation lines exactly like: Source: <book title>, p. <n>–<m>
   Use ONLY page numbers from the excerpts provided.

Textbook excerpts:
${context}

Student question: ${question}`;
}

async function answerOpenAI(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You answer only from provided textbook excerpts with accurate citations.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || null;
}

async function answerGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
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

    const question = body.question?.trim();
    const chunks = body.chunks || [];
    if (!question || question.length > 4000 || !chunks.length) {
      return NextResponse.json(
        { error: "question and chunks required; question must be 4000 characters or less" },
        { status: 400 }
      );
    }

    const safeChunks = chunks
      .filter((chunk) => chunk && typeof chunk.text === "string")
      .slice(0, 6)
      .map((chunk) => ({ ...chunk, text: chunk.text.slice(0, 12000) }));
    if (!safeChunks.length) {
      return NextResponse.json({ error: "At least one valid chunk is required" }, { status: 400 });
    }

    const prompt = buildPrompt(
      question,
      safeChunks,
      body.subjectId,
      body.languageInstruction?.slice(0, 500)
    );

    try {
      const openai = await answerOpenAI(prompt);
      if (openai) {
        return NextResponse.json({ answer: openai, usedLlm: true, provider: "openai" });
      }
      const gemini = await answerGemini(prompt);
      if (gemini) {
        return NextResponse.json({ answer: gemini, usedLlm: true, provider: "gemini" });
      }
    } catch {
      // client extractive fallback
    }

    return NextResponse.json({ usedLlm: false, provider: "none", answer: null });
  });
}
