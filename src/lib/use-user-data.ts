"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { askGroundedTutor } from "@/lib/rag";
import { loadCorpusManifest } from "@/lib/rag/shared-corpus";
import { ingestPdfForUser, removeBookChunks } from "@/lib/rag/ingest";
import { tutorFallbackMessage } from "@/data/lessons/bilingual";
import {
  addLibraryBook,
  addTask,
  appendTutorExchange,
  createEmptyUserData,
  dismissFirstRunChecklist,
  generateMetaTutorReply,
  loadUserData,
  completeLessonStudy,
  markTopicStudied,
  recordExamSession,
  removeLibraryBook,
  removeTask,
  saveUserData,
  setExamPlanner,
  setLearningLanguage,
  setUseMoeLibrary,
  skipFirstRunStep,
  toggleMoeShelfBook,
  toggleTask,
  updateLibraryBook,
  type LearningLanguage,
  type UserLearningData,
} from "@/lib/user-data";
import type { GradeLevel } from "@/data/curriculum";
import type { ExamMode } from "@/data/exam-bank/types";
import {
  syncProgressToServer,
  type ProgressSyncOpts,
} from "@/lib/progress-sync";
import {
  hydrateLearningFromServer,
  scheduleLearningSync,
  subscribeLearningSyncStatus,
  syncLearningNow,
  type LearningSyncStatus,
} from "@/lib/learning-sync";

