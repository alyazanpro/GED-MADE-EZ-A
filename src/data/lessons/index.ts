import { SUBJECT_CATALOG } from "@/data/curriculum";
import { MATH_LESSONS } from "./math-lessons";
import { SCIENCE_LESSONS } from "./science-lessons";
import { LANGUAGE_LESSONS, OTHER_LESSONS } from "./other-lessons";
import { PHYSICS_CORE_BILINGUAL } from "./physics-core-bilingual";
import type { TopicLesson } from "./types";
import { topicToSlug, youtubeSearchUrl } from "./utils";

export type { TopicLesson, LessonVideo, PracticeQuestion, LearningLanguage, GlossaryTerm } from "./types";
export {
  LEARNING_LANGUAGE_LABELS,
  STEM_SUBJECT_IDS,
  ARABIC_PRIMARY_SUBJECT_IDS,
} from "./types";
export {
  resolveLessonView,
  isFullyBilingual,
  tutorLanguageInstruction,
  tutorFallbackMessage,
  defaultLearningLanguageForSubject,
} from "./bilingual";
export {
  topicToSlug,
  youtubeEmbedUrl,
  youtubeThumbUrl,
  youtubeWatchUrl,
  youtubeSearchUrl,
} from "./utils";

/** Later bilingual packs override earlier entries with the same subject+topic key. */
function mergeLessons(...lists: TopicLesson[][]): TopicLesson[] {
  const map = new Map<string, TopicLesson>();
  for (const list of lists) {
    for (const lesson of list) {
      map.set(`${lesson.subjectId}::${lesson.topic}`, lesson);
    }
  }
  return [...map.values()];
}

const ALL_CURATED: TopicLesson[] = mergeLessons(
  MATH_LESSONS,
  SCIENCE_LESSONS,
  LANGUAGE_LESSONS,
  OTHER_LESSONS,
  PHYSICS_CORE_BILINGUAL
);

const byKey = new Map<string, TopicLesson>();
const bySlug = new Map<string, TopicLesson>();

for (const lesson of ALL_CURATED) {
  const key = `${lesson.subjectId}::${lesson.topic}`;
  byKey.set(key, lesson);
  bySlug.set(`${lesson.subjectId}::${topicToSlug(lesson.topic)}`, lesson);
}

/** Reliable subject-level intro videos used when a topic has no unique clip. */
const SUBJECT_FALLBACK_VIDEO: Record<
  string,
  { youtubeId: string; title: string; channel: string }
> = {
  math: {
    youtubeId: "NybHckSEQBI",
    title: "Algebra basics — foundations",
    channel: "Khan Academy",
  },
  physics: {
    youtubeId: "ZM8ECpBuQYE",
    title: "Introduction to physics",
    channel: "Khan Academy",
  },
  chemistry: {
    youtubeId: "FSyAehMdpyI",
    title: "Introduction to chemistry",
    channel: "Khan Academy",
  },
  biology: {
    youtubeId: "dQCsA2cCdvA",
    title: "Biology overview",
    channel: "Khan Academy",
  },
  english: {
    youtubeId: "O-6q-siuMik",
    title: "Introduction to Grammar",
    channel: "Khan Academy",
  },
  arabic: {
    youtubeId: "O-6q-siuMik",
    title: "Language study foundations — then open Arabic topic videos below",
    channel: "Khan Academy",
  },
  islamic: {
    youtubeId: "MSYw502dJNY",
    title: "Critical reading mindset — then open Islamic topic videos below",
    channel: "Crash Course",
  },
  social: {
    youtubeId: "MSYw502dJNY",
    title: "How & why we read — then open Social Studies topic videos below",
    channel: "Crash Course",
  },
  ict: {
    youtubeId: "zOjov-2OZ0E",
    title: "Introduction to programming & computers",
    channel: "freeCodeCamp",
  },
};

