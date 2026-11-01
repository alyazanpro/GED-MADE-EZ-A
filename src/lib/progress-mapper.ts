import type { TopicSnapshot } from "@/lib/classroom-types";
import type { UserLearningData } from "@/lib/user-data";

/** Single mapper: UserLearningData.topics → classroom TopicSnapshot map. */
export function topicsToSnapshot(
  topics: UserLearningData["topics"] | null | undefined
): Record<string, TopicSnapshot> {
  const out: Record<string, TopicSnapshot> = {};
  for (const [key, t] of Object.entries(topics || {})) {
    out[key] = {
      mastery: t.mastery,
      completed: t.completed,
      lastStudiedAt: t.lastStudiedAt,
    };
  }
  return out;
}

export function recentExamAccuracyFromData(
  data: UserLearningData
): number | null {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = (data.examSessions || []).filter(
    (s) => new Date(s.at).getTime() >= weekAgo
  );
  if (recent.length === 0) return null;
  const avg = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
  return Math.round(avg);
}

export function lastActiveAtFromData(data: UserLearningData): string | null {
  return (
    data.lastStudyDate ||
    data.activity[0]?.at ||
    data.examSessions[0]?.at ||
    null
  );
}