export function useUserData() {
  const { user } = useAuth();
  const userId = user?.uid || user?.email || "";
  const [data, setData] = useState<UserLearningData>(createEmptyUserData);
  const [ready, setReady] = useState(false);
  const [moeBookCount, setMoeBookCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<LearningSyncStatus>("synced");
  const [syncingNow, setSyncingNow] = useState(false);

  useEffect(() => subscribeLearningSyncStatus(setSyncStatus), []);

  useEffect(() => {
    if (!userId) {
      setData(createEmptyUserData());
      setReady(false);
      return;
    }
    let cancelled = false;
    const loaded = loadUserData(userId);
    setData(loaded);
    setReady(true);
    // Classroom snapshot (academic-only) — keep for assignment urgency
    syncProgressToServer(loaded);

    void hydrateLearningFromServer(userId, loaded).then((merged) => {
      if (cancelled) return;
      if (merged !== loaded) {
        setData(merged);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void loadCorpusManifest().then((m) => {
      if (!cancelled) setMoeBookCount(m?.books.length ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(
    (
      updater: (prev: UserLearningData) => UserLearningData,
      syncOpts?: ProgressSyncOpts
    ) => {
      if (!userId) return;
      setData((prev) => {
        const next = updater(prev);
        saveUserData(userId, next);
        // Offline-first: always persist locally; server catch-up is debounced
        scheduleLearningSync(next, syncOpts);
        // Urgent classroom assignment completion still flushes promptly
        syncProgressToServer(next, syncOpts);
        return next;
      });
    },
    [userId]
  );

  const syncNow = useCallback(async () => {
    if (!userId || syncingNow) return;
    setSyncingNow(true);
    try {
      const local = loadUserData(userId);
      const merged = await syncLearningNow(userId, local);
      saveUserData(userId, merged);
      setData(merged);
    } finally {
      setSyncingNow(false);
    }
  }, [userId, syncingNow]);

  const studyTopic = useCallback(
    (subjectId: string, topic: string) => {
      commit((prev) => markTopicStudied(prev, subjectId, topic), {
        completedLesson: { subjectId, topic },
      });
    },
    [commit]
  );

  const completeLesson = useCallback(
    (
      subjectId: string,
      topic: string,
      result: { quizPercent: number; watchedCount: number }
    ) => {
      commit((prev) => completeLessonStudy(prev, subjectId, topic, result), {
        completedLesson: { subjectId, topic },
      });
    },
    [commit]
  );

  const uploadBook = useCallback(
    async (file: File, subjectId: string) => {
      if (!userId) return;
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        return;
      }

      const title = file.name.replace(/\.pdf$/i, "");
      const bookId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const withBook = addLibraryBook(loadUserData(userId), {
        id: bookId,
        title,
        subjectId,
        sizeBytes: file.size,
      });
      saveUserData(userId, withBook);
      setData(withBook);
      scheduleLearningSync(withBook);

      try {
        const result = await ingestPdfForUser(
          userId,
          { id: bookId, title, subjectId },
          file
        );
        const latest = updateLibraryBook(loadUserData(userId), bookId, {
          status: "ready",
          pageCount: result.pageCount,
          chunkCount: result.chunkCount,
          errorMessage: undefined,
        });
        saveUserData(userId, latest);
        setData(latest);
        scheduleLearningSync(latest);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to extract text from PDF.";
        const failed = updateLibraryBook(loadUserData(userId), bookId, {
          status: "failed",
          errorMessage: message,
          pageCount: 0,
          chunkCount: 0,
        });
        saveUserData(userId, failed);
        setData(failed);
        scheduleLearningSync(failed);
      }
    },
    [userId]
  );

  const deleteBook = useCallback(
    async (bookId: string) => {
      if (!userId) return;
      try {
        await removeBookChunks(userId, bookId);
      } catch {
        // still remove metadata
      }
      commit((prev) => removeLibraryBook(prev, bookId));
    },
    [commit, userId]
  );

  const createTask = useCallback(
    (input: {
      title: string;
      subjectId: string;
      durationMin: number;
      dueDate: string;
    }) => {
      commit((prev) => addTask(prev, input));
    },
    [commit]
  );

  const completeTask = useCallback(
    (taskId: string) => {
      commit((prev) => toggleTask(prev, taskId));
    },
    [commit]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      commit((prev) => removeTask(prev, taskId));
    },
    [commit]
  );

  const askTutor = useCallback(
    async (question: string, subjectId?: string) => {
      if (!userId) return;

      const current = loadUserData(userId);
      const meta = generateMetaTutorReply(question, current, subjectId);
      if (meta) {
        commit((prev) =>
          appendTutorExchange(prev, question, meta, subjectId, { grounded: false })
        );
        return;
      }

      const readyBooks = current.books.filter((b) => b.status === "ready");
      const moeOn = current.useMoeLibrary !== false;
      if (readyBooks.length === 0 && !moeOn) {
        const msg = tutorFallbackMessage(current.learningLanguage);
        commit((prev) =>
          appendTutorExchange(prev, question, msg, subjectId, { grounded: false })
        );
        return;
      }

      const result = await askGroundedTutor(userId, question, {
        subjectId,
        learningLanguage: current.learningLanguage,
        useMoeLibrary: moeOn,
      });
      commit((prev) =>
        appendTutorExchange(prev, question, result.answer, subjectId, {
          grounded: result.grounded,
          citations: result.citations,
          relatedTopic: result.relatedTopic,
        })
      );
    },
    [commit, userId]
  );

  const updateLearningLanguage = useCallback(
    (language: LearningLanguage) => {
      commit((prev) => setLearningLanguage(prev, language));
    },
    [commit]
  );

  const updateUseMoeLibrary = useCallback(
    (enabled: boolean) => {
      commit((prev) => setUseMoeLibrary(prev, enabled));
    },
    [commit]
  );

  const toggleMoeShelf = useCallback(
    (bookId: string) => {
      commit((prev) => toggleMoeShelfBook(prev, bookId));
    },
    [commit]
  );

  const saveExamSession = useCallback(
    (input: {
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
    }) => {
      commit(
        (prev) => recordExamSession(prev, input),
        input.topic
          ? { completedExamDrill: { subjectId: input.subjectId, topic: input.topic } }
          : undefined
      );
    },
    [commit]
  );

  const updateExamPlanner = useCallback(
    (input: {
      examTargetDate: string | null;
      examFocusGrade: GradeLevel | null;
    }) => {
      commit((prev) => setExamPlanner(prev, input));
    },
    [commit]
  );

  const dismissChecklist = useCallback(() => {
    commit((prev) => dismissFirstRunChecklist(prev));
  }, [commit]);

  const skipChecklistStep = useCallback(
    (stepId: string) => {
      commit((prev) => skipFirstRunStep(prev, stepId));
    },
    [commit]
  );

  const readyBookCount = data.books.filter((b) => b.status === "ready").length;
  const groundedSourceCount =
    readyBookCount + (data.useMoeLibrary !== false ? moeBookCount : 0);

  return {
    data,
    ready,
    readyBookCount,
    moeBookCount,
    groundedSourceCount,
    syncStatus,
    syncingNow,
    syncNow,
    studyTopic,
    completeLesson,
    uploadBook,
    deleteBook,
    createTask,
    completeTask,
    deleteTask,
    askTutor,
    saveExamSession,
    updateExamPlanner,
    updateLearningLanguage,
    updateUseMoeLibrary,
    toggleMoeShelf,
    dismissChecklist,
    skipChecklistStep,
  };
}
