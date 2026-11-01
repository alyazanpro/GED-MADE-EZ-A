import type { UserLearningData } from "./user-data";
import type { TopicProgress } from "./user-data";

export enum MergeStrategy {
  LAST_WRITE_WINS = "last_write_wins",
  MOST_RECENT = "most_recent",
  MANUAL = "manual",
  CLIENT_WINS = "client_wins",
  SERVER_WINS = "server_wins"
}

export interface MergeResult {
  merged: UserLearningData;
  conflicts: Array<{
    field: string;
    clientValue: unknown;
    serverValue: unknown;
    resolved: "client" | "server" | "merged";
  }>;
}

export function mergeTopics(
  clientTopics: Record<string, TopicProgress>,
  serverTopics: Record<string, TopicProgress>,
  strategy: MergeStrategy = MergeStrategy.MOST_RECENT
): Record<string, TopicProgress> {
  const merged: Record<string, TopicProgress> = { ...serverTopics };
  const conflicts: Array<{
    field: string;
    clientValue: TopicProgress;
    serverValue: TopicProgress;
    resolved: "client" | "server" | "merged";
  }> = [];

  for (const [key, clientTopic] of Object.entries(clientTopics)) {
    const serverTopic = serverTopics[key];

    if (!serverTopic) {
      // Topic only exists on client
      merged[key] = clientTopic;
    } else {
      // Topic exists on both - resolve conflict
      const clientTime = new Date(clientTopic.lastStudiedAt || 0).getTime();
      const serverTime = new Date(serverTopic.lastStudiedAt || 0).getTime();

      if (strategy === MergeStrategy.LAST_WRITE_WINS) {
        const winner = clientTime > serverTime ? clientTopic : serverTopic;
        merged[key] = winner;
        conflicts.push({
          field: key,
          clientValue: clientTopic,
          serverValue: serverTopic,
          resolved: clientTime > serverTime ? "client" : "server"
        });
      } else if (strategy === MergeStrategy.MOST_RECENT) {
        // Merge by taking the most recent study time and highest mastery
        merged[key] = {
          mastery: Math.max(clientTopic.mastery, serverTopic.mastery),
          completed: clientTopic.completed || serverTopic.completed,
          lastStudiedAt: clientTime > serverTime ? clientTopic.lastStudiedAt : serverTopic.lastStudiedAt
        };
        conflicts.push({
          field: key,
          clientValue: clientTopic,
          serverValue: serverTopic,
          resolved: "merged"
        });
      } else if (strategy === MergeStrategy.CLIENT_WINS) {
        merged[key] = clientTopic;
        conflicts.push({
          field: key,
          clientValue: clientTopic,
          serverValue: serverTopic,
          resolved: "client"
        });
      } else {
        merged[key] = serverTopic;
        conflicts.push({
          field: key,
          clientValue: clientTopic,
          serverValue: serverTopic,
          resolved: "server"
        });
      }
    }
  }

  return merged;
}

export function mergeUserData(
  client: UserLearningData,
  server: UserLearningData,
  strategy: MergeStrategy = MergeStrategy.MOST_RECENT
): MergeResult {
  const conflicts: Array<{
    field: string;
    clientValue: unknown;
    serverValue: unknown;
    resolved: "client" | "server" | "merged";
  }> = [];

  // Merge topics
  const mergedTopics = mergeTopics(client.topics, server.topics, strategy);
  
  // Detect topic conflicts
  for (const key of Object.keys(client.topics)) {
    if (server.topics[key]) {
      conflicts.push({
        field: `topics.${key}`,
        clientValue: client.topics[key],
        serverValue: server.topics[key],
        resolved: strategy === MergeStrategy.CLIENT_WINS ? "client" : 
                 strategy === MergeStrategy.SERVER_WINS ? "server" : "merged"
      });
    }
  }

  // Merge other fields based on strategy
  const merged: UserLearningData = {
    version: Math.max(client.version, server.version),
    topics: mergedTopics,
    books: mergeArrays(client.books, server.books, "id", strategy),
    moeShelfIds: mergeArrays(client.moeShelfIds, server.moeShelfIds, undefined, strategy),
    useMoeLibrary: client.useMoeLibrary || server.useMoeLibrary,
    tasks: mergeArrays(client.tasks, server.tasks, "id", strategy),
    activity: mergeActivity(client.activity, server.activity, strategy),
    tutorMessages: strategy === MergeStrategy.CLIENT_WINS ? client.tutorMessages : 
                   strategy === MergeStrategy.SERVER_WINS ? server.tutorMessages :
                   mergeArrays(client.tutorMessages, server.tutorMessages, "id", strategy),
    studyDays: mergeStudyDays(client.studyDays, server.studyDays, strategy),
    lastStudyDate: client.lastStudyDate || server.lastStudyDate,
    examTargetDate: client.examTargetDate || server.examTargetDate,
    examFocusGrade: client.examFocusGrade || server.examFocusGrade,
    examSessions: mergeArrays(client.examSessions, server.examSessions, "id", strategy),
    examAnswers: mergeArrays(client.examAnswers, server.examAnswers, "questionId", strategy),
    learningLanguage: client.learningLanguage,
    firstRunChecklist: client.firstRunChecklist
  };

  return { merged, conflicts };
}

function mergeArrays<T>(
  client: T[],
  server: T[],
  idField?: string,
  strategy: MergeStrategy = MergeStrategy.MOST_RECENT
): T[] {
  if (strategy === MergeStrategy.CLIENT_WINS) return client;
  if (strategy === MergeStrategy.SERVER_WINS) return server;

  if (!idField) {
    // Simple concatenation with deduplication
    const combined = [...client, ...server];
    return Array.from(new Set(combined)) as T[];
  }

  // Merge by ID
  const merged = new Map<string, T>();
  
  for (const item of [...client, ...server]) {
    const id = (item as any)[idField];
    if (id) {
      merged.set(id, item);
    }
  }

  return Array.from(merged.values());
}

function mergeActivity(
  client: any[],
  server: any[],
  strategy: MergeStrategy = MergeStrategy.MOST_RECENT
): any[] {
  if (strategy === MergeStrategy.CLIENT_WINS) return client;
  if (strategy === MergeStrategy.SERVER_WINS) return server;

  // Merge by activity ID, keep most recent
  const merged = new Map<string, any>();
  
  for (const item of [...client, ...server]) {
    if (item.id) {
      const existing = merged.get(item.id);
      if (!existing || new Date(item.at) > new Date(existing.at)) {
        merged.set(item.id, item);
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => 
    new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

function mergeStudyDays(
  client: any[],
  server: any[],
  strategy: MergeStrategy = MergeStrategy.MOST_RECENT
): any[] {
  if (strategy === MergeStrategy.CLIENT_WINS) return client;
  if (strategy === MergeStrategy.SERVER_WINS) return server;

  // Merge by date, sum minutes
  const merged = new Map<string, any>();
  
  for (const item of [...client, ...server]) {
    if (item.date) {
      const existing = merged.get(item.date);
      if (existing) {
        merged.set(item.date, {
          date: item.date,
          minutes: existing.minutes + item.minutes
        });
      } else {
        merged.set(item.date, item);
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function hasConflicts(result: MergeResult): boolean {
  return result.conflicts.length > 0;
}

export function getConflictCount(result: MergeResult): number {
  return result.conflicts.length;
}
