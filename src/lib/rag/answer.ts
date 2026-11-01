import { SUBJECT_CATALOG } from "@/data/curriculum";
import {
  tutorFallbackMessage,
  tutorLanguageInstruction,
} from "@/data/lessons/bilingual";
import type { LearningLanguage } from "@/data/lessons/types";
import { topicToSlug } from "@/data/lessons/utils";
import type {
  Citation,
  GroundedTutorResult,
  RetrievedChunk,
} from "./types";

const FALLBACK_EN =
  "I couldn’t find this in your textbooks or the shared MoE library. Try another subject focus, upload a PDF, or ask a general question.";

const FALLBACK_AR =
  "لم أجد هذا في كتبك أو مكتبة وزارة التربية المشتركة. جرّب مادة أخرى، ارفع PDF، أو اطرح سؤالاً عاماً.";

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function mergeCitations(hits: RetrievedChunk[]): Citation[] {
  const map = new Map<string, Citation>();
  for (const h of hits) {
    const key = `${h.bookId}:${h.pageStart}:${h.pageEnd}`;
    if (!map.has(key)) {
      map.set(key, {
        bookId: h.bookId,
        title: h.title,
        subjectId: h.subjectId,
        pageStart: h.pageStart,
        pageEnd: h.pageEnd,
        sourceType: h.sourceType ?? (h.userId === "moe-shared" ? "moe" : "upload"),
      });
    }
  }
  // Merge overlapping page ranges for same book
  const byBook = new Map<string, Citation>();
  for (const c of map.values()) {
    const existing = byBook.get(c.bookId);
    if (!existing) {
      byBook.set(c.bookId, { ...c });
    } else {
      existing.pageStart = Math.min(existing.pageStart, c.pageStart);
      existing.pageEnd = Math.max(existing.pageEnd, c.pageEnd);
      if (!existing.sourceType) existing.sourceType = c.sourceType;
    }
  }
  return [...byBook.values()];
}

function findRelatedTopic(question: string, subjectId?: string) {
  const q = question.toLowerCase();
  const subjects = subjectId
    ? SUBJECT_CATALOG.filter((s) => s.id === subjectId)
    : SUBJECT_CATALOG;

  for (const s of subjects) {
    for (const topic of s.topics) {
      const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      if (words.some((w) => q.includes(w)) || q.includes(topic.toLowerCase().slice(0, 12))) {
        return { subjectId: s.id, topic, slug: topicToSlug(topic) };
      }
    }
  }

  // Do not invent a "related" topic when nothing matched the question.
  return undefined;
}

function citationLabel(c: Citation): string {
  const pages =
    c.pageStart === c.pageEnd
      ? `p. ${c.pageStart}`
      : `p. ${c.pageStart}–${c.pageEnd}`;
  if (c.sourceType === "moe") {
    return `MoE library: ${c.title}, ${pages}`;
  }
  return `Your upload: ${c.title}, ${pages}`;
}

function formatCitationBlock(citations: Citation[]): string {
  if (!citations.length) return "";
  return citations.map(citationLabel).join("\n");
}

function looksLikeMathOrScience(question: string, subjectId?: string): boolean {
  if (subjectId && ["math", "physics", "chemistry", "biology"].includes(subjectId)) {
    return true;
  }
  return /equation|solve|calculate|prove|formula|معادلة|احسب|قانون|force|mole|velocity/i.test(
    question
  );
}

/**
 * Build a grounded answer from retrieved chunks (no invented page numbers).
 * When /api/tutor/answer is available with an LLM key, prefer that.
 */
