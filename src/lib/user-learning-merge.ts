import {
  createEmptyUserData,
  type ActivityItem,
  type ExamAnswerRecord,
  type ExamSessionRecord,
  type LibraryBook,
  type PlannerTask,
  type StudyDay,
  type TopicProgress,
  type TutorMessage,
  type UserLearningData,
} from "@/lib/user-data";
import type { LearningLanguage } from "@/data/lessons/types";

/**
 * Conflict policy for UserLearningData sync (local ↔ server):
 *
 * - topics: per key → max mastery; completed = OR; newer lastStudiedAt
 * - lastStudyDate: prefer newer YYYY-MM-DD
 * - activity / examSessions: union by id (activity capped 100, sessions 50)
 * - examAnswers: union by composite key questionId|at|subjectId|topic (cap 500)
 * - learningLanguage: prefer non-default ("mixed"); if both non-default, prefer
 *   the side with newer lastStudyDate (ties → local)
 * - tutorMessages: last-write-wins by newest message `at` (take that side’s list)
 * - studyDays: per date → max minutes
 * - books: union by id; prefer ready > extracting > failed; higher chunkCount
 * - tasks: union by id; prefer completed=true when both exist
 * - moeShelfIds: set union
 * - useMoeLibrary: true if either side is true
 * - examTargetDate / examFocusGrade: prefer non-null; if both set, prefer newer
 *   lastStudyDate side (ties → local)
 *
 * Empty server + non-empty local → first login uploads local.
 * Empty local + non-empty server → new device hydrates from server.
 */

const DEFAULT_LANG: LearningLanguage = "mixed";

function isNonDefaultLang(lang: LearningLanguage | undefined): boolean {
  return Boolean(lang && lang !== DEFAULT_LANG);
}

function newerDate(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a >= b ? a : b;
}

function preferSideByLastStudy(
  local: UserLearningData,
  remote: UserLearningData
): "local" | "remote" {
  const l = local.lastStudyDate;
  const r = remote.lastStudyDate;
  if (l && r) return l >= r ? "local" : "remote";
  if (l) return "local";
  if (r) return "remote";
  return "local";
}

function mergeTopics(
  local: Record<string, TopicProgress>,
  remote: Record<string, TopicProgress>
): Record<string, TopicProgress> {
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const out: Record<string, TopicProgress> = {};
  for (const key of keys) {
    const a = local[key];
    const b = remote[key];
    if (!a) {
      out[key] = b;
      continue;
    }
    if (!b) {
      out[key] = a;
      continue;
    }
    out[key] = {
      mastery: Math.max(a.mastery, b.mastery),
      completed: a.completed || b.completed || Math.max(a.mastery, b.mastery) >= 80,
      lastStudiedAt: newerDate(a.lastStudiedAt, b.lastStudiedAt),
    };
  }
  return out;
}

function unionById<T extends { id: string }>(
  local: T[],
  remote: T[],
  pick: (a: T, b: T) => T,
  limit: number,
  sortAt?: (item: T) => string
): T[] {
  const map = new Map<string, T>();
  for (const item of remote) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of local) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    map.set(item.id, existing ? pick(item, existing) : item);
  }
  const list = [...map.values()];
  if (sortAt) {
    list.sort((a, b) => sortAt(b).localeCompare(sortAt(a)));
  }
  return list.slice(0, limit);
}

function answerKey(a: ExamAnswerRecord): string {
  return `${a.questionId}|${a.at}|${a.subjectId}|${a.topic}`;
}

function mergeExamAnswers(
  local: ExamAnswerRecord[],
  remote: ExamAnswerRecord[]
): ExamAnswerRecord[] {
  const map = new Map<string, ExamAnswerRecord>();
  for (const a of [...remote, ...local]) {
    if (!a?.questionId) continue;
    map.set(answerKey(a), a);
  }
  return [...map.values()]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 500);
}

function bookStatusRank(status: LibraryBook["status"]): number {
  if (status === "ready") return 3;
  if (status === "extracting") return 2;
  return 1;
}

function pickBook(a: LibraryBook, b: LibraryBook): LibraryBook {
  const rankA = bookStatusRank(a.status);
  const rankB = bookStatusRank(b.status);
  if (rankA !== rankB) return rankA > rankB ? a : b;
  const chunksA = a.chunkCount ?? 0;
  const chunksB = b.chunkCount ?? 0;
  if (chunksA !== chunksB) return chunksA > chunksB ? a : b;
  return (a.uploadedAt || "") >= (b.uploadedAt || "") ? a : b;
}

