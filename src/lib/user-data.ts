import {
  SUBJECT_CATALOG,
  getSubject,
  getTopicsForGrade,
  type GradeLevel,
} from "@/data/curriculum";
import type { ExamMode } from "@/data/exam-bank/types";
import type { LearningLanguage } from "@/data/lessons/types";
import { topicToSlug } from "@/data/lessons/utils";

export type { LearningLanguage };

export type TopicProgress = {
  mastery: number; // 0-100
  completed: boolean;
  lastStudiedAt: string | null;
};

export type LibraryBook = {
  id: string;
  title: string;
  subjectId: string;
  sizeBytes: number;
  uploadedAt: string;
  /** Real PDF pipeline: extracting → ready | failed (never fake-ready). */
  status: "extracting" | "ready" | "failed";
  pageCount?: number;
  chunkCount?: number;
  errorMessage?: string;
};

export type PlannerTask = {
  id: string;
  title: string;
  subjectId: string;
  durationMin: number;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  action: string;
  subjectId?: string;
  at: string;
  kind: "topic" | "upload" | "tutor" | "task" | "study" | "exam";
};

export type ExamAnswerRecord = {
  questionId: string;
  correct: boolean;
  userAnswer: string;
  subjectId: string;
  topic: string;
  grade: GradeLevel;
  at: string;
};

export type ExamSessionRecord = {
  id: string;
  mode: ExamMode;
  subjectId: string;
  grade: GradeLevel;
  topic?: string;
  timed: boolean;
  questionIds: string[];
  correctCount: number;
  total: number;
  accuracy: number;
  marksEarned: number;
  marksTotal: number;
  durationSec: number;
  weakTopics: string[];
  at: string;
};

export type TutorCitation = {
  bookId: string;
  title: string;
  subjectId: string;
  pageStart: number;
  pageEnd: number;
  sourceType?: "upload" | "moe";
};

export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  grounded?: boolean;
  citations?: TutorCitation[];
  relatedTopic?: { subjectId: string; topic: string; slug: string };
};

export type StudyDay = {
  date: string; // YYYY-MM-DD
  minutes: number;
};

export type FirstRunChecklistState = {
  /** User hid the dashboard checklist */
  dismissed: boolean;
  /** Optional steps the user skipped (e.g. join class) */
  skippedIds: string[];
};

export type UserLearningData = {
  /** Schema version — bump when adding required fields; migrate in loadUserData */
  version: number;
  topics: Record<string, TopicProgress>; // key: `${subjectId}::${topic}`
  books: LibraryBook[];
  /** Bookmarked shared MoE titles (ids from corpus manifest) — no re-extract */
  moeShelfIds: string[];
  /** When true (default), tutor retrieves from public/corpus MoE index */
  useMoeLibrary: boolean;
  tasks: PlannerTask[];
  activity: ActivityItem[];
  tutorMessages: TutorMessage[];
  studyDays: StudyDay[];
  lastStudyDate: string | null;
  /** Target MoE / semester exam date (YYYY-MM-DD) */
  examTargetDate: string | null;
  /** Grade the student is preparing for */
  examFocusGrade: GradeLevel | null;
  examSessions: ExamSessionRecord[];
  examAnswers: ExamAnswerRecord[];
  /**
   * Classroom language preference (Oman): STEM often Mixed (EN terms + AR شرح).
   * Default Mixed — matches MoE STEM classroom reality.
   */
  learningLanguage: LearningLanguage;
  /** First-run onboarding checklist (dashboard) */
  firstRunChecklist: FirstRunChecklistState;
};

export type ReadinessBreakdown = {
  score: number; // 0–10
  topicMastery: number; // 0–100
  examAccuracy7d: number; // 0–100
  coverage: number; // 0–100 % of grade topics with exam practice or mastery>0
  recency: number; // 0–100 based on last study / exam
  weakTopics: {
    subjectId: string;
    subjectName: string;
    topic: string;
    mastery: number;
    examAccuracy: number | null;
    lessonHref: string;
    drillHref: string;
  }[];
  formulaLabel: string;
};

function storageKey(userId: string) {
  return `ged-user-data:${userId}`;
}

function topicKey(subjectId: string, topic: string) {
  return `${subjectId}::${topic}`;
}

function normalizeLearningLanguage(value: unknown): LearningLanguage {
  if (value === "en" || value === "ar" || value === "mixed") return value;
  return "mixed";
}

