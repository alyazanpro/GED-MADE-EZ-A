import type { GradeLevel } from "@/data/curriculum";
import { GRADE_META } from "@/data/curriculum";
import type { LearningLanguage } from "@/data/lessons/types";
import type {
  ExamMode,
  ExamQuestion,
  ResolvedExamView,
} from "./types";
import { MATH_G9 } from "./math-g9-linear";
import { MATH_G9_REST } from "./math-g9-rest";
import { MATH_G10 } from "./math-g10";
import { MATH_G11 } from "./math-g11";
import { MATH_G12 } from "./math-g12";
import { PHYSICS_EXAM } from "./physics";
import { CHEMISTRY_EXAM } from "./chemistry";
import { BIOLOGY_EXAM } from "./biology";
import { ENGLISH_EXAM } from "./english";
import { ARABIC_EXAM } from "./arabic";
import { ISLAMIC_EXAM } from "./islamic";
import { SOCIAL_EXAM } from "./social";
import { ICT_EXAM } from "./ict";
import {
  hasArabicExamFields,
  mapTopicToCurriculum,
  resolveExamTopic,
} from "./map-topic";

export type {
  ExamQuestion,
  ExamMode,
  ExamDifficulty,
  ExamQuestionType,
  ExamSessionConfig,
  ResolvedExamView,
} from "./types";
export {
  mapTopicToCurriculum,
  resolveExamTopic,
  hasArabicExamFields,
} from "./map-topic";

/** Subjects where Arabic is the classroom primary language */
const ARABIC_PRIMARY = new Set(["arabic", "islamic", "social"]);

export const EXAM_BANK: ExamQuestion[] = [
  ...MATH_G9,
  ...MATH_G9_REST,
  ...MATH_G10,
  ...MATH_G11,
  ...MATH_G12,
  ...PHYSICS_EXAM,
  ...CHEMISTRY_EXAM,
  ...BIOLOGY_EXAM,
  ...ENGLISH_EXAM,
  ...ARABIC_EXAM,
  ...ISLAMIC_EXAM,
  ...SOCIAL_EXAM,
  ...ICT_EXAM,
];

const byId = new Map(EXAM_BANK.map((q) => [q.id, q]));

export function getExamQuestion(id: string): ExamQuestion | undefined {
  return byId.get(id);
}