function pickTask(a: PlannerTask, b: PlannerTask): PlannerTask {
  if (a.completed !== b.completed) return a.completed ? a : b;
  return (a.createdAt || "") >= (b.createdAt || "") ? a : b;
}

function mergeStudyDays(local: StudyDay[], remote: StudyDay[]): StudyDay[] {
  const map = new Map<string, number>();
  for (const d of [...remote, ...local]) {
    if (!d?.date) continue;
    map.set(d.date, Math.max(map.get(d.date) || 0, d.minutes || 0));
  }
  return [...map.entries()]
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function latestTutorAt(messages: TutorMessage[]): string {
  let latest = "";
  for (const m of messages) {
    if (m?.at && m.at > latest) latest = m.at;
  }
  return latest;
}

function mergeTutorMessages(
  local: TutorMessage[],
  remote: TutorMessage[]
): TutorMessage[] {
  // Last-write-wins: side with newer latest message timestamp keeps its list.
  const localAt = latestTutorAt(local);
  const remoteAt = latestTutorAt(remote);
  if (!localAt && !remoteAt) {
    return local.length ? local : remote;
  }
  if (localAt >= remoteAt) return local.slice(-80);
  return remote.slice(-80);
}

function mergeLearningLanguage(
  local: UserLearningData,
  remote: UserLearningData
): LearningLanguage {
  const l = local.learningLanguage || DEFAULT_LANG;
  const r = remote.learningLanguage || DEFAULT_LANG;
  const lSet = isNonDefaultLang(l);
  const rSet = isNonDefaultLang(r);
  if (lSet && !rSet) return l;
  if (rSet && !lSet) return r;
  if (lSet && rSet && l !== r) {
    return preferSideByLastStudy(local, remote) === "local" ? l : r;
  }
  return l;
}

/** True when data looks like a fresh empty profile (safe to overwrite from server). */
export function isSparseUserData(data: UserLearningData | null | undefined): boolean {
  if (!data) return true;
  const hasTopics = Object.keys(data.topics || {}).length > 0;
  const hasExams = (data.examSessions || []).length > 0;
  const hasBooks = (data.books || []).length > 0;
  const hasTasks = (data.tasks || []).length > 0;
  const realActivity = (data.activity || []).some((a) => a.kind !== "tutor");
  const hasStudy = (data.studyDays || []).some((d) => d.minutes > 0);
  const langSet = isNonDefaultLang(data.learningLanguage);
  return !hasTopics && !hasExams && !hasBooks && !hasTasks && !realActivity && !hasStudy && !langSet;
}

export function mergeUserLearningData(
  local: UserLearningData,
  remote: UserLearningData
): UserLearningData {
  if (isSparseUserData(remote) && !isSparseUserData(local)) {
    return {
      ...local,
      version: 2,
      firstRunChecklist: mergeFirstRunChecklist(local, remote),
    };
  }
  if (isSparseUserData(local) && !isSparseUserData(remote)) {
    return {
      ...remote,
      version: 2,
      firstRunChecklist: mergeFirstRunChecklist(local, remote),
    };
  }

  const side = preferSideByLastStudy(local, remote);

  return {
    version: 2,
    topics: mergeTopics(local.topics || {}, remote.topics || {}),
    books: unionById(local.books || [], remote.books || [], pickBook, 200, (b) => b.uploadedAt),
    moeShelfIds: [...new Set([...(remote.moeShelfIds || []), ...(local.moeShelfIds || [])])],
    // Prefer enabled: only false when both sides explicitly disable MoE.
    useMoeLibrary: local.useMoeLibrary !== false || remote.useMoeLibrary !== false,
    tasks: unionById(local.tasks || [], remote.tasks || [], pickTask, 200, (t) => t.createdAt),
    activity: unionById(
      local.activity || [],
      remote.activity || [],
      (a, _b) => a,
      100,
      (a: ActivityItem) => a.at
    ),
    tutorMessages: mergeTutorMessages(local.tutorMessages || [], remote.tutorMessages || []),
    studyDays: mergeStudyDays(local.studyDays || [], remote.studyDays || []),
    lastStudyDate: newerDate(local.lastStudyDate, remote.lastStudyDate),
    examTargetDate:
      local.examTargetDate && remote.examTargetDate
        ? side === "local"
          ? local.examTargetDate
          : remote.examTargetDate
        : local.examTargetDate || remote.examTargetDate,
    examFocusGrade:
      local.examFocusGrade != null && remote.examFocusGrade != null
        ? side === "local"
          ? local.examFocusGrade
          : remote.examFocusGrade
        : local.examFocusGrade ?? remote.examFocusGrade ?? 9,
    examSessions: unionById(
      local.examSessions || [],
      remote.examSessions || [],
      (a, _b) => a,
      50,
      (s: ExamSessionRecord) => s.at
    ),
    examAnswers: mergeExamAnswers(local.examAnswers || [], remote.examAnswers || []),
    learningLanguage: mergeLearningLanguage(local, remote),
    firstRunChecklist: mergeFirstRunChecklist(local, remote),
  };
}

function mergeFirstRunChecklist(
  local: UserLearningData,
  remote: UserLearningData
): UserLearningData["firstRunChecklist"] {
  const l = local.firstRunChecklist || { dismissed: false, skippedIds: [] };
  const r = remote.firstRunChecklist || { dismissed: false, skippedIds: [] };
  return {
    dismissed: l.dismissed || r.dismissed,
    skippedIds: [...new Set([...(l.skippedIds || []), ...(r.skippedIds || [])])],
  };
}

/** Light shape check for API upsert — returns normalized data or an error message. */
export function validateUserLearningPayload(
  body: unknown
): { ok: true; data: UserLearningData } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const raw = body as Record<string, unknown>;
  if (raw.version != null && typeof raw.version !== "number") {
    return { ok: false, error: "version must be a number." };
  }
  const requiredArrays = [
    "books",
    "tasks",
    "activity",
    "tutorMessages",
    "studyDays",
    "examSessions",
    "examAnswers",
  ] as const;
  for (const key of requiredArrays) {
    if (raw[key] != null && !Array.isArray(raw[key])) {
      return { ok: false, error: `${key} must be an array.` };
    }
  }
  if (raw.topics != null && (typeof raw.topics !== "object" || Array.isArray(raw.topics))) {
    return { ok: false, error: "topics must be an object." };
  }

  const base = createEmptyUserData();
  const data: UserLearningData = {
    ...base,
    ...(raw as Partial<UserLearningData>),
    version: 2,
    topics: (raw.topics as UserLearningData["topics"]) || {},
    books: Array.isArray(raw.books) ? (raw.books as LibraryBook[]) : [],
    moeShelfIds: Array.isArray(raw.moeShelfIds) ? (raw.moeShelfIds as string[]) : [],
    useMoeLibrary:
      typeof raw.useMoeLibrary === "boolean" ? raw.useMoeLibrary : true,
    tasks: Array.isArray(raw.tasks) ? (raw.tasks as PlannerTask[]) : [],
    activity: Array.isArray(raw.activity) ? (raw.activity as ActivityItem[]) : [],
    tutorMessages: Array.isArray(raw.tutorMessages)
      ? (raw.tutorMessages as TutorMessage[])
      : base.tutorMessages,
    studyDays: Array.isArray(raw.studyDays) ? (raw.studyDays as StudyDay[]) : [],
    lastStudyDate:
      typeof raw.lastStudyDate === "string" || raw.lastStudyDate === null
        ? (raw.lastStudyDate as string | null)
        : null,
    examTargetDate:
      typeof raw.examTargetDate === "string" || raw.examTargetDate === null
        ? (raw.examTargetDate as string | null)
        : null,
    examFocusGrade:
      typeof raw.examFocusGrade === "number" || raw.examFocusGrade === null
        ? (raw.examFocusGrade as UserLearningData["examFocusGrade"])
        : 9,
    examSessions: Array.isArray(raw.examSessions)
      ? (raw.examSessions as ExamSessionRecord[])
      : [],
    examAnswers: Array.isArray(raw.examAnswers)
      ? (raw.examAnswers as ExamAnswerRecord[])
      : [],
    learningLanguage:
      raw.learningLanguage === "en" ||
      raw.learningLanguage === "ar" ||
      raw.learningLanguage === "mixed"
        ? raw.learningLanguage
        : "mixed",
    firstRunChecklist: (() => {
      const fr = raw.firstRunChecklist;
      if (!fr || typeof fr !== "object") {
        return base.firstRunChecklist;
      }
      const o = fr as { dismissed?: unknown; skippedIds?: unknown };
      return {
        dismissed: o.dismissed === true,
        skippedIds: Array.isArray(o.skippedIds)
          ? o.skippedIds.filter((id): id is string => typeof id === "string")
          : [],
      };
    })(),
  };

  return { ok: true, data };
}
