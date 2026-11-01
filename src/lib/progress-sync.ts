"use client";

import { getToken } from "@/lib/auth-storage";
import { apiUrl } from "@/lib/api";
import type { GradeLevel } from "@/data/curriculum";
import type { UserLearningData } from "@/lib/user-data";
import {
  lastActiveAtFromData,
  recentExamAccuracyFromData,
  topicsToSnapshot,
} from "@/lib/progress-mapper";

export type ProgressSyncOpts = {
  completedLesson?: { subjectId: string; topic: string };
  completedExamDrill?: { subjectId: string; topic: string };
};

const DEBOUNCE_MS = 2500;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: {
  data: UserLearningData;
  opts: ProgressSyncOpts;
} | null = null;

function buildPayload(data: UserLearningData, opts: ProgressSyncOpts) {
  return {
    topics: topicsToSnapshot(data.topics),
    lastActiveAt: lastActiveAtFromData(data),
    examFocusGrade: data.examFocusGrade as GradeLevel | null,
    recentExamAccuracy: recentExamAccuracyFromData(data),
    completedLesson: opts.completedLesson,
    completedExamDrill: opts.completedExamDrill,
  };
}

function flushNow() {
  if (typeof window === "undefined") return;
  const token = getToken();
  if (!token || !pending) return;

  const { data, opts } = pending;
  pending = null;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  void fetch(apiUrl("/api/progress/sync"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(buildPayload(data, opts)),
  }).catch(() => {
    // Sync must not block studying
  });
}

function mergeOpts(a: ProgressSyncOpts, b: ProgressSyncOpts): ProgressSyncOpts {
  return {
    completedLesson: b.completedLesson || a.completedLesson,
    completedExamDrill: b.completedExamDrill || a.completedExamDrill,
  };
}

/** Push academic-only progress to the classroom store (no chat transcripts). */
export function syncProgressToServer(
  data: UserLearningData,
  opts?: ProgressSyncOpts
): void {
  if (typeof window === "undefined") return;
  if (!getToken()) return;

  const nextOpts = opts || {};
  pending = {
    data,
    opts: pending ? mergeOpts(pending.opts, nextOpts) : nextOpts,
  };

  // Completion hints should flush promptly so assignments complete without waiting
  const urgent = Boolean(nextOpts.completedLesson || nextOpts.completedExamDrill);
  if (urgent) {
    flushNow();
    return;
  }

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    flushNow();
  }, DEBOUNCE_MS);
}