export function listExamSubjects(): string[] {
  const order = [
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
  const present = new Set(EXAM_BANK.map((q) => q.subjectId));
  return order.filter((id) => present.has(id));
}

export function listExamGrades(subjectId?: string): GradeLevel[] {
  const grades = new Set<GradeLevel>();
  for (const q of EXAM_BANK) {
    if (!subjectId || q.subjectId === subjectId) grades.add(q.grade);
  }
  return ([9, 10, 11, 12] as GradeLevel[]).filter((g) => grades.has(g));
}

export function listExamTopics(subjectId: string, grade: GradeLevel): string[] {
  const topics: string[] = [];
  const seen = new Set<string>();
  for (const q of EXAM_BANK) {
    if (q.subjectId === subjectId && q.grade === grade && !seen.has(q.topic)) {
      seen.add(q.topic);
      topics.push(q.topic);
    }
  }
  return topics;
}

export function countExamQuestions(opts: {
  subjectId?: string;
  grade?: GradeLevel;
  topic?: string;
  /** Prefer questions that have Arabic fields */
  requireArabic?: boolean;
}): number {
  return filterExamQuestions(opts).length;
}

export type ExamCoverage = {
  subjectId: string;
  grade: GradeLevel;
  questionCount: number;
  topicCount: number;
  topicsCovered: string[];
  arabicCount: number;
};

export function getExamCoverage(
  subjectId: string,
  grade: GradeLevel
): ExamCoverage {
  const qs = filterExamQuestions({ subjectId, grade });
  const topics = listExamTopics(subjectId, grade);
  return {
    subjectId,
    grade,
    questionCount: qs.length,
    topicCount: topics.length,
    topicsCovered: topics,
    arabicCount: qs.filter(hasArabicExamFields).length,
  };
}

export function filterExamQuestions(opts: {
  subjectId?: string;
  grade?: GradeLevel;
  topic?: string;
  requireArabic?: boolean;
}): ExamQuestion[] {
  const resolvedTopic =
    opts.topic && opts.subjectId
      ? resolveExamTopic(opts.subjectId, opts.topic, opts.grade)
      : opts.topic;

  return EXAM_BANK.filter((q) => {
    if (opts.subjectId && q.subjectId !== opts.subjectId) return false;
    if (opts.grade && q.grade !== opts.grade) return false;
    if (resolvedTopic) {
      if (q.topic !== resolvedTopic && q.topic !== opts.topic) return false;
    }
    if (opts.requireArabic && !hasArabicExamFields(q)) return false;
    return true;
  });
}

/**
 * Resolve prompt/choices/explanation for learningLanguage.
 * Philosophy mirrors lessons/bilingual.ts:
 * - STEM: EN primary; AR helper in mixed; prefer *Ar in ar mode
 * - Arabic-primary: AR primary; EN fallback
 * - English: EN primary; optional AR brief in mixed
 */
export function resolveExamView(
  q: ExamQuestion,
  language: LearningLanguage
): ResolvedExamView {
  const isArPrimary = ARABIC_PRIMARY.has(q.subjectId);
  const hasAr = hasArabicExamFields(q);

  if (language === "ar") {
    if (hasAr || isArPrimary) {
      return {
        prompt: q.promptAr?.trim() || q.prompt,
        choices:
          q.choicesAr && q.choicesAr.length > 0 ? q.choicesAr : q.choices,
        explanation: q.explanationAr?.trim() || q.explanation,
        arabicHelper: null,
        dir: "rtl",
        usedFallback: !(q.promptAr?.trim()),
      };
    }
    return {
      prompt: q.prompt,
      choices: q.choices,
      explanation: q.explanation,
      arabicHelper: null,
      dir: "ltr",
      usedFallback: true,
    };
  }

  if (language === "mixed") {
    if (isArPrimary) {
      return {
        prompt: q.promptAr?.trim() || q.prompt,
        choices:
          q.choicesAr && q.choicesAr.length > 0 ? q.choicesAr : q.choices,
        explanation: q.explanationAr?.trim() || q.explanation,
        arabicHelper: null,
        dir: "rtl",
        usedFallback: false,
      };
    }
    // STEM / English: EN prompt + AR helper line when available
    return {
      prompt: q.prompt,
      choices: q.choices,
      explanation: q.explanation,
      arabicHelper: q.promptAr?.trim() || null,
      dir: "ltr",
      usedFallback: false,
    };
  }

  // en — Arabic-primary stems stay Arabic (no separate EN stem in bank)
  const promptIsAr = /[\u0600-\u06FF]/.test(q.prompt);
  return {
    prompt: q.prompt,
    choices: q.choices,
    explanation: q.explanation,
    arabicHelper: null,
    dir: promptIsAr || isArPrimary ? "rtl" : "ltr",
    usedFallback: false,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Prefer questions not recently answered; fall back to full pool. */
export function pickExamQuestions(opts: {
  subjectId: string;
  grade: GradeLevel;
  topic?: string;
  count: number;
  preferTopics?: string[];
  excludeIds?: string[];
  requireArabic?: boolean;
}): ExamQuestion[] {
  const exclude = new Set(opts.excludeIds || []);
  const topic = opts.topic
    ? resolveExamTopic(opts.subjectId, opts.topic, opts.grade)
    : undefined;

  let pool = filterExamQuestions({
    subjectId: opts.subjectId,
    grade: opts.grade,
    topic,
    requireArabic: opts.requireArabic,
  }).filter((q) => !exclude.has(q.id));

  if (pool.length === 0) {
    pool = filterExamQuestions({
      subjectId: opts.subjectId,
      grade: opts.grade,
      topic,
      requireArabic: opts.requireArabic,
    });
  }

  const preferResolved = (opts.preferTopics || [])
    .map((t) => resolveExamTopic(opts.subjectId, t, opts.grade))
    .filter(Boolean);

  if (preferResolved.length && !topic) {
    const preferred = shuffle(
      pool.filter((q) => preferResolved.includes(q.topic))
    );
    const rest = shuffle(
      pool.filter((q) => !preferResolved.includes(q.topic))
    );
    const merged = [...preferred, ...rest];
    return merged.slice(0, Math.min(opts.count, merged.length));
  }

  return shuffle(pool).slice(0, Math.min(opts.count, pool.length));
}

export function defaultMockCount(grade: GradeLevel): number {
  return grade <= 10 ? 10 : 12;
}

export function defaultTimeLimitSec(count: number): number {
  return Math.max(300, count * 90);
}

export function gradeToStage(grade: GradeLevel) {
  return GRADE_META[grade].stage;
}

export function normalizeExamAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/×/g, "x")
    .replace(/−/g, "-")
    .replace(/,/g, "")
    .replace(/\u2212/g, "-");
}

export function gradeExamAnswer(
  question: ExamQuestion,
  userAnswer: string,
  selfMarkCorrect?: boolean
): boolean {
  if (question.type === "structured") {
    return Boolean(selfMarkCorrect);
  }
  if (question.type === "mcq") {
    return String(userAnswer) === String(question.correctAnswer);
  }
  const accepted = question.correctAnswer.split("|").map(normalizeExamAnswer);
  const given = normalizeExamAnswer(userAnswer);
  return accepted.some(
    (a) => a === given || given.includes(a) || a.includes(given)
  );
}

export function lessonHref(subjectId: string, topic: string): string {
  const resolved =
    mapTopicToCurriculum(subjectId, topic) ?? topic;
  const slug = resolved
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `/subjects/${subjectId}/${slug || "topic"}`;
}

export function examDrillHref(opts: {
  subjectId: string;
  grade: GradeLevel;
  topic?: string;
  mode?: ExamMode;
  count?: number;
  timed?: boolean;
  requireArabic?: boolean;
}): string {
  const p = new URLSearchParams();
  p.set("subject", opts.subjectId);
  p.set("grade", String(opts.grade));
  p.set("mode", opts.mode || (opts.topic ? "topic" : "mock"));
  if (opts.topic) {
    const resolved = resolveExamTopic(
      opts.subjectId,
      opts.topic,
      opts.grade
    );
    p.set("topic", resolved);
  }
  if (opts.count) p.set("count", String(opts.count));
  if (opts.timed) p.set("timed", "1");
  if (opts.requireArabic) p.set("ar", "1");
  return `/exams/session?${p.toString()}`;
}

/** Hub deep-link with preselected subject+topic+mode=topic (also usable from dashboard). */
export function examHubHref(opts: {
  subjectId: string;
  grade: GradeLevel;
  topic?: string;
  mode?: ExamMode;
}): string {
  const p = new URLSearchParams();
  p.set("subject", opts.subjectId);
  p.set("grade", String(opts.grade));
  p.set("mode", opts.mode || (opts.topic ? "topic" : "mock"));
  if (opts.topic) {
    p.set(
      "topic",
      resolveExamTopic(opts.subjectId, opts.topic, opts.grade)
    );
  }
  return `/exams?${p.toString()}`;
}
