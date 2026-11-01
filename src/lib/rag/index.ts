"use client";

import { buildGroundedAnswer } from "./answer";
import { retrieveRelevantChunks } from "./retrieve";
import type { GroundedTutorResult } from "./types";

/**
 * End-to-end grounded tutor: retrieve from user IndexedDB + optional MoE corpus.
 */
export async function askGroundedTutor(
  userId: string,
  question: string,
  opts?: {
    subjectId?: string;
    learningLanguage?: import("@/data/lessons/types").LearningLanguage;
    useMoeLibrary?: boolean;
  }
): Promise<GroundedTutorResult> {
  const { hits, bookCount } = await retrieveRelevantChunks(userId, question, {
    subjectId: opts?.subjectId,
    useMoeLibrary: opts?.useMoeLibrary,
  });

  return buildGroundedAnswer(question, hits, {
    subjectId: opts?.subjectId,
    bookCount,
    learningLanguage: opts?.learningLanguage,
  });
}