export function createEmptyUserData(): UserLearningData {
  return {
    version: 2,
    topics: {},
    books: [],
    moeShelfIds: [],
    useMoeLibrary: true,
    tasks: [],
    activity: [],
    tutorMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your GED study tutor for Oman's syllabus. The built-in MoE library is on by default — ask about Chemistry or Math and I’ll cite textbook pages. You can still upload extra PDFs in Library.\n\nمرحباً! مكتبة وزارة التربية مفعّلة افتراضياً. اسأل عن الكيمياء أو الرياضيات وسأذكر الصفحات. يمكنك أيضاً رفع كتب إضافية في المكتبة.",
        at: new Date().toISOString(),
        grounded: false,
      },
    ],
    studyDays: [],
    lastStudyDate: null,
    examTargetDate: null,
    examFocusGrade: 9,
    examSessions: [],
    examAnswers: [],
    learningLanguage: "mixed",
    firstRunChecklist: { dismissed: false, skippedIds: [] },
  };
}

export function loadUserData(userId: string): UserLearningData {
  if (typeof window === "undefined") return createEmptyUserData();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return createEmptyUserData();
    const parsed = JSON.parse(raw) as UserLearningData;
    const books = (parsed.books || []).map((b) => {
      const legacy = b as Omit<LibraryBook, "status"> & { status: string };
      // Old fake pipeline used "processing" / "ready" without real extraction.
      if (legacy.status === "processing") {
        return {
          ...b,
          status: "failed" as const,
          errorMessage: "Re-upload to extract text.",
        };
      }
      if (legacy.status === "ready" && (b.chunkCount == null || b.chunkCount === 0)) {
        return {
          ...b,
          status: "failed" as const,
          errorMessage: "No text index — re-upload PDF to enable grounded tutor answers.",
        };
      }
      if (
        legacy.status !== "extracting" &&
        legacy.status !== "ready" &&
        legacy.status !== "failed"
      ) {
        return {
          ...b,
          status: "failed" as const,
          errorMessage: "Unknown status — re-upload.",
        };
      }
      return b as LibraryBook;
    });
    const learningLanguage = normalizeLearningLanguage(
      (parsed as { learningLanguage?: unknown }).learningLanguage
    );

    return {
      ...createEmptyUserData(),
      ...parsed,
      version: 2,
      topics: parsed.topics || {},
      books,
      moeShelfIds: Array.isArray((parsed as { moeShelfIds?: string[] }).moeShelfIds)
        ? (parsed as { moeShelfIds: string[] }).moeShelfIds
        : [],
      useMoeLibrary:
        typeof (parsed as { useMoeLibrary?: boolean }).useMoeLibrary === "boolean"
          ? (parsed as { useMoeLibrary: boolean }).useMoeLibrary
          : true,
      tasks: parsed.tasks || [],
      activity: parsed.activity || [],
      tutorMessages: parsed.tutorMessages?.length
        ? parsed.tutorMessages
        : createEmptyUserData().tutorMessages,
      studyDays: parsed.studyDays || [],
      examTargetDate: parsed.examTargetDate ?? null,
      examFocusGrade: parsed.examFocusGrade ?? 9,
      examSessions: parsed.examSessions || [],
      examAnswers: parsed.examAnswers || [],
      learningLanguage,
      firstRunChecklist: normalizeFirstRunChecklist(
        (parsed as { firstRunChecklist?: unknown }).firstRunChecklist
      ),
    };
  } catch {
    return createEmptyUserData();
  }
}

