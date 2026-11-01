export type LessonVideo = {
  youtubeId: string;
  title: string;
  channel: string;
  durationLabel?: string;
};

export type GlossaryTerm = {
  en: string;
  ar: string;
};

export type PracticeQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  /** Arabic prompt when bilingual content exists */
  promptAr?: string;
  /** Arabic choices (same order / length as choices) */
  choicesAr?: string[];
  /** Arabic explanation */
  explanationAr?: string;
};

export type TopicLesson = {
  subjectId: string;
  topic: string;
  /** Arabic topic title for Mixed / العربية catalogue & lesson header */
  topicAr?: string;
  summary: string;
  summaryAr?: string;
  objectives: string[];
  objectivesAr?: string[];
  keyPoints: string[];
  keyPointsAr?: string[];
  /** STEM glossary chips: English term ↔ Arabic */
  glossary?: GlossaryTerm[];
  videos: LessonVideo[];
  practice: PracticeQuestion[];
  extraLinks?: { label: string; url: string }[];
};

/** User learning language preference */
export type LearningLanguage = "en" | "ar" | "mixed";

export const LEARNING_LANGUAGE_LABELS: Record<
  LearningLanguage,
  { en: string; ar: string; short: string }
> = {
  en: { en: "English", ar: "English", short: "EN" },
  ar: { en: "العربية", ar: "العربية", short: "ع" },
  mixed: { en: "Mixed", ar: "مختلط", short: "EN/ع" },
};

export const STEM_SUBJECT_IDS = new Set([
  "math",
  "physics",
  "chemistry",
  "biology",
  "ict",
]);

/** Arabic-primary classroom subjects (English gloss for key terms) */
export const ARABIC_PRIMARY_SUBJECT_IDS = new Set([
  "arabic",
  "islamic",
  "social",
]);