function buildFallbackLesson(subjectId: string, topic: string): TopicLesson {
  const subject = SUBJECT_CATALOG.find((s) => s.id === subjectId);
  const subjectName = subject?.name ?? subjectId;
  const fallback = SUBJECT_FALLBACK_VIDEO[subjectId] ?? SUBJECT_FALLBACK_VIDEO.math;
  const searchQuery = `${subjectName} ${topic} tutorial explained`;

  return {
    subjectId,
    topic,
    summary: `Study ${topic} with curated video lessons, key points, and a short check quiz — then practise from your MoE textbook.`,
    objectives: [
      `Understand the core idea of ${topic}`,
      "Watch and take notes from the lesson videos",
      "Check understanding with the practice questions",
    ],
    keyPoints: [
      `Focus on the definitions and worked examples for ${topic}.`,
      "Pause the video and try each example yourself before continuing.",
      "After the quiz, revise weak spots in your textbook or with the AI tutor.",
    ],
    videos: [
      {
        youtubeId: fallback.youtubeId,
        title: `${fallback.title} (start here, then watch topic search results)`,
        channel: fallback.channel,
        durationLabel: "10–20 min",
      },
    ],
    practice: [
      {
        id: "fb-1",
        prompt: `Best way to study “${topic}”?`,
        choices: [
          "Watch → notes → try an example → quiz",
          "Click ‘complete’ without watching",
          "Only memorise the title",
          "Skip practice forever",
        ],
        correctIndex: 0,
        explanation: "Active study beats passive clicking.",
      },
      {
        id: "fb-2",
        prompt: "When you get a quiz question wrong, you should:",
        choices: [
          "Re-watch that part and retry later",
          "Ignore it",
          "Never open the topic again",
          "Only change subjects",
        ],
        correctIndex: 0,
        explanation: "Errors show exactly what to revise.",
      },
      {
        id: "fb-3",
        prompt: "YouTube topic search is useful to:",
        choices: [
          "Find extra explanations in your preferred language/style",
          "Replace all thinking",
          "Avoid your textbook",
          "Skip MoE objectives",
        ],
        correctIndex: 0,
        explanation: "Use multiple explanations until it clicks.",
      },
    ],
    extraLinks: [
      {
        label: `More YouTube videos: ${topic}`,
        url: youtubeSearchUrl(searchQuery),
      },
      {
        label: `YouTube: ${subjectName} ${topic}`,
        url: youtubeSearchUrl(`${topic} ${subjectName} GED OR grade OR شرح`),
      },
    ],
  };
}

export function getLesson(
  subjectId: string,
  topic: string
): TopicLesson {
  const subject = SUBJECT_CATALOG.find((s) => s.id === subjectId);
  const subjectName = subject?.name ?? subjectId;
  const base =
    byKey.get(`${subjectId}::${topic}`) ?? buildFallbackLesson(subjectId, topic);

  const searchLinks = [
    {
      label: `More YouTube videos: ${topic}`,
      url: youtubeSearchUrl(`${subjectName} ${topic} explained OR tutorial OR شرح`),
    },
  ];

  const existing = base.extraLinks ?? [];
  const merged = [
    ...existing,
    ...searchLinks.filter((s) => !existing.some((e) => e.url === s.url)),
  ];

  return { ...base, extraLinks: merged };
}

export function getLessonBySlug(
  subjectId: string,
  topicSlug: string
): TopicLesson | null {
  const direct = bySlug.get(`${subjectId}::${topicSlug}`);
  if (direct) return direct;

  const subject = SUBJECT_CATALOG.find((s) => s.id === subjectId);
  if (!subject) return null;

  const topic = subject.topics.find((t) => topicToSlug(t) === topicSlug);
  if (!topic) return null;
  return getLesson(subjectId, topic);
}

export function getLessonPath(subjectId: string, topic: string): string {
  return `/subjects/${subjectId}/${topicToSlug(topic)}`;
}

export function getNeighborTopics(
  subjectId: string,
  topic: string
): {
  prev: { topic: string; href: string } | null;
  next: { topic: string; href: string } | null;
} {
  const subject = SUBJECT_CATALOG.find((s) => s.id === subjectId);
  if (!subject) return { prev: null, next: null };
  const idx = subject.topics.indexOf(topic);
  if (idx < 0) return { prev: null, next: null };

  const prevTopic = idx > 0 ? subject.topics[idx - 1] : null;
  const nextTopic =
    idx < subject.topics.length - 1 ? subject.topics[idx + 1] : null;

  return {
    prev: prevTopic
      ? { topic: prevTopic, href: getLessonPath(subjectId, prevTopic) }
      : null,
    next: nextTopic
      ? { topic: nextTopic, href: getLessonPath(subjectId, nextTopic) }
      : null,
  };
}

export function estimateLessonMinutes(lesson: TopicLesson): number {
  return Math.max(12, lesson.videos.length * 8 + lesson.practice.length * 2);
}

export function hasCuratedLesson(subjectId: string, topic: string): boolean {
  return byKey.has(`${subjectId}::${topic}`);
}

export function countCuratedLessons(): number {
  return ALL_CURATED.length;
}