function normalizeFirstRunChecklist(raw: unknown): FirstRunChecklistState {
  if (!raw || typeof raw !== "object") {
    return { dismissed: false, skippedIds: [] };
  }
  const o = raw as { dismissed?: unknown; skippedIds?: unknown };
  return {
    dismissed: o.dismissed === true,
    skippedIds: Array.isArray(o.skippedIds)
      ? o.skippedIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

export function dismissFirstRunChecklist(data: UserLearningData): UserLearningData {
  return {
    ...data,
    version: 2,
    firstRunChecklist: {
      ...normalizeFirstRunChecklist(data.firstRunChecklist),
      dismissed: true,
    },
  };
}

export function skipFirstRunStep(
  data: UserLearningData,
  stepId: string
): UserLearningData {
  const current = normalizeFirstRunChecklist(data.firstRunChecklist);
  if (current.skippedIds.includes(stepId)) return data;
  return {
    ...data,
    version: 2,
    firstRunChecklist: {
      ...current,
      skippedIds: [...current.skippedIds, stepId],
    },
  };
}

export type FirstRunStepId =
  | "library"
  | "lesson"
  | "exam"
  | "class";

export type FirstRunStepStatus = {
  id: FirstRunStepId;
  label: string;
  hint: string;
  href: string;
  optional?: boolean;
  done: boolean;
};

/** Derive checklist completion from live learning data (+ optional class membership). */
export function buildFirstRunSteps(
  data: UserLearningData,
  opts?: { joinedClass?: boolean }
): FirstRunStepStatus[] {
  const checklist = normalizeFirstRunChecklist(data.firstRunChecklist);
  const hasLibrary =
    data.books.some((b) => b.status === "ready") ||
    (data.moeShelfIds?.length ?? 0) > 0;
  const hasLesson = Object.values(data.topics || {}).some(
    (t) => t.completed || t.mastery > 0
  );
  const examQuestionCount =
    (data.examAnswers?.length ?? 0) ||
    (data.examSessions || []).reduce((sum, s) => sum + (s.total || 0), 0);
  const hasExam = examQuestionCount >= 5;
  const hasClass = opts?.joinedClass === true;

  return [
    {
      id: "library",
      label: "Upload or enable a MoE library book",
      hint: "Add a PDF in Library, or bookmark a shared MoE title to your shelf.",
      href: "/library",
      done: hasLibrary,
    },
    {
      id: "lesson",
      label: "Complete one lesson",
      hint: "Open Subjects → Start lesson → watch + quiz.",
      href: "/subjects",
      done: hasLesson,
    },
    {
      id: "exam",
      label: "Do 5 exam questions",
      hint: "Exam OS topic drill or mock — feeds readiness.",
      href: "/exams",
      done: hasExam,
    },
    {
      id: "class",
      label: "Join a class",
      hint: "Optional — enter a teacher join code on the dashboard.",
      href: "/classes",
      optional: true,
      done: hasClass || checklist.skippedIds.includes("class"),
    },
  ];
}

export function setLearningLanguage(
  data: UserLearningData,
  language: LearningLanguage
): UserLearningData {
  return {
    ...data,
    version: 2,
    learningLanguage: normalizeLearningLanguage(language),
  };
}

export function saveUserData(userId: string, data: UserLearningData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(data));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pushActivity(
  data: UserLearningData,
  item: Omit<ActivityItem, "id" | "at"> & { at?: string }
): UserLearningData {
  const next: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: item.at || new Date().toISOString(),
    action: item.action,
    subjectId: item.subjectId,
    kind: item.kind,
  };
  return {
    ...data,
    activity: [next, ...data.activity].slice(0, 100),
  };
}

function addStudyMinutes(data: UserLearningData, minutes: number): UserLearningData {
  const date = todayKey();
  const existing = data.studyDays.find((d) => d.date === date);
  const studyDays = existing
    ? data.studyDays.map((d) =>
        d.date === date ? { ...d, minutes: d.minutes + minutes } : d
      )
    : [...data.studyDays, { date, minutes }];
  return {
    ...data,
    studyDays,
    lastStudyDate: date,
  };
}

export function getTopicProgress(
  data: UserLearningData,
  subjectId: string,
  topic: string
): TopicProgress {
  return (
    data.topics[topicKey(subjectId, topic)] || {
      mastery: 0,
      completed: false,
      lastStudiedAt: null,
    }
  );
}

export function subjectProgress(data: UserLearningData, subjectId: string) {
  const subject = getSubject(subjectId);
  if (!subject) return { progress: 0, completedTopics: 0, weakTopics: 0, totalTopics: 0 };

  const progresses = subject.topics.map((t) => getTopicProgress(data, subjectId, t));
  const totalTopics = subject.topics.length;
  const completedTopics = progresses.filter((p) => p.completed || p.mastery >= 80).length;
  const weakTopics = progresses.filter((p) => p.mastery > 0 && p.mastery < 50).length;
  const progress = Math.round(
    progresses.reduce((sum, p) => sum + p.mastery, 0) / Math.max(totalTopics, 1)
  );

  return { progress, completedTopics, weakTopics, totalTopics };
}

export function overallMastery(data: UserLearningData) {
  const values = SUBJECT_CATALOG.map((s) => subjectProgress(data, s.id).progress);
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function computeStreak(data: UserLearningData): number {
  if (!data.lastStudyDate && data.studyDays.length === 0) return 0;
  const dates = new Set(data.studyDays.filter((d) => d.minutes > 0).map((d) => d.date));
  let streak = 0;
  const cursor = new Date();
  // Allow today or yesterday as start
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);
  if (!dates.has(today) && !dates.has(yKey)) return 0;

  if (!dates.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function hoursThisWeek(data: UserLearningData): number {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startKey = start.toISOString().slice(0, 10);
  const minutes = data.studyDays
    .filter((d) => d.date >= startKey)
    .reduce((sum, d) => sum + d.minutes, 0);
  return Math.round((minutes / 60) * 10) / 10;
}

export function readinessScore(data: UserLearningData, grade?: GradeLevel): number {
  return computeReadiness(data, grade).score;
}

/**
 * Transparent exam readiness (0–10):
 * 35% topic mastery + 30% exam accuracy (7d) + 20% grade coverage + 15% recency
 */
export function computeReadiness(
  data: UserLearningData,
  grade?: GradeLevel
): ReadinessBreakdown {
  const focusGrade = grade || data.examFocusGrade || 9;
  const subjects = SUBJECT_CATALOG.filter((s) => s.grades.includes(focusGrade));

  let masterySum = 0;
  let masteryCount = 0;
  const gradeTopics: { subjectId: string; subjectName: string; topic: string }[] = [];

  for (const s of subjects) {
    const topics = getTopicsForGrade(s, focusGrade);
    for (const topic of topics) {
      gradeTopics.push({ subjectId: s.id, subjectName: s.name, topic });
      masterySum += getTopicProgress(data, s.id, topic).mastery;
      masteryCount += 1;
    }
  }

  const topicMastery = masteryCount
    ? Math.round(masterySum / masteryCount)
    : 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekIso = weekAgo.toISOString();
  const recentAnswers = data.examAnswers.filter((a) => a.at >= weekIso);
  const examAccuracy7d = recentAnswers.length
    ? Math.round(
        (recentAnswers.filter((a) => a.correct).length / recentAnswers.length) *
          100
      )
    : data.examAnswers.length
      ? Math.round(
          (data.examAnswers.filter((a) => a.correct).length /
            data.examAnswers.length) *
            100
        )
      : 0;

  const practiced = new Set(
    data.examAnswers
      .filter((a) => a.grade === focusGrade)
      .map((a) => `${a.subjectId}::${a.topic}`)
  );
  let covered = 0;
  for (const t of gradeTopics) {
    const key = `${t.subjectId}::${t.topic}`;
    const p = getTopicProgress(data, t.subjectId, t.topic);
    if (practiced.has(key) || p.mastery > 0) covered += 1;
  }
  const coverage = gradeTopics.length
    ? Math.round((covered / gradeTopics.length) * 100)
    : 0;

  let daysSince = 30;
  if (data.lastStudyDate) {
    const last = new Date(data.lastStudyDate);
    daysSince = Math.max(
      0,
      Math.floor((Date.now() - last.getTime()) / 86400000)
    );
  }
  const lastExam = data.examSessions[0]?.at;
  if (lastExam) {
    const d = Math.floor((Date.now() - new Date(lastExam).getTime()) / 86400000);
    daysSince = Math.min(daysSince, d);
  }
  const recency = Math.max(0, Math.min(100, Math.round(100 - daysSince * 12)));

  const scoreRaw =
    topicMastery * 0.35 +
    examAccuracy7d * 0.3 +
    coverage * 0.2 +
    recency * 0.15;
  const score = Math.min(10, Math.round((scoreRaw / 10) * 10) / 10);

  const weakTopics = buildWeakTopics(data, focusGrade);

  return {
    score,
    topicMastery,
    examAccuracy7d,
    coverage,
    recency,
    weakTopics,
    formulaLabel:
      "0.35×mastery + 0.30×exam accuracy (7d) + 0.20×coverage + 0.15×recency",
  };
}

export function buildWeakTopics(data: UserLearningData, grade?: GradeLevel) {
  const focusGrade = grade || data.examFocusGrade || 9;
  const subjects = SUBJECT_CATALOG.filter((s) => s.grades.includes(focusGrade));
  const rows: ReadinessBreakdown["weakTopics"] = [];

  for (const s of subjects) {
    for (const topic of getTopicsForGrade(s, focusGrade)) {
      const p = getTopicProgress(data, s.id, topic);
      const topicAnswers = data.examAnswers.filter(
        (a) => a.subjectId === s.id && a.topic === topic
      );
      const examAccuracy =
        topicAnswers.length > 0
          ? Math.round(
              (topicAnswers.filter((a) => a.correct).length /
                topicAnswers.length) *
                100
            )
          : null;

      const failedExam =
        topicAnswers.length > 0 &&
        topicAnswers.filter((a) => !a.correct).length >
          topicAnswers.filter((a) => a.correct).length;

      const weakMastery = p.mastery > 0 && p.mastery < 50;
      const unpracticedGap = p.mastery === 0 && topicAnswers.some((a) => !a.correct);

      if (weakMastery || failedExam || unpracticedGap) {
        rows.push({
          subjectId: s.id,
          subjectName: s.name,
          topic,
          mastery: p.mastery,
          examAccuracy,
          lessonHref: `/subjects/${s.id}/${topicToSlug(topic)}`,
          drillHref: `/exams?subject=${s.id}&grade=${focusGrade}&mode=topic&topic=${encodeURIComponent(topic)}`,
        });
      }
    }
  }

  rows.sort((a, b) => {
    const aScore =
      (a.examAccuracy ?? 50) * 0.5 + a.mastery * 0.5;
    const bScore =
      (b.examAccuracy ?? 50) * 0.5 + b.mastery * 0.5;
    return aScore - bScore;
  });

  return rows.slice(0, 8);
}

export function daysUntilExam(data: UserLearningData): number | null {
  if (!data.examTargetDate) return null;
  const target = new Date(data.examTargetDate + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function setExamPlanner(
  data: UserLearningData,
  input: { examTargetDate: string | null; examFocusGrade: GradeLevel | null }
): UserLearningData {
  return {
    ...data,
    examTargetDate: input.examTargetDate,
    examFocusGrade: input.examFocusGrade,
  };
}

export function recordExamSession(
  data: UserLearningData,
  input: {
    mode: ExamMode;
    subjectId: string;
    grade: GradeLevel;
    topic?: string;
    timed: boolean;
    questionIds: string[];
    answers: {
      questionId: string;
      correct: boolean;
      userAnswer: string;
      topic: string;
      marks: number;
      marksEarned: number;
    }[];
    durationSec: number;
  }
): UserLearningData {
  const correctCount = input.answers.filter((a) => a.correct).length;
  const total = input.answers.length || 1;
  const accuracy = Math.round((correctCount / total) * 100);
  const marksTotal = input.answers.reduce((s, a) => s + a.marks, 0);
  const marksEarned = input.answers.reduce((s, a) => s + a.marksEarned, 0);

  const failCounts = new Map<string, number>();
  for (const a of input.answers) {
    if (!a.correct) {
      failCounts.set(a.topic, (failCounts.get(a.topic) || 0) + 1);
    }
  }
  const weakTopics = [...failCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  const session: ExamSessionRecord = {
    id: `exam-${Date.now()}`,
    mode: input.mode,
    subjectId: input.subjectId,
    grade: input.grade,
    topic: input.topic,
    timed: input.timed,
    questionIds: input.questionIds,
    correctCount,
    total: input.answers.length,
    accuracy,
    marksEarned,
    marksTotal,
    durationSec: input.durationSec,
    weakTopics,
    at: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  const newAnswers: ExamAnswerRecord[] = input.answers.map((a) => ({
    questionId: a.questionId,
    correct: a.correct,
    userAnswer: a.userAnswer,
    subjectId: input.subjectId,
    topic: a.topic,
    grade: input.grade,
    at: now,
  }));

  let next: UserLearningData = {
    ...data,
    examSessions: [session, ...data.examSessions].slice(0, 50),
    examAnswers: [...newAnswers, ...data.examAnswers].slice(0, 500),
  };

  // Nudge topic mastery from exam performance (does not replace lesson mastery)
  for (const topic of new Set(input.answers.map((a) => a.topic))) {
    const topicAns = input.answers.filter((a) => a.topic === topic);
    const pct = Math.round(
      (topicAns.filter((a) => a.correct).length / topicAns.length) * 100
    );
    const gain =
      pct >= 80 ? 12 : pct >= 60 ? 8 : pct >= 40 ? 4 : pct > 0 ? 2 : 0;
    if (gain > 0) {
      const key = topicKey(input.subjectId, topic);
      const current = getTopicProgress(next, input.subjectId, topic);
      const mastery = Math.min(100, current.mastery + gain);
      next = {
        ...next,
        topics: {
          ...next.topics,
          [key]: {
            mastery,
            completed: mastery >= 80,
            lastStudiedAt: now,
          },
        },
      };
    } else if (pct < 40) {
      // Failed heavily — ensure topic appears as studied-but-weak if was 0
      const key = topicKey(input.subjectId, topic);
      const current = getTopicProgress(next, input.subjectId, topic);
      if (current.mastery === 0) {
        next = {
          ...next,
          topics: {
            ...next.topics,
            [key]: {
              mastery: 15,
              completed: false,
              lastStudiedAt: now,
            },
          },
        };
      }
    }
  }

  const studyMin = Math.max(5, Math.round(input.durationSec / 60));
  next = addStudyMinutes(next, studyMin);
  const modeLabel =
    input.mode === "mock"
      ? "Mock mini-paper"
      : input.mode === "mixed"
        ? "Mixed paper"
        : "Topic drill";
  next = pushActivity(next, {
    action: `${modeLabel} — ${correctCount}/${input.answers.length} (${accuracy}%)`,
    subjectId: input.subjectId,
    kind: "exam",
  });

  return next;
}

export function buildDailyExamPlan(data: UserLearningData) {
  const grade = data.examFocusGrade || 9;
  const weak = buildWeakTopics(data, grade);
  const primary = weak[0];
  const subjectId = primary?.subjectId || "math";
  const topic = primary?.topic || "Linear equations & inequalities";
  const subject = getSubject(subjectId);

  return {
    grade,
    revision: {
      title: `Revise: ${topic}`,
      subjectId,
      subjectName: subject?.name || subjectId,
      topic,
      lessonHref: `/subjects/${subjectId}/${topicToSlug(topic)}`,
      durationMin: 20,
    },
    examDrill: {
      title: `10 exam Qs — weakest topics`,
      subjectId,
      grade,
      preferTopics: weak.slice(0, 3).map((w) => w.topic),
      href: `/exams/session?subject=${subjectId}&grade=${grade}&mode=mixed&count=10&timed=0`,
      count: 10,
    },
    daysLeft: daysUntilExam(data),
  };
}

export function masteryHistory(data: UserLearningData) {
  // Build last 8 week buckets from study + topic updates approximated by activity dates
  const weeks: { week: string; mastery: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const label = `W${8 - i}`;
    // Estimate mastery at that time from topics lastStudied before end
    let sum = 0;
    let count = 0;
    for (const subject of SUBJECT_CATALOG) {
      for (const topic of subject.topics) {
        const p = getTopicProgress(data, subject.id, topic);
        if (!p.lastStudiedAt || p.lastStudiedAt.slice(0, 10) <= end.toISOString().slice(0, 10)) {
          sum += p.mastery;
          count += 1;
        } else {
          sum += 0;
          count += 1;
        }
      }
    }
    weeks.push({ week: label, mastery: count ? Math.round(sum / count) : 0 });
  }
  return weeks;
}

export function buildRecommendations(data: UserLearningData) {
  const recs: {
    title: string;
    subject: string;
    subjectId: string;
    priority: "high" | "medium";
    reason: string;
  }[] = [];

  for (const subject of SUBJECT_CATALOG) {
    for (const topic of subject.topics) {
      const p = getTopicProgress(data, subject.id, topic);
      if (p.mastery > 0 && p.mastery < 50) {
        recs.push({
          title: `Revise ${topic}`,
          subject: subject.name,
          subjectId: subject.id,
          priority: "high",
          reason: `Mastery is only ${p.mastery}%`,
        });
      } else if (p.mastery === 0) {
        recs.push({
          title: `Start ${topic}`,
          subject: subject.name,
          subjectId: subject.id,
          priority: "medium",
          reason: "Not started yet",
        });
      }
    }
  }

  if (data.books.filter((b) => b.status === "ready").length === 0 && !data.useMoeLibrary) {
    recs.unshift({
      title: "Upload your first textbook",
      subject: "Library",
      subjectId: "library",
      priority: "high",
      reason: "Upload an MoE PDF so the AI tutor can cite real pages",
    });
  }

  return recs.slice(0, 6);
}

export function markTopicStudied(
  data: UserLearningData,
  subjectId: string,
  topic: string,
  masteryGain = 15
): UserLearningData {
  const key = topicKey(subjectId, topic);
  const current = getTopicProgress(data, subjectId, topic);
  const mastery = Math.min(100, current.mastery + masteryGain);
  const completed = mastery >= 80;
  let next: UserLearningData = {
    ...data,
    topics: {
      ...data.topics,
      [key]: {
        mastery,
        completed,
        lastStudiedAt: new Date().toISOString(),
      },
    },
  };
  next = addStudyMinutes(next, 20);
  next = pushActivity(next, {
    action: completed
      ? `Mastered topic — ${topic}`
      : `Studied topic — ${topic} (${mastery}%)`,
    subjectId,
    kind: "topic",
  });
  return next;
}

/**
 * Award mastery after a real lesson: videos watched + quiz score.
 * Gain scales with quiz performance; watching is required by the UI.
 */
export function completeLessonStudy(
  data: UserLearningData,
  subjectId: string,
  topic: string,
  opts: { quizPercent: number; watchedCount: number }
): UserLearningData {
  const quiz = Math.max(0, Math.min(100, opts.quizPercent));
  const watchBonus = opts.watchedCount > 0 ? 20 : 0;
  const quizBonus = Math.round(quiz * 0.45);
  const masteryGain = Math.max(15, watchBonus + quizBonus);

  const key = topicKey(subjectId, topic);
  const current = getTopicProgress(data, subjectId, topic);
  const mastery = Math.min(100, current.mastery + masteryGain);
  const completed = mastery >= 80;
  const studyMinutes = Math.min(45, 15 + opts.watchedCount * 8 + Math.round(quiz / 10));

  let next: UserLearningData = {
    ...data,
    topics: {
      ...data.topics,
      [key]: {
        mastery,
        completed,
        lastStudiedAt: new Date().toISOString(),
      },
    },
  };
  next = addStudyMinutes(next, studyMinutes);
  next = pushActivity(next, {
    action: completed
      ? `Mastered lesson — ${topic} (quiz ${quiz}%)`
      : `Completed lesson — ${topic} (quiz ${quiz}%, mastery ${mastery}%)`,
    subjectId,
    kind: "topic",
  });
  return next;
}

export function addLibraryBook(
  data: UserLearningData,
  book: Omit<LibraryBook, "id" | "uploadedAt" | "status" | "pageCount" | "chunkCount" | "errorMessage"> & {
    id?: string;
  }
): UserLearningData {
  const entry: LibraryBook = {
    id: book.id || `book-${Date.now()}`,
    title: book.title,
    subjectId: book.subjectId,
    sizeBytes: book.sizeBytes,
    uploadedAt: new Date().toISOString(),
    status: "extracting",
  };
  let next: UserLearningData = {
    ...data,
    books: [entry, ...data.books],
  };
  next = pushActivity(next, {
    action: `Uploaded ${book.title}`,
    subjectId: book.subjectId,
    kind: "upload",
  });
  return next;
}

export function updateLibraryBook(
  data: UserLearningData,
  bookId: string,
  patch: Partial<
    Pick<LibraryBook, "status" | "pageCount" | "chunkCount" | "errorMessage" | "title" | "subjectId">
  >
): UserLearningData {
  return {
    ...data,
    books: data.books.map((b) => (b.id === bookId ? { ...b, ...patch } : b)),
  };
}

/** @deprecated Use updateLibraryBook — kept for any residual callers. */
export function finalizeBook(
  data: UserLearningData,
  bookId: string,
  meta?: { pageCount: number; chunkCount: number }
): UserLearningData {
  return updateLibraryBook(data, bookId, {
    status: "ready",
    pageCount: meta?.pageCount,
    chunkCount: meta?.chunkCount,
    errorMessage: undefined,
  });
}

export function removeLibraryBook(data: UserLearningData, bookId: string): UserLearningData {
  const book = data.books.find((b) => b.id === bookId);
  let next: UserLearningData = {
    ...data,
    books: data.books.filter((b) => b.id !== bookId),
  };
  if (book) {
    next = pushActivity(next, {
      action: `Removed ${book.title}`,
      subjectId: book.subjectId,
      kind: "upload",
    });
  }
  return next;
}

export function setUseMoeLibrary(
  data: UserLearningData,
  enabled: boolean
): UserLearningData {
  return { ...data, useMoeLibrary: enabled };
}

export function toggleMoeShelfBook(
  data: UserLearningData,
  bookId: string
): UserLearningData {
  const has = data.moeShelfIds.includes(bookId);
  return {
    ...data,
    moeShelfIds: has
      ? data.moeShelfIds.filter((id) => id !== bookId)
      : [...data.moeShelfIds, bookId],
  };
}

export function addTask(
  data: UserLearningData,
  input: { title: string; subjectId: string; durationMin: number; dueDate: string }
): UserLearningData {
  const task: PlannerTask = {
    id: `task-${Date.now()}`,
    title: input.title,
    subjectId: input.subjectId,
    durationMin: input.durationMin,
    dueDate: input.dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  let next: UserLearningData = { ...data, tasks: [task, ...data.tasks] };
  next = pushActivity(next, {
    action: `Added task — ${input.title}`,
    subjectId: input.subjectId,
    kind: "task",
  });
  return next;
}

export function toggleTask(data: UserLearningData, taskId: string): UserLearningData {
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) return data;
  let next: UserLearningData = {
    ...data,
    tasks: data.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ),
  };
  if (!task.completed) {
    next = addStudyMinutes(next, task.durationMin);
    next = pushActivity(next, {
      action: `Completed task — ${task.title}`,
      subjectId: task.subjectId,
      kind: "task",
    });
  }
  return next;
}

export function removeTask(data: UserLearningData, taskId: string): UserLearningData {
  return { ...data, tasks: data.tasks.filter((t) => t.id !== taskId) };
}

export function appendTutorExchange(
  data: UserLearningData,
  userText: string,
  assistantText: string,
  subjectId?: string,
  meta?: {
    grounded?: boolean;
    citations?: TutorCitation[];
    relatedTopic?: TutorMessage["relatedTopic"];
  }
): UserLearningData {
  const now = new Date().toISOString();
  const userMsg: TutorMessage = {
    id: `u-${Date.now()}`,
    role: "user",
    content: userText,
    at: now,
  };
  const assistantMsg: TutorMessage = {
    id: `a-${Date.now() + 1}`,
    role: "assistant",
    content: assistantText,
    at: new Date().toISOString(),
    grounded: meta?.grounded,
    citations: meta?.citations,
    relatedTopic: meta?.relatedTopic,
  };
  let next: UserLearningData = {
    ...data,
    tutorMessages: [...data.tutorMessages, userMsg, assistantMsg].slice(-80),
  };
  next = addStudyMinutes(next, 5);
  next = pushActivity(next, {
    action: `AI Tutor — ${userText.slice(0, 48)}${userText.length > 48 ? "…" : ""}`,
    subjectId,
    kind: "tutor",
  });
  return next;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/**
 * Meta / progress questions that don't need PDF grounding
 * (weak topics, study planning). Still never invents book citations.
 */
export function generateMetaTutorReply(
  question: string,
  data: UserLearningData,
  activeSubjectId?: string
): string | null {
  const q = question.toLowerCase();
  const arQ = /[\u0600-\u06FF]/.test(question);
  const lang = data.learningLanguage;
  const preferAr = lang === "ar" || (lang === "mixed" && arQ) || (lang === "mixed" && !arQ && /ضعف|خطة|تقدم|دراسة/.test(question));
  const useAr = lang === "ar" || preferAr;

  const isMeta =
    /weak|worst|need.*help|how should i study|study plan|this week|mastery|progress|ضعيف|خطة دراس|تقدم|كيف أدرس/.test(
      q + question
    );
  if (!isMeta) return null;

  const readyCount = data.books.filter((b) => b.status === "ready").length;
  const moeOn = data.useMoeLibrary !== false;
  const bookHint = useAr
    ? readyCount > 0 || moeOn
      ? `لديك ${readyCount} كتاب(كتب) مرفوع${moeOn ? " ومكتبة الوزارة المشتركة مفعّلة" : ""}. للأسئلة من الفصل، اسأل من محتوى الكتاب وسأذكر أرقام الصفحات.`
      : "فعّل مكتبة الوزارة في المكتبة أو ارفع PDF لأجيب مع ذكر الصفحات."
    : readyCount > 0 || moeOn
      ? `You have ${readyCount} uploaded textbook(s)${moeOn ? " and the shared MoE library is on" : ""}. For chapter questions, ask about content and I’ll cite pages.`
      : "Turn on the MoE library in Library or upload a PDF so I can cite pages.";

  if (/weak|worst|need.*help|ضعيف|أحتاج/.test(q + question)) {
    const weak = SUBJECT_CATALOG.flatMap((s) =>
      s.topics
        .map((t) => ({ s, t, p: getTopicProgress(data, s.id, t) }))
        .filter((x) => x.p.mastery > 0 && x.p.mastery < 50)
    ).slice(0, 5);

    if (weak.length === 0) {
      return useAr
        ? `لا توجد مواضيع ضعيفة بعد لأن الإتقان ما زال قريباً من 0%. افتح المواد، اختر موضوعاً، وأكمل درساً — بعدها أحدد الفجوات الحقيقية.\n\n${bookHint}`
        : `You don't have weak topics yet because mastery is still mostly at 0%. Open Subjects, pick a topic, and complete a lesson — then I can prioritize real gaps.\n\n${bookHint}`;
    }

    if (useAr) {
      return [
        "بناءً على تقدمك الفعلي، ركّز على:",
        ...weak.map(
          (w) => `• ${w.t}${w.s.nameAr ? ` (${w.s.nameAr})` : ` (${w.s.name})`} — إتقان ${w.p.mastery}%`
        ),
        "",
        "ادرس أول موضوع 20 دقيقة، ثم اسألني سؤالاً من كتابك المرفوع عن نفس الموضوع.",
        bookHint,
      ].join("\n");
    }

    return [
      "Based on your actual progress, focus on:",
      ...weak.map((w) => `• ${w.t} (${w.s.name}) — ${w.p.mastery}% mastery`),
      "",
      "Do a 20-minute block on the first item, then ask me a question from your uploaded textbook on that topic.",
      bookHint,
    ].join("\n");
  }

  const subject = activeSubjectId ? getSubject(activeSubjectId) : undefined;
  if (subject) {
    const progress = subjectProgress(data, subject.id);
    const nextTopic =
      subject.topics.find((t) => getTopicProgress(data, subject.id, t).mastery < 80) ||
      subject.topics[0];
    if (useAr) {
      return [
        `خطة دراسة لـ ${subject.nameAr || subject.name}:`,
        `الإتقان ${progress.progress}% (${progress.completedTopics}/${progress.totalTopics} مواضيع قوية).`,
        `التالي: "${nextTopic}" — شاهد الدرس، ثم اسألني من كتاب الوزارة لهذا الفصل.`,
        "",
        bookHint,
      ].join("\n");
    }
    return [
      `Study plan for ${subject.name}:`,
      `Mastery ${progress.progress}% (${progress.completedTopics}/${progress.totalTopics} topics strong).`,
      `Next: "${nextTopic}" — watch the lesson, then ask me a question from your MoE PDF for that chapter.`,
      "",
      bookHint,
    ].join("\n");
  }

  if (useAr) {
    return [
      "هذا الأسبوع: (1) ارفع/تأكد من كتب الوزارة في المكتبة، (2) أكمل درساً واحداً في المواد، (3) اسأل المدرّس سؤالاً من ذلك الفصل ليبقى الجواب مستنداً للكتاب.",
      "",
      bookHint,
    ].join("\n");
  }

  return [
    "This week: (1) upload/confirm MoE PDFs in Library, (2) finish one lesson in Subjects, (3) ask the tutor a question from that chapter so answers stay grounded.",
    "",
    bookHint,
  ].join("\n");
}