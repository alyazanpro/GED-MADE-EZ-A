"use client";

import { apiUrl } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import {
  mergeUserLearningData,
  isSparseUserData,
} from "@/lib/user-learning-merge";
import {
  saveUserData,
  type UserLearningData,
} from "@/lib/user-data";
import { syncProgressToServer, type ProgressSyncOpts } from "@/lib/progress-sync";

export type LearningSyncStatus = "synced" | "syncing" | "offline" | "error";

const PUT_DEBOUNCE_MS = 1500;

let status: LearningSyncStatus =
  typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "synced";
const listeners = new Set<(s: LearningSyncStatus) => void>();

let putTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPut: UserLearningData | null = null;
let pendingProgressOpts: ProgressSyncOpts = {};
let hydrateInFlight: Promise<UserLearningData | null> | null = null;
let onlineBound = false;

function setStatus(next: LearningSyncStatus) {
  status = next;
  for (const fn of listeners) fn(next);
}

export function getLearningSyncStatus(): LearningSyncStatus {
  return status;
}

export function subscribeLearningSyncStatus(
  fn: (s: LearningSyncStatus) => void
): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

function ensureOnlineListeners() {
  if (typeof window === "undefined" || onlineBound) return;
  onlineBound = true;
  window.addEventListener("online", () => {
    setStatus("syncing");
    void flushLearningPut().then(() => {
      // status set inside flush
    });
  });
  window.addEventListener("offline", () => setStatus("offline"));
}

async function fetchServerLearning(): Promise<UserLearningData | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(apiUrl("/api/user/learning"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("unauthorized");
    throw new Error(`fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    data: UserLearningData | null;
    exists?: boolean;
  };
  return json.data ?? null;
}

async function putServerLearning(data: UserLearningData): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  const res = await fetch(apiUrl("/api/user/learning"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

/**
 * On login / app ready: load local + server, merge, persist locally.
 * Never throws to callers — studying must continue offline.
 */
export async function hydrateLearningFromServer(
  userId: string,
  local: UserLearningData
): Promise<UserLearningData> {
  ensureOnlineListeners();
  if (!getToken()) {
    setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "synced");
    return local;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return local;
  }

  if (hydrateInFlight) {
    const prior = await hydrateInFlight;
    return prior ?? local;
  }

  setStatus("syncing");
  hydrateInFlight = (async () => {
    try {
      const remote = await fetchServerLearning();
      let merged: UserLearningData;
      if (!remote || isSparseUserData(remote)) {
        // First login / empty server → upload local
        merged = local;
        const ok = await putServerLearning(merged);
        if (!ok) {
          setStatus("error");
          return merged;
        }
      } else {
        merged = mergeUserLearningData(local, remote);
        saveUserData(userId, merged);
        // Persist merge result so both devices converge
        const ok = await putServerLearning(merged);
        if (!ok) {
          setStatus("error");
          return merged;
        }
      }
      syncProgressToServer(merged);
      setStatus("synced");
      return merged;
    } catch {
      setStatus(
        typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error"
      );
      return local;
    } finally {
      hydrateInFlight = null;
    }
  })();

  const result = await hydrateInFlight;
  return result ?? local;
}

async function flushLearningPut(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!getToken() || !pendingPut) {
    if (typeof navigator !== "undefined" && !navigator.onLine) setStatus("offline");
    return;
  }

  const data = pendingPut;
  const opts = pendingProgressOpts;
  pendingPut = null;
  pendingProgressOpts = {};
  if (putTimer) {
    clearTimeout(putTimer);
    putTimer = null;
  }

  if (!navigator.onLine) {
    setStatus("offline");
    pendingPut = data;
    pendingProgressOpts = opts;
    return;
  }

  setStatus("syncing");
  try {
    const ok = await putServerLearning(data);
    if (!ok) {
      setStatus("error");
      return;
    }
    // After successful learning save, push classroom progress snapshot
    syncProgressToServer(data, opts);
    setStatus("synced");
  } catch {
    setStatus(navigator.onLine ? "error" : "offline");
  }
}

/**
 * Debounced PUT after every local commit. Never blocks studying.
 */
export function scheduleLearningSync(
  data: UserLearningData,
  progressOpts?: ProgressSyncOpts
): void {
  if (typeof window === "undefined") return;
  ensureOnlineListeners();
  if (!getToken()) return;

  pendingPut = data;
  if (progressOpts) {
    pendingProgressOpts = {
      completedLesson:
        progressOpts.completedLesson || pendingProgressOpts.completedLesson,
      completedExamDrill:
        progressOpts.completedExamDrill || pendingProgressOpts.completedExamDrill,
    };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return;
  }

  if (putTimer) clearTimeout(putTimer);
  putTimer = setTimeout(() => {
    putTimer = null;
    void flushLearningPut();
  }, PUT_DEBOUNCE_MS);
}

/** Manual “Sync now” — flush pending PUT or re-hydrate. */
export async function syncLearningNow(
  userId: string,
  local: UserLearningData
): Promise<UserLearningData> {
  ensureOnlineListeners();
  if (!getToken()) {
    setStatus("error");
    return local;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return local;
  }

  if (pendingPut) {
    await flushLearningPut();
  }

  const merged = await hydrateLearningFromServer(userId, local);
  return merged;
}
