import type { GradeLevel, StageId } from "@/data/curriculum";

export type ExamDifficulty = "easy" | "medium" | "hard";
export type ExamQuestionType = "mcq" | "short" | "structured";

export type ExamQuestion = {
  id: string;
  subjectId: string;
  topic: string;
  grade: GradeLevel;
  stage: StageId;
  difficulty: ExamDifficulty;
  type: ExamQuestionType;
  /** Formal MoE-style stem; may include (marks) cues */
  prompt: string;
  /** MCQ options A–D (or more) */
  choices?: string[];
  /**
   * MCQ: zero-based choice index as string ("0").
   * Short: accepted answer (or pipe-separated alternatives).
   * Structured: model answer summary for review / self-mark.
   */
  correctAnswer: string;
  /** Marking guidance for short / structured */
  rubricNotes?: string;
  explanation: string;
  marks: number;
  tags: string[];
  /** Optional Arabic stem (Arabic-primary / bilingual session) */
  promptAr?: string;
  /** Optional Arabic MCQ choices (same order / length as choices) */
  choicesAr?: string[];
  /** Optional Arabic explanation / mark-scheme note */
  explanationAr?: string;
};

export type ExamMode = "topic" | "mixed" | "mock";

export type ExamSessionConfig = {
  mode: ExamMode;
  subjectId: string;
  grade: GradeLevel;
  topic?: string;
  count: number;
  timed: boolean;
  /** Seconds; used when timed */
  timeLimitSec?: number;
};

/** Resolved display fields for a question under a learning-language preference */
export type ResolvedExamView = {
  prompt: string;
  choices?: string[];
  explanation: string;
  /** Helper line under EN prompt in mixed mode when Arabic exists */
  arabicHelper: string | null;
  dir: "ltr" | "rtl";
  usedFallback: boolean;
};