export async function buildGroundedAnswer(
  question: string,
  hits: RetrievedChunk[],
  opts: {
    subjectId?: string;
    bookCount: number;
    learningLanguage?: LearningLanguage;
  }
): Promise<GroundedTutorResult> {
  const language = opts.learningLanguage ?? "mixed";
  const arabic =
    language === "ar" ||
    (language === "mixed" && hasArabic(question)) ||
    (language === "en" ? false : hasArabic(question));

  if (hits.length === 0) {
    return {
      answer: tutorFallbackMessage(language),
      grounded: false,
      citations: [],
      bookCount: opts.bookCount,
      chunkCountUsed: 0,
    };
  }

  const citations = mergeCitations(hits);
  const relatedTopic = findRelatedTopic(question, opts.subjectId || hits[0]?.subjectId);

  // Try LLM with strict context
  try {
    const res = await fetch("/api/tutor/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        subjectId: opts.subjectId,
        learningLanguage: language,
        languageInstruction: tutorLanguageInstruction(language, opts.subjectId),
        chunks: hits.map((h) => ({
          title: h.title,
          subjectId: h.subjectId,
          pageStart: h.pageStart,
          pageEnd: h.pageEnd,
          text: h.text,
        })),
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { answer?: string | null; usedLlm?: boolean };
      if (data.answer?.trim()) {
        let answer = data.answer.trim();
        // Ensure citation block exists (never invent pages — use our merged ones)
        if (!/^(Your upload:|MoE library:|Source:)/im.test(answer)) {
          answer = `${answer}\n\n${formatCitationBlock(citations)}`;
        }
        if (relatedTopic && !/Related topic|موضوع ذو صلة/i.test(answer)) {
          answer +=
            language === "ar"
              ? `\n\nموضوع ذو صلة في المواد: ${relatedTopic.topic}`
              : `\n\nRelated topic in Subjects: ${relatedTopic.topic}`;
        }
        return {
          answer,
          grounded: true,
          citations,
          relatedTopic,
          bookCount: opts.bookCount,
          chunkCountUsed: hits.length,
        };
      }
    }
  } catch {
    // extractive fallback below
  }

  const answer = synthesizeExtractive(
    question,
    hits,
    citations,
    relatedTopic,
    arabic,
    language
  );
  return {
    answer,
    grounded: true,
    citations,
    relatedTopic,
    bookCount: opts.bookCount,
    chunkCountUsed: hits.length,
  };
}

function synthesizeExtractive(
  question: string,
  hits: RetrievedChunk[],
  citations: Citation[],
  relatedTopic: GroundedTutorResult["relatedTopic"],
  arabic: boolean,
  language: LearningLanguage = "mixed"
): string {
  const context = hits
    .map(
      (h) =>
        `[${h.title}, p. ${h.pageStart}${h.pageEnd !== h.pageStart ? `–${h.pageEnd}` : ""}]\n${h.text}`
    )
    .join("\n\n");

  const primary = hits[0].text;
  const sentences = primary
    .split(/(?<=[.!?۔؟])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, 4);

  const stepByStep = looksLikeMathOrScience(question, hits[0].subjectId);
  const parts: string[] = [];
  const useAr = language === "ar" || (language === "mixed" && arabic) || (language === "mixed" && !arabic && STEM_HINT(hits[0].subjectId));

  const fromMoe = hits[0].sourceType === "moe" || hits[0].userId === "moe-shared";
  if (useAr || (language === "mixed" && STEM_HINT(hits[0].subjectId))) {
    parts.push(
      language === "mixed" && STEM_HINT(hits[0].subjectId)
        ? fromMoe
          ? "بناءً على مكتبة وزارة التربية المشتركة (مع الإبقاء على المصطلحات الإنجليزية):"
          : "بناءً على كتابك المدرسي (مع الإبقاء على المصطلحات الإنجليزية):"
        : fromMoe
          ? "بناءً على مكتبة وزارة التربية المشتركة:"
          : "بناءً على كتابك المدرسي المرفوع:"
    );
  } else {
    parts.push(
      fromMoe
        ? "Based on the shared Oman MoE library:"
        : "Based on your uploaded MoE textbook:"
    );
  }

  if (stepByStep) {
    parts.push("");
    if (useAr || (language === "mixed" && STEM_HINT(hits[0].subjectId))) {
      parts.push("الخطوات / Steps:");
      sentences.forEach((s, i) => parts.push(`${i + 1}) ${s}`));
      if (sentences.length === 0) {
        parts.push(primary.slice(0, 600));
      }
    } else {
      parts.push("Step-by-step from the text:");
      sentences.forEach((s, i) => parts.push(`${i + 1}) ${s}`));
      if (sentences.length === 0) {
        parts.push(primary.slice(0, 600));
      }
    }
  } else {
    parts.push("");
    parts.push(sentences.join(" ") || primary.slice(0, 700));
  }

  // Light reinforcement from second chunk if different
  if (hits[1] && hits[1].text !== primary) {
    const extra = hits[1].text.slice(0, 280).trim();
    if (extra) {
      parts.push("");
      parts.push(
        useAr
          ? `إضافة من النص: ${extra}`
          : `Also from the text: ${extra}`
      );
    }
  }

  parts.push("");
  parts.push(formatCitationBlock(citations));

  if (relatedTopic) {
    parts.push("");
    parts.push(
      language === "ar"
        ? `موضوع ذو صلة في المواد: ${relatedTopic.topic}`
        : `Related topic in Subjects: ${relatedTopic.topic}`
    );
  }

  // Keep context unused except for grounding — we already used hits texts
  void context;

  return parts.join("\n");
}

function STEM_HINT(subjectId?: string) {
  return !!subjectId && ["math", "physics", "chemistry", "biology"].includes(subjectId);
}

export { FALLBACK_EN, FALLBACK_AR, formatCitationBlock };
